import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/services/api";
import MLAPageHeader from "../components/MLAPageHeader";
import MIcon from "../../../components/MIcon";
import { ROUTES } from "../../../app/routes/RouteConstants";

// ── Utilities ──────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#2B5BD7","#1E8A5B","#6B4FD8","#C9871F","#C8453A","#5C84E0","#16233C","#0E7490"];
function avatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function timeAgo(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const CATEGORY_ICONS = {
  WATER_SUPPLY:    { icon: "water_drop",  color: "#2B5BD7", bg: "#E7EEFF" },
  ROAD_ISSUE:      { icon: "edit_road",   color: "#C9871F", bg: "#FCF1E0" },
  ELECTRICITY:     { icon: "bolt",        color: "#6B4FD8", bg: "#EDEAFB" },
  GARBAGE:         { icon: "delete",      color: "#1E8A5B", bg: "#E6F4EC" },
  NOISE_POLLUTION: { icon: "volume_up",   color: "#C8453A", bg: "#FBEAE8" },
  OTHER:           { icon: "help_outline",color: "#8590A6", bg: "#F1F4F9" },
};

function categoryMeta(cat) {
  const key = (cat || "OTHER").toUpperCase().replace(/\s+/g, "_");
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.OTHER;
}

function statusColor(s) {
  return { NEW:"#2B5BD7", ASSIGNED:"#C9871F", IN_PROGRESS:"#6B4FD8", RESOLVED:"#1E8A5B", CLOSED:"#8590A6", ON_HOLD:"#C8453A" }[s] || "#8590A6";
}

// Build a message thread from a grievance
function buildThread(g) {
  const thread = [];
  if (g?.description) {
    thread.push({
      sender: "citizen",
      text: g.description,
      time: g.createdAt,
    });
  }
  (g?.history || []).forEach(h => {
    if (h.remarks) {
      thread.push({
        sender: "mla",
        text: h.remarks,
        time: h.createdAt,
        statusChange: h.oldStatus !== h.newStatus ? `Status changed: ${h.oldStatus} → ${h.newStatus}` : null,
      });
    }
  });
  return thread;
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({ name, size = 44, fontSize = 15 }) {
  const color = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color, display: "flex", alignItems: "center", justifyContent: "center",
      font: `700 ${fontSize}px 'Hanken Grotesk'`, color: "#fff",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ── Conversation row ───────────────────────────────────────────
function ConvRow({ g, active, onClick }) {
  const name = g.citizenName || `Citizen #${(g.citizenId || "").slice(-4)}`;
  const isUnread = g.status === "NEW";
  const preview = g.description || "";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", gap: 12, padding: "15px 18px",
        borderBottom: "1px solid #F4F6FA",
        borderLeft: active ? "3px solid #2B5BD7" : "3px solid transparent",
        background: active ? "#F5F8FF" : "transparent",
        cursor: "pointer", transition: "background .15s",
      }}
    >
      <Avatar name={name} size={44} fontSize={15} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ font: `${isUnread ? 700 : 600} 14px 'Hanken Grotesk'`, color: "#16233C" }}>{name}</span>
          <span style={{ font: "600 11px 'Hanken Grotesk'", color: active ? "#2B5BD7" : "#9AA3B5", flexShrink: 0 }}>
            {timeAgo(g.updatedAt || g.createdAt)}
          </span>
        </div>
        <div style={{
          font: `${isUnread ? 700 : 500} 12.5px 'Hanken Grotesk'`,
          color: isUnread ? "#16233C" : "#8590A6",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {preview}
        </div>
      </div>
      {isUnread && (
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2B5BD7", alignSelf: "center", flexShrink: 0 }} />
      )}
    </div>
  );
}

