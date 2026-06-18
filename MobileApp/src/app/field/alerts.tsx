import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import api from "../../services/api";

interface AlertItem {
  id: string;
  alertType: string;
  location: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  FIRE:     { bg: "#FEE2E2", text: "#DC2626", icon: "🔥" },
  FLOOD:    { bg: "#DBEAFE", text: "#1D4ED8", icon: "🌊" },
  ACCIDENT: { bg: "#FEF3C7", text: "#92400E", icon: "🚗" },
  MEDICAL:  { bg: "#FCE7F3", text: "#9D174D", icon: "🏥" },
  OTHER:    { bg: "#F3F4F6", text: "#374151", icon: "⚠️" },
};

export default function FieldAlerts() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/alerts/?per_page=30");
      setItems((data.items ?? data).map((a: any) => ({
        id: a._id || a.id,
        alertType: a.alertType || a.alert_type || a.type || "OTHER",
        location: a.location || a.address || "Unknown location",
        description: a.description,
        status: a.status,
        createdAt: a.createdAt || a.created_at,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#D97706" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Alerts</Text>
        <Text style={styles.headerCount}>{items.length}</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🟢</Text>
            <Text style={styles.emptyText}>No active alerts</Text>
          </View>
        ) : (
          items.map((a) => {
            const tc = TYPE_COLORS[a.alertType] || TYPE_COLORS.OTHER;
            return (
              <View key={a.id} style={[styles.card, { borderLeftColor: tc.text, borderLeftWidth: 4 }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconCircle, { backgroundColor: tc.bg }]}>
                    <Text style={styles.iconText}>{tc.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertType}>{a.alertType}</Text>
                    <Text style={styles.location}>📍 {a.location}</Text>
                  </View>
                  {a.status && (
                    <View style={[styles.statusBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.statusText, { color: tc.text }]}>{a.status}</Text>
                    </View>
                  )}
                </View>
                {a.description && (
                  <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
                )}
                {a.createdAt && (
                  <Text style={styles.date}>{new Date(a.createdAt).toLocaleDateString("en-IN")}</Text>
                )}
              </View>
            );
          })
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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#D97706", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#FDE68A" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, marginTop: 12,
    padding: 14, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 20 },
  alertType: { fontSize: 14, fontWeight: "700", color: "#111827" },
  location: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "700" },
  desc: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  date: { fontSize: 11, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
