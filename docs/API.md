# API Documentation

## Wallet Connect

### POST /api/wallet/connect
Connect or create a user by wallet address.

**Request:**
```json
{
  "wallet_address": "0x71376f6e90cc455a900954be5fd8a1efc729d523",
  "wallet_type": "metamask"
}
```

**Response (new user):**
```json
{
  "status": "new_user",
  "user": {
    "wallet_address": "0x71376f...",
    "balance_usd": 0.0,
    "tier": "inactive",
    "joined_at": "2025-12-13T00:00:00Z",
    "referral_code": "a1b2c3d4"
  }
}
```

**Response (existing user):**
```json
{
  "status": "existing_user",
  "user": {
    "wallet_address": "0x71376f...",
    "balance_usd": 109.90,
    "tier": "vip",
    "referral_code": "a1b2c3d4"
  }
}
```

### GET /api/wallet/info/{wallet_address}
Get user info by address.

---

## Payment

### GET /api/payment/addresses
Returns all receiving USDT addresses.

**Response:**
```json
{
  "addresses": {
    "trc20": { "address": "TNGt...", "chain": "Tron", "label": "USDT / Tron" },
    "erc20": { "address": "0x713...", "chain": "Ethereum", "label": "USDT / Ethereum" },
    "bsc": { "address": "0x713...", "chain": "BSC", "label": "USDT / BSC" },
    "arb": { "address": "0x713...", "chain": "Arbitrum", "label": "USDT / Arbitrum" },
    "sol": { "address": "EjjW...", "chain": "Solana", "label": "USDT / Solana" }
  }
}
```

### POST /api/payment/verify
Auto-verify on-chain payment. Call repeatedly (every 10s) until verified.

**Request:**
```json
{
  "wallet_address": "0x71376f...",
  "amount": 9.0,
  "chain": "trc20",
  "payment_type": "deposit"
}
```

**Response (not found):**
```json
{ "verified": false, "message": "Payment not detected yet." }
```

**Response (verified):**
```json
{
  "verified": true,
  "chain": "trc20",
  "tx_hash": "abc123...",
  "amount": 9.9,
  "message": "Payment verified!"
}
```

### POST /api/payment/manual-confirm
Manual TX hash confirmation fallback.

**Request:**
```json
{
  "wallet_address": "0x71376f...",
  "tx_hash": "abc123def456...",
  "amount": 9.9,
  "chain": "trc20",
  "payment_type": "deposit"
}
```

**Response:**
```json
{ "success": true, "message": "Payment recorded." }
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing fields) |
| 404 | User not found |
| 4001 | MetaMask: user rejected connection (frontend) |
