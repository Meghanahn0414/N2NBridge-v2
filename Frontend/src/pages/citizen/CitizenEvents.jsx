import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import {
  getCitizenDashboard,
  getEvents,
  registerForEvent,
} from '../../shared/services/citizenService';

export default function CitizenEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getCitizenDashboard();
      const registeredEvents = dashboard?.registeredEvents || [];
      const registeredIds = new Set(registeredEvents.map((item) => item.eventId));

      const allEvents = await getEvents(1, 20);
      setEvents(
        (allEvents || []).map((item) => ({
          ...item,
          registered: registeredIds.has(item.id),
        }))
      );
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    try {
      await registerForEvent(eventId);
      await loadEvents();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to register for the event.');
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Events</h1>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-slate-600 shadow-sm">No upcoming events.</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{event.eventName}</h2>
                    <p className="text-sm text-slate-500">{event.eventType}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      event.registered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {event.registered ? '✓ Registered' : 'Not Registered'}
                  </span>
                </div>

                <div className="mb-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600" />
                    <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-600" />
                    <span>{new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-blue-600" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                  <span className="inline-block h-8 w-8 rounded-full bg-slate-200"></span>
                  <span>{event.registrationCount ?? 0} people attending</span>
                </div>

                {!event.registered && (
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={registering === event.id}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {registering === event.id ? 'Registering...' : 'Register for Event'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
