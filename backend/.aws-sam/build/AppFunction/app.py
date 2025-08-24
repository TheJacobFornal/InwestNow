from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field
from datetime import date
import os
import boto3
from typing import List, Any, Dict

# ---------- CORS ----------
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://www.mycoins.pl",
    "https://<your-amplify>.amplifyapp.com",
]

app = FastAPI(title="InwestNow API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Data API client & helpers ----------
RDS = boto3.client("rds-data")
CLUSTER_ARN = os.environ["DB_CLUSTER_ARN"]
SECRET_ARN = os.environ["DB_SECRET_ARN"]
DB_NAME = os.environ["DB_NAME"]
TABLE_NAME = "holdings"  # you can rename if you like

def exec_sql(sql: str, params: list | None = None) -> Dict[str, Any]:
    return RDS.execute_statement(
        resourceArn=CLUSTER_ARN,
        secretArn=SECRET_ARN,
        database=DB_NAME,
        sql=sql,
        parameters=params or [],
    )

def rows_from(resp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convert Data API response to list[dict] using column names.
    """
    cols = [c["name"] for c in resp.get("columnMetadata", [])]
    out: List[Dict[str, Any]] = []
    for rec in resp.get("records", []):
        row: Dict[str, Any] = {}
        for i, cell in enumerate(rec):
            # cell is like {'stringValue': 'USD'} or {'doubleValue': 1.23}
            val = next(iter(cell.values()))
            row[cols[i] if i < len(cols) else f"c{i}"] = val
        out.append(row)
    return out

def ensure_table():
    # Currency   VARCHAR(16)
    # PurchaseDate DATE
    # Amount     DOUBLE
    # Price      DOUBLE
    # Value      DOUBLE
    sql = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      Currency VARCHAR(16) NOT NULL,
      PurchaseDate DATE NOT NULL,
      Amount DOUBLE NOT NULL,
      Price DOUBLE NOT NULL,
      Value DOUBLE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    exec_sql(sql)

# Create table on cold start (Lambda) / app boot (local)


# ---------- Schemas ----------
class HoldingIn(BaseModel):
    currency: str = Field(..., min_length=1, max_length=16, alias="Currency")
    purchaseDate: date = Field(..., alias="PurchaseDate")
    amount: float = Field(..., alias="Amount")
    price: float = Field(..., alias="Price")
    value: float = Field(..., alias="Value")

    class Config:
        populate_by_name = True  # accept either API names or Pydantic field names

class Holding(HoldingIn):
    id: int
    created_at: str | None = None

# ---------- Routes ----------
@app.get("/hello")
def hello(name: str | None = None):
    who = name or "Jacob"
    return {"message": f"Hello v2 {who}"}

@app.post("/holdings", response_model=Holding)
def create_holding(h: HoldingIn):
    ensure_table()
    sql = f"""
      INSERT INTO {TABLE_NAME} (Currency, PurchaseDate, Amount, Price, Value)
      VALUES (:currency, :pdate, :amount, :price, :val)
    """
    params = [
        {"name": "currency", "value": {"stringValue": h.currency}},
        {"name": "pdate",    "value": {"stringValue": h.purchaseDate.isoformat()}},  # MySQL DATE accepts 'YYYY-MM-DD'
        {"name": "amount",   "value": {"doubleValue": float(h.amount)}},
        {"name": "price",    "value": {"doubleValue": float(h.price)}},
        {"name": "val",      "value": {"doubleValue": float(h.value)}},
    ]
    exec_sql(sql, params)

    # Return the last inserted row (Aurora Data API doesn't return insert id directly)
    out = exec_sql(
        f"SELECT * FROM {TABLE_NAME} WHERE Currency=:c AND PurchaseDate=:d ORDER BY id DESC LIMIT 1",
        [
            {"name": "c", "value": {"stringValue": h.currency}},
            {"name": "d", "value": {"stringValue": h.purchaseDate.isoformat()}},
        ],
    )
    rows = rows_from(out)
    if not rows:
        raise HTTPException(status_code=500, detail="Insert succeeded but row not found")
    # map DB column names -> response model fields
    r = rows[0]
    return {
        "id": r["id"],
        "currency": r["Currency"],
        "purchaseDate": r["PurchaseDate"],
        "amount": r["Amount"],
        "price": r["Price"],
        "value": r["Value"],
        "created_at": r.get("created_at"),
    }

@app.get("/holdings", response_model=list[Holding])
def list_holdings(limit: int = 100):
    ensure_table()
    out = exec_sql(f"SELECT * FROM {TABLE_NAME} ORDER BY id DESC LIMIT :lim",
                   [{"name": "lim", "value": {"longValue": limit}}])
    rows = rows_from(out)
    return [
        {
            "id": r["id"],
            "currency": r["Currency"],
            "purchaseDate": r["PurchaseDate"],
            "amount": r["Amount"],
            "price": r["Price"],
            "value": r["Value"],
            "created_at": r.get("created_at"),
        }
        for r in rows
    ]

# ---------- Lambda handler ----------
handler = Mangum(app)
