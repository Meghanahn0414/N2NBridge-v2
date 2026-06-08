import React, { useState, useEffect } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/ExecutiveDashboard.css';

export default function ExecutiveDashboard() {
  const [kpis, setKpis] = useState({
    totalCitizens: 125000,
    openComplaints: 3245,
    resolvedThisMonth: 8124,
    criticalAlerts: 12,
    upcomingEvents: 8,
    citizenSatisfaction: 4.6,
    healthScore: 82,
    activeOfficers: 245,
  });

  const [attentionNeeded, setAttentionNeeded] = useState([
    { id: 1, icon: '⚠️', title: 'Water Crisis', ward: 'Ward 14', priority: 'critical' },
    { id: 2, icon: '⚠️', title: 'Flood Alert', ward: 'Ward 8', priority: 'critical' },
    { id: 3, icon: '⚠️', title: 'Road Issue', ward: 'Ward 22', priority: 'high' },
    { id: 4, icon: '⚠️', title: '35 Complaints Escalated', ward: '', priority: 'high' },
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>🏛️ Executive Dashboard</h1>
        <p>Your constituency command center</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="mla-kpi-grid">
        <div className="mla-kpi-card">
          <div className="kpi-label">Total Citizens</div>
          <div className="kpi-value">{kpis.totalCitizens.toLocaleString()}</div>
          <div className="kpi-change">+2.5% this month</div>
        </div>

        <div className="mla-kpi-card alert">
          <div className="kpi-label">Open Complaints</div>
          <div className="kpi-value">{kpis.openComplaints}</div>
          <div className="kpi-change">-12% from last week</div>
        </div>

        <div className="mla-kpi-card success">
          <div className="kpi-label">Resolved This Month</div>
          <div className="kpi-value">{kpis.resolvedThisMonth}</div>
          <div className="kpi-change">+18% this month</div>
        </div>

        <div className="mla-kpi-card danger">
          <div className="kpi-label">Critical Alerts</div>
          <div className="kpi-value">{kpis.criticalAlerts}</div>
          <div className="kpi-change">Needs attention</div>
        </div>

        <div className="mla-kpi-card">
          <div className="kpi-label">Upcoming Events</div>
          <div className="kpi-value">{kpis.upcomingEvents}</div>
          <div className="kpi-change">This week</div>
        </div>

        <div className="mla-kpi-card success">
          <div className="kpi-label">Citizen Satisfaction</div>
          <div className="kpi-value">{kpis.citizenSatisfaction}/5 ⭐</div>
          <div className="kpi-change">+0.3 this month</div>
        </div>

        <div className="mla-kpi-card success">
          <div className="kpi-label">Health Score</div>
          <div className="kpi-value">{kpis.healthScore}%</div>
          <div className="kpi-change">+5% from last month</div>
        </div>

        <div className="mla-kpi-card">
          <div className="kpi-label">Active Officers</div>
          <div className="kpi-value">{kpis.activeOfficers}</div>
          <div className="kpi-change">All on duty</div>
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
                  <div className="metric-progress" style={{ width: '78%' }}></div>
                </div>
                <span className="metric-value">78%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Citizen Satisfaction</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: '92%' }}></div>
                </div>
                <span className="metric-value">92%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Alert Response Time</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: '85%' }}></div>
                </div>
                <span className="metric-value">85%</span>
              </div>
              <div className="metric">
                <span className="metric-name">Event Participation</span>
                <div className="metric-bar">
                  <div className="metric-progress" style={{ width: '72%' }}></div>
                </div>
                <span className="metric-value">72%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attention Needed */}
      <div className="mla-section">
        <h2>⚠️ Today's Attention Needed</h2>
        <div className="attention-grid">
          {attentionNeeded.map(item => (
            <div
              key={item.id}
              className={`attention-card ${item.priority}`}
              onClick={() => console.log('Navigate to details')}
            >
              <div className="attention-icon">{item.icon}</div>
              <div className="attention-content">
                <h4>{item.title}</h4>
                {item.ward && <p>{item.ward}</p>}
              </div>
              <div className="attention-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-btn">📊 View Heat Map</button>
          <button className="action-btn">📢 Send Broadcast</button>
          <button className="action-btn">📅 Schedule Event</button>
          <button className="action-btn">👥 Check Team Status</button>
          <button className="action-btn">📋 View Daily Briefing</button>
          <button className="action-btn">🤖 AI Insights</button>
        </div>
      </div>
    </div>
  );
}
