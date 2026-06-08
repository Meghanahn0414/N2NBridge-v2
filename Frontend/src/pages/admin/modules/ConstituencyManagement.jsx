import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function ConstituencyManagement() {
  const [constituencies, setConstituencies] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Wards</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Booths</span>
          <span className="stat-value"></span>
        </div>
      </div>

      <div className="constituencies-grid">
        <div className="empty-state">
          <p>📍 No constituencies found. Click "Add Constituency" to get started.</p>
        </div>
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
