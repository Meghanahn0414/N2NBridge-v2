import React, { useEffect, useState } from "react";
import api from "../../shared/services/api";
import "./NewMLA.css";
import PageHeader from "../../components/PageHeader";
import { formatPhoneDisplay } from "../../utils/phoneUtils";

export default function FieldOfficerList() {
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFieldOfficers();
  }, []);

  const fetchFieldOfficers = async () => {
    try {
      const res = await api.get("/api/users/", { params: { role: "FIELD_OFFICER", per_page: 100 } });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setFieldOfficers(list);
    } catch (err) {
      console.error("FieldOfficerList fetch error", err);
      const message = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to load field officers";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader subtitle="Registered Field Officers" />
      <div className="new-mla-container">
      <div className="new-mla-card">
        <div style={{ padding: 30 }}>
          {loading && <div>Loading...</div>}
          {!loading && (
            <>
              {error && <div className="new-mla-alert new-mla-alert--error">{error}</div>}
              {!error && (
                <div style={{ overflowX: "auto" }}>
                  {fieldOfficers.length === 0 ? (
                    <div>No field officers registered yet.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Email</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Mobile</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Assigned Area</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Field Officer ID</th>
                          <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid #e5e7eb" }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldOfficers.map((officer) => (
                          <tr key={officer._id || officer.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 16px" }}>{officer.fullName || officer.name || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{officer.email || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{formatPhoneDisplay(officer.mobile) || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{officer.assignedArea || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{officer.fieldOfficerId || "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{officer.role || "Field Officer"}</td>
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
