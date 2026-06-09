/**
 * AiFund Pay — useWalletConnect Hook (v1.3 Multi-Wallet)
 * Supports EVM + Solana + Bitcoin + Atomicals. Zero dependencies.
 * https://aifund.com/pay
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
import { detectWallets, connectWallet, detectChainFromAddress, WALLET_PROVIDERS } from '../adapters/multiWallet';

const SK_WALLET = config.storageKeys.wallet;
const SK_DEMO = config.storageKeys.demoMode;
const SK_CHAIN = 'afp_chain_type';

export function useWalletConnect(options = {}) {
  const backendUrl = options.backendUrl || config.backendUrl;
  const api = `${backendUrl}/api`;

  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null); // evm, solana, bitcoin, atomicals

  // Detected wallets in browser
  const availableWallets = typeof window !== 'undefined' ? detectWallets() : [];

  // Chain info
  const chainType = walletType || detectChainFromAddress(address) || (isDemoMode ? 'demo' : 'unknown');
  const chainInfo = WALLET_PROVIDERS[chainType] || {};
  const chainLabel = chainInfo.label || (isDemoMode ? 'Demo Mode' : chainType);
  const chainIcon = chainInfo.icon || (isDemoMode ? '🎮' : '❓');

  const displayAddress = address
    ? isDemoMode ? 'Demo Account' : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : '';

  // Connect to backend
  const connectToBackend = useCallback(async (walletAddress, wType = 'metamask') => {
    try {
      const response = await axios.post(`${api}/wallet/connect`, {
        wallet_address: walletAddress,
        wallet_type: wType,
      });
      setAddress(walletAddress);
      setUserData(response.data);
      setConnected(true);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to connect to server');
      localStorage.removeItem(SK_WALLET);
      return null;
    }
  }, [api]);

  // Auto-reconnect
  useEffect(() => {
    const savedWallet = localStorage.getItem(SK_WALLET);
    const savedDemo = localStorage.getItem(SK_DEMO);
    const savedChain = localStorage.getItem(SK_CHAIN);

    if (savedDemo === 'true') {
      enterDemo();
    } else if (savedWallet) {
      if (savedChain) setWalletType(savedChain);
      connectToBackend(savedWallet, savedChain || 'metamask');
    }
  }, [connectToBackend]);

  // Connect wallet (auto-detect or specify type)
  const connect = useCallback(async (type) => {
    setLoading(true);
    setError(null);

    // If type not specified, try to auto-detect
    if (!type) {
      const detected = detectWallets();
      if (detected.length === 0) {
        setError('no_wallet');
        setLoading(false);
        return { success: false, reason: 'no_wallet' };
      }
      type = detected[0].type; // Use first detected
    }

    try {
      const result = await connectWallet(type);
      const data = await connectToBackend(result.address, result.provider);

      if (data) {
        setWalletType(type);
        setIsDemoMode(false);
        localStorage.setItem(SK_WALLET, result.address);
        localStorage.setItem(SK_CHAIN, type);
        localStorage.removeItem(SK_DEMO);
        return { success: true, address: result.address, chain: type, data };
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

  // Disconnect
  const disconnect = useCallback(() => {
    // Try to disconnect Solana provider
    if (walletType === 'solana' && WALLET_PROVIDERS.solana.disconnect) {
      WALLET_PROVIDERS.solana.disconnect().catch(() => {});
    }
    setConnected(false);
    setAddress(null);
    setUserData(null);
    setIsDemoMode(false);
    setWalletType(null);
    setError(null);
    localStorage.removeItem(SK_WALLET);
    localStorage.removeItem(SK_DEMO);
    localStorage.removeItem(SK_CHAIN);
  }, [walletType]);

  // Demo mode
  const enterDemo = useCallback(async () => {
    if (!config.demo.enabled) return { success: false, reason: 'demo_disabled' };
    setLoading(true);
    setError(null);
    try {
      const data = await connectToBackend(config.demo.walletAddress, 'demo');
      if (data) {
        setIsDemoMode(true);
        setWalletType(null);
        localStorage.setItem(SK_DEMO, 'true');
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

  // Refresh
  const refresh = useCallback(async () => {
    if (address) await connectToBackend(address, walletType || 'metamask');
  }, [address, walletType, connectToBackend]);

  return {
    connected, address, userData, loading, isDemoMode, error,
    walletType, chainType, chainLabel, chainIcon, displayAddress,
    availableWallets,
    hasWalletExtension: availableWallets.length > 0,
    connect, disconnect, enterDemo, refresh,
  };
}
