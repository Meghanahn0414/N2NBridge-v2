import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

const C = {
  primary:     "#2B5BD7",
  primaryDark: "#1B3C8F",
  bg:          "#F3F5FA",
  card:        "#FFFFFF",
  ink:         "#16233C",
  muted:       "#5A6678",
  mutedLight:  "#9AA3B5",
  border:      "#EDF0F6",
};

const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Open: ["OPEN", "NEW"],
  "In Progress": ["IN_PROGRESS", "ASSIGNED", "ON_HOLD"],
  Resolved: ["RESOLVED", "CLOSED"],
};

type Complaint = {
  id: string; title?: string; description?: string;
  status: string; priority: string;
  category?: string; categoryId?: string;
  createdAt?: string;
};

const statusMeta = (s: string) => {
  switch (s?.toUpperCase()) {
    case "NEW": case "OPEN":
      return { color: "#2B5BD7", bg: "#E7EEFF", label: "Open" };
    case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD":
      return { color: "#C9871F", bg: "#FEF3C7", label: "In progress" };
    case "RESOLVED": case "CLOSED":
      return { color: "#1E8A5B", bg: "#E6F4EC", label: "Resolved" };
    default:
      return { color: C.muted, bg: "#F3F5FA", label: (s || "").replace(/_/g, " ") };
  }
};

const getCatIcon = (cat?: string): keyof typeof Ionicons.glyphMap => {
  const c = (cat || "").toUpperCase();
  if (c.includes("ROAD") || c.includes("POTHOLE"))  return "construct-outline";
  if (c.includes("WATER"))                           return "water-outline";
  if (c.includes("GARBAGE") || c.includes("SANIT")) return "trash-outline";
  if (c.includes("ELECTRIC") || c.includes("LIGHT"))return "flash-outline";
  return "document-text-outline";
};

const getCatColor = (cat?: string) => {
  const c = (cat || "").toUpperCase();
  if (c.includes("ROAD") || c.includes("POTHOLE"))  return { color: "#C9871F", bg: "#FEF3C7" };
  if (c.includes("WATER"))                           return { color: "#0891B2", bg: "#E0F7FA" };
  if (c.includes("GARBAGE") || c.includes("SANIT")) return { color: "#1E8A5B", bg: "#E6F4EC" };
  if (c.includes("ELECTRIC") || c.includes("LIGHT"))return { color: "#6B4FD8", bg: "#EDEAFB" };
  return { color: "#2B5BD7", bg: "#E7EEFF" };
};

export default function ComplaintListScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered]     = useState<Complaint[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const FILTERS = ["All", "Open", "In Progress", "Resolved"];

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return tr("Today");
    if (days === 1) return tr("Yesterday");
    if (days < 7)  return `${days}d ${tr("ago")}`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const fetchComplaints = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const { data } = await api.get(`/api/grievances/citizen/${user?.id}?page=${pageNum}`);
      const list: Complaint[] = Array.isArray(data) ? data : (data.items ?? data.results ?? data.data ?? []);
      const mapped = list.map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description || "",
        status: g.status || "NEW",
        priority: g.priority || "MEDIUM",
        category: g.category,
        categoryId: g.categoryId,
        createdAt: g.createdAt || g.created_at,
      }));
      if (refresh || pageNum === 1) setComplaints(mapped);
      else setComplaints((prev) => [...prev, ...mapped]);
      setHasMore(mapped.length === 10);
      setPage(pageNum);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  }, [user?.id]);

  useEffect(() => { fetchComplaints(1); }, [fetchComplaints]);

  useEffect(() => {
    const statuses = STATUS_MAP[activeFilter];
    setFiltered(
      statuses.length === 0
        ? complaints
        : complaints.filter((c) => statuses.includes(c.status?.toUpperCase())),
    );
  }, [complaints, activeFilter]);

  const renderItem = ({ item }: { item: Complaint }) => {
    const sm  = statusMeta(item.status);
    const cat = getCatColor(item.categoryId || item.category);
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/citizen/complaint-detail?id=${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={[s.catIconBox, { backgroundColor: cat.bg }]}>
          <Ionicons name={getCatIcon(item.categoryId || item.category)} size={20} color={cat.color} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.title || item.description || tr("Complaint")}
          </Text>
          <Text style={s.cardMeta}>
            {[item.category, timeAgo(item.createdAt)].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={[s.pill, { backgroundColor: sm.bg }]}>
          <Text style={[s.pillText, { color: sm.color }]}>{tr(sm.label)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr("My Reports")}</Text>
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push("/citizen/new-complaint" as any)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View style={s.filterBar}>
        {FILTERS.map((f) => {
          const count = f === "All"
            ? complaints.length
            : complaints.filter((c) => STATUS_MAP[f].includes(c.status?.toUpperCase())).length;
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, active && s.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[s.filterText, active && s.filterTextActive]}>
                {tr(f)}{count > 0 ? ` · ${count}` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchComplaints(1, true); }}
              colors={[C.primary]}
            />
          }
          onEndReached={() => {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
            fetchComplaints(page + 1);
          }}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />
              : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="inbox-outline" size={48} color={C.mutedLight} />
              </View>
              <Text style={s.emptyTitle}>{tr("No reports found")}</Text>
              <Text style={s.emptyText}>
                {activeFilter === "All"
                  ? tr("You haven't filed any complaints yet.")
                  : `${tr("No")} ${tr(activeFilter.toLowerCase())} ${tr("complaints.")}`}
              </Text>
              {activeFilter === "All" && (
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push("/citizen/new-complaint" as any)}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={s.emptyBtnText}>{tr("File a complaint")}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn:     { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  newBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  filterBar: {
    flexDirection: "row", backgroundColor: C.card, paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#F3F5FA",
    borderWidth: 1, borderColor: C.border,
  },
  filterPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText:       { fontSize: 12, fontWeight: "600", color: C.muted },
  filterTextActive: { color: "#fff" },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  catIconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: C.ink, marginBottom: 3 },
  cardMeta:  { fontSize: 12, color: C.mutedLight },
  pill:      { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  pillText:  { fontSize: 11, fontWeight: "700" },

  empty: { flex: 1, alignItems: "center", paddingTop: 70, paddingHorizontal: 32 },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: "#F3F5FA", borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle:   { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21, marginBottom: 24 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    elevation: 3, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
