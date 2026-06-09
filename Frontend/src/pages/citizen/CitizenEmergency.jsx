import React, { useEffect, useState } from 'react';
import { FaClock } from 'react-icons/fa';
import { getCitizenNotifications } from '../../shared/services/citizenService';

export default function CitizenEmergency() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      setLoading(true);
      setError(null);

      try {
        const notifications = await getCitizenNotifications(1, 10);
        if (!active) return;
        const alerts = (notifications || []).filter((item) =>
          ['alert', 'emergency', 'status'].includes(item.type)
        );
        setAlertHistory(alerts.length ? alerts : notifications || []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.detail || err?.message || 'Failed to load alert history.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const handleSOS = () => {
    setShowConfirm(true);
  };

  const confirmSOS = () => {
    console.log('SOS Emergency activated');
    alert('Emergency alert sent to authorities!');
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Emergency Alert</h1>

        <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Send Emergency Alert</h2>
          <button
            onClick={handleSOS}
            className="w-full rounded-lg bg-red-600 px-6 py-12 text-2xl font-bold text-white transition hover:bg-red-700"
          >
            🚨 SOS - Emergency Alert
          </button>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Location Services</h2>
          <p className="mb-4 text-sm text-slate-600">
            Your location will be shared with emergency responders.
          </p>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            📍 Share Location
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Alert History</h2>
          {error && (
            <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-800">{error}</div>
          )}
          {loading ? (
            <div className="text-slate-600">Loading alert history...</div>
          ) : alertHistory.length === 0 ? (
            <p className="text-slate-600">No previous emergency alerts.</p>
          ) : (
            <div className="space-y-4">
              {alertHistory.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title || 'Emergency Alert'}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-lg bg-white p-8">
              <h3 className="mb-4 text-xl font-bold text-slate-900">Confirm Emergency Alert?</h3>
              <p className="mb-6 text-slate-600">
                This will alert emergency services and authorities immediately.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSOS}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                >
                  Confirm Alert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
