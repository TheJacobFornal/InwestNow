# server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from mysql.connector import Error
from typing import List, Dict, Any
import os
import uvicorn

# === DB config (your provided values; use env vars in real projects) ===
DB_HOST = os.getenv("DB_HOST", "test1.c7ioa646wm47.eu-west-2.rds.amazonaws.com")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "Adria09?Jakub01?")
DB_NAME = os.getenv("DB_NAME", "company")
DB_PORT = int(os.getenv("DB_PORT", "3306"))

app = FastAPI(title="Company API")

# Allow your Vite dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://www.mycoins.pl"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    return mysql.connector.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASS,
        database=DB_NAME, port=DB_PORT, connection_timeout=5
    )

def dict_row(cursor, row) -> Dict[str, Any]:
    return {desc[0]: value for desc, value in zip(cursor.description, row)}

@app.get("/api/health")
def health():
    """Check DB connection and return server time"""
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
    """Return all employees from the existing employees table"""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM employees ORDER BY id DESC;")
        rows = cur.fetchall()
        items = [dict_row(cur, row) for row in rows]
        cur.close(); conn.close()
        return {"items": items, "count": len(items)}
    except Error as e:
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
