import React, { useEffect, useState } from 'react';
import { FaBell, FaClock } from 'react-icons/fa';
import {
  getCitizenNotifications,
  markAllNotificationsRead,
} from '../../shared/services/citizenService';

export default function CitizenNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCitizenNotifications(1, 10);
      setNotifications(result || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to mark notifications as read.');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'alert':
        return 'bg-red-100 text-red-800';
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'status':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'event':
        return '📅';
      case 'status':
        return '✓';
      default:
        return '📢';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <button
            onClick={handleMarkAllRead}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Mark all as read
          </button>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Notification Preferences</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm text-slate-600">Complaint Status Updates</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm text-slate-600">Event Notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm text-slate-600">Emergency Alerts</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span className="text-sm text-slate-600">Push Notifications</span>
            </label>
          </div>
          <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            Save Preferences
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">Loading notifications...</div>
        ) : (
          <div className="space-y-3">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Notifications</h2>
            {notifications.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">No notifications available.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-lg p-4 ${notif.isRead ? 'bg-slate-50' : 'border-l-4 border-blue-600 bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full px-2 py-1 text-sm ${getTypeColor(notif.type)}`}>
                        {getTypeIcon(notif.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{notif.title || 'Notification'}</h3>
                        <p className="text-sm text-slate-600">{notif.body}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <FaClock className="h-3 w-3" />
                          <span>{new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-600"></div>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
