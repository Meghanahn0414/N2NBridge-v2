import React, { useEffect, useState } from 'react';

const TYPE_COLOR = {
  ALERT: '#d32f2f',
  WARNING: '#f57c00',
  INFO: '#1565c0',
  SUCCESS: '#2e7d32',
};

export default function ToastNotification({ toast, onDismiss, onClick }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const accentColor = TYPE_COLOR[toast.type] || TYPE_COLOR.INFO;
  const body = toast.body || toast.message || '';
  const isClickable = typeof onClick === 'function';

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        width: 300,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      {/* Header row */}
      <div
        style={{
          background: '#f5f5f5',
          padding: '6px 10px 6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #ebebeb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: 8, fontWeight: 700, letterSpacing: -0.5 }}>JS</span>
          </div>
          <span style={{ fontSize: 11.5, color: '#555', fontWeight: 600, letterSpacing: 0.1 }}>
            Jan Seva
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(toast.toastId); }}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            fontSize: 18,
            lineHeight: 1,
            padding: '0 2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Body — clickable */}
      <div
        onClick={isClickable ? onClick : undefined}
        style={{ padding: '10px 14px 8px' }}
      >
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111', marginBottom: 3 }}>
            {toast.title}
          </div>
        )}
        {body && (
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.45 }}>
            {body.length > 90 ? body.slice(0, 90) + '…' : body}
          </div>
        )}
        {isClickable && (
          <div style={{ marginTop: 6, fontSize: 11, color: accentColor, fontWeight: 600 }}>
            Tap to open →
          </div>
        )}
      </div>

      {/* Accent bar */}
      <div style={{ height: 3, background: accentColor }} />
    </div>
  );
}
