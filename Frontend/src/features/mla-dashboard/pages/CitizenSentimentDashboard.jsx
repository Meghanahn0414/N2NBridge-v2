import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/CitizenSentimentDashboard.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function CitizenSentimentDashboard() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();

  const handleViewDetailedReport = () => navigate(ROUTES.mlaAIInsights);
  const handleExportSentimentData = () => window.alert('Exporting sentiment data...');
  const handleViewNegativeFeedback = () => navigate(ROUTES.mlaComplaintsDashboard);
  const sentimentDistribution = dashboard?.metrics?.sentimentDistribution || {};
  const positivePct = sentimentDistribution.positivePct ?? 0;
  const neutralPct = sentimentDistribution.neutralPct ?? 0;
  const negativePct = sentimentDistribution.negativePct ?? 0;
  const sentimentData = {
    positive: positivePct,
    neutral: neutralPct,
    negative: negativePct,
  };
  const concerns = Object.entries(dashboard?.metrics?.grievances?.byCategory || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);
  const keywords = concerns.length ? concerns : [];
  const topCategories = Object.entries(dashboard?.metrics?.grievances?.byCategory || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  const sentimentLabel = positivePct >= neutralPct && positivePct >= negativePct
    ? 'Positive'
    : neutralPct >= positivePct && neutralPct >= negativePct
      ? 'Neutral'
      : 'Negative';

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>😊 Citizen Sentiment Dashboard</h1>
        <p>AI-powered citizen feedback analysis</p>
      </div>

      {/* Sentiment Meter */}
      <div className="mla-section">
        <h2>Overall Sentiment</h2>
        <div className="sentiment-container">
          <div className="sentiment-gauge">
            <svg width="300" height="160" viewBox="0 0 300 160">
              {/* Gauge background */}
              <path d="M 30 130 A 100 100 0 0 1 270 130" fill="none" stroke="#e5e7eb" strokeWidth="20" />
              
              {/* Positive section (Green) */}
              <path
                d="M 30 130 A 100 100 0 0 1 119 23"
                fill="none"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray={`${(positivePct / 100) * 314} 314`}
              />
              {/* Neutral section (Yellow) */}
              <path
                d="M 119 23 A 100 100 0 0 1 212 70"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${(neutralPct / 100) * 314} 314`}
              />
              {/* Negative section (Red) */}
              <path
                d="M 212 70 A 100 100 0 0 1 270 130"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeDasharray={`${(negativePct / 100) * 314} 314`}
              />
              
              {/* Center text */}
              <text x="150" y="140" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#1f2937">
                Overall: {sentimentLabel}
              </text>
            </svg>
          </div>

          <div className="sentiment-breakdown">
            <div className="sentiment-item positive">
              <div className="sentiment-icon">😊</div>
              <div className="sentiment-percent">{sentimentData.positive}%</div>
              <div className="sentiment-label">Positive</div>
            </div>
            <div className="sentiment-item neutral">
              <div className="sentiment-icon">😐</div>
              <div className="sentiment-percent">{sentimentData.neutral}%</div>
              <div className="sentiment-label">Neutral</div>
            </div>
            <div className="sentiment-item negative">
              <div className="sentiment-icon">😞</div>
              <div className="sentiment-percent">{sentimentData.negative}%</div>
              <div className="sentiment-label">Negative</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Concerns */}
      <div className="mla-section">
        <h2>🎯 Top Citizen Concerns</h2>
        <div className="concerns-grid">
          {concerns.map((concern, idx) => (
            <div key={idx} className="concern-card">
              <div className="concern-rank">#{idx + 1}</div>
              <div className="concern-name">{concern}</div>
              <div className="concern-indicator" style={{ width: `${100 - idx * 15}%` }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Keywords */}
      <div className="mla-section">
        <h2>🔥 Trending Keywords</h2>
        <div className="keywords-cloud">
          {keywords.length ? (
            keywords.map((keyword, idx) => (
              <span key={idx} className="keyword-tag" style={{ fontSize: `${12 + idx * 2}px` }}>
                {keyword}
              </span>
            ))
          ) : (
            <div className="no-data-text">No trending keywords available</div>
          )}
        </div>
      </div>

      {/* Sentiment Trend Chart */}
      <div className="mla-section">
        <h2>Sentiment Trend (Last 30 Days)</h2>
        <div className="trend-chart-placeholder">
          <p>📈 Line Chart: Sentiment Over Time</p>
        </div>
      </div>

      {/* Feedback by Category */}
      <div className="mla-section">
        <h2>Feedback by Category</h2>
        <div className="feedback-categories">
          {topCategories.length ? (
            topCategories.map(([category, count], idx) => (
              <div key={category} className="feedback-item">
                <span className="category-name">{category}</span>
                <span className={`sentiment-badge ${idx === 0 ? 'positive' : idx === 1 ? 'neutral' : 'negative'}`}></span>
                <span className="category-count">{count} complaints</span>
              </div>
            ))
          ) : (
            <div className="feedback-item">
              <span className="category-name">No category feedback available</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleViewDetailedReport}>View Detailed Report</button>
          <button type="button" className="btn-primary" onClick={handleExportSentimentData}>Export Sentiment Data</button>
          <button type="button" className="btn-primary" onClick={handleViewNegativeFeedback}>View Negative Feedback</button>
        </div>
      </div>
    </div>
  );
}
