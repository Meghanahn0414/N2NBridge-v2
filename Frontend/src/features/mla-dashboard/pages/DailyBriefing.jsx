import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/DailyBriefing.css';

export default function DailyBriefing() {
  const [briefing] = useState({
    greeting: 'Good Morning MLA',
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    newComplaints: 145,
    resolved: 82,
    criticalAlerts: 2,
    events: 1,
    pendingEscalations: 18,
    topConcern: 'Water Supply in Ward 12',
    recommendedAction: 'Schedule review meeting with engineering department',
  });

  const [actionItems] = useState([
    { id: 1, title: 'Review escalated complaints from Ward 12', priority: 'critical', time: 'Now' },
    { id: 2, title: 'Approve pending housing scheme applications', priority: 'high', time: '10:00 AM' },
    { id: 3, title: 'Attend public health camp at Ward 5', priority: 'medium', time: '2:00 PM' },
    { id: 4, title: 'Conference call with team managers', priority: 'medium', time: '4:00 PM' },
  ]);

  const [metrics] = useState({
    citizenSatisfaction: 4.6,
    healthScore: 82,
    resolvedThisMonth: 8124,
    activeAlerts: 12,
    teamOnDuty: 245,
    eventsThisWeek: 8,
  });

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
          <button className="btn-danger">Take Action</button>
        </div>
      </div>

      {/* Action Items / To-Do List */}
      <div className="mla-section">
        <h2>📋 Your Action Items Today</h2>
        <div className="action-items-list">
          {actionItems.map(item => (
            <div key={item.id} className={`action-item ${item.priority}`}>
              <input type="checkbox" />
              <div className="action-content">
                <h4>{item.title}</h4>
                <span className="action-time">🕐 {item.time}</span>
              </div>
              <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
            </div>
          ))}
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
          <button className="nav-btn">📊 View Heat Map</button>
          <button className="nav-btn">🚨 Emergency Center</button>
          <button className="nav-btn">💬 Send Broadcast</button>
          <button className="nav-btn">👥 Team Performance</button>
          <button className="nav-btn">🤖 AI Insights</button>
          <button className="nav-btn">📋 All Complaints</button>
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
