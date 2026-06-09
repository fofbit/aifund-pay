"""
AiFund Pay — Backend Configuration
https://aifund.com/pay
Replace with your own USDT receiving addresses.
"""

# USDT Receiving Addresses (one per chain)
RECEIVING_ADDRESSES = {
    "trc20": {
        "address": "YOUR_TRON_USDT_ADDRESS",
        "chain": "Tron",
        "usdt_contract": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    },
    "erc20": {
        "address": "YOUR_ETH_USDT_ADDRESS",
        "chain": "Ethereum",
        "usdt_contract": "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    "bsc": {
        "address": "YOUR_BSC_USDT_ADDRESS",
        "chain": "BSC",
        "usdt_contract": "0x55d398326f99059ff775485246999027b3197955",
    },
    "arb": {
        "address": "YOUR_ARB_USDT_ADDRESS",
        "chain": "Arbitrum",
        "usdt_contract": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    "sol": {
        "address": "YOUR_SOLANA_USDT_ADDRESS",
        "chain": "Solana",
    },
}

# Gas fee tolerance (accept 90% of required amount)
GAS_TOLERANCE = 0.9

# MongoDB collection name for users
USERS_COLLECTION = "users"
DEPOSITS_COLLECTION = "deposits"
