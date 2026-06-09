/**
 * AiFund Pay — useWalletConnect Hook
 * Zero-dependency crypto wallet connect for React apps.
 * https://aifund.com/pay
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

const STORAGE_KEY_WALLET = config.storageKeys.wallet;
const STORAGE_KEY_DEMO = config.storageKeys.demoMode;

export function useWalletConnect(options = {}) {
  const backendUrl = options.backendUrl || config.backendUrl;
  const api = `${backendUrl}/api`;

  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState(null);

  // Chain type detection
  const chainType = address?.startsWith('0x') ? 'evm'
    : address?.startsWith('T') ? 'tron'
    : address === config.demo.walletAddress ? 'demo'
    : 'solana';

  const chainLabel = { evm: 'EVM (Ethereum/BSC/ARB)', tron: 'Tron', solana: 'Solana', demo: 'Demo' }[chainType];
  const chainIcon = { evm: '🔷', tron: '🔴', solana: '🟣', demo: '🎮' }[chainType];

  // Format address for display: 0x71376f...d523
  const displayAddress = address
    ? isDemoMode ? 'Demo Account' : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : '';

  // ===== Connect to backend =====
  const connectToBackend = useCallback(async (walletAddress, walletType = 'metamask') => {
    try {
      const response = await axios.post(`${api}/wallet/connect`, {
        wallet_address: walletAddress,
        wallet_type: walletType,
      });
      setAddress(walletAddress);
      setUserData(response.data);
      setConnected(true);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Backend connect error:', err);
      setError('Failed to connect to server');
      localStorage.removeItem(STORAGE_KEY_WALLET);
      return null;
    }
  }, [api]);

  // ===== Auto-reconnect on mount =====
  useEffect(() => {
    const savedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
    const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO);

    if (savedDemo === 'true') {
      enterDemo();
    } else if (savedWallet) {
      connectToBackend(savedWallet);
    }
  }, [connectToBackend]);

  // ===== Connect wallet (MetaMask/EVM) =====
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window.ethereum === 'undefined') {
        setError('no_wallet');
        return { success: false, reason: 'no_wallet' };
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const walletAddress = accounts[0];
      const data = await connectToBackend(walletAddress);

      if (data) {
        setIsDemoMode(false);
        localStorage.setItem(STORAGE_KEY_WALLET, walletAddress);
        localStorage.removeItem(STORAGE_KEY_DEMO);
        return { success: true, address: walletAddress, data };
      }
      return { success: false, reason: 'backend_error' };
    } catch (err) {
      if (err.code === 4001) {
        setError('User rejected connection');
        return { success: false, reason: 'user_rejected' };
      }
      setError(err.message);
      return { success: false, reason: 'error', error: err };
    } finally {
      setLoading(false);
    }
  }, [connectToBackend]);

  // ===== Disconnect =====
  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setUserData(null);
    setIsDemoMode(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY_WALLET);
    localStorage.removeItem(STORAGE_KEY_DEMO);
  }, []);

  // ===== Demo mode =====
  const enterDemo = useCallback(async () => {
    if (!config.demo.enabled) return { success: false, reason: 'demo_disabled' };
    setLoading(true);
    setError(null);
    try {
      const data = await connectToBackend(config.demo.walletAddress, 'demo');
      if (data) {
        setIsDemoMode(true);
        localStorage.setItem(STORAGE_KEY_DEMO, 'true');
        return { success: true, data };
      }
      return { success: false, reason: 'backend_error' };
    } catch (err) {
      setError(err.message);
      return { success: false, reason: 'error' };
    } finally {
      setLoading(false);
    }
  }, [connectToBackend]);

  // ===== Refresh user data =====
  const refresh = useCallback(async () => {
    if (address) {
      await connectToBackend(address, isDemoMode ? 'demo' : 'metamask');
    }
  }, [address, isDemoMode, connectToBackend]);

  return {
    // State
    connected,
    address,
    userData,
    loading,
    isDemoMode,
    error,

    // Derived
    chainType,
    chainLabel,
    chainIcon,
    displayAddress,
    hasWalletExtension: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',

    // Actions
    connect,
    disconnect,
    enterDemo,
    refresh,
  };
}
