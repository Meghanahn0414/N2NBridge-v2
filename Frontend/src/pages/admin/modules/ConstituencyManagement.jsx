import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchConstituencies, createConstituency } from '../../../features/constituencies/constituencyService';
import { fetchUsers } from '../../../features/team-management/userService';

export default function ConstituencyManagement() {
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, wards: 0, booths: 0 });
  const [representatives, setRepresentatives] = useState([]);
  const [repLoading, setRepLoading] = useState(true);
  const [repError, setRepError] = useState(null);
  const [selectedRepresentative, setSelectedRepresentative] = useState('');
  const [newConstituencyName, setNewConstituencyName] = useState('');
  const [newConstituencyCode, setNewConstituencyCode] = useState('');
  const [newConstituencyDistrict, setNewConstituencyDistrict] = useState('');
  const [newConstituencyState, setNewConstituencyState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    loadConstituencies();
    loadRepresentatives();
  }, []);

  const resetForm = () => {
    setNewConstituencyName('');
    setNewConstituencyCode('');
    setNewConstituencyDistrict('');
    setNewConstituencyState('');
    setSelectedRepresentative('');
    setSubmitError(null);
  };

  const handleCreateConstituency = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    if (!newConstituencyName.trim() || !newConstituencyDistrict.trim() || !newConstituencyState.trim()) {
      setSubmitError('Name, district, and state are required.');
      return;
    }

    const payload = {
      constituencyCode: newConstituencyCode.trim(),
      name: newConstituencyName.trim(),
      district: newConstituencyDistrict.trim(),
      state: newConstituencyState.trim(),
      representativeId: selectedRepresentative || undefined,
    };

    try {
      setIsSubmitting(true);
      await createConstituency(payload);
      await loadConstituencies();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to add constituency.');
      console.error('Create constituency failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadConstituencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchConstituencies(1, 1000);
      setConstituencies(data);
      setStats({ 
        total: data.length, 
        wards: data.reduce((sum, c) => sum + (c.wards?.length || 0), 0),
        booths: data.reduce((sum, c) => sum + (c.booths?.length || 0), 0)
      });
    } catch (err) {
      setError(err.message || 'Failed to load constituencies');
      console.error('Error loading constituencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRepresentatives = async () => {
    try {
      setRepLoading(true);
      setRepError(null);
      const reps = await fetchUsers(1, 1000, 'REPRESENTATIVE');
      setRepresentatives(reps);
    } catch (err) {
      setRepError(err.message || 'Failed to load representatives');
      console.error('Error loading representatives:', err);
    } finally {
      setRepLoading(false);
    }
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>🗂️ Constituency Management</h1>
        <p>Manage constituency information, wards, and booths</p>
      </div>

      <div className="module-controls">
        <input type="text" placeholder="Search constituencies..." />
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Constituency
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Constituencies</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Wards</span>
          <span className="stat-value">{stats.wards}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Booths</span>
          <span className="stat-value">{stats.booths}</span>
        </div>
      </div>

      <div className="constituency-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading constituencies...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : constituencies.length === 0 ? (
          <div className="empty-state">
            <p>📍 No constituencies found. Click "Add Constituency" to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Constituency Name</th>
                <th>Code</th>
                <th>District</th>
                <th>State</th>
                <th>Wards</th>
                <th>Booths</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {constituencies.map(constituency => (
                <tr key={constituency._id || constituency.id}>
                  <td>{constituency.name}</td>
                  <td>{constituency.constituencyCode || '-'}</td>
                  <td>{constituency.district || '-'}</td>
                  <td>{constituency.state || '-'}</td>
                  <td>{constituency.wards?.length || 0}</td>
                  <td>{constituency.booths?.length || 0}</td>
                  <td>
                    <button>✏️</button>
                    <button>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Constituency</h2>
            <form onSubmit={handleCreateConstituency}>
              <div className="form-group">
                <label>Constituency Name *</label>
                <input
                  type="text"
                  required
                  value={newConstituencyName}
                  onChange={(e) => setNewConstituencyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  type="text"
                  value={newConstituencyCode}
                  onChange={(e) => setNewConstituencyCode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  required
                  value={newConstituencyDistrict}
                  onChange={(e) => setNewConstituencyDistrict(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  required
                  value={newConstituencyState}
                  onChange={(e) => setNewConstituencyState(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Representative</label>
                <select
                  value={selectedRepresentative}
                  onChange={(e) => setSelectedRepresentative(e.target.value)}
                >
                  <option value="">Select Representative</option>
                  {repLoading ? (
                    <option value="" disabled>Loading representatives...</option>
                  ) : repError ? (
                    <option value="" disabled>{repError}</option>
                  ) : (
                    representatives.map((rep) => (
                      <option key={rep._id || rep.id} value={rep._id || rep.id}>
                        {rep.fullName || rep.name || rep.email || rep.mobile || 'Representative'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {submitError && <div className="form-error">{submitError}</div>}
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
