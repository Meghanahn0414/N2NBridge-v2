import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/ComplaintsDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function ComplaintsDashboard() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();
  const grievanceStats = dashboard?.metrics?.grievances || {};
  const totalComplaints = grievanceStats.total || 0;
  const openComplaints = dashboard?.summary?.openComplaints || 0;
  const escalatedComplaints = grievanceStats.byStatus?.ESCALATED || 0;
  const resolvedComplaints = dashboard?.metrics?.grievances?.byStatus?.RESOLVED || dashboard?.summary?.resolvedThisMonth || 0;

  const handleViewCategory = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleInvestigate = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleViewAllComplaints = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleEscalateIssue = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleDownloadReport = () => window.alert('Downloading complaints report...');
  const byCategory = grievanceStats.byCategory || {};

  const complaints = Object.entries(byCategory).map(([category, count]) => ({ category, count }))
    .slice(0, 6);

  const topWards = dashboard?.recentComplaints?.slice(0, 5).map((complaint, idx) => ({
    ward: complaint.wardId || complaint.location || `Ward ${idx + 1}`,
    issues: 1,
    priority: (complaint.priority || 'LOW').toLowerCase(),
  })) || Array(5).fill({ ward: '', issues: '', priority: '' });

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
            <div className="stat-value">{totalComplaints}</div>
          </div>
          <div className="stat-box alert">
            <div className="stat-label">Open Complaints</div>
            <div className="stat-value">{openComplaints}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Escalated</div>
            <div className="stat-value">{escalatedComplaints}</div>
          </div>
          <div className="stat-box success">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{resolvedComplaints}</div>
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
              <button type="button" className="btn-secondary btn-sm" onClick={handleViewCategory}>View</button>
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
              <button type="button" className="btn-secondary" onClick={handleInvestigate}>Investigate</button>
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
          <button type="button" className="btn-primary" onClick={handleViewAllComplaints}>View All Complaints</button>
          <button type="button" className="btn-primary" onClick={handleEscalateIssue}>Escalate Issue</button>
          <button type="button" className="btn-primary" onClick={handleDownloadReport}>Download Report</button>
        </div>
      </div>
    </div>
  );
}
