import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/GeographicHeatMap.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import { getGrievanceCategories } from '../../../shared/services/lookupService';
import PageHeader from '../../../components/PageHeader';
import ExportButton from '../../../components/ExportButton';
import { getRepRolePrefix } from '../../../services/authStorage';

function normalizeWardLabel(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    if (typeof value.label === 'string' && value.label.trim()) return value.label.trim();
    if (typeof value.address === 'string' && value.address.trim()) return value.address.trim();
    if (Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
      const [lng, lat] = value.coordinates;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }
    return '';
  }
  return String(value).trim();
}

function formatWardName(name) {
  if (!name || name === 'Unnamed Ward') return name;
  const trimmed = name.trim();
  // Already has "Ward" prefix — return as-is
  if (/^ward\s+/i.test(trimmed)) return trimmed;
  // Pure number like "9", "4" — prefix with "Ward"
  if (/^\d+$/.test(trimmed)) return `Ward ${trimmed}`;
  return trimmed;
}

export default function GeographicHeatMap() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
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
    // Ward list comes from backend wardStats — no need to derive from recentComplaints
    const wardNames = (dashboard?.wardStats || [])
      .map((w) => normalizeWardLabel(w.wardId || w.name))
      .filter(Boolean)
      .filter((name, index, self) => self.indexOf(name) === index);

    setAvailableWards(wardNames);
  }, [dashboard]);

  // Ward priority data is now consumed directly from the backend wardStats
  // (computed in DashboardService.get_mla_dashboard → wardStats).
  // Previously the frontend re-derived this from recentComplaints.
  const wards = (dashboard?.wardStats || [])
    .filter((w) => {
      const name = normalizeWardLabel(w.wardId || w.name);
      return selectedWard === 'all' || name === selectedWard;
    })
    .map((w) => {
      const priority = (w.highestPriority || 'LOW').toLowerCase();
      return {
        id:     String(w.wardId || w.name),
        name:   String(w.wardId || w.name),
        status: priority === 'critical' ? 'critical' : priority === 'high' ? 'high' : 'normal',
        issues: w.count || 0,
      };
    });
  const handleViewWardDetails = () => navigate(ROUTES.mlaComplaintsDashboard);

  return (
    <div>
      <PageHeader subtitle="View issues and alerts by ward and location" />
      <div className="mla-container" ref={pageRef}>

      {/* Filters */}
      <div className="mla-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Ward</label>
            <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)}>
              <option value="all">All Wards</option>
              {availableWards.map((wardName) => (
                <option key={wardName} value={wardName}>
                  {formatWardName(wardName)}
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
                <div className="ward-name">{formatWardName(ward.name)}</div>
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

      {/* Export */}
      <div className="mla-section">
        <div className="detail-buttons">
          <ExportButton
            filename={`${getRepRolePrefix()}-ward-heatmap`}
            pdfRef={pageRef}
            data={wards}
            columns={[
              { key: 'name',   label: 'Ward' },
              { key: 'issues', label: 'Issues' },
              { key: 'status', label: 'Status' },
            ]}
          />
        </div>
      </div>
    </div>
  </div>
  );
}
