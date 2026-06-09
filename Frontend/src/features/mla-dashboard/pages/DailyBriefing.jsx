import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/DailyBriefing.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function DailyBriefing() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();
  const summary = dashboard?.summary || {};

  const handleNavigate = (route) => () => navigate(route);
  const handleTakeAction = () => navigate(ROUTES.mlaComplaintsDashboard);
  const recentAlert = dashboard?.recentAlerts?.[0];
  const topConcernTitle = recentAlert
    ? `${recentAlert.alertType || recentAlert.type || 'Alert'} in ${recentAlert.location || recentAlert.wardId || 'your area'}`
    : summary.openComplaints > 0
      ? 'Pending complaints need attention'
      : 'No urgent issues detected';

  const briefing = {
    greeting: `Good ${new Date().getHours() < 12 ? 'Morning' : 'Afternoon'} MLA`,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    newComplaints: formatNumber(summary.totalComplaints),
    resolved: formatNumber(summary.resolvedThisMonth),
    criticalAlerts: formatNumber(summary.criticalAlerts),
    events: formatNumber(summary.upcomingEvents),
    pendingEscalations: formatNumber(summary.openComplaints),
    topConcern: topConcernTitle,
    recommendedAction: summary.openComplaints > 0
      ? 'Review open complaints and assign officers immediately.'
      : 'Monitor ongoing events and community sentiment.',
  };

  const actionItems = (dashboard?.recentAlerts || []).slice(0, 4).map((alert, idx) => ({
    id: alert._id || idx,
    title: alert.alertType || alert.type || 'Review new alert',
    priority: (alert.priority || 'HIGH').toLowerCase(),
    time: alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
  }));

  const metrics = {
    citizenSatisfaction: formatNumber(summary.citizenSatisfaction),
    healthScore: formatNumber(summary.healthScore),
    resolvedThisMonth: formatNumber(summary.resolvedThisMonth),
    activeAlerts: formatNumber(summary.criticalAlerts),
    teamOnDuty: formatNumber(summary.activeOfficers),
    eventsThisWeek: formatNumber(summary.upcomingEvents),
  };

  return (
    <div className="mla-container daily-briefing-container">
      <div className="daily-briefing-header">
        <h1>{briefing.greeting} 👋</h1>
        <p>{briefing.date}</p>
      </div>

      {/* Today's Summary Card */}
      <div className="mla-section briefing-summary">
        <h2>Today's Summary</h2>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-icon">📝</div>
            <div className="stat-text">
              <div className="stat-number">{briefing.newComplaints}</div>
              <div className="stat-label">New Complaints</div>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-icon">✅</div>
            <div className="stat-text">
              <div className="stat-number">{briefing.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
          <div className="summary-stat danger">
            <div className="stat-icon">🚨</div>
            <div className="stat-text">
              <div className="stat-number">{briefing.criticalAlerts}</div>
              <div className="stat-label">Critical Alerts</div>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-icon">📅</div>
            <div className="stat-text">
              <div className="stat-number">{briefing.events}</div>
              <div className="stat-label">Events Today</div>
            </div>
          </div>
          <div className="summary-stat warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-text">
              <div className="stat-number">{briefing.pendingEscalations}</div>
              <div className="stat-label">Pending Escalations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Priority Alert */}
      <div className="mla-section">
        <div className="priority-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h3>Top Concern Today</h3>
            <p className="concern-text">{briefing.topConcern}</p>
            <div className="recommended-action">
              <span className="action-label">Recommended Action:</span>
              <span className="action-text">{briefing.recommendedAction}</span>
            </div>
          </div>
          <button className="btn-danger" onClick={handleTakeAction}>Take Action</button>
        </div>
      </div>

      {/* Action Items / To-Do List */}
      <div className="mla-section">
        <h2>📋 Your Action Items Today</h2>
        <div className="action-items-list">
          {actionItems.length > 0 ? (
            actionItems.map(item => (
              <div key={item.id} className={`action-item ${item.priority}`}>
                <input type="checkbox" />
                <div className="action-content">
                  <h4>{item.title}</h4>
                  <span className="action-time">🕐 {item.time}</span>
                </div>
                <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
              </div>
            ))
          ) : (
            <div className="action-item no-data">
              <div className="action-content">
                <h4>No current action items</h4>
                <span className="action-time">No recent alerts were found.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics at a Glance */}
      <div className="mla-section">
        <h2>📊 Key Metrics at a Glance</h2>
        <div className="briefing-metrics-grid">
          <div className="briefing-metric">
            <div className="metric-icon">😊</div>
            <div className="metric-text">
              <div className="metric-label">Citizen Satisfaction</div>
              <div className="metric-value">{metrics.citizenSatisfaction}/5 ⭐</div>
            </div>
          </div>
          <div className="briefing-metric">
            <div className="metric-icon">💚</div>
            <div className="metric-text">
              <div className="metric-label">Health Score</div>
              <div className="metric-value">{metrics.healthScore}%</div>
            </div>
          </div>
          <div className="briefing-metric">
            <div className="metric-icon">✅</div>
            <div className="metric-text">
              <div className="metric-label">Resolved This Month</div>
              <div className="metric-value">{metrics.resolvedThisMonth}</div>
            </div>
          </div>
          <div className="briefing-metric">
            <div className="metric-icon">👥</div>
            <div className="metric-text">
              <div className="metric-label">Team On Duty</div>
              <div className="metric-value">{metrics.teamOnDuty}</div>
            </div>
          </div>
          <div className="briefing-metric">
            <div className="metric-icon">📅</div>
            <div className="metric-text">
              <div className="metric-label">Events This Week</div>
              <div className="metric-value">{metrics.eventsThisWeek}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mla-section">
        <h2>Quick Navigation</h2>
        <div className="quick-nav-buttons">
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaHeatMap)}>📊 View Heat Map</button>
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaEmergencyCenter)}>🚨 Emergency Center</button>
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaCommunications)}>💬 Send Broadcast</button>
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaTeamPerformance)}>👥 Team Performance</button>
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaAIInsights)}>🤖 AI Insights</button>
          <button className="nav-btn" onClick={handleNavigate(ROUTES.mlaComplaintsDashboard)}>📋 All Complaints</button>
        </div>
      </div>

      {/* Daily Briefing Footer */}
      <div className="mla-section briefing-footer">
        <p>💡 Tip: Check the AI Insights page for predictive analytics and recommendations.</p>
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
