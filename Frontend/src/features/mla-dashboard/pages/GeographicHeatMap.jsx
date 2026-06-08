import React, { useState } from 'react';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GeographicHeatMap.css';

export default function GeographicHeatMap() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  const wards = [
    { id:'', name: '', status: '', issues:'' },
    { id:'', name: '', status: '', issues:'' },
    { id:'', name: '', status: '', issues: '' },
    { id:'', name: '', status: '', issues:'' },
    { id:'', name: '', status: '', issues:'' },
  ];

  return (
    <div className="mla-container">
      <div className="mla-header">
        <h1>🗺️ Geographic Heat Map</h1>
        <p>View issues and alerts by ward and location</p>
      </div>

      {/* Filters */}
      <div className="mla-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Ward</label>
            <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
              <option value="all">All Wards</option>
              <option value="critical">Critical Wards</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Issue Category</label>
            <select>
              <option value="all">All Issues</option>
              <option value="roads">Road Issues</option>
              <option value="water">Water Problems</option>
              <option value="health">Health Complaints</option>
              <option value="electricity">Electricity Issues</option>
              <option value="alerts">Emergency Alerts</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="mla-section">
        <div className="heat-map-placeholder">
          <p>🗺️ Interactive GIS Map (Integration with Mapbox/Google Maps)</p>
        </div>
      </div>

      {/* Ward Status Cards */}
      <div className="mla-section">
        <h2>Ward Priority Index</h2>
        <div className="ward-grid">
          {wards.map(ward => (
            <div key={ward.id} className={`ward-card ${ward.status}`}>
              <div className="ward-name">{ward.name}</div>
              <div className="ward-status">
                {ward.status === 'critical' && '🔴 Critical'}
                {ward.status === 'high' && '🟠 High'}
                {ward.status === 'normal' && '🟢 Normal'}
              </div>
              <div className="ward-issues">{ward.issues} Issues</div>
              <button className="btn-secondary">View Details</button>
            </div>
          ))}
        </div>
      </div>

      {/* Heat Map Layers */}
      <div className="mla-section">
        <h2>Available Layers</h2>
        <div className="layers-grid">
          <label className="layer-option">
            <input type="checkbox" defaultChecked />
            <span>🛣️ Road Issues</span>
          </label>
          <label className="layer-option">
            <input type="checkbox" defaultChecked />
            <span>💧 Water Problems</span>
          </label>
          <label className="layer-option">
            <input type="checkbox" defaultChecked />
            <span>🏥 Health Complaints</span>
          </label>
          <label className="layer-option">
            <input type="checkbox" />
            <span>⚡ Electricity Issues</span>
          </label>
          <label className="layer-option">
            <input type="checkbox" />
            <span>🚨 Emergency Alerts</span>
          </label>
        </div>
      </div>
    </div>
  );
}
