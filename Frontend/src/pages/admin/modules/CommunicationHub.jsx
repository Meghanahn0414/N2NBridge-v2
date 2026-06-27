import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";
import { fetchNotifications } from '../../../features/communications/communicationService';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 100;

export default function CommunicationHub() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChannel, setActiveChannel] = useState('SMS');
  const [showComposer, setShowComposer] = useState(false);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, read: 0, clicked: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const channels = ['SMS', 'WhatsApp', 'Email', 'Push Notifications'];

  useEffect(() => { setPage(1); }, [activeChannel]);
  useEffect(() => { loadMessages(page); }, [page, activeChannel]);

  const loadMessages = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifications(targetPage, PAGE_SIZE);
      const filtered = data.filter(m => m.channel === activeChannel || !m.channel);
      setMessages(filtered);
      setHasMore(data.length >= PAGE_SIZE);
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
    <div>
      <PageHeader subtitle="Send messages through multiple channels">
        <div style={{ display: "flex", gap: 4, background: "#F0F2F8", borderRadius: 10, padding: 4 }}>
          {channels.map(channel => (
            <button key={channel} onClick={() => setActiveChannel(channel)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", cursor: "pointer", whiteSpace: "nowrap",
                background: activeChannel === channel ? "#fff" : "transparent",
                color: activeChannel === channel ? "#16233C" : "#8590A6",
                boxShadow: activeChannel === channel ? "0 1px 4px rgba(20,35,60,.1)" : "none" }}>
              {channel}
            </button>
          ))}
        </div>
        <button onClick={() => setShowComposer(true)}
          style={{ marginLeft: "auto", padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}>
          ✉️ Compose Message
        </button>
      </PageHeader>
      <div className="module-container">

      <div className="module-stats">
        {[
          { label: "Messages Sent",  value: stats.sent,                                                                     icon: "📨", bg: "#EEF2FF" },
          { label: "Delivery Rate",  value: `${stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%`,  icon: "📬", bg: "#F0FDF4" },
          { label: "Read Rate",      value: `${stats.sent > 0 ? Math.round((stats.read / stats.sent) * 100) : 0}%`,       icon: "👁️",  bg: "#F0FDFA" },
          { label: "Click Rate",     value: `${stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0}%`,    icon: "👆", bg: "#FFF7ED" },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <span style={{ font: "600 12px 'Hanken Grotesk',system-ui,sans-serif", color: "#8590A6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontFamily: "'Newsreader','Georgia',serif", fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 400, color: "#16233C", lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
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
        <Pagination
          page={page}
          hasMore={hasMore}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
          loading={loading}
          pageSize={PAGE_SIZE}
        />
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
    </div>
  );
}
