import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";

export default function AIServices() {
  const [aiMetrics, setAiMetrics] = useState({});

  return (
    <div>
      <PageHeader subtitle="Manage AI-powered features and automation">
        <button style={{ padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          ⚙️ Configure AI Services
        </button>
        <button style={{ padding: "9px 18px", borderRadius: 10, background: "#F8F9FC", color: "#16233C", border: "1px solid #EAEDF4", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          🧪 Test Model
        </button>
      </PageHeader>
      <div className="module-container">

      <div className="ai-services">
        <div className="service-card">
          <h3>🏷️ Complaint Categorization</h3>
          <div className="metric">
            <span>Auto-Categorized:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Manual Override %:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Model Accuracy:</span>
            <span className="value"></span>
          </div>
          <button>View Training Data</button>
        </div>

        <div className="service-card">
          <h3>😊 Sentiment Analysis</h3>
          <div className="metric">
            <span>Positive:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Neutral:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Negative:</span>
            <span className="value"></span>
          </div>
          <button>View Sentiment Trends</button>
        </div>

        <div className="service-card">
          <h3>💬 AI Chat Assistant</h3>
          <div className="metric">
            <span>Total Queries:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Success Rate:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Escalations:</span>
            <span className="value"></span>
          </div>
          <button>View Interaction Logs</button>
        </div>

        <div className="service-card">
          <h3>🔍 Anomaly Detection</h3>
          <div className="metric">
            <span>Anomalies Detected:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>False Positives:</span>
            <span className="value"></span>
          </div>
          <div className="metric">
            <span>Detection Accuracy:</span>
            <span className="value"></span>
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
              <td></td>
              <td className="status-active"></td>
              <td></td>
              <td><button>Update</button></td>
            </tr>
            <tr>
              <td>Sentiment</td>
              <td></td>
              <td className="status-active"></td>
              <td></td>
              <td><button>Update</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
