import React, { useEffect, useState } from "react";
import api from "../../shared/services/api";
import PageHeader from "../../components/PageHeader";
import { formatPhoneDisplay } from "../../utils/phoneUtils";

const styles = {
  page: { background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  body: { padding: '24px 28px', flex: 1 },
  card: { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(15,23,42,0.08)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e8edf3' },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' },
  badge: { background: '#eff6ff', color: '#3b82f6', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '3px 12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e8edf3' },
  td: { padding: '13px 16px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' },
  avatarCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 },
  name: { fontWeight: 600, color: '#0f172a', fontSize: 13 },
  roleBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ecfdf5', color: '#059669' },
  statusDot: { width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', marginRight: 6 },
  empty: { textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 },
  loading: { textAlign: 'center', padding: '48px 0', color: '#64748b', fontSize: 14 },
  error: { margin: 24, padding: '12px 16px', background: '#fef2f2', color: '#b91c1c', borderRadius: 10, fontSize: 13 },
};

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function FieldOfficerList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users/", { params: { role: "FIELD_OFFICER", per_page: 100 } });
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setUsers(list);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load field officers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <PageHeader subtitle="Registered Field Officers" />
      <div style={styles.body}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Field Officers</h3>
            {!loading && !error && <span style={styles.badge}>{users.length} total</span>}
          </div>

          {loading && <div style={styles.loading}>Loading...</div>}
          {error && <div style={styles.error}>{error}</div>}

          {!loading && !error && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Mobile</th>
                  <th style={styles.th}>Assigned Area</th>
                  <th style={styles.th}>Officer ID</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={8} style={styles.empty}>No field officers found</td></tr>
                ) : (
                  users.map((u, i) => {
                    const fullName = u.fullName || u.name || '—';
                    return (
                      <tr key={u._id || u.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ ...styles.td, color: '#94a3b8', fontWeight: 600, width: 48 }}>{i + 1}</td>
                        <td style={styles.td}>
                          <div style={styles.avatarCell}>
                            <div style={styles.avatar}>{initials(fullName)}</div>
                            <div style={styles.name}>{fullName}</div>
                          </div>
                        </td>
                        <td style={styles.td}>{u.email || '—'}</td>
                        <td style={styles.td}>{formatPhoneDisplay(u.mobile)}</td>
                        <td style={styles.td}>{u.assignedArea || '—'}</td>
                        <td style={styles.td}>{u.fieldOfficerId || '—'}</td>
                        <td style={styles.td}><span style={styles.roleBadge}>{u.role || 'FIELD_OFFICER'}</span></td>
                        <td style={styles.td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                            <span style={styles.statusDot} />Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
