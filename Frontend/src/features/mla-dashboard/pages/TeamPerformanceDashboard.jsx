import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/TeamPerformanceDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function TeamPerformanceDashboard() {
  const navigate = useNavigate();
  const { dashboard } = useMlaDashboard();

  const teamData = dashboard?.teamPerformance || [];
  const activeOfficers = dashboard?.summary?.activeOfficers || teamData.length;
  const managerCount = teamData.length;
  const resolvedThisMonth = dashboard?.summary?.resolvedThisMonth || 0;

  const handleReview = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleTakeAction = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleScheduleMeeting = () => navigate(ROUTES.mlaEvents);
  const handleViewAnalytics = () => navigate(ROUTES.mlaAIInsights);
  const handleSendReport = () => navigate(ROUTES.mlaCommunications);

  const managers = teamData
    .filter(m => (m.completed || 0) > 0 || (m.assigned || 0) > 0)
    .slice(0, 3)
    .map((m, idx) => ({ id: idx + 1, name: m.name || 'Unknown', complaints: m.assigned || 0, resolved: m.completed || 0, rating: m.rating || '0.0', ward: m.role || 'Field Officer' }));

  const officers = teamData
    .filter(m => (m.completed || 0) > 0 || (m.assigned || 0) > 0)
    .slice(0, 4)
    .map((m, idx) => ({ rank: idx + 1, name: m.name || 'Officer', resolved: m.completed || 0, rating: m.rating || '0.0', wards: m.role || 'N/A' }));

  const averageRating = teamData.length
    ? (teamData.reduce((sum, m) => sum + Number(m.rating || 0), 0) / teamData.length).toFixed(1)
    : '0.0';

  const poorPerformance = teamData.slice(3, 5).map((m) => ({
    name: m.name || 'No data',
    resolutionTime: m.time || 'N/A',
    target: dashboard?.metrics?.resolutionTime?.avgResolutionTime
      ? `${Math.round(dashboard.metrics.resolutionTime.avgResolutionTime / (1000 * 60 * 60 * 24))} days`
      : '24h',
    wards: m.role || 'N/A',
  }));

  return (
    <div>
      <PageHeader subtitle="Monitor staff performance and take action" />
      <div className="mla-container">

      <div className="mla-section">
        <div className="team-summary-grid">
          <div className="summary-card">
            <div className="summary-value">{activeOfficers}</div>
            <div className="summary-label">Active Officers</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{managerCount}</div>
            <div className="summary-label">Constituency Managers</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{averageRating}</div>
            <div className="summary-label">Overall Rating</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{resolvedThisMonth}</div>
            <div className="summary-label">Resolved This Month</div>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <h2>Managers Performance</h2>
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
              {managers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: 13 }}>
                    No manager activity data available
                  </td>
                </tr>
              ) : managers.map(mgr => (
                <tr key={mgr.id}>
                  <td><strong>{mgr.name}</strong></td>
                  <td>{mgr.ward}</td>
                  <td>{mgr.complaints}</td>
                  <td><span className="success">{mgr.resolved}</span></td>
                  <td><span className="rating">⭐ {mgr.rating}/5</span></td>
                  <td><button type="button" className="btn-secondary btn-sm" onClick={handleReview}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mla-section">
        <h2>🏆 Top Performing Officers</h2>
        {officers.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>No performance data available</p>
        ) : (
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
        )}
      </div>

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
                  <span className="value">{perf.resolutionTime}</span>
                </div>
                <div className="detail">
                  <span className="label">Target:</span>
                  <span className="value">{perf.target}</span>
                </div>
                <div className="detail">
                  <span className="label">Wards:</span>
                  <span className="value">{perf.wards}</span>
                </div>
              </div>
              <button type="button" className="btn-danger" onClick={handleTakeAction}>Take Action</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleScheduleMeeting}>Schedule Meeting</button>
          <button type="button" className="btn-primary" onClick={handleViewAnalytics}>View Detailed Analytics</button>
          <button type="button" className="btn-primary" onClick={handleSendReport}>Send Performance Report</button>
        </div>
      </div>
    </div>
  </div>
  );
}
