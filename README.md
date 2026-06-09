# AiFund Pay

**Accept crypto payments in 3 minutes. Zero dependencies.**

*Not a dApp toolkit. A payment toolkit. For websites that want to accept crypto — without the complexity.*

No RainbowKit. No Web3Modal. No wagmi. No ethers.js. Just `window.ethereum` + your backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/badge/npm-%40aifund%2Fpay-purple)](https://www.npmjs.com/package/@aifund/pay)

> Built by the team behind [AiFund.com](https://aifund.com) — an AI-powered global wealth platform.
> 
> Product page: [aifund.com/pay](https://aifund.com/pay)

---

## How is this different?

The crypto wallet ecosystem has powerful tools — but they're built for **dApp developers** who need smart contract interaction. If you just want to **connect a wallet and accept payments**, you're forced to install 200KB+ of libraries you don't need.

**AiFund Pay** is for the other 90% — normal websites, SaaS apps, content platforms, and indie developers who want to accept crypto with minimal complexity.

> They build the **connection**. We build the **transaction**.
> 
> RainbowKit connects your wallet. AppKit connects your wallet with social login.
> **AiFund Pay connects your wallet AND verifies your payment on-chain.**
> 
> Every other library stops at "connected." We go all the way to "paid."

### vs. The Ecosystem

| | AiFund Pay | Reown AppKit | RainbowKit |
|---|---|---|---|
| **npm dependencies** | **0** (only axios) | 30+ packages | 15+ packages |
| **Bundle size** | **~5KB** | 200-500KB | ~150KB |
| **Registration required** | **No** | Yes (projectId) | Yes (projectId) |
| **USDT payment verification** | **Built-in (5 chains)** | ❌ | ❌ |
| **QR code for payment** | **Built-in** | ❌ | ❌ |
| **On-chain auto-verify** | **Built-in (polling)** | ❌ | ❌ |
| **Gas fee tolerance** | **Built-in (90%)** | ❌ | ❌ |
| **No-wallet user guide** | **Built-in (6 wallets)** | ❌ | ❌ |
| **Demo mode** | **Built-in** | ❌ | ❌ |
| **Setup time** | **3 minutes** | 30+ min | 20+ min |
| **Provider nesting** | **0 layers** | 3 layers | 3 layers |
| **Target user** | **Any website** | dApp devs | React dApp devs |

### Full Landscape

| Project | Stars | Chains | Size | What it does |
|---------|-------|--------|------|-------------|
| Reown AppKit | ~5K | EVM+SOL+BTC+TON+TRON+DOT | 200-500KB | Full wallet SDK, social login, analytics |
| RainbowKit | ~2.7K | EVM (via wagmi) | ~150KB | Beautiful React wallet UI |
| Dynamic.xyz | Closed | EVM+SOL+BTC+Cosmos | Heavy | Enterprise wallet + KYC |
| Privy | Closed | EVM+SOL | Heavy | Embedded wallets, social login |
| **AiFund Pay** | 🆕 | **EVM+Tron+Solana** | **~5KB** | **Wallet connect + payment verification** |

---

## Quick Start

### Frontend (React)

```bash
# Copy into your project
cp -r frontend/src/ your-app/src/aifund-pay/

# Only dependency
npm install axios
```

```jsx
import { useWalletConnect } from './aifund-pay/hooks/useWalletConnect';
import { WalletButton } from './aifund-pay/components/WalletButton';
import { PaymentFlow } from './aifund-pay/components/PaymentFlow';

function App() {
  const wallet = useWalletConnect();

  return (
    <div>
      <WalletButton wallet={wallet} />
      
      {wallet.connected && (
        <PaymentFlow
          walletAddress={wallet.address}
          amount={9.99}
          onSuccess={() => console.log('Paid!')}
        />
      )}
    </div>
  );
}
```

### Backend (Python FastAPI)

```bash
pip install fastapi motor httpx uvicorn
```

```python
from fastapi import FastAPI
from wallet_connect import create_wallet_router
from payment_verify import create_payment_router
from config import RECEIVING_ADDRESSES

app = FastAPI()
app.include_router(create_wallet_router(db), prefix="/api")
app.include_router(create_payment_router(db, RECEIVING_ADDRESSES), prefix="/api")
```

### Configuration

```javascript
// config.js — change these, everything else works
export default {
  receivingAddresses: {
    trc20: { address: 'YOUR_TRON_ADDRESS', chain: 'Tron' },
    erc20: { address: 'YOUR_ETH_ADDRESS', chain: 'Ethereum' },
    bsc:   { address: 'YOUR_BSC_ADDRESS', chain: 'BSC' },
    arb:   { address: 'YOUR_ARB_ADDRESS', chain: 'Arbitrum' },
    sol:   { address: 'YOUR_SOL_ADDRESS', chain: 'Solana' },
  },
  backendUrl: process.env.REACT_APP_BACKEND_URL + '/api',
};
```

---

## Features

### 🔌 Wallet Connect
- **Zero dependencies** — native `window.ethereum` API
- **6 wallets** — MetaMask, OKX, WizzWallet, Trust, Coinbase, Unisat
- **Installation guide** — for users without wallet extensions (with Chrome Store links)
- **Demo mode** — full experience without any wallet
- **Auto-reconnect** — localStorage persistence across sessions
- **Chain auto-detect** — EVM / Tron / Solana from address format
- **Account menu** — address, balance, chain type, disconnect/switch

### 💰 Payment Verification
- **5 chains** — TRC20, ERC20, BSC, Arbitrum, Solana (USDT)
- **QR code** — auto-generated for mobile wallet scanning
- **Auto-verify** — polls blockchain APIs every 10s with visual spinner
- **Gas tolerance** — accepts 90% of required amount
- **TX hash fallback** — manual confirmation when auto-detect fails
- **Same-wallet check** — prompts payment from connected address
- **Duplicate prevention** — TX hash deduplication
- **Auto-grant** — payment confirmed → permissions updated instantly

---

## File Structure

```
aifund-pay/
├── frontend/src/
│   ├── hooks/
│   │   └── useWalletConnect.js    # Core wallet hook
│   ├── components/
│   │   ├── WalletButton.jsx       # Connect/disconnect + account menu
│   │   ├── WalletGuide.jsx        # No-wallet installation guide
│   │   └── PaymentFlow.jsx        # 3-step USDT payment + verification
│   └── config.js                  # All configuration in one file
├── backend/
│   ├── wallet_connect.py          # FastAPI wallet routes (factory)
│   ├── payment_verify.py          # On-chain USDT verification (factory)
│   └── config.py                  # Backend configuration
├── demo/
│   ├── DemoApp.jsx                # Frontend minimal example
│   └── demo_server.py             # Backend minimal example
└── docs/
    └── API.md                     # Complete API documentation
```

## Supported Chains

| Chain | Auto-Verify | Explorer API | Fee Level |
|-------|------------|--------------|-----------|
| Tron (TRC20) | ✅ | TronScan | ⭐ Lowest |
| Ethereum (ERC20) | ✅ | Etherscan | High |
| BSC (BEP20) | ✅ | BscScan | Low |
| Arbitrum | ✅ | Arbiscan | Low |
| Solana | Manual TX | — | Very low |

## Roadmap

| Version | Feature | Status |
|---------|---------|--------|
| v1.0 | Wallet connect + USDT payment verification | ✅ Released |
| v1.1 | SIWE signature verification (x401 security) | Planned |
| v1.2 | Native Solana + Bitcoin wallet adapters | Planned |
| v1.3 | x402 HTTP micropayment protocol | Planned |
| v2.0 | Multi-token payment (USDC, ETH, BTC, SOL) | Planned |
| v2.1 | Subscription payments (recurring billing) | Planned |
| v3.0 | AI Agent autonomous payment standard | Planned |

## Who is this for?

- 🛍️ **E-commerce** — accept USDT on your store
- 💻 **SaaS** — crypto subscription payments
- 📝 **Content creators** — paywall with crypto
- 🤖 **AI apps** — charge for API usage
- 🎮 **Games** — in-app purchases with crypto
- 🏗️ **Any developer** — who wants crypto payments without the complexity

## License

MIT — use it however you want, commercially or otherwise.

## Links

- **Product page**: [aifund.com/pay](https://aifund.com/pay)
- **Main platform**: [AiFund.com](https://aifund.com) — AI-powered global wealth platform
- **Documentation**: [docs/API.md](./docs/API.md)

---

<p align="center">
  <strong>AiFund Pay</strong> — from the team building equal access to global wealth.
  <br>
  <a href="https://aifund.com">aifund.com</a>
</p>
