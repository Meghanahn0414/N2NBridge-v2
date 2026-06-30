import { useState, useEffect } from "react";
import api from "../../../shared/services/api";
import MIcon from "../../../components/MIcon";
import { formatPhoneDisplay } from "../../../utils/phoneUtils";

function MS({ children, style }) {
  return <MIcon name={children} style={style} />;
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function MLACitizenList() {
  const [citizens, setCitizens] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    api.get("/api/users/", { params: { per_page: 500, role: "CITIZEN" } })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data
                   : Array.isArray(res.data) ? res.data : [];
        setCitizens(list);
        setFiltered(list);
      })
      .catch(() => setError("Failed to load citizens"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? citizens.filter(
            (u) =>
              (u.fullName || "").toLowerCase().includes(q) ||
              (u.email || "").toLowerCase().includes(q) ||
              (u.mobile || "").includes(q) ||
              (u.citizenId || "").toLowerCase().includes(q)
          )
        : citizens
    );
  }, [search, citizens]);

  const pg = { background: "#F3F5FA", minHeight: "100vh", fontFamily: "'Hanken Grotesk', sans-serif" };
  const card = { background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", overflow: "hidden" };

  return (
    <div style={pg}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "#F3F5FA", borderBottom: "1px solid #E5E9F1", padding: "16px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 72 }}>
        <div>
          <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 2 }}>Constituents</div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: "clamp(16px,2.2vw,26px)", fontWeight: 400, color: "#16233C", margin: 0, letterSpacing: "-.01em" }}>
            Citizen List
          </h1>
        </div>
        {!loading && !error && (
          <span style={{ background: "#EEF2FF", color: "#2B5BD7", font: "700 12px 'Hanken Grotesk'", padding: "4px 14px", borderRadius: 20 }}>
            {citizens.length} total
          </span>
        )}
      </header>

      <div style={{ padding: "28px 34px" }}>
        {/* Search */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid #E1E6F0", borderRadius: 13, padding: "0 14px", maxWidth: 380 }}>
          <MS style={{ fontSize: 18, color: "#8590A6" }}>search</MS>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile…"
            style={{ flex: 1, padding: "11px 0", font: "500 13px 'Hanken Grotesk'", color: "#16233C", border: "none", outline: "none", background: "transparent" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8590A6", padding: 0, fontSize: 16 }}>✕</button>
          )}
        </div>

        <div style={card}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 2fr 1fr 2fr 1.2fr", borderBottom: "1px solid #EAEDF4", background: "#F9FAFC" }}>
            {["#", "Name", "Citizen ID", "Email", "Mobile"].map((h) => (
              <div key={h} style={{ padding: "10px 14px", font: "700 11px 'Hanken Grotesk'", color: "#8590A6", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
            ))}
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ padding: "52px 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#8590A6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <MS style={{ fontSize: 18, color: "#8590A6" }}>sync</MS>Loading…
            </div>
          ) : error ? (
            <div style={{ margin: 24, padding: "12px 16px", background: "#FEF0EF", border: "1px solid #F5C6C2", borderRadius: 12, font: "500 13px 'Hanken Grotesk'", color: "#C8453A", display: "flex", alignItems: "center", gap: 8 }}>
              <MS style={{ fontSize: 17, color: "#C8453A" }}>error</MS>{error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "52px 0", textAlign: "center", font: "500 14px 'Hanken Grotesk'", color: "#8590A6" }}>
              {search ? "No citizens match your search." : "No citizens found."}
            </div>
          ) : (
            filtered.map((u, i) => {
              const name = u.fullName || u.name || "—";
              const isOtp = (u.email || "").includes("@otp.local");
              return (
                <div key={u._id || u.id}
                  style={{ display: "grid", gridTemplateColumns: "48px 2fr 1fr 2fr 1.2fr", borderBottom: i < filtered.length - 1 ? "1px solid #F4F6FA" : "none", background: i % 2 === 0 ? "#fff" : "#FAFBFD", alignItems: "center" }}>

                  {/* # */}
                  <div style={{ padding: "13px 14px", font: "600 12px 'Hanken Grotesk'", color: "#B0B9CC" }}>{i + 1}</div>

                  {/* Name */}
                  <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1B3C8F,#2B5BD7)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px 'Hanken Grotesk'", color: "#fff", flexShrink: 0 }}>
                      {initials(name)}
                    </div>
                    <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{name}</div>
                  </div>

                  {/* Citizen ID */}
                  <div style={{ padding: "13px 14px", font: "500 12px monospace", color: "#64748b" }}>
                    {u.citizenId || "—"}
                  </div>

                  {/* Email */}
                  <div style={{ padding: "13px 14px", font: "500 13px 'Hanken Grotesk'", color: isOtp ? "#B0B9CC" : "#16233C" }}>
                    {isOtp ? <span style={{ fontStyle: "italic", fontSize: 12 }}>OTP login (no email)</span> : (u.email || "—")}
                  </div>

                  {/* Mobile */}
                  <div style={{ padding: "13px 14px", font: "500 13px 'Hanken Grotesk'", color: "#16233C" }}>
                    {formatPhoneDisplay(u.mobile) || "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
