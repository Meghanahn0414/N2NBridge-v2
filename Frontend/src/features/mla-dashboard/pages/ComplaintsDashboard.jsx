import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/ComplaintsDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function ComplaintsDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dashboard, loading, error } = useMlaDashboard();
  const grievanceStats = dashboard?.metrics?.grievances || {};
  const totalComplaints = grievanceStats.total || 0;
  const openComplaints = dashboard?.summary?.openComplaints || 0;
  const escalatedComplaints = grievanceStats.byStatus?.ESCALATED || 0;
  const resolvedComplaints = dashboard?.metrics?.grievances?.byStatus?.RESOLVED || dashboard?.summary?.resolvedThisMonth || 0;

  const handleViewCategory = () => navigate(ROUTES.mlaHeatMap);
  const handleInvestigate = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleViewAllComplaints = () => navigate(ROUTES.mlaConstituencyStatus);
  const handleEscalateIssue = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleDownloadReport = () => window.alert('Downloading complaints report...');
  const byCategory = grievanceStats.byCategory || {};

  const complaints = Object.entries(byCategory).map(([category, count]) => ({ category, count }))
    .slice(0, 6);

  const topWards = (() => {
    if (Array.isArray(dashboard?.wardStats) && dashboard.wardStats.length) {
      return dashboard.wardStats.slice(0, 10).map(w => ({
        ward: `Ward ${w.wardId || w.name}`,
        issues: w.count || 0,
        priority: (w.highestPriority || 'LOW').toUpperCase(),
      }));
    }
    return (dashboard?.recentComplaints || []).slice(0, 5).map((c, idx) => ({
      ward: c.wardId ? `Ward ${c.wardId}` : `Ward ${idx + 1}`,
      issues: 1,
      priority: (c.priority || 'LOW').toUpperCase(),
    }));
  })();

  return (
    <div>
      <PageHeader subtitle={t("monitor_analyze_complaints")} />
      <div className="mla-container">

      {/* Overview Stats */}
      <div className="mla-section">
        <div className="complaint-stats-grid">
          <div className="stat-box">
            <div className="stat-label">{t("total_complaints")}</div>
            <div className="stat-value">{totalComplaints}</div>
          </div>
          <div className="stat-box alert">
            <div className="stat-label">{t("open_complaints")}</div>
            <div className="stat-value">{openComplaints}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">{t("escalated")}</div>
            <div className="stat-value">{escalatedComplaints}</div>
          </div>
          <div className="stat-box success">
            <div className="stat-label">{t("resolved")}</div>
            <div className="stat-value">{resolvedComplaints}</div>
          </div>
        </div>
      </div>

      {/* Category-wise Complaints */}
      <div className="mla-section">
        <h2>{t("complaints_by_category")}</h2>
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
              <button type="button" className="btn-secondary btn-sm" onClick={handleViewCategory}>{t("view")}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Top Problematic Wards */}
      <div className="mla-section">
        <div className="ward-table-card">
          <h3 className="ward-table-title">{t("top_wards_by_complaints")}</h3>
          <table className="ward-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("ward")}</th>
                <th>{t("issues")}</th>
                <th>{t("priority")}</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topWards.map((ward, idx) => {
                const p = ward.priority;
                const priorityStyle =
                  p === 'CRITICAL' ? { bg: '#fecdd3', color: '#e11d48' }
                  : p === 'HIGH'   ? { bg: '#fecdd3', color: '#e11d48' }
                  : p === 'MEDIUM' ? { bg: '#fef9c3', color: '#ca8a04' }
                  :                  { bg: '#dcfce7', color: '#16a34a' };
                const statusDot =
                  idx === 0 ? { dot: '#3b82f6', text: '#3b82f6', label: 'New' }
                  : idx === 1 ? { dot: '#f97316', text: '#f97316', label: 'Assigned' }
                  : idx === 2 ? { dot: '#eab308', text: '#ca8a04', label: 'In Progress' }
                  : { dot: '#22c55e', text: '#16a34a', label: 'Active' };
                return (
                  <tr key={idx}>
                    <td className="ward-id">W-{String(idx + 1).padStart(3, '0')}</td>
                    <td className="ward-name">{ward.ward}</td>
                    <td className="ward-issues">{ward.issues} {ward.issues === 1 ? 'issue' : 'issues'}</td>
                    <td>
                      <span className="ward-priority-badge" style={{ background: priorityStyle.bg, color: priorityStyle.color }}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      <span className="ward-status">
                        <span className="ward-status-dot" style={{ background: statusDot.dot }} />
                        <span style={{ color: statusDot.text }}>{statusDot.label}</span>
                      </span>
                    </td>
                    <td>
                      <button type="button" className={idx === 0 ? 'ward-btn-primary' : 'ward-btn-secondary'} onClick={handleInvestigate}>
                        {idx === 0 ? 'Assign' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          <button type="button" className="btn-primary" onClick={handleViewAllComplaints}>{t("view_all_complaints")}</button>
          <button type="button" className="btn-primary" onClick={handleEscalateIssue}>{t("escalate_issue")}</button>
          <button type="button" className="btn-primary" onClick={handleDownloadReport}>{t("download_report")}</button>
        </div>
      </div>
    </div>
  </div>
  );
}
