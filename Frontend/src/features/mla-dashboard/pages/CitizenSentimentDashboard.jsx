import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/CitizenSentimentDashboard.css';

export default function CitizenSentimentDashboard() {
  const [sentimentData] = useState({
    positive: 72,
    neutral: 18,
    negative: 10,
  });

  const [concerns] = useState([
    'Roads',
    'Water Supply',
    'Drainage',
    'Employment',
    'Healthcare',
  ]);

  const [keywords] = useState([
    'Water Supply',
    'Pension',
    'Road Repair',
    'Street Lights',
    'Hospital',
    'School',
    'Electricity',
    'Drainage',
  ]);

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
                strokeDasharray={`${(72 / 100) * 314} 314`}
              />
              {/* Neutral section (Yellow) */}
              <path
                d="M 119 23 A 100 100 0 0 1 212 70"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray={`${(18 / 100) * 314} 314`}
              />
              {/* Negative section (Red) */}
              <path
                d="M 212 70 A 100 100 0 0 1 270 130"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
              />
              
              {/* Center text */}
              <text x="150" y="140" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#1f2937">
                Overall: Positive
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
          {keywords.map((keyword, idx) => (
            <span key={idx} className="keyword-tag" style={{ fontSize: `${12 + idx * 2}px` }}>
              {keyword}
            </span>
          ))}
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
          <div className="feedback-item">
            <span className="category-name">Services</span>
            <span className="sentiment-badge positive">72% Positive</span>
          </div>
          <div className="feedback-item">
            <span className="category-name">Officials</span>
            <span className="sentiment-badge neutral">58% Positive</span>
          </div>
          <div className="feedback-item">
            <span className="category-name">Infrastructure</span>
            <span className="sentiment-badge negative">38% Positive</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mla-section">
        <div className="detail-buttons">
          <button className="btn-primary">View Detailed Report</button>
          <button className="btn-primary">Export Sentiment Data</button>
          <button className="btn-primary">View Negative Feedback</button>
        </div>
      </div>
    </div>
  );
}
