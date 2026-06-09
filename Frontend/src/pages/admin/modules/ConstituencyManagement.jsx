import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchConstituencies, createConstituency } from '../../../features/constituencies/constituencyService';

export default function ConstituencyManagement() {
  const [constituencies, setConstituencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, wards: 0, booths: 0 });

  useEffect(() => {
    loadConstituencies();
  }, []);

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

      <div className="constituencies-grid">
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
                  <td>{constituency.code || '-'}</td>
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
            <form>
              <div className="form-group">
                <label>Constituency Name *</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input type="text" />
              </div>
              <div className="form-group">
                <label>District</label>
                <input type="text" />
              </div>
              <div className="form-group">
                <label>Representative</label>
                <select>
                  <option>Select Representative</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
