"""
AiFund Pay — SIWE (Sign-In With Ethereum) Backend Routes
x401-level security: cryptographic proof of wallet ownership.
https://aifund.com/pay

Flow:
  1. GET /api/auth/nonce → returns nonce + message to sign
  2. POST /api/auth/verify → verifies signature, returns JWT token

Usage:
    from siwe_auth import create_siwe_router
    app.include_router(create_siwe_router(db, SECRET_KEY), prefix="/api")
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from typing import Optional
from eth_account.messages import encode_defunct
from web3 import Web3
import secrets
import hashlib
import hmac
import json
import base64
import logging

logger = logging.getLogger(__name__)


def create_siwe_router(
    db,
    secret_key: str,
    nonces_collection: str = "auth_nonces",
    token_expiry_hours: int = 24,
    app_name: str = "AiFund Pay",
    app_domain: str = "aifund.com",
) -> APIRouter:
    """
    Create a FastAPI router for SIWE authentication.
    
    Args:
        db: Motor async MongoDB database instance
        secret_key: Secret key for signing JWT-like tokens
        nonces_collection: MongoDB collection for storing nonces
        token_expiry_hours: Token validity period in hours
        app_name: Application name shown in sign message
        app_domain: Domain shown in sign message
    """
    router = APIRouter()
    nonces = db[nonces_collection]
    w3 = Web3()

    def _create_token(address: str) -> str:
        """Create a simple HMAC-signed token (lightweight JWT alternative)."""
        payload = {
            "address": address.lower(),
            "exp": (datetime.now(timezone.utc) + timedelta(hours=token_expiry_hours)).isoformat(),
            "iat": datetime.now(timezone.utc).isoformat(),
        }
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
        sig = hmac.new(secret_key.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        return f"{payload_b64}.{sig}"

    def _verify_token(token: str) -> Optional[str]:
        """Verify token, return address if valid."""
        try:
            payload_b64, sig = token.rsplit('.', 1)
            expected_sig = hmac.new(secret_key.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                return None
            payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            if datetime.fromisoformat(payload["exp"]) < datetime.now(timezone.utc):
                return None
            return payload["address"]
        except Exception:
            return None

    @router.get("/auth/nonce")
    async def get_nonce(address: str):
        """Generate a nonce and sign-in message for SIWE."""
        address = address.lower()
        nonce = secrets.token_hex(16)

        # Store nonce with expiry (10 minutes)
        await nonces.update_one(
            {"address": address},
            {"$set": {
                "nonce": nonce,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
            }},
            upsert=True,
        )

        # EIP-4361 style message
        message = (
            f"{app_name} wants you to sign in with your Ethereum account:\n"
            f"{address}\n\n"
            f"Sign this message to prove you own this wallet. No gas fee.\n\n"
            f"URI: https://{app_domain}\n"
            f"Nonce: {nonce}\n"
            f"Issued At: {datetime.now(timezone.utc).isoformat()}"
        )

        return {"nonce": nonce, "message": message}

    @router.post("/auth/verify")
    async def verify_signature(req: dict):
        """Verify wallet signature and return auth token."""
        address = req.get("address", "").lower()
        signature = req.get("signature", "")
        nonce = req.get("nonce", "")

        if not address or not signature or not nonce:
            raise HTTPException(status_code=400, detail="Missing fields")

        # Check nonce exists and hasn't expired
        stored = await nonces.find_one({"address": address, "nonce": nonce})
        if not stored:
            raise HTTPException(status_code=400, detail="Invalid or expired nonce")

        expires_at = datetime.fromisoformat(stored["expires_at"])
        if expires_at < datetime.now(timezone.utc):
            await nonces.delete_one({"address": address, "nonce": nonce})
            raise HTTPException(status_code=400, detail="Nonce expired")

        # Reconstruct the message
        message = (
            f"{app_name} wants you to sign in with your Ethereum account:\n"
            f"{address}\n\n"
            f"Sign this message to prove you own this wallet. No gas fee.\n\n"
            f"URI: https://{app_domain}\n"
            f"Nonce: {nonce}\n"
            f"Issued At: {stored['created_at']}"
        )

        # Verify signature
        try:
            msg = encode_defunct(text=message)
            recovered = w3.eth.account.recover_message(msg, signature=signature)
            if recovered.lower() != address:
                raise HTTPException(status_code=401, detail="Signature mismatch")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            raise HTTPException(status_code=401, detail="Invalid signature")

        # Clean up nonce (single use)
        await nonces.delete_one({"address": address, "nonce": nonce})

        # Generate token
        token = _create_token(address)

        logger.info(f"SIWE verified: {address}")
        return {"verified": True, "address": address, "token": token}

    @router.get("/auth/me")
    async def get_current_user(token: str = ""):
        """Verify token and return current user address."""
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
        address = _verify_token(token)
        if not address:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"address": address, "authenticated": True}

    # Expose verify function for other routers to use
    router.verify_token = _verify_token

    return router
