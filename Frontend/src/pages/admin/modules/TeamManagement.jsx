import React, { useState } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/TeamManagement.css';

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [viewType, setViewType] = useState('kpi'); // 'kpi' or 'kanban'
  const [showModal, setShowModal] = useState(false);

  const kpiMetrics = [
    {
      id: 1,
      name: 'Active Tasks',
      description: 'Assigned work',
      value: '0',
      icon: '📋',
    },
    {
      id: 2,
      name: 'Completed Tasks',
      description: 'Finished work',
      value: '0',
      icon: '✅',
    },
    {
      id: 3,
      name: 'Avg Resolution Time',
      description: 'SLA metric',
      value: '0 hrs',
      icon: '⏱️',
    },
    {
      id: 4,
      name: 'Citizen Rating',
      description: 'Satisfaction score',
      value: '0/5',
      icon: '⭐',
    },
  ];

  const taskColumns = [
    { id: 'assigned', title: 'Assigned', icon: '📋', tasks: [] },
    { id: 'in-progress', title: 'In Progress', icon: '🔄', tasks: [] },
    { id: 'completed', title: 'Completed', icon: '✅', tasks: [] },
    { id: 'rejected', title: 'Rejected', icon: '❌', tasks: [] },
  ];

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>👥 Team Management</h1>
        <p>Manage staff performance, tasks, and team assignments</p>
      </div>

      <div className="module-controls">
        <input type="text" placeholder="Search team members..." />
        <select>
          <option value="ALL">All Roles</option>
          <option value="MANAGER">Managers</option>
          <option value="FIELD_OFFICER">Field Officers</option>
        </select>
        <button className="btn-primary">Assign Tasks</button>
        
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
          {/* KPI Dashboard */}
          <div className="module-stats" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <span className="stat-label">Active Team Members</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg Team Rating</span>
              <span className="stat-value">0/5 ⭐</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completion Rate</span>
              <span className="stat-value">0%</span>
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
                <tr>
                  <td colSpan="7" className="no-data">No team members yet</td>
                </tr>
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
                    column.tasks.map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-title">{task.title}</div>
                        <div className="task-assignee">{task.assignee}</div>
                        <div className="task-date">{task.dueDate}</div>
                      </div>
                    ))
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
                <tr>
                  <td colSpan="6" className="no-data">No team members yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
