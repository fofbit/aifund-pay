"""
AiFund Pay — Subscription Payment Backend
Recurring billing with on-chain payment tracking.
https://aifund.com/pay

Usage:
    from subscription import create_subscription_router
    app.include_router(create_subscription_router(db), prefix="/api")
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)

# Default subscription plans (customize in your app)
DEFAULT_PLANS = {
    "starter_monthly": {
        "id": "starter_monthly",
        "name": "Starter Monthly",
        "price_usd": 1.00,
        "interval": "monthly",
        "interval_days": 30,
    },
    "basic_monthly": {
        "id": "basic_monthly",
        "name": "Basic Monthly",
        "price_usd": 4.99,
        "interval": "monthly",
        "interval_days": 30,
    },
    "pro_monthly": {
        "id": "pro_monthly",
        "name": "Pro Monthly",
        "price_usd": 9.99,
        "interval": "monthly",
        "interval_days": 30,
    },
    "basic_yearly": {
        "id": "basic_yearly",
        "name": "Basic Yearly",
        "price_usd": 39.99,
        "interval": "yearly",
        "interval_days": 365,
    },
}


def create_subscription_router(
    db,
    plans: dict = None,
    subscriptions_collection: str = "subscriptions",
    sub_payments_collection: str = "subscription_payments",
) -> APIRouter:
    """
    Create a FastAPI router for subscription management.
    
    Args:
        db: Motor async MongoDB database
        plans: Dict of subscription plans (overrides defaults)
        subscriptions_collection: MongoDB collection name
        sub_payments_collection: MongoDB collection for payment records
    """
    router = APIRouter()
    subs = db[subscriptions_collection]
    payments = db[sub_payments_collection]
    available_plans = plans or DEFAULT_PLANS

    @router.get("/subscription/plans")
    async def get_plans():
        """List available subscription plans."""
        return {"plans": available_plans}

    @router.get("/subscription/{wallet_address}")
    async def get_subscription(wallet_address: str):
        """Get active subscription for a wallet."""
        sub = await subs.find_one(
            {"wallet_address": wallet_address.lower(), "status": {"$in": ["active", "past_due"]}},
            {"_id": 0}
        )
        return {"subscription": sub}

    @router.post("/subscription/create")
    async def create_subscription(req: dict):
        """Create a new subscription."""
        wallet_address = req.get("wallet_address", "").lower()
        plan_id = req.get("plan_id")
        payment_token = req.get("payment_token", "USDT")
        payment_chain = req.get("payment_chain", "trc20")

        if not wallet_address or not plan_id:
            raise HTTPException(status_code=400, detail="Missing fields")

        plan = available_plans.get(plan_id)
        if not plan:
            raise HTTPException(status_code=400, detail="Invalid plan")

        # Check existing
        existing = await subs.find_one({"wallet_address": wallet_address, "status": "active"})
        if existing:
            raise HTTPException(status_code=400, detail="Already have an active subscription")

        now = datetime.now(timezone.utc)
        subscription = {
            "id": str(uuid.uuid4())[:12],
            "wallet_address": wallet_address,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "price_usd": plan["price_usd"],
            "interval": plan["interval"],
            "interval_days": plan["interval_days"],
            "payment_token": payment_token,
            "payment_chain": payment_chain,
            "status": "pending_first_payment",  # active after first payment
            "created_at": now.isoformat(),
            "current_period_start": now.isoformat(),
            "current_period_end": (now + timedelta(days=plan["interval_days"])).isoformat(),
            "next_payment_date": now.isoformat(),  # Pay now
            "payments_count": 0,
        }

        await subs.insert_one(subscription)
        logger.info(f"Subscription created: {wallet_address} - {plan_id}")
        return {"subscription": {k: v for k, v in subscription.items() if k != "_id"}}

    @router.post("/subscription/payment")
    async def record_subscription_payment(req: dict):
        """Record a subscription payment and extend the period."""
        wallet_address = req.get("wallet_address", "").lower()
        tx_hash = req.get("tx_hash", "")
        amount = req.get("amount", 0)

        sub = await subs.find_one({"wallet_address": wallet_address, "status": {"$in": ["pending_first_payment", "active", "past_due"]}})
        if not sub:
            raise HTTPException(status_code=404, detail="No subscription found")

        # Record payment
        await payments.insert_one({
            "subscription_id": sub["id"],
            "wallet_address": wallet_address,
            "tx_hash": tx_hash,
            "amount": amount,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Extend subscription period
        now = datetime.now(timezone.utc)
        next_end = now + timedelta(days=sub["interval_days"])
        next_payment = next_end

        await subs.update_one(
            {"wallet_address": wallet_address, "id": sub["id"]},
            {"$set": {
                "status": "active",
                "current_period_start": now.isoformat(),
                "current_period_end": next_end.isoformat(),
                "next_payment_date": next_payment.isoformat(),
            },
            "$inc": {"payments_count": 1}}
        )

        logger.info(f"Subscription payment: {wallet_address} - ${amount}")
        return {"success": True, "next_payment_date": next_payment.isoformat()}

    @router.post("/subscription/cancel")
    async def cancel_subscription(req: dict):
        """Cancel a subscription (remains active until period end)."""
        wallet_address = req.get("wallet_address", "").lower()

        result = await subs.update_one(
            {"wallet_address": wallet_address, "status": "active"},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="No active subscription")

        logger.info(f"Subscription cancelled: {wallet_address}")
        return {"success": True, "message": "Subscription cancelled. Access remains until current period ends."}

    return router
