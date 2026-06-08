import React, { useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function CitizenEvents() {
  const [events] = useState([
    {
      id: 1,
      title: '',
      date: '',
      time: '',
      location: '',
      attendees: '',
      registered: false,
    },
    {
      id: 2,
      title: '',
      date: '',
      time: '',
      location: '',
      attendees: '',
      registered: true,
    },
    {
      id: 3,
      title: '',
      date: '',
      time: '',
      location: '',
      attendees:'',
      registered: false,
    },
  ]);

  const handleRegister = (eventId) => {
    alert(`Registered for event ${eventId}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Events</h1>

        {/* Events List */}
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{event.title}</h2>
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
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-blue-600" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  <span>{event.location}</span>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-block h-8 w-8 rounded-full bg-slate-200"></span>
                <span>{event.attendees} people attending</span>
              </div>

              {!event.registered && (
                <button
                  onClick={() => handleRegister(event.id)}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                >
                  Register for Event
                </button>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-slate-600">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
}
