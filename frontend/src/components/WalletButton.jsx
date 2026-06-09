/**
 * AiFund Pay — WalletButton
 * Connect/disconnect button with account dropdown.
 * https://aifund.com/pay
 */
import React, { useState, useEffect } from 'react';

export function WalletButton({ wallet, className = '' }) {
  const [showMenu, setShowMenu] = useState(false);

  // Click-away to close
  useEffect(() => {
    const handler = (e) => {
      if (showMenu && !e.target.closest('.cwl-account-menu')) setShowMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showMenu]);

  // Not connected — show connect button
  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => wallet.hasWalletExtension ? wallet.connect() : wallet.connect()}
          disabled={wallet.loading}
          className={className}
          style={!className ? styles.connectBtn : undefined}
        >
          {wallet.loading ? '...' : 'Connect Wallet'}
        </button>
        <button
          onClick={wallet.enterDemo}
          disabled={wallet.loading}
          style={!className ? styles.demoBtn : undefined}
        >
          {wallet.loading ? '...' : 'Demo'}
        </button>
      </div>
    );
  }

  // Connected — show account button + dropdown
  return (
    <div className="cwl-account-menu" style={{ position: 'relative' }}>
      <button onClick={() => setShowMenu(!showMenu)} style={styles.accountBtn}>
        <span style={styles.chainIcon}>{wallet.chainIcon}</span>
        <span style={styles.addressText}>{wallet.displayAddress}</span>
        <span style={styles.chevron}>{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div style={styles.dropdown}>
          {/* Wallet info */}
          <div style={styles.walletInfo}>
            <div style={styles.walletRow}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>{wallet.chainIcon}</span>
              <div>
                <div style={styles.addressFull}>{wallet.isDemoMode ? 'Demo Account' : wallet.address}</div>
                <div style={styles.chainLabel}>{wallet.chainLabel}</div>
              </div>
            </div>
          </div>

          {/* Balance */}
          {wallet.userData?.user?.balance_usd !== undefined && (
            <div style={styles.balanceRow}>
              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Balance</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>${wallet.userData.user.balance_usd.toFixed(2)}</span>
            </div>
          )}

          {/* Demo: switch to real */}
          {wallet.isDemoMode && (
            <button onClick={() => { setShowMenu(false); wallet.disconnect(); setTimeout(wallet.connect, 100); }} style={styles.switchBtn}>
              Connect Real Wallet
            </button>
          )}

          {/* Disconnect */}
          <button onClick={() => { setShowMenu(false); wallet.disconnect(); }} style={styles.disconnectBtn}>
            Disconnect &amp; Switch Wallet
          </button>

          <div style={styles.hint}>
            {wallet.isDemoMode ? 'Exit to connect a different wallet' : 'Disconnect to switch address'}
          </div>
        </div>
      )}
    </div>
  );
}

// Default inline styles (override with className prop)
const styles = {
  connectBtn: { padding: '10px 24px', background: 'linear-gradient(to right, #7C3AED, #EC4899)', color: '#fff', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  demoBtn: { padding: '10px 20px', background: 'linear-gradient(to right, #0891B2, #2563EB)', color: '#fff', border: '2px solid rgba(34,211,238,0.5)', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  accountBtn: { display: 'flex', alignItems: 'center', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '12px' },
  chainIcon: { marginRight: '6px', fontSize: '14px' },
  addressText: { fontFamily: 'monospace', fontSize: '12px' },
  chevron: { marginLeft: '6px', fontSize: '8px', color: '#9CA3AF' },
  dropdown: { position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '260px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '12px', zIndex: 50 },
  walletInfo: { marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' },
  walletRow: { display: 'flex', alignItems: 'center' },
  addressFull: { color: '#fff', fontSize: '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' },
  chainLabel: { color: '#6B7280', fontSize: '10px' },
  balanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: '12px' },
  switchBtn: { width: '100%', padding: '8px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginBottom: '4px' },
  disconnectBtn: { width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#F87171', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  hint: { textAlign: 'center', fontSize: '9px', color: '#4B5563', marginTop: '8px' },
};

