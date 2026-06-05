import React from 'react';

export default function NotificationModal({
  isVisible = false,
  type = 'info',
  title = '',
  message = '',
  onClose = () => {},
  buttons = [],
  children,
}) {
  if (!isVisible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 20, width: '90%', maxWidth: 640, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {message && <div style={{ marginBottom: 12, color: '#333' }}>{message}</div>}
        {children}
        {buttons && buttons.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            {buttons.map((b, i) => (
              <button
                key={i}
                onClick={async () => {
                  try {
                    if (b.onClick) await b.onClick();
                  } catch (e) {
                    // ignore
                  }
                  if (b.closeOnClick !== false) onClose();
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: b.variant === 'primary' ? '#1967d2' : '#fff',
                  color: b.variant === 'primary' ? '#fff' : '#000',
                  cursor: 'pointer',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
