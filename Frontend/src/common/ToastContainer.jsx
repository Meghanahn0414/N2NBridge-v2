import React from 'react';
import ToastNotification from './ToastNotification';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 320,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.toastId} style={{ pointerEvents: 'auto' }}>
          <ToastNotification toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
