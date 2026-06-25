import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes/RouteConstants';
import '../../../styles/mla-dashboard/mla-dashboard.css';
import '../../../styles/mla-dashboard/LiveConstituencyStatus.css';
import useMlaDashboard from '../../../shared/hooks/useMlaDashboard';
import PageHeader from '../../../components/PageHeader';
import ExportButton from '../../../components/ExportButton';

const formatNumber = (value) => (value == null || value === '' ? '-' : value);

export default function LiveConstituencyStatus() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const { dashboard } = useMlaDashboard();

  const handleViewComplaints = () => navigate(ROUTES.mlaComplaintsDashboard);
  const handleViewAlerts = () => navigate(ROUTES.mlaEmergencyCenter);
  const handleViewEvents = () => navigate(ROUTES.mlaEvents);

  const stats = {
    complaints: {
      new: formatNumber(dashboard?.summary?.openComplaints),
      assigned: formatNumber(dashboard?.metrics?.grievances?.byStatus?.ASSIGNED || 0),
      inProgress: formatNumber(dashboard?.metrics?.grievances?.byStatus?.IN_PROGRESS || 0),
      resolved: formatNumber(dashboard?.summary?.resolvedThisMonth),
    },
    alerts: {
      critical: formatNumber(dashboard?.summary?.criticalAlerts),
      high: formatNumber(dashboard?.metrics?.alerts?.byPriority?.HIGH || 0),
      medium: formatNumber(dashboard?.metrics?.alerts?.byPriority?.MEDIUM || 0),
      low: formatNumber(dashboard?.metrics?.alerts?.byPriority?.LOW || 0),
    },
    events: {
      today: formatNumber(dashboard?.metrics?.events?.today || 0),
      thisWeek: formatNumber(dashboard?.metrics?.events?.week || dashboard?.summary?.upcomingEvents || 0),
      registrations: formatNumber(dashboard?.metrics?.events?.registrations || 0),
    },
  };

  return (
    <div>
      <PageHeader subtitle="Real-Time Constituency Status" />
      <div className="mla-container" ref={pageRef}>

      <div className="mla-section">
        <h2>Complaints Status</h2>
        <div className="status-widget-grid">
          <div className="status-widget new">
            <div className="status-number">{stats.complaints.new}</div>
            <div className="status-label">New</div>
            <div className="status-icon">📝</div>
          </div>
          <div className="status-widget assigned">
            <div className="status-number">{stats.complaints.assigned}</div>
            <div className="status-label">Assigned</div>
            <div className="status-icon">👤</div>
          </div>
          <div className="status-widget inProgress">
            <div className="status-number">{stats.complaints.inProgress}</div>
            <div className="status-label">In Progress</div>
            <div className="status-icon">⚙️</div>
          </div>
          <div className="status-widget resolved">
            <div className="status-number">{stats.complaints.resolved}</div>
            <div className="status-label">Resolved</div>
            <div className="status-icon">✅</div>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <h2>Emergency Alerts</h2>
        <div className="status-widget-grid">
          <div className="status-widget critical">
            <div className="status-number">{stats.alerts.critical}</div>
            <div className="status-label">Critical</div>
            <div className="status-icon">🔴</div>
          </div>
          <div className="status-widget high">
            <div className="status-number">{stats.alerts.high}</div>
            <div className="status-label">High</div>
            <div className="status-icon">🟠</div>
          </div>
          <div className="status-widget medium">
            <div className="status-number">{stats.alerts.medium}</div>
            <div className="status-label">Medium</div>
            <div className="status-icon">🟡</div>
          </div>
          <div className="status-widget low">
            <div className="status-number">{stats.alerts.low}</div>
            <div className="status-label">Low</div>
            <div className="status-icon">🟢</div>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <h2>Events &amp; Outreach</h2>
        <div className="status-widget-grid">
          <div className="status-widget events">
            <div className="status-number">{stats.events.today}</div>
            <div className="status-label">Today</div>
            <div className="status-icon">📅</div>
          </div>
          <div className="status-widget events">
            <div className="status-number">{stats.events.thisWeek}</div>
            <div className="status-label">This Week</div>
            <div className="status-icon">📆</div>
          </div>
          <div className="status-widget events">
            <div className="status-number">{stats.events.registrations}</div>
            <div className="status-label">Registrations</div>
            <div className="status-icon">👥</div>
          </div>
        </div>
      </div>

      <div className="mla-section">
        <div className="detail-buttons">
          <button type="button" className="btn-primary" onClick={handleViewComplaints}>View All Complaints</button>
          <button type="button" className="btn-primary" onClick={handleViewAlerts}>View All Alerts</button>
          <button type="button" className="btn-primary" onClick={handleViewEvents}>View All Events</button>
          <ExportButton
            filename="constituency-status"
            pdfRef={pageRef}
            data={[
              { category: 'Complaints - New',         value: stats.complaints.new },
              { category: 'Complaints - Assigned',    value: stats.complaints.assigned },
              { category: 'Complaints - In Progress', value: stats.complaints.inProgress },
              { category: 'Complaints - Resolved',    value: stats.complaints.resolved },
              { category: 'Alerts - Critical',        value: stats.alerts.critical },
              { category: 'Alerts - High',            value: stats.alerts.high },
              { category: 'Alerts - Medium',          value: stats.alerts.medium },
              { category: 'Alerts - Low',             value: stats.alerts.low },
              { category: 'Events - Today',           value: stats.events.today },
              { category: 'Events - This Week',       value: stats.events.thisWeek },
              { category: 'Events - Registrations',   value: stats.events.registrations },
            ]}
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'value',    label: 'Value' },
            ]}
          />
        </div>
      </div>
    </div>
  </div>
  );
}
