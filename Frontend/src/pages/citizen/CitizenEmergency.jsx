import React, { useState } from 'react';

export default function CitizenEmergency() {
  const [showConfirm, setShowConfirm] = useState(false);

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

        {/* SOS Button */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Send Emergency Alert</h2>
          <button
            onClick={handleSOS}
            className="w-full rounded-lg bg-red-600 px-6 py-12 text-2xl font-bold text-white transition hover:bg-red-700"
          >
            🚨 SOS - Emergency Alert
          </button>
        </div>

        {/* Location Services */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Location Services</h2>
          <p className="mb-4 text-sm text-slate-600">
            Your location will be shared with emergency responders
          </p>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            📍 Share Location
          </button>
        </div>

        {/* Recent Emergencies */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Alert History</h2>
          <p className="text-slate-600">No previous emergency alerts</p>
        </div>

        {/* Confirmation Dialog */}
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
