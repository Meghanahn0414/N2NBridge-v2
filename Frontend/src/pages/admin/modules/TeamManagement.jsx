import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/TeamManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchUsers } from '../../../features/team-management/userService';
import { fetchGrievances } from '../../../features/grievances/grievanceService';
import Pagination from '../../../components/Pagination';
import { FaClipboardList, FaCheckCircle, FaClock, FaUsers, FaSyncAlt, FaLock, FaChartBar } from 'react-icons/fa';

const PAGE_SIZE = 100;

const ACTIVE_STATUSES = ['OPEN', 'IN_PROGRESS'];
const DONE_STATUSES = ['RESOLVED', 'CLOSED'];

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('kpi');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { loadTeamData(page); }, [page]);

  const loadTeamData = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const [members, grievanceList] = await Promise.all([
        fetchUsers(targetPage, PAGE_SIZE),
        fetchGrievances(targetPage, PAGE_SIZE)
      ]);
      setTeamMembers(members);
      setGrievances(grievanceList);
      setHasMore(members.length >= PAGE_SIZE || grievanceList.length >= PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Failed to load team data');
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const STAFF_ROLES = ['MANAGER', 'CONSTITUENCY_MANAGER', 'FIELD_OFFICER'];

  const staffMembers = teamMembers
    .filter(m => STAFF_ROLES.includes(m.role))
    .filter(m => roleFilter === 'ALL' || m.role === roleFilter)
    .filter(m => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (m.fullName || '').toLowerCase().includes(term) ||
             (m.username || '').toLowerCase().includes(term);
    });
  const activeMembers = staffMembers.filter(m => m.status === 'ACTIVE').length;
  const totalTasks = grievances.length;
  const completedTaskCount = grievances.filter(g => DONE_STATUSES.includes(g.status)).length;
  const activeTaskCount = grievances.filter(g => ACTIVE_STATUSES.includes(g.status)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

  const completedWithTimes = grievances.filter(
    g => DONE_STATUSES.includes(g.status) && g.created_at && g.updated_at
  );
  const avgResolutionHrs = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((sum, t) => {
          const ms = new Date(t.updated_at) - new Date(t.created_at);
          return sum + ms / (1000 * 60 * 60);
        }, 0) / completedWithTimes.length
      )
    : 0;

  // Per-member stats helper — normalise IDs to strings for robust matching
  const normId = (v) => String(v?.$oid ?? v ?? '').trim();

  const getMemberStats = (memberId) => {
    const nid = normId(memberId);
    const memberGrievances = nid ? grievances.filter(g => normId(g.assigned_to) === nid) : [];
    const active = memberGrievances.filter(g => ACTIVE_STATUSES.includes(g.status)).length;
    const completed = memberGrievances.filter(g => DONE_STATUSES.includes(g.status)).length;
    const withTimes = memberGrievances.filter(g => DONE_STATUSES.includes(g.status) && g.created_at && g.updated_at);
    const avgHrs = withTimes.length > 0
      ? Math.round(
          withTimes.reduce((sum, g) => {
            const ms = new Date(g.updated_at) - new Date(g.created_at);
            return sum + ms / (1000 * 60 * 60);
          }, 0) / withTimes.length
        )
      : null;
    return { active, completed, avgHrs };
  };

  // Avg team rating: grievance resolution rate per member → 0-5 scale
  const ratingsArr = staffMembers
    .map(m => {
      const id = m._id || m.id;
      const nid = normId(id);
      const memberGrievances = nid ? grievances.filter(g => normId(g.assigned_to) === nid) : [];
      if (memberGrievances.length === 0) return null;
      return (memberGrievances.filter(g => DONE_STATUSES.includes(g.status)).length / memberGrievances.length) * 5;
    })
    .filter(r => r !== null);
  const avgRating = ratingsArr.length > 0
    ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)
    : '0.0';

  const kpiMetrics = [
    { id: 1, name: 'Open Tasks', description: 'Pending & in-progress', value: activeTaskCount, icon: <FaClipboardList /> },
    { id: 2, name: 'Completed Tasks', description: 'Finished work', value: completedTaskCount, icon: <FaCheckCircle /> },
    { id: 3, name: 'Avg Resolution Time', description: 'SLA metric', value: `${avgResolutionHrs} hrs`, icon: <FaClock /> },
    { id: 4, name: 'Team Size', description: 'Total members', value: teamMembers.length, icon: <FaUsers /> },
  ];

  const taskColumns = [
    { id: 'open', title: 'Open', icon: <FaClipboardList />, items: grievances.filter(g => g.status === 'OPEN') },
    { id: 'in-progress', title: 'In Progress', icon: <FaSyncAlt />, items: grievances.filter(g => g.status === 'IN_PROGRESS') },
    { id: 'resolved', title: 'Resolved', icon: <FaCheckCircle />, items: grievances.filter(g => g.status === 'RESOLVED') },
    { id: 'closed', title: 'Closed', icon: <FaLock />, items: grievances.filter(g => g.status === 'CLOSED' || g.status === 'REJECTED') },
  ];

  if (loading) return <div className="module-container"><p>Loading team data...</p></div>;
  if (error) return <div className="module-container"><p className="error-text">{error}</p></div>;

  return (
    <div>
      <PageHeader subtitle="Manage staff performance, tasks, and team assignments">
        <input type="text" placeholder="Search team members..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", outline: "none" }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "9px 14px", border: "1px solid #EAEDF4", borderRadius: 10, fontSize: 13, fontFamily: "'Hanken Grotesk',sans-serif", background: "#F8F9FC", color: "#16233C", cursor: "pointer" }}>
          <option value="ALL">All Roles</option>
          <option value="MANAGER">Managers</option>
          <option value="CONSTITUENCY_MANAGER">Constituency Managers</option>
          <option value="FIELD_OFFICER">Field Officers</option>
        </select>
        <button onClick={() => setViewType('kpi')}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid #EAEDF4", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap",
            background: viewType === 'kpi' ? "#16233C" : "#F8F9FC", color: viewType === 'kpi' ? "#fff" : "#16233C" }}>
          <FaChartBar /> KPI View
        </button>
        <button onClick={() => setViewType('kanban')}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "1px solid #EAEDF4", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap",
            background: viewType === 'kanban' ? "#16233C" : "#F8F9FC", color: viewType === 'kanban' ? "#fff" : "#16233C" }}>
          <FaClipboardList /> Kanban View
        </button>
      </PageHeader>
      <div className="module-container">

      {viewType === 'kpi' ? (
        <>
          {/* Top summary stats */}
          <div className="module-stats" style={{ marginBottom: '32px' }}>
            {[
              { label: "Active Team Members", value: activeMembers,       icon: "👥", bg: "#EEF2FF" },
              { label: "Avg Team Rating",     value: `${avgRating}/5`,    icon: "⭐", bg: "#FFFBEB" },
              { label: "Total Grievances",    value: totalTasks,           icon: "📝", bg: "#FFF7ED" },
              { label: "Completion Rate",     value: `${completionRate}%`, icon: "✅", bg: "#F0FDF4" },
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

          {/* KPI Cards Grid */}
          <div className="kpi-grid">
            {kpiMetrics.map(kpi => (
              <div key={kpi.id} className="kpi-card">
                <div className="kpi-icon">{kpi.icon}</div>
                <div className="kpi-content">
                  <h4>{kpi.name}</h4>
                  <p>{kpi.description}</p>
                  <div className="kpi-value">{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Team Performance Table */}
          <div className="team-table" style={{ marginTop: '32px' }}>
            <h3>Team Performance</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Active Tasks</th>
                  <th>Completed Tasks</th>
                  <th>Avg Resolution Time</th>
                  <th>Citizen Rating</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No team members found</td>
                  </tr>
                ) : (
                  staffMembers.map(member => {
                    const id = member._id || member.id;
                    const { active, completed, avgHrs } = getMemberStats(id);
                    return (
                      <tr key={id}>
                        <td><strong>{member.fullName || member.username || '—'}</strong></td>
                        <td>{member.role || '—'}</td>
                        <td>{active}</td>
                        <td>{completed}</td>
                        <td>{avgHrs != null ? `${avgHrs} hrs` : '—'}</td>
                        <td>—</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Kanban Board View */}
          <div className="team-board">
            {taskColumns.map(column => (
              <div key={column.id} className="board-column">
                <div className="board-column-header">
                  <h3>{column.icon} {column.title}</h3>
                  <span className="task-count">{column.items.length}</span>
                </div>
                <div className="board-column-content">
                  {column.items.length === 0 ? (
                    <div className="empty-state">No grievances</div>
                  ) : (
                    column.items.map(g => {
                      const officer = teamMembers.find(m => normId(m._id || m.id) === normId(g.assigned_to));
                      return (
                        <div key={g._id || g.id} className="task-card">
                          <div className="task-title">{g.complaintNumber || `#${String(g._id || '').slice(-6)}`}</div>
                          <div className="task-assignee">{officer?.fullName || 'Unassigned'}</div>
                          <div className="task-date">{g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Team List Below Kanban */}
          <div className="team-table" style={{ marginTop: '32px' }}>
            <h3>Team Members</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Active Tasks</th>
                  <th>Completed Tasks</th>
                  <th>Citizen Rating</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">No team members found</td>
                  </tr>
                ) : (
                  staffMembers.map(member => {
                    const id = member._id || member.id;
                    const { active, completed } = getMemberStats(id);
                    return (
                      <tr key={id}>
                        <td><strong>{member.fullName || member.username || '—'}</strong></td>
                        <td>{member.role || '—'}</td>
                        <td>{active}</td>
                        <td>{completed}</td>
                        <td>—</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
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
    </div>
  );
}
