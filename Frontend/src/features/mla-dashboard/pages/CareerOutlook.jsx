import { useState, useEffect, useRef } from "react";
import api from "../../../shared/services/api";
import MLAPageHeader from "../components/MLAPageHeader";
import MIcon from "../../../components/MIcon";

function MS({ children, style }) {
  return <MIcon name={children} style={style} />;
}

// ── Normal CDF (same as ExecutiveDashboard) ────────────────────
function Φ(z) {
  const s = z < 0 ? -1 : 1, x = Math.abs(z);
  const t2 = 1 / (1 + 0.3275911 * x);
  const p  = t2 * (0.254829592 + t2 * (-0.284496736 + t2 * (1.421413741 + t2 * (-1.453152027 + t2 * 1.061405429))));
  return 0.5 + s * 0.5 * (1 - p * Math.exp(-x * x / 2));
}

function deriveElectionOdds(approvalPct) {
  if (approvalPct == null) return { strong: null, comp: null, atRisk: null, voteShare: null };
  const σ = 15;
  const voteShare = Math.max(5, Math.min(95, 0.5 * approvalPct + 25 - 5));
  const strong  = Math.max(1, Math.round((1 - Φ((55 - voteShare) / σ)) * 100));
  const atRisk  = Math.max(1, Math.round(Φ((45 - voteShare) / σ) * 100));
  const comp    = Math.max(1, 100 - strong - atRisk);
  return { strong, comp, atRisk, voteShare: Math.round(voteShare) };
}

function monthsUntil(targetDate) {
  const now   = new Date();
  const end   = new Date(targetDate);
  const years = end.getFullYear() - now.getFullYear();
  const months = end.getMonth() - now.getMonth();
  return Math.max(0, years * 12 + months);
}

