import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, StatusBar, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useT } from "../../i18n/useT";

const C = {
  primary:    "#2B5BD7",
  primaryDark:"#1B3C8F",
  bg:         "#F3F5FA",
  card:       "#FFFFFF",
  ink:        "#16233C",
  muted:      "#5A6678",
  mutedLight: "#9AA3B5",
  border:     "#EDF0F6",
  green:      "#1E8A5B",
  greenBg:    "#E6F4EC",
  error:      "#C8453A",
  errorBg:    "#FEF2F2",
};

type Question = {
  id: string;
  type: "RATING" | "MCQ" | "TEXT";
  text: string;
  options?: string[];
  required: boolean;
};

type Survey = {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  status: string;
};

export default function SurveyDetailScreen() {
  const tr = useT();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [survey, setSurvey]       = useState<Survey | null>(null);
  const [loading, setLoading]     = useState(true);
  const [answers, setAnswers]     = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  const fetchSurvey = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/surveys/${id}`);
      const s = data?.data ?? data;
      setSurvey({
        id: s._id || s.id,
        title: s.title,
        description: s.description,
        questions: s.questions ?? [],
        status: s.status,
      });
    } catch {
      setError(tr("Failed to load survey."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSurvey(); }, [fetchSurvey]);

  const setAnswer = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!survey) return;
    // Validate required
    for (const q of survey.questions) {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === "")) {
        setError(`Please answer: "${q.text}"`);
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        answers: survey.questions.map((q) => ({
          questionId: q.id,
          value: answers[q.id] ?? "",
        })),
      };
      await api.post(`/api/surveys/${survey.id}/respond`, payload);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || tr("Submission failed. Please try again.");
      if (msg.toLowerCase().includes("already")) {
        setError(tr("You have already submitted this survey."));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar backgroundColor={C.card} barStyle="dark-content" />
        <View style={s.successBox}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={C.green} />
          </View>
          <Text style={s.successTitle}>{tr("Thank you!")}</Text>
          <Text style={s.successText}>{tr("Your response has been submitted successfully.")}</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
            <Text style={s.doneBtnText}>{tr("Back to Surveys")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{tr("Survey")}</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !survey ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={C.mutedLight} />
          <Text style={s.emptyTitle}>{error || tr("Survey not found")}</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.doneBtn}>
            <Text style={s.doneBtnText}>{tr("Go Back")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Survey title card */}
          <View style={s.titleCard}>
            <View style={s.titleIconBox}>
              <Ionicons name="clipboard-outline" size={24} color={C.primary} />
            </View>
            <Text style={s.surveyTitle}>{survey.title}</Text>
            {survey.description ? (
              <Text style={s.surveyDesc}>{survey.description}</Text>
            ) : null}
            <Text style={s.surveyMeta}>{survey.questions.length} {tr("questions")}</Text>
          </View>

          {/* Questions */}
          {survey.questions.map((q, idx) => (
            <View key={q.id} style={s.questionCard}>
              <Text style={s.qNum}>{tr("Q")} {idx + 1} {q.required ? <Text style={s.required}>*</Text> : null}</Text>
              <Text style={s.qText}>{q.text}</Text>

              {/* RATING */}
              {q.type === "RATING" && (
                <View style={s.ratingRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[s.ratingBtn, answers[q.id] === n && s.ratingBtnActive]}
                      onPress={() => setAnswer(q.id, n)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.ratingText, answers[q.id] === n && s.ratingTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* MCQ */}
              {q.type === "MCQ" && q.options?.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.optionBtn, answers[q.id] === opt && s.optionBtnActive]}
                  onPress={() => setAnswer(q.id, opt)}
                  activeOpacity={0.75}
                >
                  <View style={[s.optionDot, answers[q.id] === opt && s.optionDotActive]} />
                  <Text style={[s.optionText, answers[q.id] === opt && s.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}

              {/* TEXT */}
              {q.type === "TEXT" && (
                <TextInput
                  style={s.textInput}
                  placeholder={tr("Type your answer…")}
                  placeholderTextColor={C.mutedLight}
                  value={answers[q.id] ?? ""}
                  onChangeText={(v) => setAnswer(q.id, v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            </View>
          ))}

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.error} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[s.submitBtn, submitting && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.submitBtnText}>{tr("Submit Survey")}</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },

  header: {
    backgroundColor: C.card,
    paddingTop: 56, paddingBottom: 18, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.ink, flex: 1 },

  scrollContent: { padding: 18, gap: 14, paddingBottom: 32 },

  titleCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.border, alignItems: "center",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  titleIconBox: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  surveyTitle: { fontSize: 20, fontWeight: "800", color: C.ink, textAlign: "center", marginBottom: 8 },
  surveyDesc:  { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20, marginBottom: 10 },
  surveyMeta:  { fontSize: 12, color: C.mutedLight, fontWeight: "600" },

  questionCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  qNum:      { fontSize: 11, fontWeight: "700", color: C.mutedLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  qText:     { fontSize: 15, fontWeight: "600", color: C.ink, lineHeight: 22, marginBottom: 14 },
  required:  { color: C.error },

  // Rating
  ratingRow:       { flexDirection: "row", gap: 10 },
  ratingBtn:       { width: 48, height: 48, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  ratingBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  ratingText:      { fontSize: 16, fontWeight: "700", color: C.muted },
  ratingTextActive:{ color: "#fff" },

  // MCQ
  optionBtn:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, marginBottom: 8 },
  optionBtnActive: { backgroundColor: "#EEF2FF", borderColor: C.primary },
  optionDot:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, backgroundColor: "#fff" },
  optionDotActive: { borderColor: C.primary, backgroundColor: C.primary },
  optionText:      { fontSize: 14, color: C.ink },
  optionTextActive:{ fontWeight: "600", color: C.primary },

  // Text
  textInput: {
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, padding: 14, fontSize: 14, color: C.ink, minHeight: 90,
  },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.errorBg, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#FECACA",
  },
  errorText: { fontSize: 13, color: C.error, flex: 1 },

  submitBtn: {
    backgroundColor: C.primary, borderRadius: 14, padding: 16,
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText:     { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Success
  successBox:  { alignItems: "center", paddingHorizontal: 24 },
  successIcon: { marginBottom: 20 },
  successTitle:{ fontSize: 26, fontWeight: "800", color: C.ink, marginBottom: 10 },
  successText: { fontSize: 15, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  doneBtn:     { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 36 },
  doneBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  emptyTitle:  { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 14, marginBottom: 24, textAlign: "center" },
});
