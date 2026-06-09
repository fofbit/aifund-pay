/**
 * AiFund Pay — Demo App
 * https://aifund.com/pay
 */
import React, { useState } from 'react';
import { useWalletConnect } from '../frontend/src/hooks/useWalletConnect';
import { WalletButton } from '../frontend/src/components/WalletButton';
import { WalletGuide } from '../frontend/src/components/WalletGuide';
import { PaymentFlow } from '../frontend/src/components/PaymentFlow';

export default function DemoApp() {
  const wallet = useWalletConnect();
  const [showGuide, setShowGuide] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', padding: '40px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>AiFund Pay Demo</h1>
      <p style={{ color: '#9CA3AF', marginBottom: '32px' }}>Accept crypto payments in 3 minutes · <a href="https://aifund.com/pay" style={{color:'#A78BFA'}}>aifund.com/pay</a></p>

      {/* Wallet Button (handles connect/disconnect/account menu) */}
      <div style={{ marginBottom: '24px' }}>
        <WalletButton wallet={wallet} />
      </div>

      {/* Show wallet guide for users without extension */}
      {wallet.error === 'no_wallet' && (
        <div>
          <button onClick={() => setShowGuide(true)} style={styles.btn}>
            Show Wallet Installation Guide
          </button>
          {showGuide && <WalletGuide onClose={() => setShowGuide(false)} onDemo={wallet.enterDemo} />}
        </div>
      )}

      {/* Connected state */}
      {wallet.connected && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', maxWidth: '400px' }}>
          <h3 style={{ marginBottom: '16px' }}>Connected!</h3>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <tbody>
              <tr><td style={styles.label}>Address</td><td style={styles.val}>{wallet.displayAddress}</td></tr>
              <tr><td style={styles.label}>Chain</td><td style={styles.val}>{wallet.chainIcon} {wallet.chainLabel}</td></tr>
              <tr><td style={styles.label}>Demo</td><td style={styles.val}>{wallet.isDemoMode ? 'Yes' : 'No'}</td></tr>
              <tr><td style={styles.label}>Balance</td><td style={styles.val}>${wallet.userData?.user?.balance_usd?.toFixed(2) || '0.00'}</td></tr>
            </tbody>
          </table>

          <button onClick={() => setShowPayment(true)} style={{ ...styles.btn, marginTop: '16px', background: 'linear-gradient(to right, #059669, #10B981)' }}>
            Pay 1 USDT (test)
          </button>
        </div>
      )}

      {/* Payment Flow */}
      {showPayment && (
        <PaymentFlow
          walletAddress={wallet.address}
          amount={1}
          paymentType="deposit"
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); wallet.refresh(); alert('Payment successful!'); }}
        />
      )}
    </div>
  );
}

const styles = {
  btn: { padding: '12px 24px', background: 'linear-gradient(to right, #7C3AED, #EC4899)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  label: { color: '#9CA3AF', padding: '6px 0' },
  val: { color: '#fff', fontFamily: 'monospace', padding: '6px 0' },
};
