import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GeographicHeatMap.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import { getGrievanceCategories } from '../../../shared/services/lookupService';

export default function GeographicHeatMap() {
  const navigate = useNavigate();
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [categories, setCategories] = useState([]);
  const [availableWards, setAvailableWards] = useState([]);
  const { dashboard, loading, error } = useMlaDashboard();

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getGrievanceCategories();
        setCategories(result || []);
      } catch (err) {
        console.error('Failed to load issue categories', err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const wardNames = [
      ...(dashboard?.recentComplaints || []).map((complaint) => complaint.wardId || complaint.location),
      ...(dashboard?.recentAlerts || []).map((alert) => alert.wardId || alert.location),
    ]
      .filter(Boolean)
      .map((name) => name.trim())
      .filter((name, index, self) => self.indexOf(name) === index);

    setAvailableWards(wardNames);
  }, [dashboard]);

  const filteredComplaints = (dashboard?.recentComplaints || []).filter((complaint) => {
    const wardName = complaint.wardId || complaint.location || '';
    const matchesWard = selectedWard === 'all' || wardName === selectedWard;
    const matchesCategory = selectedCategory === 'all' || complaint.categoryId?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesWard && matchesCategory;
  });

  const wardMap = new Map();
  filteredComplaints.forEach((complaint) => {
    const name = complaint.wardId || complaint.location || 'Unnamed Ward';
    const normalized = name.trim();
    const existing = wardMap.get(normalized) || {
      id: normalized,
      name: normalized,
      status: 'normal',
      issues: 0,
    };

    existing.issues += 1;
    const priority = complaint.priority?.toLowerCase();
    if (priority === 'critical' || (priority === 'high' && existing.status !== 'critical')) {
      existing.status = priority;
    }

    wardMap.set(normalized, existing);
  });

  const wards = Array.from(wardMap.values());
  const handleViewWardDetails = () => navigate(ROUTES.mlaComplaintsDashboard);

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
            <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
              <option value="all">All Wards</option>
              {availableWards.map((wardName) => (
                <option key={wardName} value={wardName}>
                  {wardName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Issue Category</label>
            <input
              type="text"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder="Type category name or 'all' to see all"
              className="filter-input"
            />
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
          {wards.length > 0 ? (
            wards.map((ward) => (
              <div key={ward.id} className={`ward-card ${ward.status}`}>
                <div className="ward-name">{ward.name}</div>
                <div className="ward-status">
                  {ward.status === 'critical' && '🔴 Critical'}
                  {ward.status === 'high' && '🟠 High'}
                  {ward.status === 'normal' && '🟢 Normal'}
                </div>
                <div className="ward-issues">{ward.issues} Issues</div>
                <button type="button" className="btn-secondary" onClick={handleViewWardDetails}>View Details</button>
              </div>
            ))
          ) : (
            Array.from({ length: 5 }, (_, idx) => (
              <div key={idx} className="ward-card placeholder">
                <div className="ward-name">Loading...</div>
                <div className="ward-status">—</div>
                <div className="ward-issues">— Issues</div>
                <button type="button" className="btn-secondary" onClick={handleViewWardDetails}>View Details</button>
              </div>
            ))
          )}
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
