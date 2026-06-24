import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/AIInsights.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';

const formatNumber = (value) => {
  if (value == null || value === '') return '-';
  return typeof value === 'number' ? value.toLocaleString() : value;
};

export default function AIInsights() {
  const navigate = useNavigate();
  const { dashboard } = useMlaDashboard();

  const handleTakeAction = () => navigate(ROUTES.mlaCommunications);
  const handleViewComplaintForecast = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleViewEventForecast = () => navigate(ROUTES.mlaEvents);
  const handleViewSentimentForecast = () => navigate(ROUTES.mlaCitizenSentiment);
  const handleViewDetailedAnalysis = () => navigate(ROUTES.mlaConstituencyStatus);
  const handleExportReport = () => window.alert('Exporting AI insights report...');
  const handleScheduleReview = () => navigate(ROUTES.mlaEvents);

  const alertsTrend = dashboard?.metrics?.alerts?.trend || 0;
  const grievancesTrend = dashboard?.metrics?.grievances?.trend || 0;
  const eventTrend = dashboard?.metrics?.events?.trend || 0;
  const totalEvents = dashboard?.metrics?.events?.totalEvents || 0;

  const getRecommendations = () => {
    const items = [];

    if (dashboard?.metrics?.alerts) {
      items.push({
        id: 'alerts',
        title: alertsTrend >= 0
          ? `Alert Volume Up ${alertsTrend}%`
          : `Alert Volume Down ${Math.abs(alertsTrend)}%`,
        description: "Prioritize response in high-alert wards",
        action: "Coordinate with response teams",
        priority: alertsTrend >= 10 ? 'high' : 'medium',
      });
    }

    if (dashboard?.metrics?.grievances) {
      items.push({
        id: 'grievances',
        title: `Complaint Trend: ${grievancesTrend}%`,
        description: "Review service delivery in affected areas",
        action: "Initiate citizen outreach campaigns",
        priority: Math.abs(grievancesTrend) > 5 ? 'medium' : 'low',
      });
    }

    if (dashboard?.metrics?.events) {
      items.push({
        id: 'events',
        title: totalEvents > 0 ? `Managing ${totalEvents} Active Events` : "No Active Events Data",
        description: "Use event participation to boost engagement",
        action: "Review event performance metrics",
        priority: totalEvents > 0 ? 'low' : 'medium',
      });
    }

    if (!items.length) {
      items.push({
        id: 'none',
        title: "No Insights Yet",
        description: "Dashboard data is loading or unavailable",
        action: "Check back after data sync",
        priority: 'low',
      });
    }

    return items;
  };

  const recommendations = getRecommendations();

  const riskScores = [
    { category: "Alert Analytics",      score: Math.min(100, (dashboard?.summary?.criticalAlerts || 0) * 5),  color: '#ef4444' },
    { category: "Complaint Analytics",  score: Math.min(100, (dashboard?.summary?.openComplaints || 0) * 2), color: '#f59e0b' },
    { category: "Citizen Satisfaction", score: Math.min(100, (dashboard?.summary?.citizenSatisfaction || 0) * 20), color: '#10b981' },
    { category: "Health Score",         score: parseFloat(dashboard?.summary?.healthScore) || 0, color: '#3b82f6' },
  ];

  const sentimentInsight = dashboard?.summary?.citizenSatisfaction
    ? (dashboard.summary.citizenSatisfaction >= 3 ? "Positive sentiment trend" : "Neutral sentiment trend")
    : "No sentiment data available";

  return (
    <div>
      <PageHeader subtitle="AI-powered insights and recommendations" />
      <div className="mla-container">

      <div className="mla-section">
        <h2>⭐ AI Recommendations</h2>
        <div className="recommendations-list">
          {recommendations.map(rec => (
            <div key={rec.id} className={`recommendation-card ${rec.priority}`}>
              <div className="rec-header">
                <h3>{rec.title}</h3>
                <span className={`priority-label ${rec.priority}`}>{rec.priority.toUpperCase()}</span>
              </div>
              <p className="rec-description">{rec.description}</p>
              <div className="rec-action">
                <span className="action-label">Recommended Action:</span>
                <span className="action-text">{rec.action}</span>
              </div>
              <button type="button" className="btn-primary" onClick={handleTakeAction}>Take Action</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mla-section">
        <h2>📊 Constituency Risk Score</h2>
        <div className="risk-scores-grid">
          {riskScores.map((risk, idx) => (
            <div key={idx} className="risk-card">
              <div className="risk-label">{risk.category}</div>
              <div className="risk-gauge">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={risk.color} strokeWidth="8"
                    strokeDasharray={`${(risk.score / 100) * 314} 314`} transform="rotate(-90 60 60)" />
                  <text x="60" y="70" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937">
                    {risk.score}%
                  </text>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mla-section">
        <h2>🔮 Predictive Analytics</h2>
        <div className="predictions-grid">
          <div className="prediction-card">
            <h4>Complaint Forecast</h4>
            <p className="forecast-value">{grievancesTrend >= 0 ? `+${grievancesTrend}%` : `${grievancesTrend}%`}</p>
            <p className="forecast-insight">{grievancesTrend >= 0 ? "Complaints are increasing" : "Complaints are decreasing"}</p>
            <button type="button" className="btn-secondary" onClick={handleViewComplaintForecast}>View Forecast</button>
          </div>
          <div className="prediction-card">
            <h4>Event Participation</h4>
            <p className="forecast-value">{eventTrend >= 0 ? `+${eventTrend}%` : `${eventTrend}%`}</p>
            <p className="forecast-insight">{eventTrend >= 0 ? "Attendance trending up" : "Attendance showing a dip"}</p>
            <button type="button" className="btn-secondary" onClick={handleViewEventForecast}>View Forecast</button>
          </div>
          <div className="prediction-card">
            <h4>Citizen Sentiment</h4>
            <p className="forecast-value">{dashboard?.summary?.citizenSatisfaction ?? 'N/A'}/5</p>
            <p className="forecast-insight">{sentimentInsight}</p>
            <button type="button" className="btn-secondary" onClick={handleViewSentimentForecast}>View Forecast</button>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleViewDetailedAnalysis}>View Detailed Analysis</button>
          <button type="button" className="btn-primary" onClick={handleExportReport}>Export AI Report</button>
          <button type="button" className="btn-primary" onClick={handleScheduleReview}>Schedule AI Review</button>
        </div>
      </div>
    </div>
  </div>
  );
}
