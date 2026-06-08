import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GovernmentSchemeDashboard.css';

export default function GovernmentSchemeDashboard() {
  const [schemes] = useState([
    {
      id: 1,
      name: 'Housing Scheme',
      eligible:'',
      applied:'',
      approved:'',
      pending:'',
      rejected:'',
    },
    {
      id: 2,
      name: '',
      eligible:'',
      applied: '',
      approved: '',
      pending: '',
      rejected: '',
    },
    {
      id: 3,
      name: 'Scholarship Scheme',
      eligible: '',
      applied: '',
      approved: '',
      pending: '',
      rejected: '',
    },
    {
      id: 4,
      name: 'Farmer Subsidy',
      eligible: '',
      applied: '',
      approved: '',
      pending: '',
      rejected: '',
    },
    {
      id: 5,
      name: 'Health Insurance',
      eligible: '',
      applied: '',
      approved: '',
      pending: '',
      rejected: '',
    },
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>🏛️ Government Schemes Dashboard</h1>
        <p>Track scheme applications and beneficiaries</p>
      </div>

      {/* Overall Metrics */}
      <div className="mla-section">
        <div className="scheme-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Eligible</div>
            <div className="metric-value"></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Applied</div>
            <div className="metric-value"></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Approved</div>
            <div className="metric-value"></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending Approvals</div>
            <div className="metric-value"></div>
          </div>
        </div>
      </div>

      {/* Schemes Details */}
      <div className="mla-section">
        <h2>Scheme Status</h2>
        <div className="schemes-grid">
          {schemes.map(scheme => (
            <div key={scheme.id} className="scheme-card">
              <h3>{scheme.name}</h3>
              
              <div className="scheme-stat">
                <span className="label">Eligible:</span>
                <span className="value">{scheme.eligible.toLocaleString()}</span>
              </div>
              <div className="scheme-stat">
                <span className="label">Applied:</span>
                <span className="value">{scheme.applied.toLocaleString()} ({Math.round(scheme.applied/scheme.eligible*100)}%)</span>
              </div>
              <div className="scheme-stat success">
                <span className="label">Approved:</span>
                <span className="value">{scheme.approved.toLocaleString()}</span>
              </div>
              <div className="scheme-stat warning">
                <span className="label">Pending:</span>
                <span className="value">{scheme.pending}</span>
              </div>
              <div className="scheme-stat danger">
                <span className="label">Rejected:</span>
                <span className="value">{scheme.rejected}</span>
              </div>

              <div className="scheme-progress">
                <div className="progress-bar">
                  <div className="progress-approved" style={{ width: `${(scheme.approved/scheme.eligible)*100}%` }}></div>
                  <div className="progress-pending" style={{ width: `${(scheme.pending/scheme.eligible)*100}%` }}></div>
                </div>
              </div>

              <button className="btn-secondary">View Beneficiaries</button>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="mla-section">
        <h2>🔔 Pending Approvals (High Priority)</h2>
        <div className="pending-alerts">
          <div className="pending-item">
            <div className="pending-scheme">Housing Scheme</div>
            <div className="pending-count"></div>
            <button className="btn-danger">Review Now</button>
          </div>
          <div className="pending-item">
            <div className="pending-scheme">Farmer Subsidy</div>
            <div className="pending-count"></div>
            <button className="btn-danger">Review Now</button>
          </div>
          <div className="pending-item">
            <div className="pending-scheme">Pension Scheme</div>
            <div className="pending-count"></div>
            <button className="btn-danger">Review Now</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">Download Beneficiary List</button>
          <button className="btn-primary">View Scheme Reports</button>
          <button className="btn-primary">Schedule Approval Meeting</button>
        </div>
      </div>
    </div>
  );
}
