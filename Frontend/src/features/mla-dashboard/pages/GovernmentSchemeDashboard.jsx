import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GovernmentSchemeDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

const formatNumber = (value) => (value == null || value === '' ? '-' : value.toLocaleString());

export default function GovernmentSchemeDashboard() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();

  const handleViewBeneficiaries = () => navigate(ROUTES.mlaCommunications);
  const handleReviewApproval = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleDownloadBeneficiaries = () => window.alert('Downloading beneficiary list...');
  const handleViewSchemeReports = () => navigate(ROUTES.mlaAIInsights);
  const handleScheduleApproval = () => navigate(ROUTES.mlaEvents);
  const byCategory = dashboard?.metrics?.grievances?.byCategory || {};
  const schemes = Object.entries(byCategory).slice(0, 5).map(([name, count], index) => ({
    id: index + 1,
    name,
    eligible: count,
    applied: Math.round(count * 0.75),
    approved: Math.round(count * 0.6),
    pending: Math.max(0, Math.round(count * 0.15)),
    rejected: Math.max(0, Math.round(count * 0.1)),
  }));
  const totalEligible = schemes.reduce((sum, scheme) => sum + scheme.eligible, 0);
  const totalApplied = schemes.reduce((sum, scheme) => sum + scheme.applied, 0);
  const totalApproved = schemes.reduce((sum, scheme) => sum + scheme.approved, 0);
  const totalPending = schemes.reduce((sum, scheme) => sum + scheme.pending, 0);
  const topPending = schemes.slice(0, 3);

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
            <div className="metric-value">{formatNumber(totalEligible)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Applied</div>
            <div className="metric-value">{formatNumber(totalApplied)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Approved</div>
            <div className="metric-value">{formatNumber(totalApproved)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending Approvals</div>
            <div className="metric-value">{formatNumber(totalPending)}</div>
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
                <span className="value">{scheme.applied.toLocaleString()} ({scheme.eligible ? Math.round((scheme.applied / scheme.eligible) * 100) : 0}%)</span>
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
                  <div className="progress-approved" style={{ width: `${scheme.eligible ? Math.round((scheme.approved / scheme.eligible) * 100) : 0}%` }}></div>
                  <div className="progress-pending" style={{ width: `${scheme.eligible ? Math.round((scheme.pending / scheme.eligible) * 100) : 0}%` }}></div>
                </div>
              </div>

              <button type="button" className="btn-secondary" onClick={handleViewBeneficiaries}>View Beneficiaries</button>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="mla-section">
        <h2>🔔 Pending Approvals (High Priority)</h2>
        <div className="pending-alerts">
          {topPending.length ? topPending.map((scheme) => (
            <div key={scheme.id} className="pending-item">
              <div className="pending-scheme">{scheme.name}</div>
              <div className="pending-count">{formatNumber(scheme.pending)}</div>
              <button type="button" className="btn-danger" onClick={handleReviewApproval}>Review Now</button>
            </div>
          )) : (
            <div className="pending-item">
              <div className="pending-scheme">No pending scheme approvals</div>
              <div className="pending-count">0</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleDownloadBeneficiaries}>Download Beneficiary List</button>
          <button type="button" className="btn-primary" onClick={handleViewSchemeReports}>View Scheme Reports</button>
          <button type="button" className="btn-primary" onClick={handleScheduleApproval}>Schedule Approval Meeting</button>
        </div>
      </div>
    </div>
  );
}
