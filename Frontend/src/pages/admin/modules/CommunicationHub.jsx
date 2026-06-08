import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';

export default function CommunicationHub() {
  const [messages, setMessages] = useState([]);
  const [activeChannel, setActiveChannel] = useState('SMS');
  const [showComposer, setShowComposer] = useState(false);

  const channels = ['SMS', 'WhatsApp', 'Email', 'Push Notifications'];

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>💬 Communication Hub</h1>
        <p>Send messages through multiple channels (SMS, WhatsApp, Email, Push)</p>
      </div>

      <div className="module-controls">
        <div className="channel-tabs">
          {channels.map(channel => (
            <button
              key={channel}
              className={`tab-btn ${activeChannel === channel ? 'active' : ''}`}
              onClick={() => setActiveChannel(channel)}
            >
              {channel}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={() => setShowComposer(true)}>
          ✉️ Compose Message
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Messages Sent</span>
          <span className="stat-value">0</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Delivery Rate</span>
          <span className="stat-value">0%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Read Rate</span>
          <span className="stat-value">0%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Click Rate</span>
          <span className="stat-value">0%</span>
        </div>
      </div>

      <div className="messages-list">
        <div className="empty-state">
          <p>📭 No messages yet. Click "Compose Message" to send one.</p>
        </div>
      </div>

      {showComposer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Compose {activeChannel} Message</h2>
            <form>
              <div className="form-group">
                <label>Recipients *</label>
                <select multiple>
                  <option>Select recipients...</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message Template</label>
                <select>
                  <option>Custom Message</option>
                  <option>Alert Template</option>
                  <option>Announcement Template</option>
                  <option>Reminder Template</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message Content *</label>
                <textarea required placeholder="Type your message..."></textarea>
              </div>
              <div className="form-group">
                <label>Schedule</label>
                <select>
                  <option>Send Now</option>
                  <option>Schedule Later</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowComposer(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
