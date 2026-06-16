import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const TABS = ["All", "Open", "In Progress", "Resolved"] as const;
type Tab = typeof TABS[number];

const STATUS_MAP: Record<Tab, string[]> = {
  All: [],
  Open: ["NEW"],
  "In Progress": ["ASSIGNED", "IN_PROGRESS", "ON_HOLD"],
  Resolved: ["RESOLVED", "CLOSED"],
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "#DBEAFE", ASSIGNED: "#FEF3C7", IN_PROGRESS: "#FEF3C7",
  RESOLVED: "#D1FAE5", CLOSED: "#D1FAE5", ON_HOLD: "#F3F4F6",
};

interface Complaint {
  id: string; title: string; description: string;
  status: string; category: string; createdAt: string;
}

export default function Complaints() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("All");
  const [all, setAll] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/api/grievances/?citizen_id=${user.id}&per_page=100`);
      const items = data.items ?? data;
      setAll(items.map((c: any) => ({
        id: c._id || c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        category: c.category || "General",
        createdAt: c.created_at || c.createdAt || "",
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = tab === "All"
    ? all
    : all.filter((c) => STATUS_MAP[tab].includes(c.status));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Complaints</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/citizen/new-complaint" as any)}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No complaints here</Text>
          </View>
        ) : (
          filtered.map((c) => <ComplaintCard key={c.id} complaint={c} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function ComplaintCard({ complaint: c }: { complaint: Complaint }) {
  const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "";
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>{c.title}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[c.status] || "#F3F4F6" }]}>
          <Text style={styles.badgeText}>{c.status.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📁 {c.category}</Text>
        {date ? <Text style={styles.metaText}>🗓 {date}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, backgroundColor: "#1D4ED8",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  addBtn: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  addBtnText: { color: "#1D4ED8", fontWeight: "700", fontSize: 13 },
  tabBar: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 12, maxHeight: 52 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginRight: 8, backgroundColor: "#F3F4F6" },
  tabActive: { backgroundColor: "#1D4ED8" },
  tabText: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  list: { flex: 1, padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#374151" },
  cardDesc: { fontSize: 13, color: "#6B7280", marginBottom: 10 },
  cardMeta: { flexDirection: "row", gap: 16 },
  metaText: { fontSize: 12, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9CA3AF" },
});
