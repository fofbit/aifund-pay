/**
 * AiFund Pay — x402 Micropayment Client
 * HTTP 402 Payment Required protocol for API billing.
 * https://aifund.com/pay
 * 
 * Usage:
 *   const client = createX402Client(wallet);
 *   const data = await client.get('/api/premium-data'); // auto-pays if 402
 */
import axios from 'axios';
import config from '../config';
import { signMessage, WALLET_PROVIDERS } from '../adapters/multiWallet';

/**
 * Create an axios-like client that auto-handles HTTP 402 Payment Required.
 * When an API returns 402, the client automatically:
 *   1. Reads payment details from the response
 *   2. Signs a payment authorization with the wallet
 *   3. Retries the request with X-PAYMENT header
 * 
 * @param {Object} wallet - wallet object from useWalletConnect()
 * @param {Object} options - { maxAutoPayAmount: max amount to auto-pay without confirmation }
 */
export function createX402Client(wallet, options = {}) {
  const maxAutoPay = options.maxAutoPayAmount || 1.0; // Default: auto-pay up to $1
  const baseURL = options.baseURL || config.backendUrl;

  const client = axios.create({ baseURL });

  // Response interceptor: handle 402
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response } = error;
      
      if (response?.status !== 402) {
        return Promise.reject(error);
      }

      // Extract payment details from 402 response
      const paymentDetails = response.data?.payment || response.headers['x-payment-details'];
      
      if (!paymentDetails) {
        return Promise.reject(new Error('402 received but no payment details provided'));
      }

      const amount = paymentDetails.amount || 0;
      const currency = paymentDetails.currency || 'USDT';
      const recipient = paymentDetails.recipient || '';
      const description = paymentDetails.description || 'API access';

      // Check if amount exceeds auto-pay limit
      if (amount > maxAutoPay) {
        return Promise.reject(new Error(
          `Payment required: ${amount} ${currency} for "${description}". Exceeds auto-pay limit of ${maxAutoPay}.`
        ));
      }

      if (!wallet?.connected || !wallet?.address) {
        return Promise.reject(new Error('Wallet not connected. Cannot process x402 payment.'));
      }

      try {
        // Create payment authorization message
        const paymentMessage = JSON.stringify({
          from: wallet.address,
          to: recipient,
          amount: amount,
          currency: currency,
          description: description,
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(2),
        });

        // Sign with connected wallet
        const walletType = wallet.walletType || 'evm';
        const signature = await signMessage(walletType, wallet.address, paymentMessage);

        // Encode payment header
        const paymentHeader = btoa(JSON.stringify({
          message: paymentMessage,
          signature: signature,
          address: wallet.address,
          chain: walletType,
        }));

        // Retry original request with payment header
        const retryConfig = { ...error.config };
        retryConfig.headers = { ...retryConfig.headers, 'X-PAYMENT': paymentHeader };
        delete retryConfig._retry;
        
        return axios(retryConfig);
      } catch (signError) {
        return Promise.reject(new Error(`Payment signing failed: ${signError.message}`));
      }
    }
  );

  return client;
}

/**
 * React hook for x402 client
 */
export function useX402(wallet, options = {}) {
  const client = createX402Client(wallet, options);
  
  return {
    client,
    get: (url, config) => client.get(url, config),
    post: (url, data, config) => client.post(url, data, config),
    put: (url, data, config) => client.put(url, data, config),
    delete: (url, config) => client.delete(url, config),
  };
}
