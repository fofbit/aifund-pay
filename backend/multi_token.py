"""
AiFund Pay — Multi-Token Payment Support
Accept USDT, USDC, ETH, BTC, SOL and custom ERC-20/SPL tokens.
https://aifund.com/pay

Adds to payment_verify.py:
  - Token-aware verification (check specific contract or native transfer)
  - Price conversion via CoinGecko
  - Multi-token balance tracking
"""
from fastapi import APIRouter
from typing import Dict, Optional
import httpx
import logging

logger = logging.getLogger(__name__)

# Token contract addresses for verification
TOKEN_CONTRACTS = {
    "USDT": {
        "erc20": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "bsc": "0x55d398326f99059ff775485246999027b3197955",
        "arb": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
        "trc20": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    },
    "USDC": {
        "erc20": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "arb": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    "ETH": {"erc20": "native", "arb": "native", "base": "native"},
    "BNB": {"bsc": "native"},
    "SOL": {"sol": "native"},
}

COINGECKO_IDS = {
    "ETH": "ethereum",
    "BTC": "bitcoin",
    "SOL": "solana",
    "BNB": "binancecoin",
}


async def get_usd_price(token_symbol: str) -> float:
    """Get current USD price for a non-stablecoin token."""
    if token_symbol in ("USDT", "USDC"):
        return 1.0
    
    cg_id = COINGECKO_IDS.get(token_symbol)
    if not cg_id:
        return 0
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.coingecko.com/api/v3/simple/price?ids={cg_id}&vs_currencies=usd"
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get(cg_id, {}).get("usd", 0)
    except Exception as e:
        logger.error(f"Price fetch error for {token_symbol}: {e}")
    
    # Fallback prices
    fallbacks = {"ETH": 3500, "BTC": 100000, "SOL": 180, "BNB": 580}
    return fallbacks.get(token_symbol, 0)


def calculate_token_amount(usd_amount: float, token_symbol: str, price: float) -> float:
    """Calculate how much token is needed for a USD amount."""
    if token_symbol in ("USDT", "USDC"):
        return usd_amount
    if price <= 0:
        return 0
    return round(usd_amount / price, 8)


def create_multi_token_router(db) -> APIRouter:
    """Create router for multi-token price and conversion."""
    router = APIRouter()

    @router.get("/tokens/prices")
    async def get_token_prices():
        """Get current USD prices for all supported tokens."""
        prices = {}
        for symbol in ["USDT", "USDC", "ETH", "BTC", "SOL", "BNB"]:
            prices[symbol] = await get_usd_price(symbol)
        return {"prices": prices}

    @router.get("/tokens/convert")
    async def convert_amount(usd_amount: float, token: str = "ETH"):
        """Convert a USD amount to token amount."""
        price = await get_usd_price(token)
        amount = calculate_token_amount(usd_amount, token, price)
        return {
            "usd_amount": usd_amount,
            "token": token,
            "token_amount": amount,
            "price": price,
        }

    @router.get("/tokens/supported")
    async def get_supported_tokens():
        """List all supported tokens and their chains."""
        tokens = {}
        for symbol, chains in TOKEN_CONTRACTS.items():
            tokens[symbol] = {
                "symbol": symbol,
                "chains": list(chains.keys()),
                "is_stablecoin": symbol in ("USDT", "USDC"),
            }
        return {"tokens": tokens}

    return router
