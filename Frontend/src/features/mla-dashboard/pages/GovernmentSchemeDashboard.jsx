import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GovernmentSchemeDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';
import ExportButton from '../../../components/ExportButton';
import { getRepRolePrefix } from '../../../services/authStorage';

const formatNumber = (value) => (value == null || value === '' ? '-' : value.toLocaleString());

const SCHEME_EXPORT_COLUMNS = [
  { key: 'name',       label: 'Category' },
  { key: 'total',      label: 'Total' },
  { key: 'open',       label: 'Open' },
  { key: 'resolved',   label: 'Resolved' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'escalated',  label: 'Escalated' },
];

export default function GovernmentSchemeDashboard() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();
  const pageRef = useRef(null);

  const handleViewBeneficiaries = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleReviewApproval = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleViewSchemeReports = () => navigate(ROUTES.mlaAIInsights);
  const handleScheduleApproval = () => navigate(ROUTES.mlaEvents);
  const categoryComplaints = dashboard?.categoryComplaints || {};
  const schemes = Object.entries(categoryComplaints)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)
    .map(([name, stats], index) => ({
      id: index + 1,
      name,
      total: stats.total || 0,
      open: stats.open || 0,
      resolved: stats.resolved || 0,
      inProgress: stats.inProgress || 0,
      escalated: stats.escalated || 0,
    }));
  const totalComplaints = schemes.reduce((sum, s) => sum + s.total, 0);
  const totalOpen = schemes.reduce((sum, s) => sum + s.open, 0);
  const totalResolved = schemes.reduce((sum, s) => sum + s.resolved, 0);
  const totalEscalated = schemes.reduce((sum, s) => sum + s.escalated, 0);
  const topPending = schemes.filter(s => s.open > 0).slice(0, 3);

  return (
    <div>
      <PageHeader subtitle="Track scheme applications and beneficiaries" />
      <div className="mla-container" ref={pageRef}>

      {/* Overall Metrics */}
      <div className="mla-section">
        <div className="scheme-metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Complaints</div>
            <div className="metric-value">{formatNumber(totalComplaints)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Open</div>
            <div className="metric-value">{formatNumber(totalOpen)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Resolved</div>
            <div className="metric-value">{formatNumber(totalResolved)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Escalated</div>
            <div className="metric-value">{formatNumber(totalEscalated)}</div>
          </div>
        </div>
      </div>

      {/* Complaints by Category */}
      <div className="mla-section">
        <h2>Complaints by Category</h2>
        {schemes.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>No complaint data available yet.</p>
        ) : (
          <div className="schemes-grid">
            {schemes.map(scheme => (
              <div key={scheme.id} className="scheme-card">
                <h3>{scheme.name}</h3>

                <div className="scheme-stat">
                  <span className="label">Total:</span>
                  <span className="value">{scheme.total.toLocaleString()}</span>
                </div>
                <div className="scheme-stat">
                  <span className="label">Open:</span>
                  <span className="value">{scheme.open.toLocaleString()} ({scheme.total ? Math.round((scheme.open / scheme.total) * 100) : 0}%)</span>
                </div>
                <div className="scheme-stat success">
                  <span className="label">Resolved:</span>
                  <span className="value">{scheme.resolved.toLocaleString()}</span>
                </div>
                <div className="scheme-stat warning">
                  <span className="label">In Progress:</span>
                  <span className="value">{scheme.inProgress}</span>
                </div>
                <div className="scheme-stat danger">
                  <span className="label">Escalated:</span>
                  <span className="value">{scheme.escalated}</span>
                </div>

                <div className="scheme-progress">
                  <div className="progress-bar">
                    <div className="progress-approved" style={{ width: `${scheme.total ? Math.round((scheme.resolved / scheme.total) * 100) : 0}%` }}></div>
                    <div className="progress-pending" style={{ width: `${scheme.total ? Math.round((scheme.open / scheme.total) * 100) : 0}%` }}></div>
                  </div>
                </div>

                <button type="button" className="btn-secondary" onClick={handleViewBeneficiaries}>View Details</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Complaints (High Priority) */}
      <div className="mla-section">
        <h2>🔔 Categories with Open Complaints</h2>
        <div className="pending-alerts">
          {topPending.length ? topPending.map((scheme) => (
            <div key={scheme.id} className="pending-item">
              <div className="pending-scheme">{scheme.name}</div>
              <div className="pending-count">{formatNumber(scheme.open)} open</div>
              <button type="button" className="btn-danger" onClick={handleReviewApproval}>Review Now</button>
            </div>
          )) : (
            <div className="pending-item">
              <div className="pending-scheme">No open complaints</div>
              <div className="pending-count">0</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <ExportButton filename={`${getRepRolePrefix()}-government-schemes`} pdfRef={pageRef} data={schemes} columns={SCHEME_EXPORT_COLUMNS} />
          <button type="button" className="btn-primary" onClick={handleViewSchemeReports}>View Scheme Reports</button>
          <button type="button" className="btn-primary" onClick={handleScheduleApproval}>Schedule Approval Meeting</button>
        </div>
      </div>
    </div>
  </div>
  );
}
