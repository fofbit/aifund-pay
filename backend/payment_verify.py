"""
AiFund Pay — On-chain USDT Payment Verification
https://aifund.com/pay

Drop-in FastAPI router for crypto payment verification.
Usage:
    from payment_verify import create_payment_router
    app.include_router(create_payment_router(db, ADDRESSES), prefix="/api")
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional, Dict
import httpx
import uuid
import logging

logger = logging.getLogger(__name__)


def create_payment_router(
    db,
    receiving_addresses: Dict,
    gas_tolerance: float = 0.9,
    deposits_collection: str = "deposits",
    users_collection: str = "users",
) -> APIRouter:
    """
    Create a FastAPI router for USDT payment verification.
    
    Args:
        db: Motor async MongoDB database instance
        receiving_addresses: Dict of chain_id -> {address, chain, usdt_contract}
        gas_tolerance: Accept this fraction of required amount (default 0.9 = 90%)
        deposits_collection: MongoDB collection for deposit records
        users_collection: MongoDB collection for users
    """
    router = APIRouter()
    deposits = db[deposits_collection]
    users = db[users_collection]

    @router.get("/payment/addresses")
    async def get_payment_addresses():
        """Return all receiving addresses for frontend display."""
        result = {}
        for chain_id, info in receiving_addresses.items():
            result[chain_id] = {
                "address": info["address"],
                "chain": info["chain"],
                "label": f"USDT / {info['chain']}",
                "explorer": info.get("explorer", ""),
            }
        return {"addresses": result}

    @router.post("/payment/verify")
    async def verify_payment(req: dict):
        """Auto-verify on-chain payment."""
        wallet_address = req.get("wallet_address", "").lower()
        amount = req.get("amount", 0)
        chain = req.get("chain")
        payment_type = req.get("payment_type", "deposit")
        
        if not wallet_address or amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid request")
        
        result = await _verify_on_chain(chain, wallet_address, amount * gas_tolerance)
        
        if result and result.get("verified"):
            # Check duplicate
            existing = await deposits.find_one({"tx_hash": result.get("tx_hash")})
            if existing:
                return {"verified": True, "already_processed": True, "message": "Already processed"}
            
            # Record deposit
            await deposits.insert_one({
                "id": str(uuid.uuid4()),
                "wallet_address": wallet_address,
                "currency": "USDT",
                "amount": result["amount"],
                "chain": result["chain"],
                "tx_hash": result.get("tx_hash", ""),
                "payment_type": payment_type,
                "status": "confirmed",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            
            # Update user balance
            await users.update_one(
                {"wallet_address": wallet_address},
                {"$inc": {"balance_usd": result["amount"]}}
            )
            
            logger.info(f"Payment verified: {wallet_address} - {result['amount']} USDT via {result['chain']}")
            return {
                "verified": True,
                "chain": result["chain"],
                "tx_hash": result.get("tx_hash"),
                "amount": result["amount"],
                "message": "Payment verified!",
            }
        
        return {"verified": False, "message": "Payment not detected yet. Please wait and retry."}

    @router.post("/payment/manual-confirm")
    async def manual_confirm(req: dict):
        """Manual TX hash confirmation (fallback)."""
        wallet_address = req.get("wallet_address", "").lower()
        tx_hash = req.get("tx_hash", "")
        amount = req.get("amount", 0)
        chain = req.get("chain", "unknown")
        payment_type = req.get("payment_type", "deposit")
        
        if not wallet_address or not tx_hash or amount <= 0:
            raise HTTPException(status_code=400, detail="Missing fields")
        
        existing = await deposits.find_one({"tx_hash": tx_hash})
        if existing:
            return {"success": True, "already_processed": True}
        
        await deposits.insert_one({
            "id": str(uuid.uuid4()),
            "wallet_address": wallet_address,
            "currency": "USDT",
            "amount": amount,
            "chain": chain,
            "tx_hash": tx_hash,
            "payment_type": payment_type,
            "status": "pending_review",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        
        await users.update_one(
            {"wallet_address": wallet_address},
            {"$inc": {"balance_usd": amount}}
        )
        
        return {"success": True, "message": "Payment recorded."}

    async def _verify_on_chain(chain: str, from_address: str, min_amount: float) -> Optional[Dict]:
        """Check blockchain APIs for USDT transfer."""
        if chain == "trc20":
            return await _check_trc20(from_address, min_amount)
        elif chain in ("erc20", "bsc", "arb"):
            return await _check_evm(chain, from_address, min_amount)
        return None

    async def _check_trc20(from_address: str, min_amount: float) -> Optional[Dict]:
        try:
            addr = receiving_addresses["trc20"]["address"]
            contract = receiving_addresses["trc20"].get("usdt_contract", "")
            url = f"https://apilist.tronscanapi.com/api/filter/trc20/transfers?limit=20&toAddress={addr}&contract_address={contract}"
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    for tx in resp.json().get("token_transfers", []):
                        if tx.get("from_address", "").lower() == from_address.lower():
                            amount = float(tx.get("quant", 0)) / 1e6
                            if amount >= min_amount:
                                return {"verified": True, "chain": "trc20", "tx_hash": tx.get("transaction_id"), "amount": amount}
        except Exception as e:
            logger.error(f"TRC20 check error: {e}")
        return None

    async def _check_evm(chain: str, from_address: str, min_amount: float) -> Optional[Dict]:
        api_urls = {"erc20": "https://api.etherscan.io/api", "bsc": "https://api.bscscan.com/api", "arb": "https://api.arbiscan.io/api"}
        if chain not in api_urls:
            return None
        try:
            addr = receiving_addresses[chain]["address"]
            contract = receiving_addresses[chain].get("usdt_contract", "")
            url = f"{api_urls[chain]}?module=account&action=tokentx&contractaddress={contract}&address={addr}&sort=desc&page=1&offset=20"
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    for tx in resp.json().get("result", []):
                        if tx.get("from", "").lower() == from_address.lower():
                            decimals = int(tx.get("tokenDecimal", 6))
                            amount = float(tx.get("value", 0)) / (10 ** decimals)
                            if amount >= min_amount:
                                return {"verified": True, "chain": chain, "tx_hash": tx.get("hash"), "amount": amount}
        except Exception as e:
            logger.error(f"EVM {chain} check error: {e}")
        return None

    return router
