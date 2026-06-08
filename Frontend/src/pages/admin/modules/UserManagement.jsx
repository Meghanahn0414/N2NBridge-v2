import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch users from API
    // fetchUsers();
    setLoading(false);
  }, []);

  const handleAddUser = (formData) => {
    // TODO: Call API to add new user
    console.log('Adding user:', formData);
    setShowAddModal(false);
  };

  const handleEditUser = (userId, formData) => {
    // TODO: Call API to edit user
    console.log('Editing user:', userId, formData);
  };

  const handleDeleteUser = (userId) => {
    // TODO: Call API to delete user
    console.log('Deleting user:', userId);
  };

  const handleBlockUser = (userId) => {
    // TODO: Call API to block user
    console.log('Blocking user:', userId);
  };

  const handleResetPassword = (userId) => {
    // TODO: Call API to reset password
    console.log('Resetting password for user:', userId);
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h1>👥 User Management</h1>
        <p>Manage citizens, staff members, and system users</p>
      </div>

      <div className="module-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters">
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="CITIZEN">Citizen</option>
            <option value="FIELD_OFFICER">Field Officer</option>
            <option value="MANAGER">Manager</option>
            <option value="REPRESENTATIVE">Representative</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New User
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Users</span>
          <span className="stat-value"></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Blocked Users</span>
          <span className="stat-value"></span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Role</th>
                <th>Ward/Constituency</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="8" className="no-data">
                  No users found. Click "Add New User" to create one.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New User</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddUser(new FormData(e.target));
            }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" required />
              </div>
              <div className="form-group">
                <label>Mobile *</label>
                <input type="tel" name="mobile" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select name="role" required>
                  <option>Select Role</option>
                  <option value="CITIZEN">Citizen</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="REPRESENTATIVE">Representative</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ward/Constituency</label>
                <input type="text" name="constituency" />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
