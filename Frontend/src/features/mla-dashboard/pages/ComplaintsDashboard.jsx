import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/ComplaintsDashboard.css';

export default function ComplaintsDashboard() {
  const [complaints, setComplaints] = useState([
    { category: 'Water Supply', count: 450 },
    { category: 'Electricity', count: 380 },
    { category: 'Roads', count: 320 },
    { category: 'Drainage', count: 210 },
    { category: 'Health', count: 180 },
    { category: 'Education', count: 125 },
  ]);

  const [topWards] = useState([
    { ward: 'Ward 12', issues: 156, priority: 'critical' },
    { ward: 'Ward 18', issues: 142, priority: 'critical' },
    { ward: 'Ward 4', issues: 128, priority: 'high' },
    { ward: 'Ward 7', issues: 98, priority: 'high' },
    { ward: 'Ward 21', issues: 87, priority: 'medium' },
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>📋 Complaints Dashboard</h1>
        <p>Monitor and analyze citizen complaints</p>
      </div>

      {/* Overview Stats */}
      <div className="mla-section">
        <div className="complaint-stats-grid">
          <div className="stat-box">
            <div className="stat-label">Total Complaints</div>
            <div className="stat-value">3,245</div>
          </div>
          <div className="stat-box alert">
            <div className="stat-label">Open Complaints</div>
            <div className="stat-value">1,270</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Escalated</div>
            <div className="stat-value">45</div>
          </div>
          <div className="stat-box success">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">2,500</div>
          </div>
        </div>
      </div>

      {/* Category-wise Complaints */}
      <div className="mla-section">
        <h2>Complaints by Category</h2>
        <div className="category-grid">
          {complaints.map((item, idx) => (
            <div key={idx} className="category-card">
              <div className="category-header">
                <h4>{item.category}</h4>
                <span className="category-count">{item.count}</span>
              </div>
              <div className="category-bar">
                <div 
                  className="category-progress"
                  style={{ width: `${(item.count / 450) * 100}%` }}
                ></div>
              </div>
              <button className="btn-secondary btn-sm">View</button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Problematic Wards */}
      <div className="mla-section">
        <h2>🔴 Most Problematic Wards</h2>
        <div className="ward-ranking">
          {topWards.map((ward, idx) => (
            <div key={idx} className={`ward-rank-item ${ward.priority}`}>
              <div className="rank-badge">#{idx + 1}</div>
              <div className="rank-info">
                <h4>{ward.ward}</h4>
                <p>{ward.issues} issues</p>
              </div>
              <button className="btn-secondary">Investigate</button>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Trend */}
      <div className="mla-section">
        <h2>Resolution Trend</h2>
        <div className="trend-chart-placeholder">
          <p>📈 Chart: Complaints vs Resolutions (This Month)</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">View All Complaints</button>
          <button className="btn-primary">Escalate Issue</button>
          <button className="btn-primary">Download Report</button>
        </div>
      </div>
    </div>
  );
}
