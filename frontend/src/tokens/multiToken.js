/**
 * AiFund Pay — Multi-Token Payment Support
 * Accept USDT, USDC, ETH, BTC, SOL and any ERC-20/SPL token.
 * https://aifund.com/pay
 *
 * Adds to config.js:
 *   - Multiple token definitions per chain
 *   - Token selection in PaymentFlow
 *   - Price conversion via CoinGecko API
 */

// Default supported tokens with contract addresses
export const SUPPORTED_TOKENS = {
  // Stablecoins (1:1 USD, no conversion needed)
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    isStablecoin: true,
    icon: '💵',
    chains: {
      trc20: { contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
      erc20: { contract: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
      bsc: { contract: '0x55d398326f99059ff775485246999027b3197955' },
      arb: { contract: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' },
      polygon: { contract: '0xc2132D05D31c914a87C6611C10748AaCBb0B0cE' },
      sol: { contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
    },
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    isStablecoin: true,
    icon: '🔵',
    chains: {
      erc20: { contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      arb: { contract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      polygon: { contract: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
      base: { contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      sol: { contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    },
  },
  'USDC.e': {
    symbol: 'USDC.e',
    name: 'Bridged USDC (Polygon)',
    decimals: 6,
    isStablecoin: true,
    icon: '🔵',
    chains: {
      polygon: { contract: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' },
    },
  },

  // Native tokens (need price conversion)
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isStablecoin: false,
    icon: '🔷',
    coingeckoId: 'ethereum',
    chains: {
      erc20: { native: true },
      arb: { native: true },
      base: { native: true },
    },
  },
  POL: {
    symbol: 'POL',
    name: 'Polygon',
    decimals: 18,
    isStablecoin: false,
    icon: '🟪',
    coingeckoId: 'matic-network',
    chains: {
      polygon: { native: true },
    },
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    isStablecoin: false,
    icon: '₿',
    coingeckoId: 'bitcoin',
    chains: {
      bitcoin: { native: true },
    },
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    isStablecoin: false,
    icon: '🟣',
    coingeckoId: 'solana',
    chains: {
      sol: { native: true },
    },
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    isStablecoin: false,
    icon: '🟡',
    coingeckoId: 'binancecoin',
    chains: {
      bsc: { native: true },
    },
  },
};

/**
 * Get current USD price for a token via CoinGecko
 * @param {string} coingeckoId - e.g. 'ethereum', 'bitcoin', 'solana'
 * @returns {number} USD price
 */
export async function getTokenPrice(coingeckoId) {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`
    );
    const data = await res.json();
    return data[coingeckoId]?.usd || 0;
  } catch (e) {
    console.error('Price fetch error:', e);
    return 0;
  }
}

/**
 * Calculate how much of a token is needed for a USD amount
 * @param {string} tokenSymbol - e.g. 'ETH', 'BTC', 'SOL'
 * @param {number} usdAmount - Amount in USD
 * @returns {Object} { amount, price, symbol }
 */
export async function calculateTokenAmount(tokenSymbol, usdAmount) {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) return null;

  if (token.isStablecoin) {
    return { amount: usdAmount, price: 1, symbol: tokenSymbol };
  }

  const price = await getTokenPrice(token.coingeckoId);
  if (!price) return null;

  const amount = usdAmount / price;
  // Round to reasonable decimals
  const decimals = token.symbol === 'BTC' ? 8 : token.symbol === 'ETH' ? 6 : 4;
  return {
    amount: parseFloat(amount.toFixed(decimals)),
    price,
    symbol: tokenSymbol,
  };
}

/**
 * Get available tokens for a specific chain
 * @param {string} chainId - e.g. 'erc20', 'sol', 'bsc'
 * @returns {Array} List of tokens available on this chain
 */
export function getTokensForChain(chainId) {
  const available = [];
  for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
    if (token.chains[chainId]) {
      available.push({
        symbol,
        name: token.name,
        icon: token.icon,
        isStablecoin: token.isStablecoin,
        isNative: token.chains[chainId].native || false,
      });
    }
  }
  return available;
}
