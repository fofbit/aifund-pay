"""
AiFund Pay — Wallet Connect API Routes
https://aifund.com/pay

Drop-in FastAPI router for wallet connection.
Usage:
    from wallet_connect import create_wallet_router
    app.include_router(create_wallet_router(db), prefix="/api")
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)


class ConnectWalletRequest(BaseModel):
    wallet_address: str
    wallet_type: str = "metamask"  # metamask, okx, unisat, trust, demo


class UserModel(BaseModel):
    """Default user model. Extend as needed for your project."""
    model_config = ConfigDict(extra="ignore")
    wallet_address: str
    balance_usd: float = 0.0
    tier: str = "inactive"  # inactive, basic, vip — customize tiers
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])


def create_wallet_router(db, users_collection: str = "users") -> APIRouter:
    """
    Create a FastAPI router for wallet connect/disconnect.
    
    Args:
        db: Motor async MongoDB database instance
        users_collection: Name of MongoDB collection for users
    
    Returns:
        APIRouter with /wallet/connect endpoint
    """
    router = APIRouter()
    users = db[users_collection]

    @router.post("/wallet/connect")
    async def connect_wallet(req: ConnectWalletRequest):
        """Connect wallet — creates new user or returns existing."""
        wallet_address = req.wallet_address.lower()
        
        user = await users.find_one({"wallet_address": wallet_address}, {"_id": 0})
        
        if not user:
            new_user = UserModel(wallet_address=wallet_address)
            user_dict = new_user.model_dump()
            user_dict["joined_at"] = user_dict["joined_at"].isoformat()
            await users.insert_one(user_dict)
            logger.info(f"New user: {wallet_address} via {req.wallet_type}")
            return {"status": "new_user", "user": new_user.model_dump()}
        
        logger.info(f"Existing user: {wallet_address}")
        return {
            "status": "existing_user",
            "user": {
                "wallet_address": user["wallet_address"],
                "balance_usd": user.get("balance_usd", 0),
                "tier": user.get("tier", "inactive"),
                "referral_code": user.get("referral_code"),
            }
        }

    @router.get("/wallet/info/{wallet_address}")
    async def get_wallet_info(wallet_address: str):
        """Get user info by wallet address."""
        user = await users.find_one(
            {"wallet_address": wallet_address.lower()}, {"_id": 0}
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"user": user}

    return router
