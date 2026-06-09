import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/ExecutiveDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

const formatNumber = (value) => {
  if (value == null || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();
  const kpis = dashboard?.summary || {};

  const handleNavigate = (route) => () => navigate(route);
  const handleAttentionClick = () => navigate(ROUTES.mlaComplaintsDashboard);
  const totalComplaints = Number(kpis.totalComplaints || 0);
  const complaintsResolutionPct = totalComplaints > 0
    ? Math.min(100, Math.round((Number(kpis.resolvedThisMonth || 0) / totalComplaints) * 100))
    : 0;
  const citizenSatisfactionPct = kpis.citizenSatisfaction != null
    ? Math.min(100, Math.round((Number(kpis.citizenSatisfaction || 0) / 5) * 100))
    : 0;
  const alertTotal = Number(dashboard?.overview?.alerts?.total || 0);
  const alertResponsePct = alertTotal > 0
    ? Math.min(100, Math.round((1 - (Number(kpis.criticalAlerts || 0) / alertTotal)) * 100))
    : 0;
  const avgRegistrationsPerEvent = Number(dashboard?.overview?.events?.avgRegistrationsPerEvent || 0);
  const eventParticipationPct = Math.min(100, Math.round(avgRegistrationsPerEvent * 10));

  const attentionNeeded = (dashboard?.recentAlerts || []).slice(0, 4).map((alert, idx) => ({
    id: alert._id || idx,
    icon: '⚠️',
    title: alert.alertType || alert.type || 'Alert',
    ward: alert.location || alert.wardId || 'Unknown ward',
    priority: (alert.priority || 'LOW').toLowerCase(),
  }));

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>🏛️ Executive Dashboard</h1>
        <p>Your constituency command center</p>
      </div>

      {loading ? (
        <div className="mla-loading">Loading executive dashboard...</div>
      ) : error ? (
        <div className="mla-error">{error}</div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="mla-kpi-grid">
            <div className="mla-kpi-card">
              <div className="kpi-label">Total Citizens</div>
              <div className="kpi-value">{formatNumber(kpis.registeredCitizens)}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card alert">
              <div className="kpi-label">Open Complaints</div>
              <div className="kpi-value">{formatNumber(kpis.openComplaints)}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card success">
              <div className="kpi-label">Resolved This Month</div>
              <div className="kpi-value">{formatNumber(kpis.resolvedThisMonth)}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card danger">
              <div className="kpi-label">Critical Alerts</div>
              <div className="kpi-value">{formatNumber(kpis.criticalAlerts)}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card">
              <div className="kpi-label">Upcoming Events</div>
              <div className="kpi-value">{formatNumber(kpis.upcomingEvents)}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card success">
              <div className="kpi-label">Citizen Satisfaction</div>
              <div className="kpi-value">{formatNumber(kpis.citizenSatisfaction)}/5 ⭐</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card success">
              <div className="kpi-label">Health Score</div>
              <div className="kpi-value">{kpis.healthScore}</div>
              <div className="kpi-change"></div>
            </div>

            <div className="mla-kpi-card">
              <div className="kpi-label">Active Officers</div>
              <div className="kpi-value">{formatNumber(kpis.activeOfficers)}</div>
              <div className="kpi-change"></div>
            </div>
          </div>

          {/* Constituency Health Score */}
      <div className="mla-section">
        <div className="health-score-container">
          <div className="health-score-circle">
            <div className="health-score-value">{kpis.healthScore}</div>
            <div className="health-score-label">Health Score</div>
          </div>
          <div className="health-score-details">
            <h3>Constituency Health Metrics</h3>
            <div className="health-metrics">
              <div className="metric">
                <span className="metric-name">Complaints Resolution</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: `${complaintsResolutionPct}%` }}></div>
                </div>
                <span className="metric-value">{complaintsResolutionPct}%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Citizen Satisfaction</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: `${citizenSatisfactionPct}%` }}></div>
                </div>
                <span className="metric-value">{citizenSatisfactionPct}%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Alert Response</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: `${alertResponsePct}%` }}></div>
                </div>
                <span className="metric-value">{alertResponsePct}%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Event Participation</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: `${eventParticipationPct}%` }}></div>
                </div>
                <span className="metric-value">{eventParticipationPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attention Needed */}
      <div className="mla-section">
        <h2>⚠️ Today's Attention Needed</h2>
        <div className="attention-grid">
          {attentionNeeded.length > 0 ? (
            attentionNeeded.map(item => (
              <div
                key={item.id}
                className={`attention-card ${item.priority}`}
                onClick={handleAttentionClick}
              >
                <div className="attention-icon">{item.icon}</div>
                <div className="attention-content">
                  <h4>{item.title}</h4>
                  {item.ward && <p>{item.ward}</p>}
                </div>
                <div className="attention-arrow">→</div>
              </div>
            ))
          ) : (
            <div className="attention-card no-data">
              <div className="attention-content">
                <h4>No alerts found</h4>
                <p>All current alerts have been cleared or there is no active alert data.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaHeatMap)}>📊 View Heat Map</button>
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaCommunications)}>📢 Send Broadcast</button>
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaEvents)}>📅 Schedule Event</button>
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaTeamPerformance)}>👥 Check Team Status</button>
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaDailyBriefing)}>📋 View Daily Briefing</button>
          <button className="action-btn" onClick={handleNavigate(ROUTES.mlaAIInsights)}>🤖 AI Insights</button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
