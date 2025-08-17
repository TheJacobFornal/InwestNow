from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

ALLOWED_ORIGINS = [
    "http://localhost:5173",          # dev (Vite)
    "https://www.mycoins.pl"     # podmień po deployu frontu
]

app = FastAPI(title="InwestNow API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/hello")
def hello(name: str | None = None):
    who = name or "Jacob"
    return {"message": f"Hello {who}"}

# Handler dla AWS Lambda
handler = Mangum(app)