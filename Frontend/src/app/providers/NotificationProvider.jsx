import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { notificationService } from '../../shared/services/notification';
import ToastContainer from '../../common/ToastContainer';

const ToastContext = createContext(null);

/** Call this hook anywhere to manually trigger a toast */
export const useToast = () => useContext(ToastContext);

const POLL_INTERVAL_MS = 30_000;

export default function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const knownIds = useRef(new Set());
  const timers = useRef({});

  const dismiss = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    clearTimeout(timers.current[toastId]);
    delete timers.current[toastId];
  }, []);

  const addToast = useCallback((notification) => {
    const toastId = (notification._id || notification.id || '') + '_' + Date.now();
    const entry = { ...notification, toastId };
    setToasts((prev) => [...prev, entry]);
    timers.current[toastId] = setTimeout(() => dismiss(toastId), 5000);
  }, [dismiss]);

  useEffect(() => {
    let initialized = false;

    const poll = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      try {
        const unread = await notificationService.getUnread();
        if (!initialized) {
          // First load — mark all existing as seen, don't toast them
          unread.forEach((n) => {
            const id = n._id || n.id;
            if (id) knownIds.current.add(id);
          });
          initialized = true;
          return;
        }
        unread.forEach((n) => {
          const id = n._id || n.id;
          if (!id || knownIds.current.has(id)) return;
          knownIds.current.add(id);
          addToast(n);
        });
      } catch {
        // Auth not ready or network error — skip silently
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
