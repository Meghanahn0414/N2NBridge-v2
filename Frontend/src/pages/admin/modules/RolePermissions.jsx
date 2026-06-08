import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/RolePermissions.css';

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const modules = [
    { id: 1, name: 'Complaints', icon: '📋' },
    { id: 2, name: 'Events', icon: '📅' },
    { id: 3, name: 'Campaigns', icon: '📢' },
    { id: 4, name: 'Reports', icon: '📊' },
    { id: 5, name: 'Users', icon: '👥' },
    { id: 6, name: 'Alerts', icon: '🚨' },
    { id: 7, name: 'Communications', icon: '💬' },
    { id: 8, name: 'Settings', icon: '⚙️' },
  ];

  const permissions = ['View', 'Create', 'Edit', 'Delete', 'Approve'];

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>🎭 Role & Permission Management</h1>
        <p>Define roles and manage permissions for all modules</p>
      </div>

      <div className="module-controls">
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Create New Role
        </button>
      </div>

      <div className="permissions-grid">
        <div className="permission-matrix">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {permissions.map(perm => (
                  <th key={perm}>{perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <tr key={module.id}>
                  <td className="module-name">{module.icon} {module.name}</td>
                  {permissions.map(perm => (
                    <td key={perm} className="checkbox-cell">
                      <input type="checkbox" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="roles-section">
        <h3>Existing Roles</h3>
        <div className="roles-list">
          <div className="role-card">
            <h4>Administrator</h4>
            <p>Full system access</p>
            <button className="btn-secondary">Edit Permissions</button>
          </div>
          <div className="role-card">
            <h4>Constituency Manager</h4>
            <p>Manage constituency users and complaints</p>
            <button className="btn-secondary">Edit Permissions</button>
          </div>
          <div className="role-card">
            <h4>Field Officer</h4>
            <p>Handle field-level tasks and reporting</p>
            <button className="btn-secondary">Edit Permissions</button>
          </div>
          <div className="role-card">
            <h4>Representative</h4>
            <p>Represent constituency in system</p>
            <button className="btn-secondary">Edit Permissions</button>
          </div>
          <div className="role-card">
            <h4>Citizen</h4>
            <p>Basic user with complaint filing rights</p>
            <button className="btn-secondary">Edit Permissions</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Role</h2>
            <form>
              <div className="form-group">
                <label>Role Name *</label>
                <input type="text" placeholder="e.g., Auditor" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Brief description of the role"></textarea>
              </div>
              <div className="form-group">
                <label>Select Permissions</label>
                <div className="checkbox-group">
                  {permissions.map(perm => (
                    <label key={perm}>
                      <input type="checkbox" />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
