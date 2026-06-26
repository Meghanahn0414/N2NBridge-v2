import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/Integrations.css';
import PageHeader from "../../../components/PageHeader";
import { FaCheck, FaExclamationTriangle, FaCog, FaFlask, FaClipboardList } from 'react-icons/fa';

export default function Integrations() {
  const [integrations, setIntegrations] = useState([
    { name: '', status: '', lastSync: '' },
    { name: '', status: '', lastSync: '' },
    { name: '', status: '', lastSync: '' },
    { name: '', status: '', lastSync: 'N/A' },
    { name: '', status: '', lastSync: 'N/A' },
    { name: '', status: '', lastSync: '' },
  ]);

  const [showConfig, setShowConfig] = useState(null);

  return (
    <div>
      <PageHeader subtitle="Manage third-party service integrations and API credentials">
        <input type="text" placeholder="Search integrations..."
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", outline: "none" }} />
        <button style={{ padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          + Add Integration
        </button>
      </PageHeader>
      <div className="module-container">

      <div className="integrations-grid">
        {integrations.map((integration, idx) => (
          <div key={idx} className="integration-card">
            <div className={`status-badge ${integration.status}`}>
              {integration.status === 'connected' ? <FaCheck /> : <FaExclamationTriangle />}
            </div>
            <h3>{integration.name}</h3>
            <p className={`status-text ${integration.status}`}>
              {integration.status === 'connected' ? 'Connected' : 'Not Configured'}
            </p>
            <p className="sync-time">Last Sync: {integration.lastSync}</p>
            <div className="card-actions">
              <button className="btn-secondary" onClick={() => setShowConfig(integration.name)}>
                <FaCog style={{marginRight:4,verticalAlign:'middle'}} /> Configure
              </button>
              <button className="btn-secondary"><FaFlask style={{marginRight:4,verticalAlign:'middle'}} /> Test</button>
              <button className="btn-secondary"><FaClipboardList style={{marginRight:4,verticalAlign:'middle'}} /> Logs</button>
            </div>
          </div>
        ))}
      </div>

      {showConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Configure {showConfig}</h2>
            <form>
              <div className="form-group">
                <label>API Key *</label>
                <input type="password" placeholder="Enter API key" />
              </div>
              <div className="form-group">
                <label>API Secret *</label>
                <input type="password" placeholder="Enter API secret" />
              </div>
              <div className="form-group">
                <label>Webhook URL</label>
                <input type="url" placeholder="Enter webhook URL" />
              </div>
              <div className="form-group">
                <label>Enabled</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowConfig(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