// ── Data hook ──────────────────────────────────────────────────
function useCareerData() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      api.get("/api/mla/insights", { params: { days: 365 } }),
      api.get("/api/analytics/dashboard", { params: { days: 365 } }),
      api.get("/api/grievances/", { params: { page: 1, per_page: 100 } }).catch(() => null),
    ])
      .then(([insRes, anRes, grRes]) => {
        // Both mla/insights and analytics/dashboard wrap in success_response → .data.data
        const insights   = insRes?.data?.data  || insRes?.data  || null;
        const analytics  = anRes?.data?.data   || anRes?.data   || null;
        // grievances list is returned as a plain array (no success_response wrapper)
        const grievances = Array.isArray(grRes?.data) ? grRes.data : [];

        // ── Approval % from public sentiment (VADER NLP) ──────────────
        const sentiment = insights?.publicSentiment || null;
        const sentDist  = analytics?.sentimentDistribution || null;
        // Prefer NLP-based positive pct; fall back to rating-based positivePct
        const approvalPct = (sentiment?.hasData && sentiment?.positive?.pct != null)
          ? sentiment.positive.pct
          : (sentDist?.total > 0 ? (sentDist.positivePct ?? null) : null);

        // ── Peer ranking ──────────────────────────────────────────────
        // peerRanking = { wards: [{wardId, wardName, approvalPct, rank}], totalWards, hasData }
        const peerRanking = insights?.peerRanking || null;
        const myWard      = peerRanking?.wards?.[0] || null;  // rank 1 = top ward
        const peers       = peerRanking
          ? { rank: myWard?.rank ?? null, total: peerRanking.totalWards ?? null, wardName: myWard?.wardName ?? null }
          : null;

        // ── Grievance stats from analytics dashboard ──────────────────
        const byStatus = analytics?.grievances?.byStatus || {};
        const resolved = byStatus.RESOLVED ?? 0;
        const total    = analytics?.grievances?.total    ?? 0;

        // ── Category breakdown from live grievance list ───────────────
        const openRoad = grievances.filter(g =>
          ["NEW", "OPEN", "ASSIGNED"].includes(g.status) &&
          (g.categoryId || g.category || "").toUpperCase().includes("ROAD")
        ).length;
        const openTransit = grievances.filter(g =>
          ["NEW", "OPEN", "ASSIGNED"].includes(g.status) &&
          (g.categoryId || g.category || "").toUpperCase().includes("TRANSIT")
        ).length;

        // ── Trend points ──────────────────────────────────────────────
        // sentimentTrend = { points: [{month, approvalPct, positivePct, ...}], hasData }
        const trendPoints = Array.isArray(insights?.sentimentTrend?.points)
          ? insights.sentimentTrend.points
          : [];

        // ── Users & events ────────────────────────────────────────────
        const citizens = analytics?.users?.byRole?.CITIZEN ?? null;
        const totalReg = analytics?.events?.totalRegistrations ?? null;

        setData({
          approvalPct,
          peers,
          resolved, total,
          openRoad, openTransit,
          trendPoints,
          citizens,
          totalReg,
          byStatus,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ── Re-election gauge ──────────────────────────────────────────
function ReelectionGauge({ pct, voteShare, moToElection, momentum }) {
  const filled     = pct != null ? Math.round((pct / 100) * 283) : 0;
  const trend      = momentum ?? 0;
  const trendLabel = trend > 0 ? `up ${trend} pts this year` : trend < 0 ? `down ${Math.abs(trend)} pts this year` : "momentum stable";
  const trendIcon  = trend >= 0 ? "trending_up" : "trending_down";
  const trendColor = trend >= 0 ? "#9FE8C2" : "#F08080";

  return (
    <div style={{
      background: "linear-gradient(165deg,#1B3C8F,#2B5BD7)",
      borderRadius: 22, padding: "26px 28px", color: "#fff",
      display: "flex", flexDirection: "column",
      boxShadow: "0 18px 36px -22px rgba(43,91,215,.7)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ font: "600 13px 'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.82)", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Re-election outlook
        </span>
        <MS style={{ fontSize: 20, color: "rgba(255,255,255,.7)" }}>help</MS>
      </div>

      <div style={{ position: "relative", display: "flex", justifyContent: "center", margin: "6px 0 0" }}>
        <svg viewBox="0 0 220 130" style={{ width: 230, height: "auto" }}>
          <path d="M20,118 A90,90 0 0 1 200,118" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="16" strokeLinecap="round" />
          <path d="M20,118 A90,90 0 0 1 200,118" fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${filled} 283`} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <div style={{ font: "400 48px 'Newsreader',serif", color: "#fff", lineHeight: 1 }}>
            {pct != null ? `${pct}%` : "—"}
          </div>
          <div style={{ font: "600 13px 'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.85)" }}>Likely to hold seat</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "11px 14px", marginTop: 18 }}>
        <MS style={{ fontSize: 20, color: trendColor }}>{trendIcon}</MS>
        <span style={{ font: "600 13px 'Hanken Grotesk',sans-serif", color: "#fff" }}>Momentum — {trendLabel}</span>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 13px" }}>
          <div style={{ font: "400 22px 'Newsreader',serif", color: "#fff" }}>
            {moToElection != null ? `${moToElection} mo` : "—"}
          </div>
          <div style={{ font: "500 11px 'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.78)" }}>to next election</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "12px 13px" }}>
          <div style={{ font: "400 22px 'Newsreader',serif", color: "#fff" }}>
            {voteShare != null ? `${voteShare}%` : "—"}
          </div>
          <div style={{ font: "500 11px 'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.78)" }}>projected vote share</div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ iconName, iconBg, iconColor, label, value, sub, subColor }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 18, padding: 20, boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MS style={{ fontSize: 20, color: iconColor }}>{iconName}</MS>
        </div>
        <span style={{ font: "600 12px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>{label}</span>
      </div>
      <div style={{ font: "400 28px 'Newsreader',serif", color: "#16233C", lineHeight: 1 }}>{value ?? "—"}</div>
      <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: subColor || "#8590A6", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Approval trajectory (driven by sentimentTrend) ─────────────
function TrajectoryChart({ points, approvalPct }) {
  const ELECTION_DATE = new Date("2027-11-01");
  const now = new Date();

  // Build chart points: historical from API + projected endpoint
  const safePoints = Array.isArray(points) ? points : [];
  const hist = safePoints
    .filter(p => p.approvalPct != null || p.positive != null)
    .map(p => ({ pct: p.approvalPct ?? p.positive?.pct ?? p.positivePct ?? null, label: p.month || p.label || "" }))
    .filter(p => p.pct != null);

  const currentPct = approvalPct ?? (hist.length ? hist[hist.length - 1].pct : null);
  const projPct    = currentPct != null ? Math.min(95, currentPct + 4) : null;

  const W = 920, H = 280;
  const PAD_L = 44, PAD_R = 10, PAD_T = 50, PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const toX = (ratio) => PAD_L + ratio * chartW;
  const toY = (pct)   => PAD_T + chartH - ((pct - 40) / 40) * chartH; // 40–80% range
  const winY = toY(50);

  // Historical points mapped to x=0..0.6 (today at 60%)
  const histPts = hist.map((p, i) => ({
    x: toX(hist.length > 1 ? (i / (hist.length - 1)) * 0.6 : 0),
    y: toY(Math.max(40, Math.min(80, p.pct))),
    label: p.label,
  }));
  const todayX = toX(0.6);
  const todayY = currentPct != null ? toY(Math.max(40, Math.min(80, currentPct))) : null;
  const projX  = toX(1);
  const projY  = projPct != null ? toY(Math.max(40, Math.min(80, projPct))) : null;

  const histLine = histPts.length > 0
    ? histPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
      (todayY != null ? ` L${todayX},${todayY}` : "")
    : (todayY != null ? `M${PAD_L},${todayY} L${todayX},${todayY}` : null);

  const histFill = histLine ? `${histLine} L${todayX},${PAD_T + chartH} L${PAD_L},${PAD_T + chartH} Z` : null;

  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "26px 28px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ font: "700 16px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>Approval trajectory</div>
          <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: "#8590A6", marginTop: 2 }}>
            Sentiment trend to date · projected to the 2027 election · dashed line = 50% win line
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["#2B5BD7","Actual"],["#1E8A5B","Projected"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 3, borderRadius: 2, background: c, display: "inline-block" }} />
              <span style={{ font: "600 12px 'Hanken Grotesk',sans-serif", color: "#5A6678" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {histLine ? (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <linearGradient id="coFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B5BD7" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#2B5BD7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[40,50,60,70,80].map(v => (
            <g key={v}>
              <line x1={PAD_L} y1={toY(v)} x2={W - PAD_R} y2={toY(v)} stroke="#EEF1F7" />
              <text x={0} y={toY(v) + 4} fontFamily="Hanken Grotesk" fontSize="11" fontWeight="600" fill="#9AA3B5">{v}%</text>
            </g>
          ))}
          {/* 50% win line */}
          <line x1={PAD_L} y1={winY} x2={W - PAD_R} y2={winY} stroke="#C8453A" strokeWidth="1.5" strokeDasharray="6 5" />
          <text x={W - 90} y={winY - 5} fontFamily="Hanken Grotesk" fontSize="11" fontWeight="700" fill="#C8453A">50% win line</text>
          {/* Today divider */}
          <line x1={todayX} y1={PAD_T - 16} x2={todayX} y2={PAD_T + chartH} stroke="#D8DEEA" strokeWidth="1.5" strokeDasharray="4 5" />
          <text x={todayX} y={PAD_T - 20} textAnchor="middle" fontFamily="Hanken Grotesk" fontSize="11" fontWeight="700" fill="#2B5BD7">TODAY</text>
          {/* Actual fill + line */}
          {histFill && <path d={histFill} fill="url(#coFill)" />}
          {histLine && <path d={histLine} fill="none" stroke="#2B5BD7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
          {/* Projected cone */}
          {todayY != null && projY != null && (
            <>
              <path d={`M${todayX},${todayY} L${projX},${projY - 20} L${projX},${projY + 20} Z`} fill="#1E8A5B" fillOpacity="0.10" />
              <polyline points={`${todayX},${todayY} ${projX},${projY}`} fill="none" stroke="#1E8A5B" strokeWidth="3.5" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={projX} cy={projY} r="6.5" fill="#1E8A5B" stroke="#fff" strokeWidth="3" />
            </>
          )}
          {/* Dots */}
          {histPts.length > 0 && <circle cx={histPts[0].x} cy={histPts[0].y} r="5.5" fill="#2B5BD7" stroke="#fff" strokeWidth="2.5" />}
          {todayY != null && <circle cx={todayX} cy={todayY} r="6.5" fill="#2B5BD7" stroke="#fff" strokeWidth="3" />}
        </svg>
      ) : (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFC", borderRadius: 12 }}>
          <span style={{ font: "500 13px 'Hanken Grotesk'", color: "#C0C7D4" }}>No trend data available</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingLeft: PAD_L }}>
        {hist.length > 0 && <span style={{ font: "600 11px 'Hanken Grotesk',sans-serif", color: "#9AA3B5" }}>{hist[0].label} · {Math.round(hist[0].pct)}%</span>}
        <span style={{ font: "700 11px 'Hanken Grotesk',sans-serif", color: "#2B5BD7" }}>Today · {currentPct != null ? `${Math.round(currentPct)}%` : "—"}</span>
        {projPct != null && <span style={{ font: "600 11px 'Hanken Grotesk',sans-serif", color: "#1E7A50" }}>Election '27 · ~{projPct}%</span>}
      </div>
    </div>
  );
}

// ── Election scenarios ─────────────────────────────────────────
function ElectionScenarios({ strong, comp, atRisk }) {
  const scenarios = [
    {
      icon: "verified", iconColor: "#1E8A5B",
      label: "Strong re-election", pct: strong, barColor: "#2B5BD7",
      desc: "Hold approval momentum, close open reports → strong majority vote share.",
      active: true,
    },
    {
      icon: "balance", iconColor: "#C9871F",
      label: "Competitive race", pct: comp, barColor: "#C9871F",
      desc: "Approval dips; credible challenger emerges from opposition.",
    },
    {
      icon: "warning", iconColor: "#C8453A",
      label: "At-risk", pct: atRisk, barColor: "#C8453A",
      desc: "Stalled complaints plus sustained drop in constituent sentiment.",
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ font: "700 16px 'Hanken Grotesk',sans-serif", color: "#16233C", marginBottom: 3 }}>Election scenarios</div>
      <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: "#8590A6", marginBottom: 18 }}>
        Modeled from current sentiment & complaint resolution rates
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {scenarios.map((s) => (
          <div key={s.label} style={{
            border: s.active ? "1.5px solid #2B5BD7" : "1px solid #EEF1F7",
            background: s.active ? "#F5F8FF" : "#fff",
            borderRadius: 15, padding: "16px 18px",
            boxShadow: s.active ? "0 0 0 3px rgba(43,91,215,.06)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, font: "700 15px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>
                <MS style={{ fontSize: 20, color: s.iconColor }}>{s.icon}</MS>
                {s.label}
              </span>
              <span style={{ font: "400 24px 'Newsreader',serif", color: s.barColor }}>
                {s.pct != null ? `${s.pct}%` : "—"}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: s.active ? "#E1E6F0" : "#EEF1F7" }}>
              <div style={{ width: `${s.pct ?? 0}%`, height: "100%", borderRadius: 4, background: s.barColor }} />
            </div>
            <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: "#5A6678", marginTop: 10 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Road to 2027 ───────────────────────────────────────────────
function RoadTo2027() {
  const milestones = [
    { label: "Mid-term review",   sub: "Now · performance tracked",  done: true  },
    { label: "Budget cycle vote", sub: "Q4 2026",                    done: false },
    { label: "Campaign opens",    sub: "Q1 2027",                    done: false },
    { label: "Election day",      sub: "Nov 2027",                   done: false, last: true },
  ];
  return (
    <div style={{ background: "#fff", border: "1px solid #EAEDF4", borderRadius: 22, padding: "24px 26px", boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)" }}>
      <div style={{ font: "700 16px 'Hanken Grotesk',sans-serif", color: "#16233C", marginBottom: 18 }}>Road to 2027</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {milestones.map((m) => (
          <div key={m.label} style={{ display: "flex", gap: 13 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{
                width: 13, height: 13, borderRadius: "50%", flexShrink: 0,
                background: m.done ? "#2B5BD7" : "#fff",
                border: m.done ? "none" : "2px solid #C2CADA",
              }} />
              {!m.last && <span style={{ width: 2, flex: 1, minHeight: 18, background: m.done ? "#2B5BD7" : "#E1E6F0" }} />}
            </div>
            <div style={{ paddingBottom: m.last ? 0 : 16 }}>
              <div style={{ font: "700 13px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>{m.label}</div>
              <div style={{ font: "500 12px 'Hanken Grotesk',sans-serif", color: "#8590A6" }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Levers ─────────────────────────────────────────────────────
function Levers({ openRoad, openTransit, resolved, total }) {
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : null;
  const levers = [
    {
      icon: "arrow_upward", color: "#1E8A5B",
      text: openRoad > 0
        ? `Close ${openRoad} open road report${openRoad > 1 ? "s" : ""} to boost approval`
        : "All road complaints resolved — maintain momentum",
      delta: openRoad > 0 ? `+${Math.min(5, openRoad).toFixed(1)}` : "+0.0",
      pos: true,
    },
    {
      icon: "arrow_upward", color: "#1E8A5B",
      text: resolutionRate != null
        ? `Resolution rate is ${resolutionRate}% — target 80%+`
        : "Improve complaint resolution rate",
      delta: resolutionRate != null && resolutionRate < 80 ? `+${Math.round((80 - resolutionRate) / 10 * 2.1)}` : "+2.1",
      pos: true,
    },
    {
      icon: "arrow_downward", color: "#C8453A",
      text: openTransit > 0
        ? `${openTransit} unresolved transit complaint${openTransit > 1 ? "s" : ""} dragging sentiment`
        : "No open transit complaints — good standing",
      delta: openTransit > 0 ? `−${Math.min(3, openTransit).toFixed(1)}` : "0.0",
      pos: openTransit === 0,
    },
  ];

  return (
    <div style={{ background: "#F5F8FF", border: "1px solid #DCE6FA", borderRadius: 22, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <MS style={{ fontSize: 20, color: "#2B5BD7" }}>lightbulb</MS>
        <span style={{ font: "700 15px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>Levers that move your odds</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {levers.map((l) => (
          <div key={l.text} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <MS style={{ fontSize: 18, color: l.color, flexShrink: 0, marginTop: 1 }}>{l.icon}</MS>
            <span style={{ flex: 1, font: "500 13px 'Hanken Grotesk',sans-serif", color: "#3A4760" }}>{l.text}</span>
            <span style={{ font: "700 13px 'Hanken Grotesk',sans-serif", color: l.pos ? "#1E7A50" : "#C8453A", flexShrink: 0 }}>{l.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────
function Skeleton({ h = 200, radius = 18 }) {
  return (
    <div style={{
      height: h, borderRadius: radius,
      background: "linear-gradient(90deg,#F0F2F7 25%,#E4E8F0 50%,#F0F2F7 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

// ── Helpers ────────────────────────────────────────────────────
function getElectionDate() {
  // Try to read from the logged-in user's profile (set during registration)
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.electionDate) return u.electionDate;          // "YYYY-MM-DD"
      if (u?.termEndDate)  return u.termEndDate;
    }
  } catch (_) {}
  return "2027-11-01";                                     // Karnataka default
}

function formatElectionLabel(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

// ── Main page ──────────────────────────────────────────────────
export default function CareerOutlook() {
  const { data, loading, error } = useCareerData();
  const contentRef  = useRef(null);
  const [exporting, setExporting] = useState(false);

  const ELECTION_DATE  = getElectionDate();
  const electionLabel  = formatElectionLabel(ELECTION_DATE);
  const moToElection   = monthsUntil(ELECTION_DATE);

  // Derive odds from real approval pct
  const odds = data ? deriveElectionOdds(data.approvalPct) : {};

  // Field position string
  const peers      = data?.peers;
  const rankLabel  = peers?.rank && peers?.total
    ? `#${peers.rank} of ${peers.total}`
    : peers?.position || "—";
  const posLabel   = peers?.rank <= Math.ceil((peers?.total || 4) / 4)
    ? "Front-runner" : peers?.rank <= Math.ceil((peers?.total || 4) / 2)
    ? "Strong position" : "Mid-field";

  // Momentum: compare first and last trend points
  const trend = data?.trendPoints || [];
  const momentum = trend.length >= 2
    ? Math.round((trend[trend.length - 1].approvalPct ?? trend[trend.length - 1].positivePct ?? 0) -
                 (trend[0].approvalPct ?? trend[0].positivePct ?? 0))
    : null;

  // ── PDF export ─────────────────────────────────────────────────
  async function handleExport() {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F4F6FA",
        logging: false,
      });

      const imgW  = 210;                              // A4 width in mm
      const imgH  = (canvas.height * imgW) / canvas.width;
      const pdf   = new jsPDF({ orientation: imgH > 297 ? "p" : "p", unit: "mm", format: "a4" });

      let yOffset = 0;
      const pageH = 297;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0, -yOffset,
          imgW, imgH
        );
        yOffset += pageH;
      }

      const rep  = (() => { try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"); } catch { return {}; } })();
      const name = (rep?.fullName || rep?.name || "Career").replace(/\s+/g, "_");
      pdf.save(`${name}_Career_Outlook_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();   // graceful fallback
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <MLAPageHeader subtitle={`Your trajectory toward the ${new Date(ELECTION_DATE).getFullYear()} election`} title="Career outlook">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ height: 44, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 9, padding: "0 15px" }}>
            <MS style={{ fontSize: 19, color: "#2B5BD7" }}>flag</MS>
            <span style={{ font: "600 14px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>Election · {electionLabel}</span>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ height: 44, background: "#fff", border: "1px solid #E1E6F0", borderRadius: 13, display: "flex", alignItems: "center", gap: 8, padding: "0 15px", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.7 : 1 }}
          >
            <MS style={{ fontSize: 19, color: "#5A6678" }}>{exporting ? "hourglass_top" : "ios_share"}</MS>
            <span style={{ font: "600 14px 'Hanken Grotesk',sans-serif", color: "#16233C" }}>{exporting ? "Exporting…" : "Export PDF"}</span>
          </button>
        </div>
      </MLAPageHeader>

      <div ref={contentRef} style={{ padding: "28px 34px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: "16px 20px", color: "#B91C1C", font: "500 13px 'Hanken Grotesk',sans-serif" }}>
            ⚠️ Could not load career data. Check your connection and try refreshing.
          </div>
        )}

        {/* Row 1: gauge + stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.55fr", gap: 20 }}>
          {loading ? <Skeleton h={340} /> : (
            <ReelectionGauge
              pct={odds.strong}
              voteShare={odds.voteShare}
              moToElection={moToElection}
              momentum={momentum}
            />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16 }}>
            {loading ? (
              <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></>
            ) : (
              <>
                <StatCard
                  iconName="leaderboard" iconBg="#E7EEFF" iconColor="#2B5BD7"
                  label="Field position" value={posLabel}
                  sub={rankLabel + (peers?.total ? " · top quartile" : "")}
                />
                <StatCard
                  iconName="how_to_vote" iconBg="#E6F4EC" iconColor="#1E8A5B"
                  label="Registered citizens" value={data?.citizens != null ? data.citizens.toLocaleString() : "—"}
                  sub="Constituent base" subColor="#1E7A50"
                />
                <StatCard
                  iconName="task_alt" iconBg="#FCF1E0" iconColor="#C9871F"
                  label="Complaints closed"
                  value={data?.resolved != null ? `${data.resolved}/${data.total}` : "—"}
                  sub={data?.total > 0 ? `${Math.round((data.resolved / data.total) * 100)}% resolution rate` : "No data"}
                />
                <StatCard
                  iconName="campaign" iconBg="#EDEAFB" iconColor="#6B4FD8"
                  label="Event registrations" value={data?.totalReg != null ? data.totalReg.toLocaleString() : "—"}
                  sub="Constituent engagement" subColor="#1E7A50"
                />
              </>
            )}
          </div>
        </div>

        {/* Row 2: trajectory chart */}
        {loading ? <Skeleton h={340} /> : (
          <TrajectoryChart points={data?.trendPoints} approvalPct={data?.approvalPct} />
        )}

        {/* Row 3: scenarios + road + levers */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          {loading ? <Skeleton h={380} /> : (
            <ElectionScenarios strong={odds.strong} comp={odds.comp} atRisk={odds.atRisk} />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <RoadTo2027 />
            {loading ? <Skeleton h={160} /> : (
              <Levers
                openRoad={data?.openRoad ?? 0}
                openTransit={data?.openTransit ?? 0}
                resolved={data?.resolved ?? 0}
                total={data?.total ?? 0}
              />
            )}
          </div>
        </div>

      </div>
    </>
  );
}
