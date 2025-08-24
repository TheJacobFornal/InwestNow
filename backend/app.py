# server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error
from typing import Dict, Any, List
import os
import uvicorn

# === DB config (from your snippet; env vars can override in prod) ===
DB_HOST = os.getenv("DB_HOST", "test1.c7ioa646wm47.eu-west-2.rds.amazonaws.com")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "Adria09?Jakub01?")
DB_NAME = os.getenv("DB_NAME", "company")   # your DB name
DB_PORT = int(os.getenv("DB_PORT", "3306"))

app = FastAPI(title="Company API")

# CORS: allow your local Vite and your site
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://www.mycoins.pl",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    """Create a short-lived MySQL connection using your settings."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        port=DB_PORT,
        connection_timeout=5,
    )

def rows_to_dicts(cur, rows) -> List[Dict[str, Any]]:
    """Turn cursor rows into a list of dicts using column names from cursor.description."""
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in rows]

@app.get("/api/health")
def health():
    """Check DB connectivity and return server time."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT NOW();")
        server_time = cur.fetchone()[0]
        cur.close(); conn.close()
        return {"ok": True, "server_time": str(server_time)}
    except Error as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

@app.get("/api/employees")
def list_employees():
    """
    Return all rows from the existing employees table.
    No hard-coded columns, so it adapts to your current schema.
    """
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM employees ORDER BY 1 DESC;")
        rows = cur.fetchall()
        items = rows_to_dicts(cur, rows)
        cur.close(); conn.close()
        return {"items": items, "count": len(items)}
    except Error as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

if __name__ == "__main__":
    # Run locally: python server.py
    # Or with reload: uvicorn server:app --reload --port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
