import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity,
} from "react-native";
import api from "../../services/api";

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  description?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: "#FEF3C7", text: "#92400E" },
  IN_PROGRESS: { bg: "#DBEAFE", text: "#1D4ED8" },
  COMPLETED:  { bg: "#D1FAE5", text: "#065F46" },
  CANCELLED:  { bg: "#F3F4F6", text: "#374151" },
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981",
};

export default function FieldTasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const FILTERS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"];

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = { per_page: "50" };
      if (filter !== "ALL") params.status = filter;
      const { data } = await api.get("/api/tasks/", { params });
      setItems((data.items ?? data).map((t: any) => ({
        id: t._id || t.id,
        title: t.title || t.taskTitle || t.name || "Untitled",
        status: t.status || "PENDING",
        priority: t.priority,
        dueDate: t.dueDate || t.due_date,
        description: t.description,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#D97706" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerCount}>{items.length} tasks</Text>
      </View>

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

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        ) : (
          items.map((t) => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.PENDING;
            return (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{t.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{t.status.replace("_", " ")}</Text>
                  </View>
                </View>
                {t.description && (
                  <Text style={styles.desc} numberOfLines={2}>{t.description}</Text>
                )}
                <View style={styles.cardBottom}>
                  {t.priority && (
                    <View style={[styles.priorityBadge, { borderColor: PRIORITY_COLORS[t.priority] ?? "#ccc" }]}>
                      <Text style={[styles.priorityText, { color: PRIORITY_COLORS[t.priority] ?? "#ccc" }]}>
                        {t.priority}
                      </Text>
                    </View>
                  )}
                  {t.dueDate && (
                    <Text style={styles.dueDate}>
                      Due: {new Date(t.dueDate).toLocaleDateString("en-IN")}
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
    backgroundColor: "#D97706", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#FDE68A" },
  filterBar: { flexGrow: 0, marginVertical: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#E5E7EB" },
  filterChipActive: { backgroundColor: "#D97706" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  filterTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, marginBottom: 10,
    padding: 14, elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827", marginRight: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  desc: { fontSize: 12, color: "#6B7280", marginBottom: 8 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priorityBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 10, fontWeight: "700" },
  dueDate: { fontSize: 11, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