// ── Thread bubble ──────────────────────────────────────────────
function Bubble({ msg, repInitials }) {
  const isMla = msg.sender === "mla";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: isMla ? "flex-end" : "flex-start" }}>
      {msg.statusChange && (
        <div style={{ alignSelf: "center", font: "600 11px 'Hanken Grotesk'", color: "#8590A6", background: "#F1F4F9", padding: "4px 12px", borderRadius: 20, marginBottom: 6 }}>
          {msg.statusChange}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, maxWidth: "78%", flexDirection: isMla ? "row-reverse" : "row" }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0, borderRadius: "50%",
          background: isMla ? "#16233C" : "#2B5BD7",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "700 12px 'Hanken Grotesk'", color: "#fff",
        }}>
          {isMla ? (repInitials || "Rep") : "C"}
        </div>
        <div>
          <div style={{
            background: isMla ? "#2B5BD7" : "#F1F4F9",
            borderRadius: isMla ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            padding: "13px 16px",
            font: "400 14px/1.55 'Hanken Grotesk'",
            color: isMla ? "#fff" : "#16233C",
          }}>
            {msg.text}
          </div>
          <div style={{
            font: "500 11px 'Hanken Grotesk'", color: "#9AA3B5", marginTop: 5,
            paddingLeft: isMla ? 0 : 4, paddingRight: isMla ? 4 : 0,
            textAlign: isMla ? "right" : "left",
          }}>
            {formatTime(msg.time)}{isMla ? " · Sent" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compose modal ──────────────────────────────────────────────
function ComposeModal({ grievances, onClose, onSend }) {
  const [q,       setQ]       = useState("");
  const [picked,  setPicked]  = useState(null);
  const [text,    setText]    = useState("");
  const [busy,    setBusy]    = useState(false);

  // Build unique citizen list from grievances
  const citizens = [];
  const seen = new Set();
  grievances.forEach(g => {
    const id   = g.citizenId || g.id || g._id;
    const name = g.citizenName || `Citizen #${(g.citizenId || "").slice(-4)}`;
    if (id && !seen.has(id)) {
      seen.add(id);
      citizens.push({ id, name, grievance: g });
    }
  });

  const filtered = q
    ? citizens.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    : citizens;

  async function handleSend() {
    if (!picked || !text.trim() || busy) return;
    setBusy(true);
    await onSend(picked.grievance, text.trim());
    setBusy(false);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(14,22,38,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 500, background: "#fff", borderRadius: 22,
          boxShadow: "0 32px 64px -24px rgba(14,22,38,.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid #F0F2F7" }}>
          <span style={{ font: "700 17px 'Hanken Grotesk'", color: "#16233C" }}>New message</span>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "#F1F4F9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MIcon name="close" style={{ fontSize: 18, color: "#5A6678" }} />
          </div>
        </div>

        {/* To: field */}
        <div style={{ padding: "14px 24px 0" }}>
          <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>To</div>
          {picked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F8FF", border: "1.5px solid #2B5BD7", borderRadius: 12, padding: "10px 14px" }}>
              <Avatar name={picked.name} size={32} fontSize={12} />
              <span style={{ font: "600 14px 'Hanken Grotesk'", color: "#16233C", flex: 1 }}>{picked.name}</span>
              <MIcon name="close" onClick={() => setPicked(null)} style={{ fontSize: 16, color: "#8590A6", cursor: "pointer" }} />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#F3F5FA", borderRadius: 12, padding: "0 13px", height: 42, marginBottom: 8 }}>
                <MIcon name="search" style={{ fontSize: 18, color: "#9AA3B5" }} />
                <input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search residents…"
                  style={{ flex: 1, border: "none", background: "transparent", font: "500 14px 'Hanken Grotesk'", color: "#16233C", outline: "none" }}
                />
              </div>
              <div style={{ maxHeight: 180, overflowY: "auto", borderRadius: 12, border: "1px solid #EAEDF4" }}>
                {filtered.length === 0 && (
                  <div style={{ padding: "14px 16px", font: "500 13px 'Hanken Grotesk'", color: "#9AA3B5" }}>No residents found</div>
                )}
                {filtered.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setPicked(c); setQ(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #F4F6FA" }}
                  >
                    <Avatar name={c.name} size={34} fontSize={12} />
                    <div>
                      <div style={{ font: "600 13px 'Hanken Grotesk'", color: "#16233C" }}>{c.name}</div>
                      <div style={{ font: "500 11px 'Hanken Grotesk'", color: "#8590A6" }}>
                        {(c.grievance.categoryId || c.grievance.category || "").replace(/_/g, " ")} · {c.grievance.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Message area */}
        <div style={{ padding: "14px 24px 20px" }}>
          <div style={{ font: "600 12px 'Hanken Grotesk'", color: "#8590A6", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>Message</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your message…"
            rows={4}
            style={{
              width: "100%", border: "1.5px solid #E1E6F0", borderRadius: 13,
              padding: "12px 14px", font: "500 14px/1.55 'Hanken Grotesk'",
              color: "#16233C", resize: "none", outline: "none", boxSizing: "border-box",
              background: "#FAFBFD",
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 42, padding: "0 18px", border: "1px solid #E1E6F0", borderRadius: 11, background: "#fff", font: "600 14px 'Hanken Grotesk'", color: "#5A6678", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!picked || !text.trim() || busy}
            style={{
              height: 42, padding: "0 20px", border: "none", borderRadius: 11,
              background: picked && text.trim() ? "#2B5BD7" : "#C2CADA",
              font: "700 14px 'Hanken Grotesk'", color: "#fff", cursor: picked && text.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <MIcon name={busy ? "hourglass_top" : "send"} style={{ fontSize: 17 }} />
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function Messages() {
  const [grievances,  setGrievances]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [replyText,   setReplyText]   = useState("");
  const [sending,     setSending]     = useState(false);
  const [composing,   setComposing]   = useState(false);
  const threadEndRef = useRef(null);
  const navigate = useNavigate();

  // Current rep info
  const rep = (() => { try { return JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const repInitials = getInitials(rep?.fullName || rep?.name || "Rep");

  // Fetch grievances as conversations
  useEffect(() => {
    setLoading(true);
    api.get("/api/grievances/", { params: { page: 1, per_page: 50 } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setGrievances(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll thread to bottom
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  // Filtered conversation list
  const unreadCount = grievances.filter(g => g.status === "NEW").length;
  const filtered = grievances.filter(g => {
    const name = (g.citizenName || g.citizenId || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();
    const q    = search.toLowerCase();
    if (q && !name.includes(q) && !desc.includes(q)) return false;
    if (filter === "unread")  return g.status === "NEW";
    if (filter === "flagged") return ["HIGH", "CRITICAL"].includes(g.priority);
    return true;
  });

  // Resolve grievance ID regardless of whether API returns id or _id
  function gid(g) { return g?.id || g?._id || null; }

  // Deliver an in-app notification to the citizen so they actually see the message
  async function notifyCitizen(citizenId, senderName, messageText) {
    if (!citizenId) return;
    try {
      await api.post("/api/notifications/send", {
        userId: citizenId,
        title:  `Message from ${senderName}`,
        body:   messageText,
        type:   "MESSAGE",
      });
    } catch (e) {
      // Non-fatal — message is still saved in the grievance history
      console.warn("Notification delivery failed:", e);
    }
  }

  // Send reply via grievance history + notify the citizen
  async function handleSend(text) {
    const msg = (text || replyText).trim();
    if (!msg || !selected || sending) return;
    const id = gid(selected);
    if (!id) return;
    setSending(true);
    try {
      // 1. Save remark into grievance history
      await api.put(`/api/grievances/${id}`, { remarks: msg, status: selected.status });
      // 2. Notify the citizen so they receive the message in their app
      await notifyCitizen(
        selected.citizenId,
        rep?.fullName || rep?.name || "Your Representative",
        msg
      );
      // 3. Refresh thread
      const res = await api.get(`/api/grievances/${id}`);
      const updated = res?.data?.data || res?.data || null;
      if (updated) {
        setSelected(updated);
        setGrievances(prev => prev.map(g => gid(g) === gid(updated) ? updated : g));
      }
      setReplyText("");
    } catch (e) {
      console.error("Reply failed:", e);
    } finally {
      setSending(false);
    }
  }

  const thread   = buildThread(selected);
  const catMeta  = categoryMeta(selected?.categoryId || selected?.category);
  const selName  = selected ? (selected.citizenName || `Citizen #${(selected.citizenId || "").slice(-4)}`) : "";

  const QUICK_REPLIES = [
    "We're looking into this right away",
    "A team has been dispatched",
    "Thank you for reporting this",
    "We'll update you shortly",
  ];

  // Send from compose modal — saves remark + notifies citizen
  async function handleComposeSend(grievance, text) {
    const id = gid(grievance);
    if (!id) return;
    try {
      // 1. Save remark into grievance history
      await api.put(`/api/grievances/${id}`, { remarks: text, status: grievance.status });
      // 2. Send in-app notification to the citizen
      await notifyCitizen(
        grievance.citizenId,
        rep?.fullName || rep?.name || "Your Representative",
        text
      );
      // 3. Refresh and switch to that conversation
      const res = await api.get(`/api/grievances/${id}`);
      const updated = res?.data?.data || res?.data || null;
      if (updated) {
        setSelected(updated);
        setGrievances(prev => prev.map(g => gid(g) === gid(updated) ? updated : g));
      } else {
        setSelected(grievance);
      }
    } catch (e) {
      console.error("Compose send failed:", e);
      setSelected(grievance);
    }
  }

  return (
    <>
      {composing && (
        <ComposeModal
          grievances={grievances}
          onClose={() => setComposing(false)}
          onSend={handleComposeSend}
        />
      )}

      <MLAPageHeader title="Messages" subtitle="Direct conversations with residents">
        <button
          onClick={() => setComposing(true)}
          style={{
            height: 44, padding: "0 18px", border: "none", borderRadius: 13,
            background: "#2B5BD7", color: "#fff", font: "700 14px 'Hanken Grotesk'",
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            boxShadow: "0 12px 24px -10px rgba(43,91,215,.7)",
          }}
        >
          <MIcon name="edit_square" style={{ fontSize: 19 }} />
          New message
        </button>
      </MLAPageHeader>

      <div style={{ flex: 1, minHeight: 0, padding: "20px 34px 28px", display: "flex", gap: 20 }}>

        {/* ── Conversation list ── */}
        <div style={{
          width: 360, flexShrink: 0, background: "#fff",
          border: "1px solid #EAEDF4", borderRadius: 22,
          boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Search + filters */}
          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #F0F2F7" }}>
            <div style={{
              height: 42, background: "#F3F5FA", borderRadius: 12,
              display: "flex", alignItems: "center", gap: 9, padding: "0 13px", marginBottom: 12,
            }}>
              <MIcon name="search" style={{ fontSize: 19, color: "#9AA3B5" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations"
                style={{ flex: 1, border: "none", background: "transparent", font: "500 14px 'Hanken Grotesk'", color: "#16233C", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { key: "all",     label: "All" },
                { key: "unread",  label: `Unread · ${unreadCount}` },
                { key: "flagged", label: "Flagged" },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    font: "600 12px 'Hanken Grotesk'", padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                    background: filter === key ? (key === "unread" ? "#FBEAE8" : "#2B5BD7") : "#F1F4F9",
                    color: filter === key ? (key === "unread" ? "#C8453A" : "#fff") : "#7A839A",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: 24, textAlign: "center", font: "500 13px 'Hanken Grotesk'", color: "#9AA3B5" }}>
                Loading conversations…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", font: "500 13px 'Hanken Grotesk'", color: "#9AA3B5" }}>
                No conversations found
              </div>
            )}
            {filtered.map(g => (
              <ConvRow
                key={g.id || g._id}
                g={g}
                active={(selected?.id || selected?._id) === (g.id || g._id)}
                onClick={() => setSelected(g)}
              />
            ))}
          </div>
        </div>

        {/* ── Thread panel ── */}
        <div style={{
          flex: 1, minWidth: 0, background: "#fff",
          border: "1px solid #EAEDF4", borderRadius: 22,
          boxShadow: "0 14px 30px -22px rgba(20,35,60,.3)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <MIcon name="forum" style={{ fontSize: 48, color: "#D8DEEA" }} />
              <span style={{ font: "500 14px 'Hanken Grotesk'", color: "#9AA3B5" }}>Select a conversation</span>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 24px", borderBottom: "1px solid #F0F2F7", flexShrink: 0 }}>
                <Avatar name={selName} size={44} fontSize={15} />
                <div style={{ flex: 1 }}>
                  <div style={{ font: "700 16px 'Hanken Grotesk'", color: "#16233C" }}>{selName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>
                      {selected.address || selected.wardId || "—"}
                    </span>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C2CADA" }} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, font: "600 12px 'Hanken Grotesk'", color: statusColor(selected.status) }}>
                      <MIcon name="circle" style={{ fontSize: 10 }} />
                      {selected.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["flag","Flag"],["more_horiz","More"]].map(([icon, label]) => (
                    <div key={icon} title={label} style={{ width: 40, height: 40, border: "1.5px solid #E1E6F0", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <MIcon name={icon} style={{ fontSize: 20, color: "#5A6678" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked report card */}
              <div style={{ margin: "16px 24px 0", display: "flex", alignItems: "center", gap: 12, background: "#F5F8FF", border: "1px solid #DCE6FA", borderRadius: 14, padding: "13px 16px", flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: catMeta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MIcon name={catMeta.icon} style={{ fontSize: 20, color: catMeta.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "700 13px 'Hanken Grotesk'", color: "#16233C" }}>
                    Linked report · {selected.description?.slice(0, 50)}{selected.description?.length > 50 ? "…" : ""}
                  </div>
                  <div style={{ font: "500 12px 'Hanken Grotesk'", color: "#8590A6" }}>
                    {(selected.categoryId || selected.category || "Other").replace(/_/g, " ")} · #{selected.complaintNumber || (gid(selected) || "").slice(-6)} · {selected.status} · {selected.priority}
                  </div>
                </div>
                <span
                  onClick={() => navigate(ROUTES.mlaComplaintsDashboard)}
                  style={{ font: "600 13px 'Hanken Grotesk'", color: "#2B5BD7", cursor: "pointer", flexShrink: 0 }}
                >
                  Open report
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ font: "600 11px 'Hanken Grotesk'", color: "#9AA3B5", background: "#F1F4F9", padding: "5px 12px", borderRadius: 20 }}>
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) : ""}
                  </span>
                </div>

                {thread.length === 0 && (
                  <div style={{ textAlign: "center", font: "500 13px 'Hanken Grotesk'", color: "#9AA3B5", marginTop: 24 }}>
                    No messages yet. Be the first to respond.
                  </div>
                )}

                {thread.map((msg, i) => (
                  <Bubble key={i} msg={msg} repInitials={repInitials} />
                ))}
                <div ref={threadEndRef} />
              </div>

              {/* Quick replies + composer */}
              <div style={{ flexShrink: 0, borderTop: "1px solid #F0F2F7", padding: "14px 24px 18px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {QUICK_REPLIES.map(r => (
                    <span
                      key={r}
                      onClick={() => handleSend(r)}
                      style={{ font: "600 12.5px 'Hanken Grotesk'", color: "#2B5BD7", background: "#EEF3FF", padding: "7px 13px", borderRadius: 20, cursor: "pointer" }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1.5px solid #E1E6F0", borderRadius: 14, padding: "8px 8px 8px 16px", background: "#FAFBFD" }}>
                  <MIcon name="attach_file" style={{ fontSize: 22, color: "#9AA3B5" }} />
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Write a reply…"
                    style={{ flex: 1, border: "none", background: "transparent", font: "500 14px 'Hanken Grotesk'", color: "#16233C", outline: "none" }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!replyText.trim() || sending}
                    style={{
                      width: 44, height: 44, border: "none", borderRadius: 11,
                      background: replyText.trim() && !sending ? "#2B5BD7" : "#E1E6F0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: replyText.trim() && !sending ? "pointer" : "default",
                      boxShadow: replyText.trim() ? "0 10px 20px -10px rgba(43,91,215,.7)" : "none",
                      transition: "all .2s",
                    }}
                  >
                    <MIcon name={sending ? "hourglass_top" : "send"} style={{ fontSize: 21, color: "#fff" }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
