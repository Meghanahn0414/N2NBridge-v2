import { useState, useEffect } from "react";
import api from "../../shared/services/api";
import "./CitizenSurveys.css";

export default function CitizenSurveys() {
  const [surveys, setSurveys]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [active, setActive]       = useState(null);   // survey being answered
  const [answers, setAnswers]     = useState({});
  const [submitted, setSubmitted] = useState(new Set());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    api.get("/api/surveys", { params: { status: "ACTIVE" } })
      .then(r => setSurveys(r.data?.data || []))
      .catch(() => setSurveys([]))
      .finally(() => setLoading(false));
  }, []);

  const openSurvey = (s) => {
    setActive(s);
    setAnswers({});
    setError("");
    setSuccess("");
  };

  const setAnswer = (qid, val) =>
    setAnswers(prev => ({ ...prev, [qid]: val }));

  // MongoDB returns _id; helper doesn't rename it to id
  const sid = (s) => s?._id || s?.id;

  const handleSubmit = async () => {
    if (!active) return;
    const missing = active.questions.filter(
      q => q.required && (answers[q.id] === undefined || answers[q.id] === "")
    );
    if (missing.length > 0) {
      setError(`Please answer: ${missing.map(q => q.text).join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      };
      await api.post(`/api/surveys/${sid(active)}/respond`, payload);
      setSubmitted(prev => new Set([...prev, sid(active)]));
      setSuccess("Thank you! Your response has been recorded.");
      setTimeout(() => { setActive(null); setSuccess(""); }, 2000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="surveys-loading">Loading surveys…</div>;

  return (
    <div className="surveys-page">
      <div className="surveys-header">
        <h1>Citizen Surveys</h1>
        <p>Your feedback helps improve services in your ward</p>
      </div>

      {!active ? (
        /* Survey list */
        surveys.length === 0 ? (
          <div className="surveys-empty">
            <div className="surveys-empty-icon">📋</div>
            <h3>No active surveys right now</h3>
            <p>Check back later — your MLA will publish surveys to collect your feedback.</p>
          </div>
        ) : (
          <div className="surveys-grid">
            {surveys.map(s => (
              <div key={sid(s)} className="survey-card">
                <div className="survey-card-header">
                  <span className="survey-badge">Active</span>
                  <span className="survey-qcount">{s.questions?.length || 0} questions</span>
                </div>
                <h3 className="survey-title">{s.title}</h3>
                {s.description && <p className="survey-desc">{s.description}</p>}
                <div className="survey-meta">
                  <span>🗳 {s.responseCount || 0} responses</span>
                </div>
                {submitted.has(sid(s)) ? (
                  <div className="survey-done">✓ Submitted</div>
                ) : (
                  <button className="survey-start-btn" onClick={() => openSurvey(s)}>
                    Take Survey
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Survey form */
        <div className="survey-form-wrap">
          <button className="survey-back-btn" onClick={() => setActive(null)}>
            ← Back to surveys
          </button>
          <div className="survey-form">
            <h2>{active.title}</h2>
            {active.description && <p className="survey-form-desc">{active.description}</p>}

            <div className="survey-questions">
              {active.questions.map((q, idx) => (
                <div key={q.id} className="survey-question">
                  <label className="survey-q-label">
                    {idx + 1}. {q.text}
                    {q.required && <span className="survey-required"> *</span>}
                  </label>

                  {q.type === "RATING" && (
                    <div className="survey-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          className={`star-btn ${answers[q.id] >= star ? "active" : ""}`}
                          onClick={() => setAnswer(q.id, star)}
                          type="button"
                        >
                          ★
                        </button>
                      ))}
                      {answers[q.id] && (
                        <span className="star-label">
                          {["", "Very poor", "Poor", "Okay", "Good", "Excellent"][answers[q.id]]}
                        </span>
                      )}
                    </div>
                  )}

                  {q.type === "MCQ" && (
                    <div className="survey-options">
                      {q.options?.map(opt => (
                        <label key={opt} className={`survey-option ${answers[q.id] === opt ? "selected" : ""}`}>
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswer(q.id, opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === "TEXT" && (
                    <textarea
                      className="survey-textarea"
                      rows={3}
                      placeholder="Type your answer…"
                      value={answers[q.id] || ""}
                      onChange={e => setAnswer(q.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {error   && <div className="survey-error">{error}</div>}
            {success && <div className="survey-success">{success}</div>}

            <button
              className="survey-submit-btn"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Submitting…" : "Submit Response"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
