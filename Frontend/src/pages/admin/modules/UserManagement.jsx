import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import '../../../styles/modules/UserManagement.css';
import PageHeader from "../../../components/PageHeader";
import { fetchUsers, updateUser, deleteUser, resetUserPassword } from '../../../features/team-management/userService';
import Pagination from '../../../components/Pagination';
import { FaEdit, FaKey, FaBan, FaCheck, FaTrashAlt } from 'react-icons/fa';

const PAGE_SIZE = 100;
import PhoneInput from '../../../components/PhoneInput';
import { formatPhoneDisplay, sanitizePhoneInput } from '../../../utils/phoneUtils';
import api from '../../../shared/services/api';

const EMPTY_EDIT = { fullName: '', mobile: '', email: '', role: '', address: '', constituencyId: '' };

const extractError = (err) =>
  err?.message || err?.response?.data?.detail || 'Operation failed';

export default function UserManagement() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password result
  const [resetResult, setResetResult] = useState(null); // { userName, tempPassword }

  // Block in-progress tracker
  const [blockingId, setBlockingId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { loadUsers(page); }, [page]);

  const loadUsers = async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers(targetPage, PAGE_SIZE);
      setAllUsers(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter
  const filteredUsers = allUsers.filter(u => {
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q ||
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.mobile || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Edit ──────────────────────────────────────────────────
  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || '',
      mobile: user.mobile || '',
      email: user.email || '',
      role: user.role || '',
      address: user.address || '',
      constituencyId: user.constituencyId || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUser(editingUser._id || editingUser.id, editForm);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      alert(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteUser(deletingUser._id || deletingUser.id);
      setDeletingUser(null);
      await loadUsers();
    } catch (err) {
      alert(extractError(err));
    } finally {
      setDeleting(false);
    }
  };

  // ── Block / Unblock ───────────────────────────────────────
  const handleToggleBlock = async (user) => {
    const id = user._id || user.id;
    const newStatus = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    try {
      setBlockingId(id);
      await updateUser(id, { status: newStatus });
      setAllUsers(prev => prev.map(u =>
        (u._id || u.id) === id ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      alert(extractError(err));
    } finally {
      setBlockingId(null);
    }
  };

  // ── Reset Password ────────────────────────────────────────
  const handleResetPassword = async (user) => {
    const id = user._id || user.id;
    try {
      const res = await api.post(`/api/users/${id}/reset-password`, {});
      const tempPassword = res.data?.data?.tempPassword || res.data?.tempPassword;
      setResetResult({ userName: user.fullName || user.email, tempPassword });
    } catch (err) {
      alert(extractError(err));
    }
  };

  const totalUsers = allUsers.length;

  return (
    <div>
      <PageHeader subtitle="Manage citizens, staff members, and system users" />
      <div className="module-container">
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
        </div>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{totalUsers}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active</span>
          <span className="stat-value">{allUsers.filter(u => u.status !== 'BLOCKED').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Blocked</span>
          <span className="stat-value">{allUsers.filter(u => u.status === 'BLOCKED').length}</span>
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
                <th className="notranslate" translate="no">#</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Ward/Constituency</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    {allUsers.length === 0
                      ? 'No users found.'
                      : 'No users match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user._id || user.id} className={user.status === 'BLOCKED' ? 'row-blocked' : ''}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="user-name-cell">{user.fullName || '-'}</td>
                    <td>{formatPhoneDisplay(user.mobile) || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <span className={`role-badge role-${(user.role || '').toLowerCase()}`}>
                        {user.role || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`event-status-badge status-${(user.status || 'active').toLowerCase()}`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>{user.constituencyId || user.wardId || '-'}</td>
                    <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="action-btn edit"
                          title="Edit user"
                          onClick={() => openEdit(user)}
                        ><FaEdit /></button>
                        <button
                          className="action-btn reset"
                          title="Reset password"
                          onClick={() => handleResetPassword(user)}
                        ><FaKey /></button>
                        <button
                          className="action-btn block"
                          title={user.status === 'BLOCKED' ? 'Unblock user' : 'Block user'}
                          onClick={() => handleToggleBlock(user)}
                          disabled={blockingId === (user._id || user.id)}
                        >
                          {user.status === 'BLOCKED' ? <FaCheck /> : <FaBan />}
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete user"
                          onClick={() => setDeletingUser(user)}
                        ><FaTrashAlt /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        hasMore={hasMore}
        onPrev={() => setPage(p => p - 1)}
        onNext={() => setPage(p => p + 1)}
        loading={loading}
        pageSize={PAGE_SIZE}
      />

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="modal-content">
            <h2><FaEdit style={{marginRight:6,verticalAlign:'middle'}} /> Edit User</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editForm.fullName}
                  onChange={(e) => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <PhoneInput
                  value={editForm.mobile}
                  onChange={(name, value) => setEditForm(p => ({ ...p, [name]: sanitizePhoneInput(value) }))}
                  name="mobile"
                  placeholder="Enter mobile number"
                  className="user-management-phone-input"
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.email}
                  onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={editForm.address}
                  onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ward / Constituency</label>
                <input type="text" value={editForm.constituencyId}
                  onChange={(e) => setEditForm(p => ({ ...p, constituencyId: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setEditingUser(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingUser(null)}>
          <div className="modal-content delete-confirm-modal">
            <div className="delete-icon"><FaTrashAlt /></div>
            <h2>Delete User?</h2>
            <p className="delete-msg">
              Are you sure you want to delete <strong>{deletingUser.fullName || deletingUser.email}</strong>?
              This action cannot be undone.
            </p>
            <div className="form-actions">
              <button type="button" onClick={() => setDeletingUser(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Result Modal */}
      {resetResult && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setResetResult(null)}>
          <div className="modal-content delete-confirm-modal">
            <div className="delete-icon"><FaKey /></div>
            <h2>Password Reset</h2>
            <p className="delete-msg">
              Password for <strong>{resetResult.userName}</strong> has been reset.
            </p>
            <div className="temp-password-box">
              <span>Temporary Password:</span>
              <strong>{resetResult.tempPassword}</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Share this with the user. They should change it on next login.
            </p>
            <div className="form-actions">
              <button type="button" className="btn-primary" onClick={() => setResetResult(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
