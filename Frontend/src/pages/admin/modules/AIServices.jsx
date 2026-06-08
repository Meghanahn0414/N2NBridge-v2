import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function AIServices() {
  const [aiMetrics, setAiMetrics] = useState({});

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>🤖 AI Services Administration</h1>
        <p>Manage AI-powered features (categorization, sentiment analysis, chatbot)</p>
      </div>

      <div className="module-controls">
        <button className="btn-primary">⚙️ Configure AI Services</button>
        <button className="btn-secondary">🧪 Test Model</button>
      </div>

      <div className="ai-services">
        <div className="service-card">
          <h3>🏷️ Complaint Categorization</h3>
          <div className="metric">
            <span>Auto-Categorized:</span>
            <span className="value">0</span>
          </div>
          <div className="metric">
            <span>Manual Override %:</span>
            <span className="value">0%</span>
          </div>
          <div className="metric">
            <span>Model Accuracy:</span>
            <span className="value">0%</span>
          </div>
          <button>View Training Data</button>
        </div>

        <div className="service-card">
          <h3>😊 Sentiment Analysis</h3>
          <div className="metric">
            <span>Positive:</span>
            <span className="value">0%</span>
          </div>
          <div className="metric">
            <span>Neutral:</span>
            <span className="value">0%</span>
          </div>
          <div className="metric">
            <span>Negative:</span>
            <span className="value">0%</span>
          </div>
          <button>View Sentiment Trends</button>
        </div>

        <div className="service-card">
          <h3>💬 AI Chat Assistant</h3>
          <div className="metric">
            <span>Total Queries:</span>
            <span className="value">0</span>
          </div>
          <div className="metric">
            <span>Success Rate:</span>
            <span className="value">0%</span>
          </div>
          <div className="metric">
            <span>Escalations:</span>
            <span className="value">0</span>
          </div>
          <button>View Interaction Logs</button>
        </div>

        <div className="service-card">
          <h3>🔍 Anomaly Detection</h3>
          <div className="metric">
            <span>Anomalies Detected:</span>
            <span className="value">0</span>
          </div>
          <div className="metric">
            <span>False Positives:</span>
            <span className="value">0%</span>
          </div>
          <div className="metric">
            <span>Detection Accuracy:</span>
            <span className="value">0%</span>
          </div>
          <button>View Anomaly Log</button>
        </div>
      </div>

      <div className="ai-config">
        <h3>AI Model Configuration</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Model Version</th>
              <th>Status</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Categorization</td>
              <td>v2.1</td>
              <td className="status-active">Active</td>
              <td>2 days ago</td>
              <td><button>Update</button></td>
            </tr>
            <tr>
              <td>Sentiment</td>
              <td>v1.5</td>
              <td className="status-active">Active</td>
              <td>5 days ago</td>
              <td><button>Update</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
