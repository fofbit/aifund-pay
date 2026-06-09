"""
AiFund Pay — x402 Micropayment Backend Middleware
HTTP 402 Payment Required protocol for API billing.
https://aifund.com/pay

Usage:
    from x402_middleware import create_x402_paywall, create_x402_verify

    # Option 1: Decorator
    @app.get("/api/premium")
    @x402_paywall(price=0.01, currency="USDT")
    async def premium_endpoint():
        return {"data": "premium content"}

    # Option 2: Middleware for all routes
    app.include_router(create_x402_router(db, verify_payment_func), prefix="/api")
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from typing import Callable, Optional
from functools import wraps
import json
import base64
import logging

logger = logging.getLogger(__name__)


def x402_payment_required(price: float, currency: str = "USDT", description: str = "API access", recipient: str = ""):
    """
    Return a 402 Payment Required response with payment details.
    Use this in your endpoint to request payment.
    """
    return JSONResponse(
        status_code=402,
        content={
            "error": "Payment Required",
            "payment": {
                "amount": price,
                "currency": currency,
                "description": description,
                "recipient": recipient,
                "protocol": "x402",
            }
        },
        headers={
            "X-Payment-Required": "true",
            "X-Payment-Amount": str(price),
            "X-Payment-Currency": currency,
        }
    )


def parse_x402_header(request: Request) -> Optional[dict]:
    """Parse the X-PAYMENT header from a request."""
    payment_header = request.headers.get("X-PAYMENT")
    if not payment_header:
        return None
    try:
        decoded = json.loads(base64.b64decode(payment_header))
        return {
            "message": json.loads(decoded.get("message", "{}")),
            "signature": decoded.get("signature", ""),
            "address": decoded.get("address", ""),
            "chain": decoded.get("chain", "evm"),
        }
    except Exception as e:
        logger.error(f"x402 header parse error: {e}")
        return None


def create_x402_router(
    db,
    verify_signature_func: Optional[Callable] = None,
    payments_collection: str = "x402_payments",
) -> APIRouter:
    """
    Create a FastAPI router for x402 payment tracking.
    
    Args:
        db: Motor async MongoDB database
        verify_signature_func: Optional function to verify payment signatures
        payments_collection: MongoDB collection for payment records
    """
    router = APIRouter()
    payments = db[payments_collection]

    @router.post("/x402/record")
    async def record_payment(request: Request):
        """Record an x402 micropayment."""
        payment = parse_x402_header(request)
        if not payment:
            raise HTTPException(status_code=400, detail="Invalid payment header")

        msg = payment["message"]
        
        # Record payment
        await payments.insert_one({
            "from": payment["address"],
            "to": msg.get("to", ""),
            "amount": msg.get("amount", 0),
            "currency": msg.get("currency", "USDT"),
            "description": msg.get("description", ""),
            "signature": payment["signature"],
            "chain": payment["chain"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        return {"recorded": True}

    @router.get("/x402/balance/{address}")
    async def get_payment_balance(address: str):
        """Get total x402 micropayments by address."""
        pipeline = [
            {"$match": {"from": address.lower()}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        ]
        result = await payments.aggregate(pipeline).to_list(1)
        if result:
            return {"address": address, "total_spent": result[0]["total"], "payment_count": result[0]["count"]}
        return {"address": address, "total_spent": 0, "payment_count": 0}

    return router


def x402_paywall(price: float, currency: str = "USDT", description: str = ""):
    """
    Decorator to add x402 paywall to an endpoint.
    If no X-PAYMENT header, returns 402. If present, allows through.
    
    Usage:
        @app.get("/api/premium")
        @x402_paywall(price=0.01, currency="USDT", description="Premium data access")
        async def premium_endpoint():
            return {"data": "premium content"}
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, request: Request = None, **kwargs):
            # Check for x402 payment header
            if request:
                payment = parse_x402_header(request)
                if payment and payment["message"].get("amount", 0) >= price:
                    # Payment provided, allow through
                    return await func(*args, **kwargs)
            
            # No payment — return 402
            return x402_payment_required(price, currency, description or func.__name__)
        
        return wrapper
    return decorator
