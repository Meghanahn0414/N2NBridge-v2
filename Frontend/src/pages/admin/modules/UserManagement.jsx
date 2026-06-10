import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/UserManagement.css';
import { fetchUsers, createUser } from '../../../features/team-management/userService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers(1, 1000, filterRole);
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (formData) => {
    try {
      setAddingUser(true);
      const userData = {
        fullName: formData.get('fullName'),
        mobile: formData.get('mobile'),
        email: formData.get('email') || '',
        role: formData.get('role'),
        constituencyId: formData.get('constituency') || null,
        password: Math.random().toString(36).slice(-8), // Generate temporary password
      };
      
      await createUser(userData);
      await loadUsers();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Failed to add user');
      console.error('Error adding user:', err);
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditUser = (userId, formData) => {
    // TODO: Implement edit user functionality
    console.log('Editing user:', userId, formData);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // TODO: Call API to delete user
      console.log('Deleting user:', userId);
    }
  };

  const handleBlockUser = (userId) => {
    // TODO: Call API to block user
    console.log('Blocking user:', userId);
  };

  const handleResetPassword = (userId) => {
    // TODO: Call API to reset password
    console.log('Resetting password for user:', userId);
  };

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const blockedUsers = users.filter(u => u.status === 'BLOCKED').length;

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
{/* 
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLOCKED">Blocked</option>
          </select> */}
        </div>

        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New User
        </button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{totalUsers}</span>
        </div>
        {/* <div className="stat-card">
          <span className="stat-label">Active Users</span>
          <span className="stat-value">{activeUsers}</span>
        </div> */}
        {/* <div className="stat-card">
          <span className="stat-label">Blocked Users</span>
          <span className="stat-value">{blockedUsers}</span>
        </div> */}
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
                {/* <th>Status</th> */}
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {users.length === 0 
                      ? 'No users found. Click "Add New User" to create one.'
                      : 'No users match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id || user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.mobile}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.constituencyId || user.wardId || '-'}</td>
                    {/* <td>
                      <span className={`status-badge status-${user.status?.toLowerCase() || 'active'}`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td> */}
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                    <td className="actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEditUser(user._id || user.id, null)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn reset" 
                        onClick={() => handleResetPassword(user._id || user.id)}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button 
                        className="action-btn block" 
                        onClick={() => handleBlockUser(user._id || user.id)}
                        title="Block"
                      >
                        🚫
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDeleteUser(user._id || user.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
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
                  <option value="">Select Role</option>
                  <option value="CITIZEN">Citizen</option>
                  <option value="FIELD_OFFICER">Field Officer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="REPRESENTATIVE">Representative</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ward/Constituency</label>
                <input type="text" name="constituency" placeholder="Optional" />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  disabled={addingUser}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={addingUser}
                >
                  {addingUser ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
