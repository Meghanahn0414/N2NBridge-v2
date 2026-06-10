import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/RolePermissions.css';

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

const createEmptyPermissions = () => {
  return modules.reduce((acc, module) => {
    acc[module.name] = permissions.reduce((permAcc, perm) => {
      permAcc[perm] = false;
      return permAcc;
    }, {});
    return acc;
  }, {});
};

const defaultRoles = [
  {
    id: 'role-admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: modules.reduce((acc, module) => {
      acc[module.name] = permissions.reduce((permAcc, perm) => {
        permAcc[perm] = true;
        return permAcc;
      }, {});
      return acc;
    }, {}),
  },
  {
    id: 'role-manager',
    name: 'Constituency Manager',
    description: 'Manage constituency users, complaints, and reports',
    permissions: {
      Complaints: { View: true, Create: true, Edit: true, Delete: false, Approve: true },
      Events: { View: true, Create: true, Edit: true, Delete: false, Approve: false },
      Campaigns: { View: true, Create: true, Edit: false, Delete: false, Approve: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Users: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Alerts: { View: true, Create: true, Edit: false, Delete: false, Approve: false },
      Communications: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
    },
  },
  {
    id: 'role-officer',
    name: 'Field Officer',
    description: 'Handle field-level tasks and reporting',
    permissions: {
      Complaints: { View: true, Create: true, Edit: true, Delete: false, Approve: false },
      Events: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Campaigns: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Users: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Alerts: { View: true, Create: true, Edit: false, Delete: false, Approve: false },
      Communications: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
    },
  },
  {
    id: 'role-rep',
    name: 'Representative',
    description: 'Represent constituency in system',
    permissions: {
      Complaints: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Events: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Campaigns: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Reports: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Users: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Alerts: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Communications: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
    },
  },
  {
    id: 'role-citizen',
    name: 'Citizen',
    description: 'Basic user with complaint filing rights',
    permissions: {
      Complaints: { View: true, Create: true, Edit: false, Delete: false, Approve: false },
      Events: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Campaigns: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Reports: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Users: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Alerts: { View: true, Create: false, Edit: false, Delete: false, Approve: false },
      Communications: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
      Settings: { View: false, Create: false, Edit: false, Delete: false, Approve: false },
    },
  },
];

export default function RolePermissions() {
  const [roles, setRoles] = useState(defaultRoles);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState(createEmptyPermissions());
  const [activeRoleId, setActiveRoleId] = useState(defaultRoles[0]?.id || null);
  const [formError, setFormError] = useState('');
  const location = useLocation();

  const roleIdMap = {
    ADMIN: 'role-admin',
    CONSTITUENCY_MANAGER: 'role-manager',
    FIELD_OFFICER: 'role-officer',
    REPRESENTATIVE: 'role-rep',
    CITIZEN: 'role-citizen',
  };

  useEffect(() => {
    const selectedRole = location.state?.selectedRole;
    if (selectedRole) {
      const mappedId = roleIdMap[selectedRole];
      if (mappedId) {
        setActiveRoleId(mappedId);
      }
    }
  }, [location.state?.selectedRole]);

  const activeRole = roles.find(role => role.id === activeRoleId) || null;

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setRolePermissions(createEmptyPermissions());
    setEditingRole(null);
    setFormError('');
  };

  const handleCreateClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setRolePermissions(role.permissions);
    setFormError('');
    setShowModal(true);
  };

  const handlePermissionToggle = (moduleName, permission) => {
    setRolePermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [permission]: !prev[moduleName][permission],
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = roleName.trim();

    if (!trimmedName) {
      setFormError('Role name is required.');
      return;
    }

    const newRole = {
      id: editingRole ? editingRole.id : `role-${Date.now()}`,
      name: trimmedName,
      description: roleDescription.trim() || 'No description provided',
      permissions: rolePermissions,
    };

    if (editingRole) {
      setRoles((prev) => prev.map((role) => (role.id === editingRole.id ? newRole : role)));
      if (activeRoleId === editingRole.id) {
        setActiveRoleId(newRole.id);
      }
    } else {
      setRoles((prev) => [newRole, ...prev]);
      setActiveRoleId(newRole.id);
    }

    setShowModal(false);
    resetForm();
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>🎭 Role & Permission Management</h1>
        <p>Create new roles and control module-level permissions for your system.</p>
      </div>

      <div className="module-controls">
        <button className="btn-primary" onClick={handleCreateClick}>
          + Create New Role
        </button>
      </div>

      <div className="permissions-grid">
        <div className="permission-matrix">
          <div className="permission-matrix-header">
            <h3>{activeRole ? `${activeRole.name} Permissions` : 'Select a role to preview permissions'}</h3>
            <p>{activeRole ? activeRole.description : 'Click any existing role card to preview or edit its permissions.'}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {permissions.map((perm) => (
                  <th key={perm}>{perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.id}>
                  <td className="module-name">{module.icon} {module.name}</td>
                  {permissions.map((perm) => (
                    <td key={perm} className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={activeRole ? !!activeRole.permissions[module.name]?.[perm] : false}
                        readOnly
                      />
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
          {roles.map((role) => (
            <div key={role.id} className={`role-card ${activeRoleId === role.id ? 'active-role' : ''}`}>
              <h4>{role.name}</h4>
              <p>{role.description}</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setActiveRoleId(role.id);
                  handleEditClick(role);
                }}
              >
                Edit Permissions
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingRole ? 'Edit Role Permissions' : 'Create New Role'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Staff"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Brief description of the role"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                />
              </div>
              <div className="permission-matrix">
                <div className="permission-matrix-header">
                  <h3>Assign Permissions</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Module</th>
                      {permissions.map((perm) => (
                        <th key={perm}>{perm}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <tr key={module.id}>
                        <td className="module-name">{module.icon} {module.name}</td>
                        {permissions.map((perm) => (
                          <td key={perm} className="checkbox-cell">
                            <input
                              type="checkbox"
                              checked={!!rolePermissions[module.name]?.[perm]}
                              onChange={() => handlePermissionToggle(module.name, perm)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
