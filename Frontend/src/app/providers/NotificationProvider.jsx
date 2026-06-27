import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../shared/services/notification';
import { getAuthRole } from '../../services/authStorage';
import { getNotificationRoute } from '../../utils/notificationRoute';
import ToastContainer from '../../common/ToastContainer';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const POLL_INTERVAL_MS = 30_000;

export default function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const knownIds = useRef(new Set());
  const timers = useRef({});
  const initialized = useRef(false);
  const lastToken = useRef(null);
  const navigate = useNavigate();

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

  const handleToastClick = useCallback(async (toast) => {
    // Mark notification as read
    const id = toast._id || toast.id;
    if (id) {
      try { await notificationService.markRead(id); } catch { /* non-fatal */ }
    }
    // Navigate to target page
    const role = getAuthRole();
    const route = getNotificationRoute(toast, role);
    if (route) navigate(route);
    // Dismiss toast
    dismiss(toast.toastId);
    // Refresh header badge
    window.dispatchEvent(new Event('app-notification-updated'));
  }, [navigate, dismiss]);

  useEffect(() => {
    const poll = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      // Reset when the logged-in user changes (e.g. different role in same tab)
      if (token !== lastToken.current) {
        lastToken.current = token;
        knownIds.current.clear();
        initialized.current = false;
      }

      try {
        const unread = await notificationService.getUnread();
        if (!initialized.current) {
          // Seed known IDs on first successful poll — don't show existing items as toasts
          unread.forEach((n) => {
            const id = n._id || n.id;
            if (id) knownIds.current.add(id);
          });
          initialized.current = true;
          // Refresh bell badge with current unread count
          window.dispatchEvent(new Event('app-notification-updated'));
          return;
        }

        let hasNew = false;
        unread.forEach((n) => {
          const id = n._id || n.id;
          if (!id || knownIds.current.has(id)) return;
          knownIds.current.add(id);
          addToast(n);
          hasNew = true;
        });
        // Tell PageHeader / any bell to refresh its badge
        if (hasNew) window.dispatchEvent(new Event('app-notification-updated'));
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
      <ToastContainer toasts={toasts} onDismiss={dismiss} onToastClick={handleToastClick} />
    </ToastContext.Provider>
  );
}
