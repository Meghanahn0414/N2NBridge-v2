import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/TeamManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchUsers } from '../../../features/team-management/userService';
import { fetchTasks } from '../../../features/tasks/taskService';

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('kpi');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [members, taskList] = await Promise.all([
        fetchUsers(1, 1000),
        fetchTasks(1, 1000)
      ]);
      setTeamMembers(members);
      setTasks(taskList);
    } catch (err) {
      setError(err.message || 'Failed to load team data');
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const staffMembers = teamMembers
    .filter(m => ['MANAGER', 'FIELD_OFFICER'].includes(m.role))
    .filter(m => roleFilter === 'ALL' || m.role === roleFilter)
    .filter(m => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (m.fullName || '').toLowerCase().includes(term) ||
             (m.username || '').toLowerCase().includes(term);
    });
  const activeMembers = staffMembers.filter(m => m.status === 'ACTIVE').length;
  const totalTasks = tasks.length;
  const completedTaskCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const activeTaskCount = tasks.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTaskCount / totalTasks) * 100) : 0;

  const completedWithTimes = tasks.filter(
    t => t.status === 'COMPLETED' && t.createdAt && t.updatedAt
  );
  const avgResolutionHrs = completedWithTimes.length > 0
    ? Math.round(
        completedWithTimes.reduce((sum, t) => {
          const ms = new Date(t.updatedAt) - new Date(t.createdAt);
          return sum + ms / (1000 * 60 * 60);
        }, 0) / completedWithTimes.length
      )
    : 0;

  // Per-member stats helper
  const getMemberStats = (memberId) => {
    const memberTasks = tasks.filter(t => t.assignedTo === memberId);
    const active = memberTasks.filter(t => !['COMPLETED', 'CANCELLED'].includes(t.status)).length;
    const completed = memberTasks.filter(t => t.status === 'COMPLETED').length;
    const withTimes = memberTasks.filter(t => t.status === 'COMPLETED' && t.createdAt && t.updatedAt);
    const avgHrs = withTimes.length > 0
      ? Math.round(
          withTimes.reduce((sum, t) => {
            const ms = new Date(t.updatedAt) - new Date(t.createdAt);
            return sum + ms / (1000 * 60 * 60);
          }, 0) / withTimes.length
        )
      : null;
    return { active, completed, avgHrs };
  };

  // Avg team rating: task completion rate per member → 0-5 scale
  const ratingsArr = staffMembers
    .map(m => {
      const id = m._id || m.id;
      const memberTasks = tasks.filter(t => t.assignedTo === id);
      if (memberTasks.length === 0) return null;
      return (memberTasks.filter(t => t.status === 'COMPLETED').length / memberTasks.length) * 5;
    })
    .filter(r => r !== null);
  const avgRating = ratingsArr.length > 0
    ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1)
    : '0.0';

  const kpiMetrics = [
    { id: 1, name: 'Active Tasks', description: 'Assigned work', value: activeTaskCount, icon: '📋' },
    { id: 2, name: 'Completed Tasks', description: 'Finished work', value: completedTaskCount, icon: '✅' },
    { id: 3, name: 'Avg Resolution Time', description: 'SLA metric', value: `${avgResolutionHrs} hrs`, icon: '⏱️' },
    { id: 4, name: 'Team Size', description: 'Total members', value: teamMembers.length, icon: '👥' },
  ];

  const taskColumns = [
    { id: 'assigned', title: 'Assigned', icon: '📋', tasks: tasks.filter(t => t.status === 'ASSIGNED') },
    { id: 'in-progress', title: 'In Progress', icon: '🔄', tasks: tasks.filter(t => t.status === 'IN_PROGRESS') },
    { id: 'completed', title: 'Completed', icon: '✅', tasks: tasks.filter(t => t.status === 'COMPLETED') },
    { id: 'cancelled', title: 'Cancelled', icon: '❌', tasks: tasks.filter(t => t.status === 'CANCELLED') },
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
              <span className="stat-label">Total Tasks</span>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">No team members found</td>
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
                        <td>
                          <span className={`status-badge ${member.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                            {member.status || 'UNKNOWN'}
                          </span>
                        </td>
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
                  <span className="task-count">{column.tasks.length}</span>
                </div>
                <div className="board-column-content">
                  {column.tasks.length === 0 ? (
                    <div className="empty-state">No tasks</div>
                  ) : (
                    column.tasks.map(task => {
                      const officer = teamMembers.find(m => (m._id || m.id) === task.assignedTo);
                      return (
                        <div key={task._id || task.id} className="task-card">
                          <div className="task-title">Grievance #{(task.grievanceId || '').slice(-6)}</div>
                          <div className="task-assignee">{officer?.fullName || task.assignedTo || 'Unassigned'}</div>
                          <div className="task-date">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</div>
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
                  <th>Status</th>
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
                    const { active, completed } = getMemberStats(id);
                    return (
                      <tr key={id}>
                        <td><strong>{member.fullName || member.username || '—'}</strong></td>
                        <td>{member.role || '—'}</td>
                        <td>{active}</td>
                        <td>{completed}</td>
                        <td>—</td>
                        <td>
                          <span className={`status-badge ${member.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                            {member.status || 'UNKNOWN'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
