import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./ConstituencyHeatMap.css";

// Fix default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * ConstituencyHeatMap Component
 * Displays an interactive heat map of constituencies with Leaflet
 */
export default function ConstituencyHeatMap({ data = [], onViewFullMap = () => {} }) {
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Default constituency data with coordinates
  const defaultConstituencies = [
    { id: 1, name: "North District", value: 45, level: "very-high", lat: 40.7128, lng: -74.0060 },
    { id: 2, name: "Northeast Zone", value: 38, level: "high", lat: 40.7580, lng: -73.9855 },
    { id: 3, name: "Central Area", value: 28, level: "medium", lat: 40.7489, lng: -73.9680 },
    { id: 4, name: "West Region", value: 15, level: "low", lat: 40.7282, lng: -74.0076 },
    { id: 5, name: "Southwest Zone", value: 8, level: "very-low", lat: 40.7069, lng: -74.0113 },
    { id: 6, name: "South District", value: 22, level: "medium", lat: 40.6943, lng: -73.9249 },
    { id: 7, name: "Southeast Area", value: 32, level: "high", lat: 40.6892, lng: -73.9760 },
    { id: 8, name: "East Region", value: 35, level: "high", lat: 40.6837, lng: -73.9740 },
    { id: 9, name: "Northeast District", value: 42, level: "very-high", lat: 40.8448, lng: -73.8648 },
    { id: 10, name: "Central Zone", value: 18, level: "low", lat: 40.7505, lng: -73.9972 },
    { id: 11, name: "West Area", value: 25, level: "medium", lat: 40.7614, lng: -74.0000 },
    { id: 12, name: "North Central", value: 48, level: "very-high", lat: 40.7614, lng: -73.9776 },
  ];

  // Coordinate lookup map for constituencies by ID or name
  const coordinateMap = {
    1: { lat: 40.7128, lng: -74.0060 },
    2: { lat: 40.7580, lng: -73.9855 },
    3: { lat: 40.7489, lng: -73.9680 },
    4: { lat: 40.7282, lng: -74.0076 },
    5: { lat: 40.7069, lng: -74.0113 },
    6: { lat: 40.6943, lng: -73.9249 },
    7: { lat: 40.6892, lng: -73.9760 },
    8: { lat: 40.6837, lng: -73.9740 },
    9: { lat: 40.8448, lng: -73.8648 },
    10: { lat: 40.7505, lng: -73.9972 },
    11: { lat: 40.7614, lng: -74.0000 },
    12: { lat: 40.7614, lng: -73.9776 },
  };

  // Enrich data with coordinates if missing
  const enrichedData = data.map((item, idx) => {
    const coords = coordinateMap[item.id] || coordinateMap[idx + 1];
    return {
      ...item,
      lat: item.lat !== undefined ? item.lat : coords?.lat || 40.7300,
      lng: item.lng !== undefined ? item.lng : coords?.lng || -73.9500,
    };
  });

  const constituencies = data.length > 0 ? enrichedData : defaultConstituencies;

  const getIntensityLevel = (value) => {
    if (value >= 40) return "very-high";
    if (value >= 30) return "high";
    if (value >= 20) return "medium";
    if (value >= 10) return "low";
    return "very-low";
  };

  const getIntensityColor = (level) => {
    const colors = {
      "very-high": "#dc2626",
      high: "#f97316",
      medium: "#facc15",
      low: "#84cc16",
      "very-low": "#22c55e",
    };
    return colors[level] || "#94a3b8";
  };

  const getIntensityLabel = (level) => {
    const labels = {
      "very-high": "Very High",
      high: "High",
      medium: "Medium",
      low: "Low",
      "very-low": "Very Low",
    };
    return labels[level] || "Unknown";
  };

  const intensityLevels = [
    { level: "very-high", label: "Very High", color: "#dc2626" },
    { level: "high", label: "High", color: "#f97316" },
    { level: "medium", label: "Medium", color: "#facc15" },
    { level: "low", label: "Low", color: "#84cc16" },
    { level: "very-low", label: "Very Low", color: "#22c55e" },
  ];

  // Calculate center of map
  const center = [40.7300, -73.9500];
  const mapZoom = 12;

  return (
    <div className="constituency-heat-map">
      <div className="heat-map-container">
        <MapContainer 
          center={center} 
          zoom={mapZoom} 
          scrollWheelZoom={true}
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {constituencies.map((constituency) => {
            // Skip markers with invalid coordinates
            if (!constituency.lat || !constituency.lng || isNaN(constituency.lat) || isNaN(constituency.lng)) {
              return null;
            }

            const level = constituency.level || getIntensityLevel(constituency.value);
            const color = getIntensityColor(level);
            const isSelected = selectedConstituency?.id === constituency.id;
            const radius = isSelected ? 35 : 25;

            return (
              <CircleMarker
                key={constituency.id}
                center={[constituency.lat, constituency.lng]}
                radius={radius}
                fillColor={color}
                color={isSelected ? "#3b82f6" : "#333"}
                weight={isSelected ? 3 : 2}
                opacity={0.8}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => setSelectedConstituency(isSelected ? null : constituency),
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <div className="popup-title">{constituency.id}. {constituency.name}</div>
                    <div className="popup-info">
                      <span>Intensity: {getIntensityLabel(level)}</span>
                      <span>Value: {constituency.value || 0}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {selectedConstituency && (
        <div className="heat-map-details">
          <div className="details-header">
            <h3>
              <FaMapMarkerAlt /> {selectedConstituency.name}
            </h3>
            <button
              className="details-close"
              onClick={() => setSelectedConstituency(null)}
            >
              ✕
            </button>
          </div>
          <div className="details-body">
            <div className="detail-row">
              <span>Intensity Level:</span>
              <span
                className="intensity-badge"
                style={{
                  backgroundColor: getIntensityColor(
                    selectedConstituency.level || getIntensityLevel(selectedConstituency.value)
                  ),
                }}
              >
                {getIntensityLabel(
                  selectedConstituency.level || getIntensityLevel(selectedConstituency.value)
                )}
              </span>
            </div>
            <div className="detail-row">
              <span>Value:</span>
              <strong>{selectedConstituency.value || 0}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="heat-map-legend">
        <div className="legend-title">Intensity Levels</div>
        <div className="legend-items">
          {intensityLevels.map(({ level, label, color }) => (
            <div key={level} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
                title={label}
              />
              <span className="legend-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="view-full-map-btn" onClick={onViewFullMap}>
        View Full Map
      </button>
    </div>
  );
}
