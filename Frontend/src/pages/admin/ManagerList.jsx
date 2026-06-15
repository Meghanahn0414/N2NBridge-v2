import React, { useEffect, useState } from "react";
import api from "../../shared/services/api";
import "./NewMLA.css";
import PageHeader from "../../components/PageHeader";

export default function ManagerList() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await api.get("/api/users/", { params: { role: "CONSTITUENCY_MANAGER", per_page: 100 } });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setManagers(list);
    } catch (err) {
      console.error("ManagerList fetch error", err);
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to load managers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Registered Managers" />
      <div className="new-mla-container">
      <div className="new-mla-card">
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {!loading && (
            <>
              {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
              {!error && (
                <div style={{ overflowX: "auto" }}>
                  {managers.length === 0 ? (
                    <div>No managers registered yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Mobile</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Department</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Office Location</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Manager Code</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managers.map((m) => (
                          <tr key={m._id || m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 16px" }}>{m.fullName || m.name || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.email || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.mobile || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.department || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.officeLocation || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.managerCode || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{m.role || "Manager"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
