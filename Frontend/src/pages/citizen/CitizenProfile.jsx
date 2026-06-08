import React, { useState } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit } from 'react-icons/fa';

export default function CitizenProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '+91-xxxxxxxxxx',
    address: '',
    constituency: '',
    joinDate: '',
  });

  const [formData, setFormData] = useState(profile);

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              <FaEdit className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="mb-6 rounded-lg bg-white p-8 shadow-sm">
          {/* Profile Header */}
          <div className="mb-8 flex items-center gap-4 border-b border-slate-200 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-sm text-slate-600">{profile.constituency}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <FaEnvelope className="h-4 w-4 text-blue-600" />
                  Email
                </div>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                />
              ) : (
                <p className="text-slate-600">{profile.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <FaPhone className="h-4 w-4 text-blue-600" />
                  Phone Number
                </div>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                />
              ) : (
                <p className="text-slate-600">{profile.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                <div className="mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                  Address
                </div>
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                  rows="3"
                />
              ) : (
                <p className="text-slate-600">{profile.address}</p>
              )}
            </div>

            {/* Constituency */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Constituency
              </label>
              <p className="text-slate-600">{profile.constituency}</p>
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Member Since
              </label>
              <p className="text-slate-600">
                {new Date(profile.joinDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Account Security
          </h3>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 transition hover:bg-slate-50">
            Change Password
          </button>
          <button className="mt-3 block rounded-lg border border-slate-300 px-4 py-2 text-slate-900 transition hover:bg-slate-50">
            Two-Factor Authentication
          </button>
        </div>
      </div>
    </div>
  );
}
