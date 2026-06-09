/**
 * AiFund Pay — Configuration
 * Accept crypto payments in 3 minutes.
 * https://aifund.com/pay
 * 
 * Customize all settings here. No code changes needed.
 */

const config = {
  // ===== RECEIVING ADDRESSES =====
  // Replace with YOUR USDT addresses for each chain
  receivingAddresses: {
    trc20: {
      address: 'YOUR_TRON_USDT_ADDRESS',
      chain: 'Tron',
      label: 'USDT / TRC20',
      explorer: 'https://tronscan.org/#/address/YOUR_ADDRESS',
      usdtContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    },
    erc20: {
      address: 'YOUR_ETH_USDT_ADDRESS',
      chain: 'Ethereum',
      label: 'USDT / ERC20',
      explorer: 'https://etherscan.io/address/YOUR_ADDRESS',
      usdtContract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
    bsc: {
      address: 'YOUR_BSC_USDT_ADDRESS',
      chain: 'BSC',
      label: 'USDT / BEP20',
      explorer: 'https://bscscan.com/address/YOUR_ADDRESS',
      usdtContract: '0x55d398326f99059ff775485246999027b3197955',
    },
    arb: {
      address: 'YOUR_ARB_USDT_ADDRESS',
      chain: 'Arbitrum',
      label: 'USDT / Arbitrum',
      explorer: 'https://arbiscan.io/address/YOUR_ADDRESS',
      usdtContract: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    },
    sol: {
      address: 'YOUR_SOLANA_USDT_ADDRESS',
      chain: 'Solana',
      label: 'USDT / Solana',
      explorer: 'https://solscan.io/account/YOUR_ADDRESS',
    },
  },

  // ===== CHAIN DISPLAY INFO =====
  chains: {
    trc20: { name: 'Tron (TRC20)', icon: '🔴', fee: 'Low (~1 USDT)', speed: '~3s' },
    erc20: { name: 'Ethereum (ERC20)', icon: '🔷', fee: 'High gas', speed: '~15s' },
    bsc:   { name: 'BNB Chain (BEP20)', icon: '🟡', fee: 'Very low', speed: '~3s' },
    arb:   { name: 'Arbitrum', icon: '🔵', fee: 'Low', speed: '~2s' },
    sol:   { name: 'Solana', icon: '🟣', fee: 'Minimal', speed: '~0.4s' },
  },

  // ===== SUPPORTED WALLETS =====
  // Shown in the wallet installation guide for users without a wallet
  wallets: [
    { name: 'MetaMask', desc: 'Most popular Ethereum wallet', icon: '🦊', url: 'https://metamask.io/download/', chrome: 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn', type: 'Browser + Mobile' },
    { name: 'OKX Wallet', desc: 'OKX official Web3 wallet', icon: '⭕', url: 'https://www.okx.com/web3', chrome: 'https://chromewebstore.google.com/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge', type: 'Browser + Mobile' },
    { name: 'Trust Wallet', desc: 'Binance recommended wallet', icon: '🛡️', url: 'https://trustwallet.com/download', chrome: 'https://chromewebstore.google.com/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph', type: 'Browser + Mobile' },
    { name: 'Coinbase Wallet', desc: 'Coinbase official wallet', icon: '🔵', url: 'https://www.coinbase.com/wallet/downloads', chrome: 'https://chromewebstore.google.com/detail/coinbase-wallet-extension/hnfanknocfeofbddgcijnmhnfnkdnaad', type: 'Browser + Mobile' },
    { name: 'Unisat', desc: 'Bitcoin inscriptions wallet', icon: '🟠', url: 'https://unisat.io/download', chrome: 'https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo', type: 'Browser Extension' },
  ],

  // ===== BACKEND =====
  backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',

  // ===== LOCAL STORAGE KEYS =====
  storageKeys: {
    wallet: 'cwl_wallet',      // Connected wallet address
    demoMode: 'cwl_demo_mode', // Demo mode flag
  },

  // ===== PAYMENT =====
  payment: {
    pollInterval: 10000,     // Auto-verify every 10 seconds
    maxPolls: 30,            // Max attempts (5 minutes total)
    gasTolerance: 0.9,       // Accept 90% of required amount
    qrApiUrl: 'https://api.qrserver.com/v1/create-qr-code/',
  },

  // ===== DEMO MODE =====
  demo: {
    enabled: true,
    walletAddress: '0xDemoAccount_CryptoWalletLite',
  },
};

export default config;
