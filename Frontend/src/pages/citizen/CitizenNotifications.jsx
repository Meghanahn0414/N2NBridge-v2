import React, { useState } from 'react';
import { FaBell, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function CitizenNotifications() {
  const [notifications] = useState([
    {
      id: 1,
      title: 'Your complaint #GR001 has been acknowledged',
      message: 'Your grievance has been received by the authorities.',
      type: 'status',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      title: 'New event: Community Cleanup Drive',
      message: 'A new event has been scheduled in your area.',
      type: 'event',
      time: '1 day ago',
      read: true,
    },
    {
      id: 3,
      title: 'Complaint #GR002 status updated',
      message: 'Your complaint status has been updated to "In Progress".',
      type: 'status',
      time: '3 days ago',
      read: true,
    },
    {
      id: 4,
      title: 'Emergency Alert nearby',
      message: 'An emergency alert was reported in your area.',
      type: 'alert',
      time: '1 week ago',
      read: true,
    },
  ]);

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
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            Mark all as read
          </button>
        </div>

        {/* Notification Preferences */}
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

        {/* Notifications List */}
        <div className="space-y-3">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Notifications</h2>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg p-4 ${notif.read ? 'bg-slate-50' : 'border-l-4 border-blue-600 bg-white'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-full px-2 py-1 text-sm ${getTypeColor(notif.type)}`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                    <p className="text-sm text-slate-600">{notif.message}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <FaClock className="h-3 w-3" />
                      <span>{notif.time}</span>
                    </div>
                  </div>
                </div>
                {!notif.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
