import { useState, useEffect } from "react";
import api from "../../../shared/services/api";
import PageHeader from "../../../components/PageHeader";

const QUESTION_TYPES = ["RATING", "MCQ", "TEXT"];

const emptyQuestion = () => ({
  id: `q${Date.now()}`,
  type: "RATING",
  text: "",
  options: [],
  required: true,
});

export default function SurveyManagement() {
  const [surveys, setSurveys]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    questions: [emptyQuestion()],
  });

  const loadSurveys = () => {
    setLoading(true);
    api.get("/api/surveys")
      .then(r => setSurveys(r.data?.data || []))
      .catch(() => setSurveys([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSurveys(); }, []);

  // ---- question helpers ----
  const addQuestion = () =>
    setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));

  const removeQuestion = (idx) =>
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const updateQuestion = (idx, patch) =>
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, ...patch } : q),
    }));

  const addOption = (idx) =>
    updateQuestion(idx, { options: [...(form.questions[idx].options || []), ""] });

  const updateOption = (qIdx, oIdx, val) => {
    const opts = [...form.questions[qIdx].options];
    opts[oIdx] = val;
    updateQuestion(qIdx, { options: opts });
  };

  const removeOption = (qIdx, oIdx) =>
    updateQuestion(qIdx, { options: form.questions[qIdx].options.filter((_, i) => i !== oIdx) });

  // ---- submit ----
  const handleCreate = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    const invalid = form.questions.filter(q => !q.text.trim());
    if (invalid.length) { setError("All questions must have text"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/api/surveys", form);
      setSuccess("Survey published successfully!");
      setCreating(false);
      setForm({ title: "", description: "", questions: [emptyQuestion()] });
      loadSurveys();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create survey");
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/api/surveys/${id}`, { status });
      loadSurveys();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this survey?")) return;
    try {
      await api.delete(`/api/surveys/${id}`);
      loadSurveys();
    } catch { /* ignore */ }
  };

  const statusBadge = (s) => {
    const map = { ACTIVE: ["#E6F4EC","#1E8A5B"], DRAFT: ["#F0F2F7","#8590A6"], CLOSED: ["#FBE8E8","#C8453A"] };
    const [bg, color] = map[s] || map.DRAFT;
    return <span style={{ background:bg, color, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>{s}</span>;
  };

  return (
    <div style={{ fontFamily:"'Hanken Grotesk',sans-serif" }}>
      <PageHeader subtitle="Create and manage citizen satisfaction surveys">
        <button
          style={{ padding: "9px 18px", borderRadius: 10, background: "#16233C", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Hanken Grotesk',sans-serif", whiteSpace: "nowrap" }}
          onClick={() => { setCreating(true); setError(""); setSuccess(""); }}
        >
          + New Survey
        </button>
      </PageHeader>
      <div style={{ padding:"28px 32px", maxWidth:900, margin:"0 auto" }}>

      {error   && <div style={{ background:"#FBEAE8", color:"#C8453A", padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13 }}>{error}</div>}
      {success && <div style={{ background:"#E6F4EC", color:"1E8A5B", padding:"12px 16px", borderRadius:10, marginBottom:16, fontSize:13, fontWeight:600 }}>{success}</div>}

      {/* Create form */}
      {creating && (
        <div style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:18, padding:28, marginBottom:28, boxShadow:"0 8px 24px -12px rgba(20,35,60,.15)" }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#16233C", margin:"0 0 20px" }}>New Survey</h3>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#8590A6", display:"block", marginBottom:6 }}>TITLE *</label>
            <input style={inputStyle} placeholder="e.g. Constituency Satisfaction Q2 2026"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#8590A6", display:"block", marginBottom:6 }}>DESCRIPTION</label>
            <textarea style={{ ...inputStyle, resize:"vertical" }} rows={2}
              placeholder="Brief description for citizens"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h4 style={{ fontSize:14, fontWeight:700, color:"#16233C", margin:0 }}>Questions</h4>
            <button onClick={addQuestion} style={outlineBtn}>+ Add Question</button>
          </div>

          {form.questions.map((q, idx) => (
            <div key={q.id} style={{ background:"#F9FAFC", border:"1px solid #EAEDF4", borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                <select style={{ ...inputStyle, flex:"0 0 120px" }} value={q.type}
                  onChange={e => updateQuestion(idx, { type: e.target.value, options: [] })}>
                  {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={{ ...inputStyle, flex:1 }} placeholder={`Question ${idx + 1}`}
                  value={q.text} onChange={e => updateQuestion(idx, { text: e.target.value })} />
                <button onClick={() => removeQuestion(idx)}
                  style={{ background:"#FBEAE8", color:"#C8453A", border:"none", borderRadius:8, padding:"0 12px", cursor:"pointer", fontWeight:700 }}>
                  ✕
                </button>
              </div>

              {q.type === "MCQ" && (
                <div style={{ paddingLeft:8 }}>
                  {(q.options || []).map((opt, oIdx) => (
                    <div key={oIdx} style={{ display:"flex", gap:8, marginBottom:6 }}>
                      <input style={{ ...inputStyle, flex:1 }} placeholder={`Option ${oIdx + 1}`}
                        value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} />
                      <button onClick={() => removeOption(idx, oIdx)}
                        style={{ background:"none", border:"none", color:"#C8453A", cursor:"pointer", fontWeight:700 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addOption(idx)} style={{ ...outlineBtn, marginTop:4, fontSize:12 }}>+ Add option</button>
                </div>
              )}

              {q.type === "RATING" && (
                <div style={{ fontSize:12, color:"#8590A6", paddingLeft:8 }}>Citizens will rate 1–5 stars</div>
              )}
              {q.type === "TEXT" && (
                <div style={{ fontSize:12, color:"#8590A6", paddingLeft:8 }}>Citizens will type a free-text answer</div>
              )}
            </div>
          ))}

          <div style={{ display:"flex", gap:12, marginTop:20 }}>
            <button onClick={handleCreate} disabled={saving}
              style={{ background:"#2B5BD7", color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:14, fontWeight:700, cursor:"pointer", opacity: saving ? .6 : 1 }}>
              {saving ? "Publishing…" : "Publish Survey"}
            </button>
            <button onClick={() => setCreating(false)}
              style={{ background:"#F0F2F7", color:"#16233C", border:"none", borderRadius:10, padding:"11px 20px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Survey list */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#8590A6" }}>Loading surveys…</div>
      ) : surveys.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#C0C7D4", fontSize:14 }}>
          No surveys yet. Create your first survey above.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {surveys.map(s => (
            <div key={s.id} style={{ background:"#fff", border:"1px solid #EAEDF4", borderRadius:16, padding:"18px 22px",
              boxShadow:"0 4px 12px -6px rgba(20,35,60,.1)", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"#16233C" }}>{s.title}</span>
                  {statusBadge(s.status)}
                </div>
                {s.description && <p style={{ fontSize:13, color:"#8590A6", margin:"0 0 6px" }}>{s.description}</p>}
                <div style={{ fontSize:12, color:"#B0B8C9" }}>
                  {s.questions?.length || 0} questions · {s.responseCount || 0} responses
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {s.status === "ACTIVE" && (
                  <button onClick={() => handleStatusChange(s.id, "CLOSED")}
                    style={{ background:"#FBE8E8", color:"#C8453A", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Close
                  </button>
                )}
                {s.status === "CLOSED" && (
                  <button onClick={() => handleStatusChange(s.id, "ACTIVE")}
                    style={{ background:"#E6F4EC", color:"#1E8A5B", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                    Re-open
                  </button>
                )}
                <button onClick={() => handleDelete(s.id)}
                  style={{ background:"#F0F2F7", color:"#8590A6", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

const inputStyle = {
  border:"1.5px solid #EAEDF4", borderRadius:8, padding:"9px 12px",
  fontSize:14, color:"#16233C", outline:"none", width:"100%", boxSizing:"border-box",
  fontFamily:"'Hanken Grotesk',sans-serif",
};
const outlineBtn = {
  background:"none", border:"1.5px solid #2B5BD7", color:"#2B5BD7",
  borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:"pointer",
};
