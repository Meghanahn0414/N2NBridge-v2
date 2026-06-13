import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/AnalyticsReports.css';
import PageHeader from "../../../components/PageHeader";
import { getGrievanceStats, getAlertStats, getEventStats, getDashboardMetrics } from '../../../features/analytics/analyticsService';

export default function AnalyticsReports() {
  const [reportType, setReportType] = useState('COMPLAINTS');
  const [dateRange, setDateRange] = useState('MONTH');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadAnalytics();
  }, [reportType]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = {};
      
      switch(reportType) {
        case 'COMPLAINTS':
          data = await getGrievanceStats();
          break;
        case 'ALERTS':
          data = await getAlertStats();
          break;
        case 'EVENTS':
          data = await getEventStats();
          break;
        default:
          data = await getDashboardMetrics();
      }
      
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const complaintMetrics = [
    { name: 'Category-wise Complaints', icon: '📋' },
    { name: 'Ward-wise Complaints', icon: '🗺️' },
    { name: 'Monthly Trend', icon: '📈' },
    { name: 'Resolution Trend', icon: '✅' },
  ];

  const alertMetrics = [
    { name: 'Alert Types Distribution', icon: '🚨' },
    { name: 'Alert Resolution Time', icon: '⏱️' },
    { name: 'Alert Frequency', icon: '📊' },
    { name: 'Severity Breakdown', icon: '⚠️' },
  ];

  const eventMetrics = [
    { name: 'Event Attendance', icon: '👥' },
    { name: 'Participation Rate', icon: '📊' },
    { name: 'Feedback Rating', icon: '⭐' },
    { name: 'Event Timeline', icon: '📅' },
  ];

  const communicationMetrics = [
    { name: 'Delivery Rate', icon: '📬' },
    { name: 'Read Rate', icon: '👁️' },
    { name: 'Engagement Rate', icon: '💬' },
    { name: 'Channel Performance', icon: '📢' },
  ];

  const getMetricsForType = (type) => {
    const metricsMap = {
      COMPLAINTS: complaintMetrics,
      ALERTS: alertMetrics,
      EVENTS: eventMetrics,
      COMMUNICATION: communicationMetrics,
    };
    return metricsMap[type] || [];
  };

  const metrics = getMetricsForType(reportType);

  return (
    <div>
      <PageHeader subtitle="Generate and view detailed platform analytics and reports" />
      <div className="module-container">
      <div className="module-controls">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="COMPLAINTS">Complaint Analytics</option>
          <option value="ALERTS">Alert Analytics</option>
          <option value="EVENTS">Event Analytics</option>
          <option value="COMMUNICATION">Communication Analytics</option>
        </select>

        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="WEEK">Last Week</option>
          <option value="MONTH">Last Month</option>
          <option value="QUARTER">Last Quarter</option>
          <option value="YEAR">Last Year</option>
          <option value="CUSTOM">Custom Range</option>
        </select>

        <button className="btn-primary">📥 Download Report</button>
      </div>

      {/* Summary Stats */}
      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Records</span>
          <span className="stat-value">{stats?.total || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Trend</span>
          <span className="stat-value">{stats?.trend ? `${stats.trend}%` : 'N/A'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{stats?.byCategory ? Object.keys(stats.byCategory).length : 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Status Breakdown</span>
          <span className="stat-value">{stats?.byStatus ? Object.keys(stats.byStatus).length : 0}</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="chart-card">
            <div className="chart-header">
              <h3>{metric.icon} {metric.name}</h3>
            </div>
            <div className="chart-placeholder">
              <div className="placeholder-icon">{metric.icon}</div>
              <p>Chart data will load here</p>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats Table */}
      <div className="detailed-stats" style={{ marginTop: '32px' }}>
        <h3>Detailed Breakdown</h3>
        {loading ? (
          <div className="loading-state">Loading analytics...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportType === 'COMPLAINTS' && stats?.byCategory ? (
                Object.entries(stats.byCategory).map(([category, count]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{count}</td>
                    <td>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))
              ) : reportType === 'ALERTS' && stats?.byPriority ? (
                Object.entries(stats.byPriority).map(([priority, count]) => (
                  <tr key={priority}>
                    <td>{priority}</td>
                    <td>{count}</td>
                    <td>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))
              ) : reportType === 'EVENTS' && stats?.byStatus ? (
                Object.entries(stats.byStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td>{status}</td>
                    <td>{count}</td>
                    <td>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))
              ) : reportType === 'COMMUNICATION' && stats?.byChannel ? (
                Object.entries(stats.byChannel).map(([channel, count]) => (
                  <tr key={channel}>
                    <td>{channel}</td>
                    <td>{count}</td>
                    <td>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="no-data">
                    No data available for {reportType}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Analytics Section */}
      {reportType === 'COMPLAINTS' && (
        <div className="ai-analytics" style={{ marginTop: '32px' }}>
          <h3>🤖 AI Complaint Categorization</h3>
          <div className="ai-metrics">
            <div className="ai-metric-card">
              <div className="metric-label">Auto-Categorized</div>
              <div className="metric-value"></div>
            </div>
            <div className="ai-metric-card">
              <div className="metric-label">Manual Override %</div>
              <div className="metric-value"></div>
            </div>
            <div className="ai-metric-card">
              <div className="metric-label">Accuracy %</div>
              <div className="metric-value"></div>
            </div>
          </div>

          <h4 style={{ marginTop: '20px' }}>Sentiment Analysis</h4>
          <div className="sentiment-grid">
            <div className="sentiment-card positive">
              <div className="sentiment-icon">😊</div>
              <div className="sentiment-label">Positive</div>
              <div className="sentiment-value">0</div>
            </div>
            <div className="sentiment-card neutral">
              <div className="sentiment-icon">😐</div>
              <div className="sentiment-label">Neutral</div>
              <div className="sentiment-value">0</div>
            </div>
            <div className="sentiment-card negative">
              <div className="sentiment-icon">😞</div>
              <div className="sentiment-label">Negative</div>
              <div className="sentiment-value">0</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
