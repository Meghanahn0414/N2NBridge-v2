import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/AIInsights.css';

export default function AIInsights() {
  const [recommendations] = useState([
    {
      id: 1,
      title: '',
      description: '',
      action: '',
      priority: '',
    },
    {
      id: 2,
      title: '',
      description: '',
      action: '',
      priority: '',
    },
    {
      id: 3,
      title: '',
      description: '',
      action: '',
      priority: '',
    },
  ]);

  const [riskScores] = useState([
    { category: '', score: '', color: '#ef4444' },
    { category: '', score: '', color: '#f59e0b' },
    { category: '', score: '', color: '#fbbf24' },
    { category: '', score: '', color: '#10b981' },
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>🤖 AI Insights & Predictions</h1>
        <p>AI-powered constituency intelligence and recommendations</p>
      </div>

      {/* AI Recommendations */}
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
              <button className="btn-primary">Take Action</button>
            </div>
          ))}
        </div>
      </div>

      {/* Constituency Risk Score */}
      <div className="mla-section">
        <h2>📊 Constituency Risk Score</h2>
        <div className="risk-scores-grid">
          {riskScores.map((risk, idx) => (
            <div key={idx} className="risk-card">
              <div className="risk-label">{risk.category}</div>
              <div className="risk-gauge">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx=""
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={risk.color}
                    strokeWidth="8"
                    strokeDasharray={`${(risk.score / 100) * 314} 314`}
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="70" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1f2937">
                    {risk.score}%
                  </text>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="mla-section">
        <h2>🔮 Predictive Analytics</h2>
        <div className="predictions-grid">
          <div className="prediction-card">
            <h4>Complaint Forecast</h4>
            <p className="forecast-value"></p>
            <p className="forecast-insight"></p>
            <button className="btn-secondary">View Forecast</button>
          </div>
          <div className="prediction-card">
            <h4>Event Participation</h4>
            <p className="forecast-value"></p>
            <p className="forecast-insight"></p>
            <button className="btn-secondary">View Forecast</button>
          </div>
          <div className="prediction-card">
            <h4>Citizen Sentiment</h4>
            <p className="forecast-value"></p>
            <p className="forecast-insight"></p>
            <button className="btn-secondary">View Forecast</button>
          </div>
        </div>
      </div>

      {/* Historical Insights */}
      <div className="mla-section">
        <h2>📈 Seasonal Insights</h2>
        <div className="insights-list">
          <div className="insight-item">
            <span className="insight-season">Monsoon Season (Jun-Sep):</span>
            <span className="insight-data">
              
            </span>
          </div>
          <div className="insight-item">
            <span className="insight-season">Summer (Apr-May):</span>
            <span className="insight-data">
              
            </span>
          </div>
          <div className="insight-item">
            <span className="insight-season">Winter (Dec-Feb):</span>
            <span className="insight-data">
              
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">View Detailed Analysis</button>
          <button className="btn-primary">Export AI Report</button>
          <button className="btn-primary">Schedule AI Review Meeting</button>
        </div>
      </div>
    </div>
  );
}
