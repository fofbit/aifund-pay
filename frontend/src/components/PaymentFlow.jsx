/**
 * AiFund Pay — PaymentFlow
 * 3-step USDT payment with on-chain verification.
 * https://aifund.com/pay
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';

export function PaymentFlow({ walletAddress, amount, paymentType = 'payment', onClose, onSuccess, backendUrl }) {
  const api = `${backendUrl || config.backendUrl}/api`;
  const [selectedChain, setSelectedChain] = useState('trc20');
  const [step, setStep] = useState('select');
  const [copied, setCopied] = useState(false);
  const [autoPolling, setAutoPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [txHash, setTxHash] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const currentAddr = config.receivingAddresses[selectedChain];
  const chainInfo = config.chains[selectedChain];
  const qrUrl = currentAddr ? `${config.payment.qrApiUrl}?size=180x180&data=${encodeURIComponent(currentAddr.address)}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddr?.address || '').catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doVerify = async () => {
    setVerifying(true);
    try {
      const res = await axios.post(`${api}/payment/verify`, {
        wallet_address: walletAddress,
        amount: amount * config.payment.gasTolerance,
        chain: selectedChain,
        payment_type: paymentType,
      });
      setVerifyResult(res.data);
      if (res.data.verified) {
        stopPolling();
        setTimeout(() => onSuccess && onSuccess(), 1500);
      }
    } catch (e) {
      setVerifyResult({ verified: false, message: 'Check failed, retrying...' });
    }
    setVerifying(false);
  };

  const startPolling = () => {
    setAutoPolling(true);
    setVerifyResult(null);
    setPollCount(0);
    doVerify();
    pollRef.current = setInterval(() => {
      setPollCount(prev => {
        if (prev >= config.payment.maxPolls) { stopPolling(); return prev; }
        doVerify();
        return prev + 1;
      });
    }, config.payment.pollInterval);
  };

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setAutoPolling(false);
  };

  const handleManualConfirm = async () => {
    if (!txHash) return;
    setVerifying(true);
    stopPolling();
    try {
      await axios.post(`${api}/payment/manual-confirm`, {
        wallet_address: walletAddress, tx_hash: txHash,
        amount, chain: selectedChain, payment_type: paymentType,
      });
      setVerifyResult({ verified: true, message: 'Payment confirmed!' });
      setTimeout(() => onSuccess && onSuccess(), 1500);
    } catch (e) {
      setVerifyResult({ verified: false, message: 'Submission failed.' });
    }
    setVerifying(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Pay {amount} USDT</h3>
          <button onClick={() => { stopPolling(); onClose(); }} style={styles.closeBtn}>&times;</button>
        </div>

        {/* Step 1: Select Chain */}
        {step === 'select' && (
          <div>
            <p style={styles.stepLabel}>1. Select payment network</p>
            <div style={styles.chainGrid}>
              {Object.entries(config.chains).map(([id, info]) => (
                <button key={id} onClick={() => setSelectedChain(id)}
                  style={{ ...styles.chainCard, ...(selectedChain === id ? styles.chainSelected : {}) }}>
                  <div style={{ fontSize: '20px' }}>{info.icon}</div>
                  <div style={{ color: '#fff', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>{info.name}</div>
                  <div style={{ color: '#6B7280', fontSize: '10px' }}>{info.fee}</div>
                </button>
              ))}
            </div>
            <div style={styles.warnBox}>
              ⚠️ Please pay from the same wallet you used to log in.
            </div>
            <button onClick={() => setStep('pay')} style={styles.primaryBtn}>Continue →</button>
          </div>
        )}

        {/* Step 2: Address + QR */}
        {step === 'pay' && currentAddr && (
          <div>
            <p style={styles.stepLabel}>2. Send {amount} USDT ({chainInfo.icon} {chainInfo.name})</p>
            <div style={styles.qrContainer}>
              <div style={styles.qrWhiteBg}><img src={qrUrl} alt="QR" style={styles.qrImg} /></div>
              <p style={{ color: '#9CA3AF', fontSize: '11px', margin: '8px 0 4px' }}>Scan QR or copy address</p>
            </div>
            <div style={styles.addressBox}>
              <p style={styles.addressText}>{currentAddr.address}</p>
            </div>
            <button onClick={handleCopy} style={{ ...styles.secondaryBtn, background: copied ? '#059669' : 'rgba(255,255,255,0.1)' }}>
              {copied ? '✓ Copied!' : 'Copy Address'}
            </button>
            <div style={{ ...styles.warnBox, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              ⚠️ Ensure at least {amount} USDT arrives after gas. Wrong network = lost funds.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => setStep('select')} style={styles.secondaryBtn}>Back</button>
              <button onClick={() => { setStep('verify'); startPolling(); }} style={styles.successBtn}>I've Sent Payment</button>
            </div>
          </div>
        )}

        {/* Step 3: Verify */}
        {step === 'verify' && (
          <div>
            <p style={styles.stepLabel}>3. Verifying payment</p>
            <div style={{ ...styles.verifyBox, borderColor: verifyResult?.verified ? '#059669' : '#7C3AED' }}>
              <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>
                {verifyResult?.verified ? '✅' : autoPolling ? '🔄' : '⏳'}
              </div>
              <p style={{ textAlign: 'center', color: verifyResult?.verified ? '#6EE7B7' : '#fff', fontWeight: 600, fontSize: '13px' }}>
                {verifyResult?.verified ? 'Payment Verified!' : autoPolling ? 'Scanning blockchain...' : 'Waiting'}
              </p>
              {autoPolling && !verifyResult?.verified && (
                <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '11px', marginTop: '4px' }}>
                  Auto-checking every {config.payment.pollInterval/1000}s ({pollCount + 1}/{config.payment.maxPolls})
                </p>
              )}
            </div>

            {/* Manual TX hash */}
            {!verifyResult?.verified && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '8px' }}>Or paste transaction hash:</p>
                <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
                  placeholder="TX hash..." style={styles.input} />
                <button onClick={handleManualConfirm} disabled={!txHash || verifying}
                  style={{ ...styles.secondaryBtn, opacity: !txHash ? 0.4 : 1, marginTop: '8px' }}>
                  Confirm with TX Hash
                </button>
              </div>
            )}
            <button onClick={() => { stopPolling(); setStep('pay'); }} style={{ ...styles.secondaryBtn, marginTop: '12px' }}>Back</button>
          </div>
        )}

        {/* Powered by */}
        <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '12px' }}>
          <a href="https://aifund.com/pay" target="_blank" rel="noopener noreferrer"
            style={{ color: '#4B5563', fontSize: '9px', textDecoration: 'none' }}>
            Powered by <span style={{ color: '#7C3AED' }}>AiFund Pay</span>
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '8px' },
  modal: { background: 'linear-gradient(to bottom right, #1E293B, #0F172A)', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '20px', border: '1px solid rgba(139,92,246,0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' },
  stepLabel: { color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '12px' },
  chainGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' },
  chainCard: { padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' },
  chainSelected: { borderColor: '#7C3AED', background: 'rgba(124,58,237,0.1)' },
  warnBox: { padding: '10px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '12px', color: '#FDE047', fontSize: '11px', marginBottom: '12px' },
  primaryBtn: { width: '100%', padding: '12px', background: 'linear-gradient(to right, #7C3AED, #EC4899)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtn: { width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  successBtn: { flex: 1, padding: '10px', background: 'linear-gradient(to right, #059669, #10B981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' },
  qrWhiteBg: { background: '#fff', borderRadius: '12px', padding: '8px' },
  qrImg: { width: '160px', height: '160px' },
  addressBox: { padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '8px' },
  addressText: { color: '#fff', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all' },
  verifyBox: { padding: '16px', borderRadius: '12px', border: '1px solid', background: 'rgba(124,58,237,0.1)' },
  input: { width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace', boxSizing: 'border-box' },
};
