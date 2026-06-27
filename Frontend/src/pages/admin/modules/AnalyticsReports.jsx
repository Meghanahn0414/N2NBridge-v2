import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/AnalyticsReports.css';
import PageHeader from "../../../components/PageHeader";
import { getGrievanceStats, getAlertStats, getEventStats, getDashboardMetrics } from '../../../features/analytics/analyticsService';
import { FaClipboardList, FaMap, FaChartLine, FaCheckCircle, FaExclamationCircle, FaClock, FaChartBar, FaExclamationTriangle, FaUsers, FaEnvelope, FaEye, FaComments, FaBullhorn, FaDownload, FaRobot, FaSmile, FaMeh, FaFrown, FaStar, FaCalendarAlt } from 'react-icons/fa';

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
    { name: 'Category-wise Complaints', icon: <FaClipboardList /> },
    { name: 'Ward-wise Complaints', icon: <FaMap /> },
    { name: 'Monthly Trend', icon: <FaChartLine /> },
    { name: 'Resolution Trend', icon: <FaCheckCircle /> },
  ];

  const alertMetrics = [
    { name: 'Alert Types Distribution', icon: <FaExclamationCircle /> },
    { name: 'Alert Resolution Time', icon: <FaClock /> },
    { name: 'Alert Frequency', icon: <FaChartBar /> },
    { name: 'Severity Breakdown', icon: <FaExclamationTriangle /> },
  ];

  const eventMetrics = [
    { name: 'Event Attendance', icon: <FaUsers /> },
    { name: 'Participation Rate', icon: <FaChartBar /> },
    { name: 'Feedback Rating', icon: <FaStar /> },
    { name: 'Event Timeline', icon: <FaCalendarAlt /> },
  ];

  const communicationMetrics = [
    { name: 'Delivery Rate', icon: <FaEnvelope /> },
    { name: 'Read Rate', icon: <FaEye /> },
    { name: 'Engagement Rate', icon: <FaComments /> },
    { name: 'Channel Performance', icon: <FaBullhorn /> },
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
      <PageHeader subtitle="Generate and view detailed platform analytics and reports">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="COMPLAINTS">Complaint Analytics</option>
          <option value="ALERTS">Alert Analytics</option>
          <option value="EVENTS">Event Analytics</option>
          <option value="COMMUNICATION">Communication Analytics</option>
        </select>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="WEEK">Last Week</option>
          <option value="MONTH">Last Month</option>
          <option value="QUARTER">Last Quarter</option>
          <option value="YEAR">Last Year</option>
          <option value="CUSTOM">Custom Range</option>
        </select>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          <FaDownload /> Download Report
        </button>
      </PageHeader>
      <div className="module-container">

      {/* Summary Stats */}
      <div className="module-stats">
        {[
          { label: "Total Records",    value: stats?.total || 0,                                              icon: "📋", bg: "#EEF2FF" },
          { label: "Trend",            value: stats?.trend ? `${stats.trend}%` : 'N/A',                      icon: "📈", bg: "#F0FDF4" },
          { label: "Categories",       value: stats?.byCategory ? Object.keys(stats.byCategory).length : 0,  icon: "🏷️", bg: "#FFF7ED" },
          { label: "Status Breakdown", value: stats?.byStatus ? Object.keys(stats.byStatus).length : 0,      icon: "📊", bg: "#F5F3FF" },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
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
          <h3><FaRobot style={{marginRight:6,verticalAlign:'middle'}} /> AI Complaint Categorization</h3>
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
              <div className="sentiment-icon"><FaSmile /></div>
              <div className="sentiment-label">Positive</div>
              <div className="sentiment-value">0</div>
            </div>
            <div className="sentiment-card neutral">
              <div className="sentiment-icon"><FaMeh /></div>
              <div className="sentiment-label">Neutral</div>
              <div className="sentiment-value">0</div>
            </div>
            <div className="sentiment-card negative">
              <div className="sentiment-icon"><FaFrown /></div>
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
