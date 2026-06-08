import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/CommunicationCenter.css';

export default function CommunicationCenter() {
  const [broadcasts, setBroadcasts] = useState([
    { id: 1, date: '2024-06-10', channel: 'WhatsApp', recipients: 45000, delivered: 44820, opened: 38700 },
    { id: 2, date: '2024-06-09', channel: 'SMS', recipients: 50000, delivered: 49950, opened: 35000 },
    { id: 3, date: '2024-06-08', channel: 'Email', recipients: 8500, delivered: 8420, opened: 4210 },
  ]);

  const [audienceSegments] = useState([
    'All Citizens',
    'Ward Wise',
    'Age Group',
    'Women',
    'Youth',
    'Farmers',
    'Senior Citizens',
  ]);

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>💬 Communication Center</h1>
        <p>Communicate with citizens through multiple channels</p>
      </div>

      {/* Quick Broadcast */}
      <div className="mla-section">
        <h2>Quick Broadcast</h2>
        <div className="broadcast-buttons">
          <button className="broadcast-btn whatsapp">
            <span>💬 Send WhatsApp</span>
            <span className="count">45K</span>
          </button>
          <button className="broadcast-btn sms">
            <span>📱 Send SMS</span>
            <span className="count">50K</span>
          </button>
          <button className="broadcast-btn email">
            <span>📧 Send Email</span>
            <span className="count">8.5K</span>
          </button>
          <button className="broadcast-btn push">
            <span>🔔 Push Notification</span>
            <span className="count">125K</span>
          </button>
        </div>
      </div>

      {/* Audience Filters */}
      <div className="mla-section">
        <h2>Target Audience</h2>
        <div className="audience-tags">
          {audienceSegments.map((segment, idx) => (
            <label key={idx} className="audience-tag">
              <input type="radio" name="audience" />
              <span>{segment}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Message Template */}
      <div className="mla-section">
        <h2>Compose Message</h2>
        <form className="message-form">
          <div className="form-group">
            <label>Subject / Title</label>
            <input type="text" placeholder="Enter message subject" />
          </div>
          <div className="form-group">
            <label>Message Content</label>
            <textarea placeholder="Type your message..." rows="5"></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary">Save as Template</button>
            <button type="button" className="btn-secondary">Preview</button>
            <button type="submit" className="btn-primary">Send Now</button>
          </div>
        </form>
      </div>

      {/* Recent Broadcasts */}
      <div className="mla-section">
        <h2>Recent Broadcasts</h2>
        <div className="broadcasts-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Recipients</th>
                <th>Delivered</th>
                <th>Opened</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map(bc => (
                <tr key={bc.id}>
                  <td>{bc.date}</td>
                  <td>
                    <span className={`channel-badge ${bc.channel.toLowerCase()}`}>
                      {bc.channel}
                    </span>
                  </td>
                  <td>{bc.recipients.toLocaleString()}</td>
                  <td>{bc.delivered.toLocaleString()} ({Math.round(bc.delivered/bc.recipients*100)}%)</td>
                  <td>{bc.opened.toLocaleString()} ({Math.round(bc.opened/bc.recipients*100)}%)</td>
                  <td>
                    <button className="btn-secondary btn-sm">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
