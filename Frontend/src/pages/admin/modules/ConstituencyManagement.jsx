import React, { useState, useEffect } from 'react';
import '../../../styles/modules/ModulePageTemplate.css';
import PageHeader from "../../../components/PageHeader";
import {
  fetchConstituencies, fetchAllWards,
  createConstituency, updateConstituency, deleteConstituency,
  getWards, createWard
} from '../../../features/constituencies/constituencyService';
import { fetchUsers } from '../../../features/team-management/userService';

const EMPTY_FORM = { name: '', constituencyCode: '', district: '', state: '', representativeId: '' };
const EMPTY_WARD_ROW = { wardNumber: '', wardName: '' };

export default function ConstituencyManagement() {
  const [allConstituencies, setAllConstituencies] = useState([]);
  const [wardMap, setWardMap] = useState({});  // { constituencyId: [wardNumber, ...] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [representatives, setRepresentatives] = useState([]);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);       // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  // Inline wards (only for create mode)
  const [inlineWards, setInlineWards] = useState([]);     // [{ wardNumber, wardName }]
  const [wardRow, setWardRow] = useState(EMPTY_WARD_ROW); // current input row

  // Delete confirmation
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Wards modal
  const [wardsConstituency, setWardsConstituency] = useState(null); // { _id, name }
  const [wardsList, setWardsList] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardForm, setWardForm] = useState({ wardNumber: '', wardName: '' });
  const [wardSubmitting, setWardSubmitting] = useState(false);
  const [wardError, setWardError] = useState(null);

  useEffect(() => {
    loadAll();
    loadRepresentatives();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [constituencies, allWards] = await Promise.all([
        fetchConstituencies(),
        fetchAllWards().catch(() => []),
      ]);
      setAllConstituencies(constituencies);
      const map = {};
      allWards.forEach(w => {
        const cid = w.constituencyId;
        if (cid && w.wardNumber) {
          if (!map[cid]) map[cid] = [];
          map[cid].push(w.wardNumber);
        }
      });
      setWardMap(map);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRepresentatives = async () => {
    try {
      const reps = await fetchUsers(1, 1000, 'REPRESENTATIVE');
      setRepresentatives(reps);
    } catch { /* silent */ }
  };

  // Client-side search
  const filtered = allConstituencies.filter(c => {
    const q = search.trim().toLowerCase();
    return !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.district || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q) ||
      (c.constituencyCode || '').toLowerCase().includes(q);
  });

  // Stats
  const totalWards = Object.values(wardMap).reduce((s, arr) => s + arr.length, 0);

  // ── Open create modal ─────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setInlineWards([]);
    setWardRow(EMPTY_WARD_ROW);
    setShowModal(true);
  };

  // ── Open edit modal ───────────────────────────────────────
  const openEdit = (c) => {
    setEditingId(c._id || c.id);
    setForm({
      name: c.name || '',
      constituencyCode: c.constituencyCode || '',
      district: c.district || '',
      state: c.state || '',
      representativeId: c.representativeId || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setForm(EMPTY_FORM);
    setInlineWards([]); setWardRow(EMPTY_WARD_ROW);
  };

  const addInlineWard = () => {
    if (!wardRow.wardNumber.trim() || !wardRow.wardName.trim()) return;
    setInlineWards(prev => [...prev, { wardNumber: wardRow.wardNumber.trim(), wardName: wardRow.wardName.trim() }]);
    setWardRow(EMPTY_WARD_ROW);
  };

  const removeInlineWard = (idx) => setInlineWards(prev => prev.filter((_, i) => i !== idx));

  // ── Submit (create or edit) ───────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.district.trim() || !form.state.trim()) {
      setFormError('Name, district and state are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      const payload = {
        name: form.name.trim(),
        constituencyCode: form.constituencyCode.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        representativeId: form.representativeId || undefined,
      };
      if (editingId) {
        await updateConstituency(editingId, payload);
      } else {
        const created = await createConstituency(payload);
        // Create any inline wards; extract id from response
        const newId = created?.data?.id || created?.id;
        if (newId && inlineWards.length > 0) {
          await Promise.all(inlineWards.map(w => createWard({ ...w, constituencyId: newId })));
        }
      }
      closeModal();
      await loadAll();
    } catch (err) {
      setFormError(err.message || 'Failed to save constituency');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Wards modal ───────────────────────────────────────────
  const openWards = async (c) => {
    setWardsConstituency(c);
    setWardForm({ wardNumber: '', wardName: '' });
    setWardError(null);
    setWardsLoading(true);
    try {
      const wards = await getWards(c._id || c.id);
      setWardsList(wards);
    } catch (err) {
      setWardsList([]);
    } finally {
      setWardsLoading(false);
    }
  };

  const closeWards = () => { setWardsConstituency(null); setWardsList([]); };

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!wardForm.wardNumber.trim() || !wardForm.wardName.trim()) {
      setWardError('Ward number and name are required.');
      return;
    }
    try {
      setWardSubmitting(true);
      setWardError(null);
      const cid = wardsConstituency._id || wardsConstituency.id;
      await createWard({ wardNumber: wardForm.wardNumber.trim(), wardName: wardForm.wardName.trim(), constituencyId: cid });
      setWardForm({ wardNumber: '', wardName: '' });
      const updated = await getWards(cid);
      setWardsList(updated);
      setWardMap(prev => ({ ...prev, [cid]: updated.map(w => w.wardNumber) }));
    } catch (err) {
      setWardError(err.message || 'Failed to add ward');
    } finally {
      setWardSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteConstituency(deletingItem._id || deletingItem.id);
      setDeletingItem(null);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete constituency');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Manage constituency information, wards, and booths" />
      <div className="module-container">
      <div className="module-controls">
        <input
          type="text"
          placeholder="Search by name, district, state, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-primary" onClick={openCreate}>+ Add Constituency</button>
      </div>

      <div className="module-stats">
        <div className="stat-card">
          <span className="stat-label">Total Constituencies</span>
          <span className="stat-value">{allConstituencies.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Wards</span>
          <span className="stat-value">{totalWards}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Filtered Results</span>
          <span className="stat-value">{filtered.length}</span>
        </div>
      </div>

      <div className="constituency-table-wrapper">
        {loading ? (
          <div className="loading-state">Loading constituencies...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>{allConstituencies.length === 0
              ? '📍 No constituencies found. Click "Add Constituency" to get started.'
              : '🔍 No constituencies match your search.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Constituency Name</th>
                <th>Code</th>
                <th>District</th>
                <th>State</th>
                <th>Representative</th>
                <th>Wards</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const id = c._id || c.id;
                const rep = representatives.find(r => (r._id || r.id) === c.representativeId);
                return (
                  <tr key={id}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="event-name-cell">{c.name || '-'}</td>
                    <td>{c.constituencyCode || '-'}</td>
                    <td>{c.district || '-'}</td>
                    <td>{c.state || '-'}</td>
                    <td>{rep ? (rep.fullName || rep.email) : '-'}</td>
                    <td className="center">{wardMap[id]?.join(', ') || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" title="Edit" onClick={() => openEdit(c)}>✏️</button>
<button className="action-btn delete" title="Delete" onClick={() => setDeletingItem(c)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <h2>{editingId ? '✏️ Edit Constituency' : '➕ Add Constituency'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Constituency Name *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input type="text" value={form.constituencyCode}
                  onChange={(e) => setForm(p => ({ ...p, constituencyCode: e.target.value }))}
                  placeholder="e.g. 89" />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input type="text" value={form.district}
                  onChange={(e) => setForm(p => ({ ...p, district: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input type="text" value={form.state}
                  onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Representative</label>
                <select value={form.representativeId}
                  onChange={(e) => setForm(p => ({ ...p, representativeId: e.target.value }))}>
                  <option value="">— None —</option>
                  {representatives.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      {r.fullName || r.email || r.mobile}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inline ward entry — only in create mode */}
              {!editingId && (
                <div className="form-group inline-wards-section">
                  <label>Wards <span className="optional-tag">(optional)</span></label>
                  <div className="inline-ward-row">
                    <input
                      type="text"
                      placeholder="No. (e.g. 1)"
                      value={wardRow.wardNumber}
                      onChange={(e) => setWardRow(p => ({ ...p, wardNumber: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInlineWard())}
                    />
                    <input
                      type="text"
                      placeholder="Ward Name"
                      value={wardRow.wardName}
                      onChange={(e) => setWardRow(p => ({ ...p, wardName: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInlineWard())}
                    />
                    <button type="button" className="ward-inline-add-btn" onClick={addInlineWard}>+ Add</button>
                  </div>
                  {inlineWards.length > 0 && (
                    <ul className="inline-wards-list">
                      {inlineWards.map((w, i) => (
                        <li key={i}>
                          <span className="ward-badge">Ward {w.wardNumber}</span>
                          <span>{w.wardName}</span>
                          <button type="button" className="ward-remove-btn" onClick={() => removeInlineWard(i)}>✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {formError && <div className="error" style={{ marginBottom: 0 }}>{formError}</div>}
              <div className="form-actions">
                <button type="button" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Constituency')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wards Modal */}
      {wardsConstituency && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeWards()}>
          <div className="modal-content wards-modal">
            <div className="wards-modal-header">
              <h2>🏘️ Wards — {wardsConstituency.name}</h2>
              <button className="modal-close-btn" onClick={closeWards}>✕</button>
            </div>

            {/* Add ward form */}
            <form onSubmit={handleAddWard} className="ward-add-form">
              <input
                type="text"
                placeholder="Ward Number (e.g. 1)"
                value={wardForm.wardNumber}
                onChange={(e) => setWardForm(p => ({ ...p, wardNumber: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Ward Name (e.g. Koramangala)"
                value={wardForm.wardName}
                onChange={(e) => setWardForm(p => ({ ...p, wardName: e.target.value }))}
              />
              <button type="submit" className="btn-primary" disabled={wardSubmitting}>
                {wardSubmitting ? 'Adding...' : '+ Add Ward'}
              </button>
            </form>
            {wardError && <div className="error ward-error">{wardError}</div>}

            {/* Wards list */}
            <div className="wards-list">
              {wardsLoading ? (
                <div className="loading-state">Loading wards...</div>
              ) : wardsList.length === 0 ? (
                <div className="wards-empty">No wards added yet. Use the form above to add the first ward.</div>
              ) : (
                <table className="data-table wards-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ward No.</th>
                      <th>Ward Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardsList.map((w, i) => (
                      <tr key={w._id || w.id || i}>
                        <td>{i + 1}</td>
                        <td>{w.wardNumber}</td>
                        <td>{w.wardName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeletingItem(null)}>
          <div className="modal-content delete-confirm-modal">
            <div className="delete-icon">🗑️</div>
            <h2>Delete Constituency?</h2>
            <p className="delete-msg">
              Are you sure you want to delete <strong>{deletingItem.name}</strong>?
              This will not delete associated wards or users, but cannot be undone.
            </p>
            <div className="form-actions">
              <button type="button" onClick={() => setDeletingItem(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
