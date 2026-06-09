/**
 * AiFund Pay — SIWE (Sign-In With Ethereum) Verification
 * x401-level security: cryptographic proof of wallet ownership.
 * https://aifund.com/pay
 * 
 * Flow:
 *   1. Frontend requests a nonce from backend
 *   2. User signs the nonce message with their wallet
 *   3. Frontend sends signature to backend
 *   4. Backend verifies signature → issues session token
 */
import { useState, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

export function useSIWE(walletAddress, options = {}) {
  const api = `${options.backendUrl || config.backendUrl}/api`;
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const signIn = useCallback(async () => {
    if (!walletAddress || !window.ethereum) {
      setError('Wallet not connected');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get nonce from backend
      const nonceRes = await axios.get(`${api}/auth/nonce`, {
        params: { address: walletAddress }
      });
      const { nonce, message } = nonceRes.data;

      // Step 2: Ask user to sign the message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // Step 3: Send signature to backend for verification
      const verifyRes = await axios.post(`${api}/auth/verify`, {
        address: walletAddress,
        signature,
        nonce,
      });

      if (verifyRes.data.verified) {
        setVerified(true);
        setToken(verifyRes.data.token);
        // Store token for subsequent API calls
        if (verifyRes.data.token) {
          localStorage.setItem('afp_auth_token', verifyRes.data.token);
        }
        return { success: true, token: verifyRes.data.token };
      } else {
        setError('Signature verification failed');
        return { success: false };
      }
    } catch (err) {
      if (err.code === 4001) {
        setError('User rejected signing');
      } else {
        setError(err.message || 'Sign-in failed');
      }
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [walletAddress, api]);

  const signOut = useCallback(() => {
    setVerified(false);
    setToken(null);
    localStorage.removeItem('afp_auth_token');
  }, []);

  return {
    verified,
    loading,
    error,
    token,
    signIn,
    signOut,
  };
}
