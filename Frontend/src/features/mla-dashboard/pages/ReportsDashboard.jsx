import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../shared/services/api";
import MIcon from "../../../components/MIcon";
import ExportButton from "../../../components/ExportButton";
import { getRepRolePrefix } from "../../../services/authStorage";
import {
  RiTimeLine,
  RiSearchLine,
  RiArrowDownSLine,
  RiInformationLine,
  RiAlarmWarningLine,
  RiFileListLine,
  RiBarChart2Line,
} from "react-icons/ri";

/* ── category metadata ─────────────────────── */
const CATEGORY_META = {
  WATER_SUPPLY:    { label: "Water",       icon: "water_drop", bg: "#FBEAE8", color: "#C8453A" },
  ROAD_ISSUE:      { label: "Roads",       icon: "road",       bg: "#E3E9F5", color: "#4B5E80" },
  ELECTRICITY:     { label: "Electricity", icon: "bolt",       bg: "#E7EEFF", color: "#2B5BD7" },
  GARBAGE:         { label: "Sanitation",  icon: "trash",      bg: "#F0EBF8", color: "#6B4FD8" },
  NOISE_POLLUTION: { label: "Noise",       icon: "noise",      bg: "#FCF1E0", color: "#C9871F" },
  OTHER:           { label: "Other",       icon: "clipboard",  bg: "#EEF1F7", color: "#8590A6" },
};

/* Match a category name or ID to CATEGORY_META — fuzzy, case-insensitive */
function resolveCatMeta(catId, catMap) {
  if (!catId) return CATEGORY_META.OTHER;
  // Direct enum key match (e.g. "WATER_SUPPLY")
  if (CATEGORY_META[catId]) return CATEGORY_META[catId];
  // Look up human-readable name via the map
  const name = (catMap[catId] || catId || "").toLowerCase();
  if (name.includes("water")) return CATEGORY_META.WATER_SUPPLY;
  if (name.includes("road") || name.includes("pothole") || name.includes("street"))
    return CATEGORY_META.ROAD_ISSUE;
  if (name.includes("electric") || name.includes("light") || name.includes("power"))
    return CATEGORY_META.ELECTRICITY;
  if (name.includes("garbage") || name.includes("waste") || name.includes("sanit") || name.includes("trash"))
    return CATEGORY_META.GARBAGE;
  if (name.includes("noise") || name.includes("sound") || name.includes("volume"))
    return CATEGORY_META.NOISE_POLLUTION;
  return CATEGORY_META.OTHER;
}

const PRIORITY_COLORS = {
  CRITICAL: { bg: "#FBEAE8", color: "#C8453A" },
  HIGH:     { bg: "#FCF1E0", color: "#C9871F" },
  MEDIUM:   { bg: "#E7EEFF", color: "#2B5BD7" },
  LOW:      { bg: "#E6F4EC", color: "#1E7A50" },
};

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function impactRationale(g) {
  const parts = [];
  if (g.ageDays > 0) parts.push(`Unresolved for ${g.ageDays} day${g.ageDays !== 1 ? "s" : ""}`);
  if (g.volumePct > 0) parts.push(`${g.volumePct}% of all new complaints are in this category`);
  if (parts.length === 0) {
    return g.priority === "CRITICAL" ? "Critical — needs immediate attention"
         : g.priority === "HIGH"     ? "High priority issue"
         : "Resolving this improves service satisfaction";
  }
  return parts.join(" · ");
}

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
}

function statusBadge(status) {
  switch (status) {
    case "NEW":         return { label: "New",         bg: "#FBEAE8", color: "#C8453A" };
    case "ASSIGNED":    return { label: "In progress", bg: "#FCF1E0", color: "#B5781A" };
    case "IN_PROGRESS": return { label: "In progress", bg: "#FCF1E0", color: "#B5781A" };
    case "ON_HOLD":     return { label: "In review",   bg: "#E7EEFF", color: "#2B5BD7" };
    case "RESOLVED":    return { label: "Resolved",    bg: "#E6F4EC", color: "#1E7A50" };
    case "CLOSED":      return { label: "Resolved",    bg: "#E6F4EC", color: "#1E7A50" };
    case "REJECTED":    return { label: "Rejected",    bg: "#EEF1F7", color: "#8590A6" };
    default:            return { label: status || "—", bg: "#EEF1F7", color: "#8590A6" };
  }
}

