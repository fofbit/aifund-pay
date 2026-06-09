"""
AiFund Pay — Demo Server
https://aifund.com/pay
Run: pip install fastapi motor httpx uvicorn web3 && python demo_server.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from wallet_connect import create_wallet_router
from payment_verify import create_payment_router
from siwe_auth import create_siwe_router
from config import RECEIVING_ADDRESSES, GAS_TOLERANCE

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "aifund_pay_demo")
SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-production")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="AiFund Pay Demo")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], allow_credentials=True)

# Mount all routers
app.include_router(create_wallet_router(db), prefix="/api")
app.include_router(create_payment_router(db, RECEIVING_ADDRESSES, GAS_TOLERANCE), prefix="/api")
app.include_router(create_siwe_router(db, SECRET_KEY), prefix="/api")

@app.get("/api/")
async def root():
    return {"message": "AiFund Pay demo server", "version": "1.2.0", "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
