import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/TeamManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchUsers } from '../../../features/team-management/userService';
import { fetchGrievances } from '../../../features/grievances/grievanceService';
import Pagination from '../../../components/Pagination';

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
    g => DONE_STATUSES.includes(g.status) && g.createdAt && g.updatedAt
  );
  const avgResolutionHrs = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((sum, t) => {
          const ms = new Date(t.updatedAt) - new Date(t.createdAt);
          return sum + ms / (1000 * 60 * 60);
        }, 0) / completedWithTimes.length
      )
    : 0;

  // Per-member stats helper — normalise IDs to strings for robust matching
  const normId = (v) => String(v?.$oid ?? v ?? '').trim();

  const getMemberStats = (memberId) => {
    const nid = normId(memberId);
    const memberGrievances = nid ? grievances.filter(g => normId(g.assignedOfficerId || g.assignedTo) === nid) : [];
    const active = memberGrievances.filter(g => ACTIVE_STATUSES.includes(g.status)).length;
    const completed = memberGrievances.filter(g => DONE_STATUSES.includes(g.status)).length;
    const withTimes = memberGrievances.filter(g => DONE_STATUSES.includes(g.status) && g.createdAt && g.updatedAt);
    const avgHrs = withTimes.length > 0
      ? Math.round(
          withTimes.reduce((sum, g) => {
            const ms = new Date(g.updatedAt) - new Date(g.createdAt);
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
      const memberGrievances = nid ? grievances.filter(g => normId(g.assignedOfficerId || g.assignedTo) === nid) : [];
      if (memberGrievances.length === 0) return null;
      return (memberGrievances.filter(g => DONE_STATUSES.includes(g.status)).length / memberGrievances.length) * 5;
    })
    .filter(r => r !== null);
  const avgRating = ratingsArr.length > 0
    ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)
    : '0.0';

  const kpiMetrics = [
    { id: 1, name: 'Open Tasks', description: 'Pending & in-progress', value: activeTaskCount, icon: '📋' },
    { id: 2, name: 'Completed Tasks', description: 'Finished work', value: completedTaskCount, icon: '✅' },
    { id: 3, name: 'Avg Resolution Time', description: 'SLA metric', value: `${avgResolutionHrs} hrs`, icon: '⏱️' },
    { id: 4, name: 'Team Size', description: 'Total members', value: teamMembers.length, icon: '👥' },
  ];

  const taskColumns = [
    { id: 'open', title: 'Open', icon: '📋', items: grievances.filter(g => g.status === 'OPEN') },
    { id: 'in-progress', title: 'In Progress', icon: '🔄', items: grievances.filter(g => g.status === 'IN_PROGRESS') },
    { id: 'resolved', title: 'Resolved', icon: '✅', items: grievances.filter(g => g.status === 'RESOLVED') },
    { id: 'closed', title: 'Closed', icon: '🔒', items: grievances.filter(g => g.status === 'CLOSED' || g.status === 'REJECTED') },
  ];

  if (loading) return <div className="module-container"><p>Loading team data...</p></div>;
  if (error) return <div className="module-container"><p className="error-text">{error}</p></div>;

  return (
    <div>
      <PageHeader subtitle="Manage staff performance, tasks, and team assignments" />
      <div className="module-container">
      <div className="module-controls">
        <input
          type="text"
          placeholder="Search team members..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="MANAGER">Managers</option>
          <option value="CONSTITUENCY_MANAGER">Constituency Managers</option>
          <option value="FIELD_OFFICER">Field Officers</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            className={`btn-secondary ${viewType === 'kpi' ? 'active' : ''}`}
            onClick={() => setViewType('kpi')}
          >
            📊 KPI View
          </button>
          <button
            className={`btn-secondary ${viewType === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewType('kanban')}
          >
            📋 Kanban View
          </button>
        </div>
      </div>

      {viewType === 'kpi' ? (
        <>
          {/* Top summary stats */}
          <div className="module-stats" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <span className="stat-label">Active Team Members</span>
              <span className="stat-value">{activeMembers}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Team Rating</span>
              <span className="stat-value">{avgRating}/5 ⭐</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Grievances</span>
              <span className="stat-value">{totalTasks}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completion Rate</span>
              <span className="stat-value">{completionRate}%</span>
            </div>
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
                      const officer = teamMembers.find(m => normId(m._id || m.id) === normId(g.assignedOfficerId || g.assignedTo));
                      return (
                        <div key={g._id || g.id} className="task-card">
                          <div className="task-title">{g.complaintNumber || `#${String(g._id || '').slice(-6)}`}</div>
                          <div className="task-assignee">{officer?.fullName || 'Unassigned'}</div>
                          <div className="task-date">{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}</div>
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
