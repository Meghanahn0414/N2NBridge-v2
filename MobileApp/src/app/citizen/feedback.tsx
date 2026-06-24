import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

interface Complaint {
  id: string; title: string; status: string; closedAt?: string;
  feedback?: { rating: number };
}

export default function Feedback() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get(
        `/api/grievances/?citizen_id=${user.id}&per_page=100`
      );
      const items: any[] = data.items ?? data;
      const resolved = items.filter((c) => ["RESOLVED", "CLOSED"].includes(c.status));
      const mapped: Complaint[] = resolved.map((c: any) => ({
        id: c._id || c.id,
        title: c.title,
        status: c.status,
        closedAt: c.closed_at || c.closedAt,
        feedback: c.feedback,
      }));
      setComplaints(mapped);
      const initRatings: Record<string, number> = {};
      const initSubmitted: Record<string, boolean> = {};
      mapped.forEach((c) => {
        if (c.feedback?.rating) {
          initRatings[c.id] = c.feedback.rating;
          initSubmitted[c.id] = true;
        }
      });
      setRatings(initRatings);
      setSubmitted(initSubmitted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function submitRating(id: string) {
    const rating = ratings[id];
    if (!rating) { Alert.alert("Please select a star rating first"); return; }
    try {
      await api.post(`/api/grievances/${id}/feedback`, {
        rating,
        comments: "",
        submittedAt: new Date().toISOString(),
      });
      setSubmitted((prev) => ({ ...prev, [id]: true }));
      Alert.alert("Thank you!", "Your feedback has been submitted.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? "Failed to submit feedback");
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#BFDBFE" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{tr('feedback.title')}</Text>
          <Text style={styles.headerSub}>{tr('feedback.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {complaints.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>{tr('feedback.noResolved')}</Text>
            <Text style={styles.emptySubText}>{tr('feedback.noResolvedSub')}</Text>
          </View>
        ) : (
          complaints.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {c.title || (c as any).description || "Untitled Complaint"}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{c.status}</Text>
                </View>
                {submitted[c.id] && (
                  <Text style={styles.ratedLabel}>{tr('feedback.rated')}</Text>
                )}
              </View>

              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      if (!submitted[c.id]) {
                        setRatings((prev) => ({ ...prev, [c.id]: star }));
                      }
                    }}
                    disabled={submitted[c.id]}
                  >
                    <Text style={[styles.star, (ratings[c.id] || 0) >= star && styles.starFilled]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!submitted[c.id] && (
                <TouchableOpacity
                  style={[styles.submitBtn, !ratings[c.id] && styles.submitBtnDisabled]}
                  onPress={() => submitRating(c.id)}
                  disabled={!ratings[c.id]}
                >
                  <Text style={styles.submitText}>{tr('feedback.submitRating')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20, backgroundColor: "#1D4ED8",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#BFDBFE", marginTop: 2 },
  list: { flex: 1, padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  badge: { backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#065F46" },
  ratedLabel: { fontSize: 12, color: "#10B981", fontWeight: "600" },
  stars: { flexDirection: "row", gap: 8, marginBottom: 14 },
  star: { fontSize: 32, color: "#D1D5DB" },
  starFilled: { color: "#FBBF24" },
  submitBtn: { backgroundColor: "#1D4ED8", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitBtnDisabled: { backgroundColor: "#93C5FD" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 8 },
  emptySubText: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
});
