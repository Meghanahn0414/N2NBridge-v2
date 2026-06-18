import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import api from "../../services/api";

interface Grievance {
  id: string;
  title: string;
  status: string;
  category?: string;
  citizenName?: string;
  createdAt?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW:         { bg: "#DBEAFE", text: "#1D4ED8" },
  ASSIGNED:    { bg: "#FEF3C7", text: "#92400E" },
  IN_PROGRESS: { bg: "#FEF3C7", text: "#92400E" },
  ON_HOLD:     { bg: "#F3F4F6", text: "#374151" },
  RESOLVED:    { bg: "#D1FAE5", text: "#065F46" },
  CLOSED:      { bg: "#D1FAE5", text: "#065F46" },
};

export default function AdminGrievances() {
  const [items, setItems] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const FILTERS = ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  const load = useCallback(async (pg = 1, append = false) => {
    try {
      const params: Record<string, string> = { per_page: "20", page: String(pg) };
      if (filter !== "ALL") params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/api/grievances/", { params });
      const list = (data.items ?? data).map((g: any) => ({
        id: g._id || g.id,
        title: g.title || g.subject || "Untitled",
        status: g.status || "NEW",
        category: g.category,
        citizenName: g.citizenName || g.citizen_name,
        createdAt: g.createdAt || g.created_at,
      }));
      setItems(append ? (prev) => [...prev, ...list] : list);
      setHasMore(list.length === 20);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { setLoading(true); load(1); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(1); setRefreshing(false); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Grievances</Text>
        <Text style={styles.headerCount}>{items.length} records</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search grievances..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={(t) => { setSearch(t); }}
        onSubmitEditing={() => { setLoading(true); load(1); }}
        returnKeyType="search"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "ALL" ? "All" : f.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40 && hasMore) {
            load(page + 1, true);
          }
        }}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No grievances found</Text>
          </View>
        ) : (
          items.map((g) => {
            const color = STATUS_COLORS[g.status] || STATUS_COLORS.NEW;
            return (
              <View key={g.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{g.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
                    <Text style={[styles.statusText, { color: color.text }]}>
                      {g.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                {g.citizenName && (
                  <Text style={styles.cardSub}>👤 {g.citizenName}</Text>
                )}
                <View style={styles.cardBottom}>
                  {g.category && <Text style={styles.tag}>{g.category}</Text>}
                  {g.createdAt && (
                    <Text style={styles.date}>
                      {new Date(g.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                  )}
                </View>
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
    backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#DDD6FE" },
  search: {
    margin: 16, marginBottom: 8, backgroundColor: "#fff",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: "#111827", elevation: 1,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  filterBar: { flexGrow: 0, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#E5E7EB",
  },
  filterChipActive: { backgroundColor: "#7C3AED" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  filterTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginBottom: 10,
    padding: 14, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827", marginRight: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardSub: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tag: {
    fontSize: 11, color: "#7C3AED", backgroundColor: "#F5F3FF",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  date: { fontSize: 11, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
