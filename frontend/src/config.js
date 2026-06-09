/**
 * AiFund Pay — Configuration
 * Accept crypto payments in 3 minutes.
 * https://aifund.com/pay
 * 
 * Customize all settings here. No code changes needed.
 */

const config = {
  // ===== THEME =====
  // Customize colors to match your brand. All components follow this theme.
  theme: {
    // Primary brand color (buttons, highlights, active states)
    primary: '#7C3AED',       // Purple — change to your brand color
    primaryHover: '#6D28D9',
    // Secondary color (demo button, info elements)  
    secondary: '#0891B2',     // Cyan
    // Success color (payment verified, copied)
    success: '#059669',       // Green
    // Danger color (disconnect, warnings)
    danger: '#EF4444',        // Red
    // Warning color (gas fee alerts, chain warnings)
    warning: '#EAB308',       // Yellow
    // Background colors
    bgPrimary: '#0F172A',     // Dark navy — main background
    bgSecondary: '#1E293B',   // Slightly lighter — cards/modals
    bgTertiary: 'rgba(255,255,255,0.05)', // Subtle card background
    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#4B5563',
    // Border
    border: 'rgba(255,255,255,0.1)',
    borderHover: 'rgba(255,255,255,0.3)',
    // Gradient (connect button, primary CTA)
    gradient: 'linear-gradient(to right, #7C3AED, #EC4899)',
    gradientSuccess: 'linear-gradient(to right, #059669, #10B981)',
    // Border radius
    radius: '12px',
    radiusLg: '16px',
    radiusFull: '24px',
    // "Powered by" footer — set false to hide
    showPoweredBy: true,
  },

  // ===== RECEIVING ADDRESSES =====
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
    base:  { name: 'Base', icon: '🅱️', fee: 'Very low', speed: '~2s' },
    sol:   { name: 'Solana', icon: '🟣', fee: 'Minimal', speed: '~0.4s' },
    bitcoin: { name: 'Bitcoin', icon: '🟠', fee: 'Variable', speed: '~10min' },
  },

  // ===== SUPPORTED WALLETS =====
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
    wallet: 'afp_wallet',
    demoMode: 'afp_demo_mode',
  },

  // ===== PAYMENT =====
  payment: {
    pollInterval: 10000,
    maxPolls: 30,
    gasTolerance: 0.9,
    qrApiUrl: 'https://api.qrserver.com/v1/create-qr-code/',
  },

  // ===== DEMO MODE =====
  demo: {
    enabled: true,
    walletAddress: '0xDemoAccount_AiFundPay',
  },
};

export default config;
