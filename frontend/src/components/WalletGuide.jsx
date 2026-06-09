/**
 * AiFund Pay — WalletGuide
 * Installation guide for users without a wallet extension.
 * https://aifund.com/pay
 */
import React from 'react';
import config from '../config';

export function WalletGuide({ onClose, onDemo }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Don't have a wallet?</h3>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        <p style={styles.desc}>A crypto wallet is your gateway to Web3. Pick one and install in 3 minutes.</p>

        {/* Chrome download */}
        <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" style={styles.chromeLink}>
          <span style={{ fontSize: '20px', marginRight: '10px' }}>🌐</span>
          <div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Download Chrome Browser</div>
            <div style={{ color: '#9CA3AF', fontSize: '11px' }}>Required for browser extension wallets</div>
          </div>
        </a>

        {/* Wallet list */}
        <div style={styles.walletList}>
          {config.wallets.map((w) => (
            <div key={w.name} style={styles.walletCard}>
              <div style={styles.walletHeader}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{w.icon}</span>
                <div>
                  <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                  <div style={{ color: '#9CA3AF', fontSize: '11px' }}>{w.desc}</div>
                </div>
              </div>
              <div style={styles.walletLinks}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>Official Site ↗</a>
                <a href={w.chrome} target="_blank" rel="noopener noreferrer" style={styles.chromeLinkBtn}>Chrome Store ↗</a>
              </div>
            </div>
          ))}
        </div>

        {/* Demo hint */}
        {onDemo && (
          <div style={styles.demoHint}>
            <strong>Don't want to install?</strong> Try the <button onClick={() => { onClose(); onDemo(); }} style={styles.demoLink}>Free Demo</button> instead!
          </div>
        )}

        <button onClick={onClose} style={styles.gotItBtn}>Got it</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' },
  modal: { background: 'linear-gradient(to bottom right, #1E293B, #0F172A)', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '20px', border: '1px solid rgba(139,92,246,0.3)', maxHeight: '85vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { color: '#fff', fontSize: '20px', fontWeight: 'bold', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' },
  desc: { color: '#9CA3AF', fontSize: '12px', marginBottom: '16px' },
  chromeLink: { display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', textDecoration: 'none' },
  walletList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' },
  walletCard: { padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' },
  walletHeader: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
  walletLinks: { display: 'flex', gap: '8px', marginLeft: '30px' },
  linkBtn: { flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' },
  chromeLinkBtn: { flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(6,182,212,0.2)', color: '#67E8F9', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' },
  demoHint: { padding: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', color: '#67E8F9', fontSize: '12px', marginBottom: '12px' },
  demoLink: { background: 'none', border: 'none', color: '#22D3EE', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  gotItBtn: { width: '100%', padding: '10px', background: '#374151', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
};
