import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaCamera } from 'react-icons/fa';
import { getCitizenProfile, updateCitizenProfile, uploadCitizenProfilePhoto } from '../../shared/services/citizenService';

export default function CitizenProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    constituencyId: '',
    createdAt: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const handleLogout = () => {
  // Clear auth tokens/session
  localStorage.removeItem("token");
  navigate("/login");
};
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await getCitizenProfile();
        if (!active) return;
        setProfile(result);
        setFormData({
          fullName: result.fullName || '',
          email: result.email || '',
          mobile: result.mobile || '',
          address: result.address || '',
          constituencyId: result.constituencyId || '',
          createdAt: result.createdAt || '',
        });
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccessMessage('');
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
      };
      const updated = await updateCitizenProfile(payload);
      setProfile(updated);
      setFormData({
        fullName: updated.fullName || '',
        email: updated.email || '',
        mobile: updated.mobile || '',
        address: updated.address || '',
        constituencyId: updated.constituencyId || '',
        createdAt: updated.createdAt || '',
      });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to save profile.');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        constituencyId: profile.constituencyId || '',
        createdAt: profile.createdAt || '',
      });
    }
    setIsEditing(false);
  };

  const handlePhotoChange = (event) => {
    setPhotoError('');
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      return;
    }
    setPhotoFile(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setPhotoError('Please choose an image to upload.');
      return;
    }

    setPhotoError('');
    setSuccessMessage('');
    setUploadingPhoto(true);

    try {
      const result = await uploadCitizenProfilePhoto(photoFile);
      const updatedProfile = { ...profile, profileImage: result.profileImage || result.data?.profileImage };
      setProfile(updatedProfile);
      setPhotoFile(null);
      setSuccessMessage('Profile photo uploaded successfully.');
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          profileImage: updatedProfile.profileImage,
        })
      );
      window.dispatchEvent(new Event('auth-user-updated'));
    } catch (err) {
      setPhotoError(err?.response?.data?.detail || err?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const joinedDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-';
  const constituencyLabel = profile?.constituencyId || 'Not available';

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

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800">{error}</div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-100 px-4 py-3 text-green-800">{successMessage}</div>
        )}

        <div className="mb-6 rounded-lg bg-white p-8 shadow-sm">
          {loading ? (
            <div className="text-slate-600">Loading profile...</div>
          ) : (
            <>
              <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-2xl">
                      {profile?.profileImage ? (
                        <img
                          src={profile.profileImage.startsWith('http') ? profile.profileImage : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || 'http://127.0.0.1:8000'}/${profile.profileImage}`}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FaUser className="h-8 w-8 text-slate-500" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm text-slate-700 transition hover:bg-slate-100">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <FaCamera className="h-4 w-4" />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{profile?.fullName || profile?.email || 'Citizen'}</h2>
                    {/* <p className="text-sm text-slate-600">{constituencyLabel}</p> */}
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto || !photoFile}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  {photoError && (
                    <p className="text-sm text-red-600">{photoError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    <div className="mb-2 flex items-center gap-2">
                      <FaUser className="h-4 w-4 text-blue-600" />
                      Name
                    </div>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-slate-600">{profile?.fullName || 'Not provided'}</p>
                  )}
                </div>

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
                    <p className="text-slate-600">{profile?.email}</p>
                  )}
                </div>

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
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-blue-600 focus:outline-none"
                    />
                  ) : (
                    <p className="text-slate-600">{profile?.mobile}</p>
                  )}
                </div>

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
                    <p className="text-slate-600">{profile?.address || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900">Constituency</label>
                  <p className="text-slate-600">{constituencyLabel}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900">Member Since</label>
                  <p className="text-slate-600">{joinedDate}</p>
                </div>
              </div>

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
            </>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Account Security</h3>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-slate-900 transition hover:bg-slate-50">
            Change Password
          </button>
          <button className="mt-3 block rounded-lg border border-slate-300 px-4 py-2 text-slate-900 transition hover:bg-slate-50">
            Two-Factor Authentication
          </button>
        </div>
        {/* Logout */}
        <div className="logout-section">
          <button className="logout-btn" onClick={handleLogout}>
             🚪 Log out
          </button>
        </div>
      </div>
    </div>
  );
}
