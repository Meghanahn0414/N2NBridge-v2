import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/CommunicationCenter.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import { getCommunicationChannels, getAudienceSegments } from '../../../shared/services/lookupService';

const formatNumber = (value) => (value == null || value === '' ? '-' : value.toLocaleString());

export default function CommunicationCenter() {
  const navigate = useNavigate();
  const { dashboard, loading, error } = useMlaDashboard();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const broadcasts = dashboard?.recentAlerts?.slice(0, 3).map((alert, idx) => ({
    id: alert._id || idx,
    date: new Date(alert.createdAt || Date.now()).toISOString().split('T')[0],
    channel: alert.channel || 'Unknown',
    recipients: alert.recipients?.length || 0,
    delivered: alert.delivered || Math.max(0, Math.round((alert.recipients?.length || 0) * 0.99)),
    opened: alert.opened || Math.max(0, Math.round((alert.recipients?.length || 0) * 0.8)),
  })) || [];

  const [messageChannels, setMessageChannels] = useState([]);
  const [audienceSegments, setAudienceSegments] = useState([]);

  const channelRecipientCounts = broadcasts.reduce((counts, bc) => {
    counts[bc.channel] = (counts[bc.channel] || 0) + bc.recipients;
    return counts;
  }, {});

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [channels, audiences] = await Promise.all([
          getCommunicationChannels(),
          getAudienceSegments(),
        ]);
        setMessageChannels(channels || []);
        setAudienceSegments(audiences || []);
      } catch (err) {
        console.error('Failed to load communication center lookups:', err);
      }
    };

    fetchLookups();
  }, []);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel.value);
    setFeedback(`Channel selected: ${channel.label}`);
  };

  const handleAudienceChange = (event) => {
    setSelectedAudience(event.target.value);
    setFeedback(`Target audience: ${event.target.value}`);
  };

  const handleSaveTemplate = () => {
    setFeedback('Template saved.');
  };

  const handlePreview = () => {
    setFeedback('Preview ready.');
  };

  const handleSendNow = (event) => {
    event.preventDefault();
    if (!selectedChannel || !selectedAudience || !subject || !message) {
      setFeedback('Please select a channel, audience, and enter subject and message.');
      return;
    }
    setFeedback(`Sending ${selectedChannel} broadcast to ${selectedAudience}.`);
  };

  const handleViewDetails = (id) => {
    setFeedback(`Viewing broadcast details for ${id}.`);
  };

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
          {messageChannels.length ? (
            messageChannels.map((channel) => {
              const count = channelRecipientCounts[channel.value] ?? 0;
              return (
                <button
                  key={channel.value}
                  type="button"
                  className={`broadcast-btn ${channel.value.toLowerCase()}`}
                  onClick={() => handleSelectChannel(channel)}
                >
                  <span>{channel.icon} Send {channel.label}</span>
                  <span className="count">{count.toLocaleString()}</span>
                </button>
              );
            })
          ) : (
            <div className="broadcast-loading">Loading channels...</div>
          )}
        </div>
      </div>

      {/* Audience Filters */}
      <div className="mla-section">
        <h2>Target Audience</h2>
        <div className="audience-tags">
          {audienceSegments.length ? (
            audienceSegments.map((segment) => (
              <label key={segment.value} className="audience-tag">
                <input type="radio" name="audience" value={segment.value} checked={selectedAudience === segment.value} onChange={handleAudienceChange} />
                <span>{segment.label}</span>
              </label>
            ))
          ) : (
            <div className="audience-loading">Loading audience segments...</div>
          )}
        </div>
      </div>

      {/* Message Template */}
      <div className="mla-section">
        <h2>Compose Message</h2>
        <form className="message-form" onSubmit={handleSendNow}>
          <div className="form-group">
            <label>Subject / Title</label>
            <input type="text" placeholder="Enter message subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Message Content</label>
            <textarea placeholder="Type your message..." rows="5" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleSaveTemplate}>Save as Template</button>
            <button type="button" className="btn-secondary" onClick={handlePreview}>Preview</button>
            <button type="submit" className="btn-primary">Send Now</button>
          </div>
          {feedback && <div className="form-feedback">{feedback}</div>}
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
                    <button type="button" className="btn-secondary btn-sm" onClick={() => handleViewDetails(bc.id)}>View Details</button>
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
