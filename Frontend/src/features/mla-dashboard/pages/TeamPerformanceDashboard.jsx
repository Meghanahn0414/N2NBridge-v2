import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/TeamPerformanceDashboard.css';

export default function TeamPerformanceDashboard() {
  const [managers, setManagers] = useState([
    { id: 1, name: '', complaints:'', resolved:'', rating:'', ward: '' },
    { id: 2, name: '', complaints:'', resolved:'', rating: '', ward: ''},
    { id: 3, name: '', complaints:'', resolved:'', rating: '', ward: '' },
  ]);

  const [officers] = useState([
    { rank: 1, name: '', resolved: '', rating: '', wards: '' },
    { rank: 2, name: '', resolved: '', rating: '', wards: '' },
    { rank: 3, name: '', resolved: '', rating: '', wards: '' },
    { rank: 4, name: '', resolved: '', rating: '', wards: '' },
  ]);

  const [poorPerformance] = useState([
    { name: '', resolutionTime: '', target: '', wards: '' },
    { name: '', resolutionTime: '', target: '', wards: '' },
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>👥 Team Performance Dashboard</h1>
        <p>Monitor staff performance and team metrics</p>
      </div>

      {/* Team Summary */}
      <div className="mla-section">
        <div className="team-summary-grid">
          <div className="summary-card">
            <div className="summary-value"></div>
            <div className="summary-label">Active Officers</div>
          </div>
          <div className="summary-card">
            <div className="summary-value"></div>
            <div className="summary-label">Constituency Managers</div>
          </div>
          <div className="summary-card">
            <div className="summary-value"></div>
            <div className="summary-label">Overall Rating</div>
          </div>
          <div className="summary-card">
            <div className="summary-value"></div>
            <div className="summary-label">Resolved This Month</div>
          </div>
        </div>
      </div>

      {/* Constituency Managers */}
      <div className="mla-section">
        <h2>Constituency Managers Performance</h2>
        <div className="performance-table">
          <table>
            <thead>
              <tr>
                <th>Manager</th>
                <th>Ward</th>
                <th>Complaints</th>
                <th>Resolved</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {managers.map(mgr => (
                <tr key={mgr.id}>
                  <td><strong>{mgr.name}</strong></td>
                  <td>{mgr.ward}</td>
                  <td>{mgr.complaints}</td>
                  <td><span className="success">{mgr.resolved}</span></td>
                  <td><span className="rating">⭐ {mgr.rating}/5</span></td>
                  <td><button className="btn-secondary btn-sm">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officers Ranking */}
      <div className="mla-section">
        <h2>🏆 Top Performing Officers</h2>
        <div className="ranking-list">
          {officers.map(officer => (
            <div key={officer.rank} className="ranking-item">
              <div className="rank-badge">#{officer.rank}</div>
              <div className="officer-info">
                <h4>{officer.name}</h4>
                <p className="officer-wards">{officer.wards}</p>
              </div>
              <div className="officer-stats">
                <div className="stat">
                  <span className="stat-label">Resolved</span>
                  <span className="stat-value">{officer.resolved}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">⭐ {officer.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Poor Performance Alerts */}
      <div className="mla-section">
        <h2>⚠️ Performance Concerns</h2>
        <div className="performance-alerts">
          {poorPerformance.map((perf, idx) => (
            <div key={idx} className="alert-item danger">
              <div className="alert-header">
                <h4>{perf.name}</h4>
                <span className="warning-badge">⚠️ Below Target</span>
              </div>
              <div className="alert-details">
                <div className="detail">
                  <span className="label">Resolution Time:</span>
                  <span className="value">{perf.resolutionTime} days</span>
                </div>
                <div className="detail">
                  <span className="label">Target:</span>
                  <span className="value">{perf.target} days</span>
                </div>
                <div className="detail">
                  <span className="label">Wards:</span>
                  <span className="value">{perf.wards}</span>
                </div>
              </div>
              <button className="btn-danger">Take Action</button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">Schedule Meeting</button>
          <button className="btn-primary">View Detailed Analytics</button>
          <button className="btn-primary">Send Performance Report</button>
        </div>
      </div>
    </div>
  );
}
