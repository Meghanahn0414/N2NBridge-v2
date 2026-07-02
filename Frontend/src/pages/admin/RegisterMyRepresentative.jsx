import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../shared/services/api";
import { getAuthUser, setAuthUser } from "../../services/authStorage";
import { normalizePhone as normalizePhoneUtil } from "../../utils/phoneUtils";

const SCOPE_META = {
  MLA:        { label: "MLA",        locField: "Assembly Constituency",     locPlaceholder: "Enter assembly constituency name" },
  MP:         { label: "MP",         locField: "Parliamentary Constituency", locPlaceholder: "Enter parliamentary constituency name" },
  COUNCILLOR: { label: "Councillor", locField: "Ward ID",                    locPlaceholder: "Enter ward ID" },
};

const INITIAL_FORM = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  location: "",
  district: "",
  state: "",
};

export default function RegisterMyRepresentative() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const scope = (user?.scope || "").toUpperCase();
  const meta = SCOPE_META[scope];

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  if (!scope || !meta) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>No scope assigned</h2>
          <p style={styles.desc}>
            Your account doesn't have an MLA/MP/Councillor scope from an invite token. Contact your Super Admin.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim() || !form.password || !form.location.trim()) {
      setError(`All required fields must be filled, including ${meta.locField}.`);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: normalizePhoneUtil(form.mobile.replace(/\D/g, ""), "+91"),
        rep_type: scope,
        location: form.location.trim(),
        password: form.password,
        district: form.district.trim() || null,
        state: form.state.trim() || null,
      };
      if (scope === "MLA")        payload.assembly_name = form.location.trim();
      if (scope === "MP")         payload.parliamentary_name = form.location.trim();
      if (scope === "COUNCILLOR") payload.ward_id = form.location.trim();

      const res = await api.post("/api/auth/admin/register-my-representative", payload);
      const data = res.data?.data ?? res.data;

      // This admin's login stays exactly as-is — no session swap. Just
      // record that they now manage this representative (managedDbName),
      // then send them back to the normal Admin Portal.
      setAuthUser({ ...user, managedDbName: data.managedDbName });
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register your {meta.label}</h2>
        <p style={styles.desc}>
          Your invite token authorizes exactly one {meta.label} registration. Once submitted, you'll be signed in
          as that representative and can manage their Field Officers, Managers, citizens, and grievances from there.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label={`${meta.label} Full Name *`}>
            <input style={styles.input} value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Email *">
            <input type="email" style={styles.input} value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <Field label="Mobile Number *">
            <input style={styles.input} value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))} maxLength={10} placeholder="10-digit number" />
          </Field>
          <Field label={`${meta.locField} *`}>
            <input style={styles.input} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder={meta.locPlaceholder} />
          </Field>
          <Field label="District">
            <input style={styles.input} value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="State">
            <input style={styles.input} value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Password *">
            <input type="password" style={styles.input} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </Field>
          <Field label="Confirm Password *">
            <input type="password" style={styles.input} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
          </Field>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Registering…" : `Register ${meta.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: 32, width: "100%", maxWidth: 440 },
  title: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  desc: { fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column" },
  input: {
    width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 12px",
    fontSize: 13, background: "#f8fafc", outline: "none", boxSizing: "border-box", color: "#1e293b",
  },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 },
  submitBtn: {
    width: "100%", background: "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "#fff", border: "none",
    borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
};
