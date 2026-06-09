/**
 * AiFund Pay — Multi-Wallet Adapter
 * Native support for EVM + Solana + Bitcoin wallets. Zero dependencies.
 * https://aifund.com/pay
 * 
 * Detects and connects to:
 *   - EVM: MetaMask, OKX, Trust, Coinbase (window.ethereum)
 *   - Solana: Phantom, Solflare (window.phantom.solana / window.solana)
 *   - Bitcoin: Unisat, WizzWallet (window.unisat / window.wizz)
 */

const WALLET_PROVIDERS = {
  // EVM wallets — window.ethereum
  evm: {
    detect: () => typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
    connect: async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return { address: accounts[0], chain: 'evm', provider: 'ethereum' };
    },
    getAddress: async () => {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    },
    sign: async (address, message) => {
      return await window.ethereum.request({ method: 'personal_sign', params: [message, address] });
    },
    icon: '🔷',
    label: 'EVM (MetaMask / OKX / Trust)',
  },

  // Solana wallets — window.phantom.solana or window.solana
  solana: {
    detect: () => typeof window !== 'undefined' && (window.phantom?.solana || window.solana),
    connect: async () => {
      const provider = window.phantom?.solana || window.solana;
      if (!provider) throw new Error('Solana wallet not found');
      const response = await provider.connect();
      return { address: response.publicKey.toString(), chain: 'solana', provider: 'phantom' };
    },
    getAddress: async () => {
      const provider = window.phantom?.solana || window.solana;
      if (provider?.isConnected && provider?.publicKey) {
        return provider.publicKey.toString();
      }
      return null;
    },
    sign: async (address, message) => {
      const provider = window.phantom?.solana || window.solana;
      const encodedMessage = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(encodedMessage, 'utf8');
      return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
    },
    disconnect: async () => {
      const provider = window.phantom?.solana || window.solana;
      if (provider?.disconnect) await provider.disconnect();
    },
    icon: '🟣',
    label: 'Solana (Phantom)',
  },

  // Bitcoin wallets — window.unisat
  bitcoin: {
    detect: () => typeof window !== 'undefined' && typeof window.unisat !== 'undefined',
    connect: async () => {
      const accounts = await window.unisat.requestAccounts();
      return { address: accounts[0], chain: 'bitcoin', provider: 'unisat' };
    },
    getAddress: async () => {
      try {
        const accounts = await window.unisat.getAccounts();
        return accounts[0] || null;
      } catch { return null; }
    },
    sign: async (address, message) => {
      return await window.unisat.signMessage(message);
    },
    icon: '🟠',
    label: 'Bitcoin (Unisat)',
  },

  // WizzWallet (Atomicals) — window.wizz
  atomicals: {
    detect: () => typeof window !== 'undefined' && typeof window.wizz !== 'undefined',
    connect: async () => {
      const accounts = await window.wizz.requestAccounts();
      return { address: accounts[0], chain: 'atomicals', provider: 'wizz' };
    },
    getAddress: async () => {
      try {
        const accounts = await window.wizz.getAccounts();
        return accounts[0] || null;
      } catch { return null; }
    },
    sign: async (address, message) => {
      return await window.wizz.signMessage(message);
    },
    icon: '🧙',
    label: 'Atomicals (WizzWallet)',
  },
};

/**
 * Detect all available wallet providers in the browser
 * @returns {Array} List of detected wallet types with their info
 */
export function detectWallets() {
  const available = [];
  for (const [type, wallet] of Object.entries(WALLET_PROVIDERS)) {
    if (wallet.detect()) {
      available.push({ type, icon: wallet.icon, label: wallet.label });
    }
  }
  return available;
}

/**
 * Connect to a specific wallet type
 * @param {string} type - 'evm', 'solana', 'bitcoin', or 'atomicals'
 * @returns {Object} { address, chain, provider }
 */
export async function connectWallet(type = 'evm') {
  const wallet = WALLET_PROVIDERS[type];
  if (!wallet) throw new Error(`Unknown wallet type: ${type}`);
  if (!wallet.detect()) throw new Error(`${wallet.label} wallet not detected`);
  return await wallet.connect();
}

/**
 * Sign a message with the connected wallet
 * @param {string} type - Wallet type
 * @param {string} address - Wallet address
 * @param {string} message - Message to sign
 * @returns {string} Signature
 */
export async function signMessage(type, address, message) {
  const wallet = WALLET_PROVIDERS[type];
  if (!wallet) throw new Error(`Unknown wallet type: ${type}`);
  return await wallet.sign(address, message);
}

/**
 * Auto-detect chain type from address format
 * @param {string} address - Wallet address
 * @returns {string} 'evm', 'solana', 'bitcoin', or 'unknown'
 */
export function detectChainFromAddress(address) {
  if (!address) return 'unknown';
  if (address.startsWith('0x')) return 'evm';
  if (address.startsWith('T')) return 'tron';  // Tron uses T prefix
  if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) return 'bitcoin';
  if (address.length >= 32 && address.length <= 44 && !address.startsWith('0x')) return 'solana';
  return 'unknown';
}

export { WALLET_PROVIDERS };
