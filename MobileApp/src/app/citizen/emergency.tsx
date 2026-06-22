import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import * as Location from "expo-location";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_TABS = ["All", "Critical", "High", "Medium", "Low"] as const;
type PriorityTab = typeof PRIORITY_TABS[number];

const PRIORITY_MAP: Record<PriorityTab, string> = {
  All: "", Critical: "CRITICAL", High: "HIGH", Medium: "MEDIUM", Low: "LOW",
};

const ALERT_TYPES = ["EMERGENCY", "SECURITY", "HEALTH", "INFRASTRUCTURE", "POLLUTION", "OTHER"] as const;
const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const PRIORITY_BG: Record<string, string> = {
  CRITICAL: "#FEE2E2", HIGH: "#FFEDD5", MEDIUM: "#FEF9C3", LOW: "#DCFCE7",
};
const PRIORITY_FG: Record<string, string> = {
  CRITICAL: "#B91C1C", HIGH: "#C2410C", MEDIUM: "#A16207", LOW: "#166534",
};
const STATUS_BG: Record<string, string> = {
  OPEN: "#DBEAFE", ACKNOWLEDGED: "#FEF3C7", IN_PROGRESS: "#FEF3C7",
  RESOLVED: "#D1FAE5", CLOSED: "#F3F4F6",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertItem {
  id: string;
  alertNumber: string;
  alertType: string;
  priority: string;
  description: string;
  status: string;
  location: { type: string; coordinates: number[] } | null;
  assignedTo: string | null;
  createdAt: string;
}

interface ReportForm {
  alertType: typeof ALERT_TYPES[number];
  priority: typeof PRIORITIES[number];
  description: string;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Emergency() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<PriorityTab>("All");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Report modal state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReportForm>({
    alertType: "EMERGENCY",
    priority: "HIGH",
    description: "",
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Fetch Alerts ───────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setFetchError(null);
    try {
      const params: Record<string, string> = { per_page: "100" };
      if (tab !== "All") params.priority = PRIORITY_MAP[tab];
      const { data } = await api.get("/api/alerts/", { params });
      const items: any[] = Array.isArray(data) ? data : data?.data ?? [];
      setAlerts(
        items.map((a) => ({
          id: a._id || a.id,
          alertNumber: a.alertNumber,
          alertType: a.alertType,
          priority: a.priority,
          description: a.description,
          status: a.status,
          location: a.location ?? null,
          assignedTo: a.assignedTo ?? null,
          createdAt: a.createdAt,
        }))
      );
    } catch (e: any) {
      setFetchError(e?.response?.data?.detail || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // ─── GPS ────────────────────────────────────────────────────────────────────

  const captureGPS = async () => {
    setGpsLoading(true);
    setGps(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Denied",
          "Please allow location access in Settings to attach your GPS coordinates to the alert."
        );
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGps({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      Alert.alert("GPS Error", "Could not get your location. You can still submit without it.");
    } finally {
      setGpsLoading(false);
    }
  };

  const openForm = () => {
    setForm({ alertType: "EMERGENCY", priority: "HIGH", description: "" });
    setSubmitError(null);
    setGps(null);
    setShowForm(true);
    captureGPS();
  };

  // ─── Submit Alert ───────────────────────────────────────────────────────────

  const submitAlert = async () => {
    if (!form.description.trim()) {
      setSubmitError("Please describe the emergency.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, any> = {
        alertType: form.alertType,
        priority: form.priority,
        description: form.description.trim(),
        citizenId: user?.id ?? null,
      };

      if (gps) {
        payload.location = {
          type: "Point",
          coordinates: [gps.lng, gps.lat], // GeoJSON order: [longitude, latitude]
        };
      }

      await api.post("/api/alerts/", payload);
      setShowForm(false);
      Alert.alert("Alert Sent", "Your emergency alert has been reported successfully.");
      load(); // refresh list
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setSubmitError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join(", ")
          : "Failed to send alert. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const criticalCount = alerts.filter((a) => a.priority === "CRITICAL").length;

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#DC2626" /></View>;
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Emergency Alerts</Text>
          <Text style={s.headerSub}>
            {criticalCount > 0 ? `${criticalCount} critical active` : "All clear"}
          </Text>
        </View>
        <TouchableOpacity style={s.reportBtn} onPress={openForm}>
          <Text style={s.reportBtnText}>🚨 Report</Text>
        </TouchableOpacity>
      </View>

      {/* Priority Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {PRIORITY_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fetch Error */}
      {fetchError && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{fetchError}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Alert List */}
      <ScrollView
        style={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
      >
        {alerts.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🛡️</Text>
            <Text style={s.emptyTitle}>No alerts</Text>
            <Text style={s.emptyText}>No emergency alerts at this time. Tap "Report" to raise one.</Text>
          </View>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Report Emergency Modal ─── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.modalContainer}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🚨 Report Emergency</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} disabled={submitting}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
              {/* GPS Status */}
              <View style={s.gpsRow}>
                <Text style={s.gpsLabel}>📍 GPS Location</Text>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : gps ? (
                  <Text style={s.gpsValue}>
                    {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} ✓
                  </Text>
                ) : (
                  <TouchableOpacity onPress={captureGPS}>
                    <Text style={s.gpsRetry}>Tap to capture</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Alert Type */}
              <Text style={s.fieldLabel}>Alert Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {ALERT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[s.chip, form.alertType === t && s.chipActive]}
                    onPress={() => setForm({ ...form, alertType: t })}
                  >
                    <Text style={[s.chipText, form.alertType === t && s.chipTextActive]}>
                      {t.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Priority */}
              <Text style={s.fieldLabel}>Priority *</Text>
              <View style={s.priorityRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      s.priorityChip,
                      { backgroundColor: PRIORITY_BG[p] },
                      form.priority === p && s.priorityChipActive,
                    ]}
                    onPress={() => setForm({ ...form, priority: p })}
                  >
                    <Text style={[s.priorityChipText, { color: PRIORITY_FG[p] }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={s.fieldLabel}>Description *</Text>
              <TextInput
                style={s.textArea}
                placeholder="Describe the emergency situation clearly…"
                multiline
                numberOfLines={5}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
                maxLength={500}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={s.charCount}>{form.description.length}/500</Text>

              {/* Submit Error */}
              {submitError && (
                <View style={s.submitError}>
                  <Text style={s.submitErrorText}>{submitError}</Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                onPress={submitAlert}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>Send Emergency Alert</Text>
                }
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ alert: a }: { alert: AlertItem }) {
  const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "";
  const locationText = a.location?.coordinates
    ? `${Number(a.location.coordinates[1]).toFixed(4)}, ${Number(a.location.coordinates[0]).toFixed(4)}`
    : null;

  return (
    <View style={[s.card, a.priority === "CRITICAL" && s.cardCritical]}>
      <View style={s.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardType}>{a.alertType.replace("_", " ")}</Text>
          <Text style={s.alertNumber}>{a.alertNumber}</Text>
        </View>
        <View style={[s.priorityBadge, { backgroundColor: PRIORITY_BG[a.priority] || "#F3F4F6" }]}>
          <Text style={[s.priorityBadgeText, { color: PRIORITY_FG[a.priority] || "#374151" }]}>
            {a.priority}
          </Text>
        </View>
      </View>
      <Text style={s.cardDesc} numberOfLines={3}>{a.description}</Text>
      <View style={s.cardMeta}>
        <View style={[s.statusBadge, { backgroundColor: STATUS_BG[a.status] || "#F3F4F6" }]}>
          <Text style={s.statusText}>{a.status.replace("_", " ")}</Text>
        </View>
        {locationText && <Text style={s.metaText}>📍 {locationText}</Text>}
        {a.assignedTo && <Text style={s.metaText}>👤 {a.assignedTo}</Text>}
        {date ? <Text style={s.metaText}>🗓 {date}</Text> : null}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: "#DC2626",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "#FEE2E2", marginTop: 2 },
  reportBtn: {
    backgroundColor: "#fff", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  reportBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },

  tabBar: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 12, maxHeight: 52 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: "#F3F4F6" },
  tabActive: { backgroundColor: "#DC2626" },
  tabText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  errorBox: {
    margin: 16, padding: 14, backgroundColor: "#FEE2E2", borderRadius: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  errorText: { color: "#B91C1C", fontSize: 13, flex: 1 },
  retryText: { color: "#DC2626", fontWeight: "700", fontSize: 13, marginLeft: 12 },

  list: { flex: 1, padding: 16 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 30 },

  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10,
    elevation: 2, borderLeftWidth: 3, borderLeftColor: "#E5E7EB",
  },
  cardCritical: { borderLeftColor: "#DC2626" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardType: { fontSize: 14, fontWeight: "700", color: "#111827" },
  alertNumber: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  priorityBadgeText: { fontSize: 10, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: "#6B7280", marginBottom: 10, lineHeight: 18 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "600", color: "#374151" },
  metaText: { fontSize: 11, color: "#9CA3AF" },

  // ─── Modal ───
  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: "#DC2626",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  modalClose: { fontSize: 20, color: "#fff", paddingHorizontal: 4 },
  modalBody: { flex: 1, padding: 20 },

  gpsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 18,
    elevation: 1,
  },
  gpsLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  gpsValue: { fontSize: 12, color: "#166534", fontWeight: "600" },
  gpsRetry: { fontSize: 12, color: "#DC2626", fontWeight: "600" },

  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },

  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTextActive: { color: "#fff" },

  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  priorityChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
    borderWidth: 2, borderColor: "transparent",
  },
  priorityChipActive: { borderColor: "#374151" },
  priorityChipText: { fontSize: 12, fontWeight: "700" },

  textArea: {
    backgroundColor: "#fff", borderRadius: 10, padding: 14, fontSize: 14,
    color: "#111827", minHeight: 120, textAlignVertical: "top",
    borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 4,
  },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginBottom: 18 },

  submitError: {
    backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12, marginBottom: 14,
  },
  submitErrorText: { color: "#B91C1C", fontSize: 13 },

  submitBtn: {
    backgroundColor: "#DC2626", borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
