import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import { fetchNotifications } from '../../../features/communications/communicationService';

export default function CommunicationHub() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChannel, setActiveChannel] = useState('SMS');
  const [showComposer, setShowComposer] = useState(false);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, read: 0, clicked: 0 });

  const channels = ['SMS', 'WhatsApp', 'Email', 'Push Notifications'];

  useEffect(() => {
    loadMessages();
  }, [activeChannel]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifications(1, 1000);
      const filtered = data.filter(m => m.channel === activeChannel || !m.channel);
      setMessages(filtered);
      updateStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (messageList) => {
    setStats({
      sent: messageList.length,
      delivered: messageList.filter(m => m.status === 'DELIVERED').length,
      read: messageList.filter(m => m.status === 'READ').length,
      clicked: messageList.filter(m => m.clicked).length
    });
  };

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
          <span className="stat-value">{stats.sent}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Delivery Rate</span>
          <span className="stat-value">{stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Read Rate</span>
          <span className="stat-value">{stats.sent > 0 ? Math.round((stats.read / stats.sent) * 100) : 0}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Click Rate</span>
          <span className="stat-value">{stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0}%</span>
        </div>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="loading-state">Loading messages...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>📭 No messages yet. Click "Compose Message" to send one.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Channel</th>
                <th>Message</th>
                <th>Status</th>
                <th>Sent Date</th>
                <th>Read</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg._id || msg.id}>
                  <td>{msg.recipient || 'System'}</td>
                  <td>{msg.channel || activeChannel}</td>
                  <td>{msg.content?.substring(0, 50) || msg.message}</td>
                  <td><span className="status-badge">{msg.status}</span></td>
                  <td>{msg.sentDate ? new Date(msg.sentDate).toLocaleDateString() : '-'}</td>
                  <td>{msg.read ? '✓' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
