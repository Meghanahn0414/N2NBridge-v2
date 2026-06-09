import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { fetchEvents } from '../../shared/services/eventService';

export default function CitizenEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents(1, 1000);
      // Ensure we have an array
      const eventsList = Array.isArray(data) ? data : (data?.events || []);
      setEvents(eventsList);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (eventId) => {
    alert(`Registered for event ${eventId}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Events</h1>

        {loading && (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-slate-600">Loading events...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-slate-600">No upcoming events</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          /* Events List */
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id || event._id} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{event.eventName || event.title || 'Untitled Event'}</h2>
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
                  {event.eventDate && (
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-600" />
                      <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {event.eventDate && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-blue-600" />
                      <span>{new Date(event.eventDate).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {(event.venue || event.location) && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-600" />
                      <span>{event.venue || event.location}</span>
                    </div>
                  )}
                </div>

                {event.capacity && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-block h-8 w-8 rounded-full bg-slate-200"></span>
                    <span>Capacity: {event.capacity}</span>
                  </div>
                )}

                {!event.registered && (
                  <button
                    onClick={() => handleRegister(event.id || event._id)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                  >
                    Register for Event
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
