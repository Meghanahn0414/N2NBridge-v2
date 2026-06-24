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
      <PageHeader subtitle="Manage third-party service integrations and API credentials" />
      <div className="module-container">
      <div className="module-controls">
        <input type="text" placeholder="Search integrations..." />
        <button className="btn-primary">+ Add Integration</button>
      </div>

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