const STATUS_TABS = [
  { label: "All",         filter: () => true },
  { label: "New",         filter: (g) => g.status === "NEW" },
  { label: "In progress", filter: (g) => ["ASSIGNED", "IN_PROGRESS"].includes(g.status) },
  { label: "Resolved",    filter: (g) => ["RESOLVED", "CLOSED"].includes(g.status) },
];

/* ── skeleton ─────────────────────────────── */
function KpiSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ border: "1px solid #EAEDF4", borderRadius: 18, height: 100,
          background: "linear-gradient(90deg,#f0f2f7 25%,#fafbfd 50%,#f0f2f7 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function ReportsDashboard() {
  const pageRef = useRef(null);
  const _cachedReportStats = (() => { try { const v = sessionStorage.getItem("mla_reports_stats_cache"); return v ? JSON.parse(v) : null; } catch { return null; } })();
  const [stats, setStats]           = useState(_cachedReportStats);
  const [grievances, setGrievances] = useState([]);
  const [catMap, setCatMap]         = useState({}); // categoryId → categoryName
  const [loading, setLoading]       = useState(!_cachedReportStats);
  const [activeTab, setActiveTab]   = useState("All");
  const [searchQ, setSearchQ]       = useState("");
  const [catFilter, setCatFilter]   = useState("All categories");
  const [sortMode, setSortMode]     = useState("Most urgent");

  const load = useCallback(async () => {
    try {
      // /api/grievances/reports/stats and the citizen-scoped /api/grievances/
      // list don't apply to a representative — the real endpoints are under
      // /api/rep/grievances/. All three responses are wrapped in the
      // standard {success,message,data} envelope, which wasn't being unwrapped.
      const [statsRes, listRes, catsRes] = await Promise.all([
        api.get("/api/rep/grievances/stats"),
        api.get("/api/rep/grievances/", { params: { per_page: 100 } }),
        api.get("/api/grievances/categories"),
      ]);
      const freshStats = statsRes.data?.data ?? null;
      if (freshStats) { try { sessionStorage.setItem("mla_reports_stats_cache", JSON.stringify(freshStats)); } catch {} }
      setStats(freshStats);
      const gList = listRes.data?.data?.items ?? [];
      setGrievances(gList);
      // Build id → name map from categories
      const map = {};
      const cats = catsRes.data?.data ?? [];
      cats.forEach(c => {
        const id = c.id || c._id;
        if (id) map[id] = c.categoryName || c.name || "";
        // also key by categoryName itself for enum-style lookups
        if (c.categoryName) map[c.categoryName] = c.categoryName;
      });
      setCatMap(map);
    } catch (e) {
      console.error("ReportsDashboard load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── derived data ── */
  const kpi = stats?.kpi || {};
  const topUnassigned = stats?.topUnassigned || [];

  const tabDef = STATUS_TABS.find(t => t.label === activeTab) || STATUS_TABS[0];
  const catLabels = ["All categories", ...Object.values(CATEGORY_META).map(m => m.label)];

  const filtered = grievances
    .filter(tabDef.filter)
    .filter(g => catFilter === "All categories" || resolveCatMeta(g.category || g.categoryId, catMap).label === catFilter)
    .filter(g => {
      if (!searchQ) return true;
      const q = searchQ.toLowerCase();
      return (g.description || "").toLowerCase().includes(q)
        || (g.address || "").toLowerCase().includes(q)
        || (g.wardId || "").toLowerCase().includes(q)
        || (g.complaintNumber || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortMode === "Most urgent") return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (sortMode === "Most recent") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });

  const tabCounts = {};
  STATUS_TABS.forEach(t => { tabCounts[t.label] = grievances.filter(t.filter).length; });

  const totalImpact = topUnassigned.reduce((s, g) => s + (g.impact || 0), 0).toFixed(1);

  /* ── Export column definitions — used by ExportButton ── */
  const exportColumns = [
    { key: "complaintNumber",    label: "Complaint #" },
    { key: "description",        label: "Description" },
    { key: "_categoryLabel",     label: "Category" },
    { key: "address",            label: "Address" },
    { key: "wardId",             label: "Ward" },
    { key: "status",             label: "Status" },
    { key: "priority",           label: "Priority" },
    { key: "_assignedOfficer",   label: "Assigned To" },
    { key: "_reportedOn",        label: "Reported On" },
  ];

  // Enrich filtered rows with derived fields so ExportButton can use flat keys
  const exportData = filtered.map((g) => {
    const meta = resolveCatMeta(g.category || g.categoryId, catMap);
    // Prefer the resolved name; fall back to "Assigned" if only an ID exists, else "Unassigned"
    const assignedOfficer = g.assignedOfficerName
      || g.officerName
      || g.assignedOfficer?.name
      || (g.assignedOfficerId ? "Assigned" : "Unassigned");
    return {
      ...g,
      _categoryLabel:    meta.label,
      _reportedOn:       g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "",
      _assignedOfficer:  assignedOfficer,
    };
  });

  /* ── render ── */
  return (
    <div ref={pageRef} style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F3F5FA", overflowY: "auto" }}>

      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 34px", background: "#F3F5FA",
        position: "sticky", top: 0, zIndex: 10,
        borderBottom: "1px solid #E5E9F1",
      }}>
        <div>
          <div style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif", fontWeight: 500, fontSize: 13, color: "#8590A6", marginBottom: 3 }}>
            Issues your residents have reported
          </div>
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 30, color: "#16233C", margin: 0, letterSpacing: "-0.01em" }}>
            Reports
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search */}
          <div style={{ height: 44, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 9, padding: "0 15px", width: 260 }}>
            <RiSearchLine style={{ fontSize: 19, color: "#9AA3B5", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search reports"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 14, color: "#16233C", width: "100%" }}
            />
          </div>
          {/* Export */}
          <ExportButton
            filename={`${getRepRolePrefix()}-reports-${activeTab.toLowerCase().replace(/\s/g, "-")}`}
            pdfRef={pageRef}
            pdfOrientation="portrait"
            data={exportData}
            columns={exportColumns}
            disabled={loading || filtered.length === 0}
          />
        </div>
      </header>

      <div style={{ padding: "28px 34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── KPI Strip ── */}
        {!stats ? <KpiSkeleton /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>

            {/* Needs attention */}
            <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FBEAE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RiAlarmWarningLine style={{ fontSize: 20, color: "#C8453A" }} />
                </div>
                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: "#8590A6" }}>Needs attention</span>
              </div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 32, color: "#C8453A", lineHeight: 1 }}>{kpi.needsAttention ?? 0}</div>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#8590A6", marginTop: 3 }}>New &amp; unassigned</div>
            </div>

            {/* In progress */}
            <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FCF1E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RiTimeLine style={{ fontSize: 20, color: "#C9871F" }} />
                </div>
                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: "#8590A6" }}>In progress</span>
              </div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 32, color: "#16233C", lineHeight: 1 }}>{kpi.inProgress ?? 0}</div>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#8590A6", marginTop: 3 }}>Assigned to departments</div>
            </div>

            {/* Resolved 30d */}
            <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E6F4EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RiFileListLine style={{ fontSize: 20, color: "#1E8A5B" }} />
                </div>
                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: "#8590A6" }}>Resolved · 30d</span>
              </div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 32, color: "#16233C", lineHeight: 1 }}>{kpi.resolved30d ?? 0}</div>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: (kpi.resolvedDelta ?? 0) >= 0 ? "#1E7A50" : "#C8453A", marginTop: 3 }}>
                {(kpi.resolvedDelta ?? 0) >= 0 ? `+${kpi.resolvedDelta}` : kpi.resolvedDelta} vs. previous month
              </div>
            </div>

            {/* Avg resolution */}
            <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: "18px 20px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E7EEFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RiTimeLine style={{ fontSize: 20, color: "#2B5BD7" }} />
                </div>
                <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 12, color: "#8590A6" }}>Avg. resolution</span>
              </div>
              <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 32, color: "#16233C", lineHeight: 1 }}>
                {kpi.avgResolutionDays ?? 0}
                <span style={{ fontSize: 18, color: "#8590A6" }}> days</span>
              </div>
              <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#1E7A50", marginTop: 3 }}>Based on resolved complaints</div>
            </div>

          </div>
        )}

        {/* ── Insight Panel ── */}
        {!loading && topUnassigned.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", overflow: "hidden" }}>
            {/* Blue gradient header */}
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "22px 24px", background: "linear-gradient(110deg,#1B3C8F,#2B5BD7)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RiBarChart2Line style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fix these first to lift your approval</div>
                <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12.5, color: "rgba(255,255,255,.82)" }}>
                  Your {kpi.needsAttention} needs-attention reports, ranked by projected impact on approval
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 30, color: "#fff", lineHeight: 1 }}>
                  +{totalImpact}
                  <span style={{ fontSize: 16, color: "rgba(255,255,255,.8)" }}> pts</span>
                </div>
                <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 11, color: "rgba(255,255,255,.78)" }}>if all are resolved this quarter</div>
              </div>
            </div>

            {/* Ranked rows */}
            {topUnassigned.map((g, idx) => {
              const meta = resolveCatMeta(g.category || g.categoryId, catMap);

              return (
                <div key={g.id} style={{
                  display: "grid", gridTemplateColumns: "34px 48px 2.3fr 1.5fr 90px",
                  gap: 16, alignItems: "center", padding: "16px 24px",
                  borderBottom: idx < topUnassigned.length - 1 ? "1px solid #F4F6FA" : "none",
                }}>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 400, fontSize: 22, color: "#2B5BD7" }}>{idx + 1}</span>

                  <div style={{ width: 42, height: 42, borderRadius: 11, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MIcon name={meta.icon} style={{ fontSize: 20, color: meta.color }} />
                  </div>

                  <div>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#16233C", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(g.description || "—").slice(0, 65)}{(g.description?.length || 0) > 65 ? "…" : ""}
                    </div>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#8590A6" }}>
                      {meta.label}
                      {g.relatedCount > 0 ? ` · ${g.relatedCount} related` : ""}
                      {g.wardId ? ` · ${g.wardId}` : ""}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, lineHeight: 1.4, color: "#5A6678" }}>
                      {impactRationale(g)}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#1E7A50" }}>+{g.impact} pts</div>
                    <div style={{ height: 6, borderRadius: 4, background: "#EEF1F7", marginTop: 5 }}>
                      <div style={{ width: `${Math.min(100, (g.impact / 2) * 100)}%`, height: "100%", borderRadius: 4, background: "#1E8A5B" }} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Info footer */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 24px", background: "#F7F9FC", borderTop: "1px solid #F0F2F7" }}>
              <RiInformationLine style={{ fontSize: 18, color: "#2B5BD7", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12.5, color: "#5A6678" }}>
                Impact is estimated from complaint priority, residents affected, category urgency, and resolution history.
              </span>
            </div>
          </div>
        )}

        {/* ── Reports List ── */}
        <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #F0F2F7", gap: 12, flexWrap: "wrap" }}>
            {/* Status tabs */}
            <div style={{ display: "flex", gap: 6, background: "#F1F4F9", borderRadius: 11, padding: 4 }}>
              {STATUS_TABS.map(tab => {
                const count = tabCounts[tab.label] ?? 0;
                const isActive = activeTab === tab.label;
                return (
                  <button key={tab.label} onClick={() => setActiveTab(tab.label)} style={{
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontWeight: isActive ? 700 : 600,
                    fontSize: 13,
                    color: isActive ? "#fff" : tab.label === "New" && count > 0 ? "#C8453A" : "#7A839A",
                    background: isActive ? "#2B5BD7" : "transparent",
                    padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all .15s",
                  }}>
                    {tab.label}{count > 0 ? ` · ${count}` : ""}
                  </button>
                );
              })}
            </div>

            {/* Dropdowns */}
            <div style={{ display: "flex", gap: 10 }}>
              {/* Category filter */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{
                  height: 40, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 11,
                  padding: "0 36px 0 13px", fontFamily: "'Hanken Grotesk', sans-serif",
                  fontWeight: 600, fontSize: 13, color: "#16233C", cursor: "pointer",
                  appearance: "none", outline: "none",
                }}>
                  {catLabels.map(c => <option key={c}>{c}</option>)}
                </select>
                <RiArrowDownSLine style={{ position: "absolute", right: 8, color: "#9AA3B5", pointerEvents: "none" }} />
              </div>
              {/* Sort */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{
                  height: 40, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 11,
                  padding: "0 36px 0 13px", fontFamily: "'Hanken Grotesk', sans-serif",
                  fontWeight: 600, fontSize: 13, color: "#16233C", cursor: "pointer",
                  appearance: "none", outline: "none",
                }}>
                  <option>Most urgent</option>
                  <option>Most recent</option>
                </select>
                <RiArrowDownSLine style={{ position: "absolute", right: 8, color: "#9AA3B5", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "60px 2.4fr 1.1fr 1fr", gap: 16, padding: "12px 22px", background: "#FAFBFD", borderBottom: "1px solid #F0F2F7" }}>
            {["", "Issue", "Status", "Priority"].map((h, i) => (
              <span key={i} style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 11, color: "#9AA3B5", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {loading && grievances.length === 0 ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ height: 80, borderBottom: "1px solid #F4F6FA", background: i % 2 ? "#FAFBFD" : "#fff", opacity: 0.4 }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 14, color: "#8590A6" }}>
                No reports{activeTab !== "All" ? ` in "${activeTab}"` : ""}{searchQ ? ` matching "${searchQ}"` : ""}
              </div>
            ) : filtered.map((g, idx) => {
              const meta    = resolveCatMeta(g.category || g.categoryId, catMap);
              const badge   = statusBadge(g.status);
              const priCol  = PRIORITY_COLORS[g.priority] || PRIORITY_COLORS.MEDIUM;
              const isNew   = g.status === "NEW";
              const isInProg = ["ASSIGNED", "IN_PROGRESS"].includes(g.status);
              // hatched bg for non-new
              const iconBg = isNew
                ? meta.bg
                : "repeating-linear-gradient(45deg,#E3E9F5,#E3E9F5 8px,#EDF1F9 8px,#EDF1F9 16px)";
              const iconColor = isNew ? meta.color : "#9AA7BD";

              return (
                <div key={g.id || g._id || idx}

                  style={{
                    display: "grid", gridTemplateColumns: "60px 2.4fr 1.1fr 1fr",
                    gap: 16, alignItems: "center", padding: "16px 22px",
                    borderBottom: idx < filtered.length - 1 ? "1px solid #F4F6FA" : "none",
                    borderLeft: `3px solid ${isNew ? "#C8453A" : "transparent"}`,
                    background: isNew ? "#FEFAFA" : "#fff",
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 11, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MIcon name={meta.icon} style={{ fontSize: isNew ? 22 : 18, color: iconColor }} />
                  </div>

                  {/* Issue */}
                  <div>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#16233C", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(g.description || "—").slice(0, 72)}{(g.description?.length || 0) > 72 ? "…" : ""}
                    </div>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#8590A6" }}>
                      {meta.label}
                      {g.address ? ` · ${g.address.slice(0, 35)}` : ""}
                      {g.createdAt ? ` · ${timeAgo(g.createdAt)}` : ""}
                      {g.complaintNumber ? ` · #${g.complaintNumber}` : ""}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ background: badge.bg, color: badge.color, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 11, padding: "5px 11px", borderRadius: 20 }}>
                      {badge.label}{isNew && g.priority === "CRITICAL" ? " · Urgent" : ""}
                    </span>
                  </div>

                  {/* Priority */}
                  <div>
                    <span style={{ background: priCol.bg, color: priCol.color, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 20 }}>
                      {g.priority || "MEDIUM"}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
