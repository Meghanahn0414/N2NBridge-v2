import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useT } from "../../../i18n/useT";

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

type Complaint = {
  id: string;
  title?: string;
  status: string;
  category?: string;
  createdAt?: string;
};

const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Open: ["OPEN", "NEW"],
  "In Progress": ["IN_PROGRESS", "ASSIGNED", "ON_HOLD"],
  Resolved: ["RESOLVED", "CLOSED"],
};
const FILTERS = ["All", "Open", "In Progress", "Resolved"];

const statusLabel = (s: string) => {
  switch ((s || "").toUpperCase()) {
    case "NEW": case "OPEN":                              return { color: "#2B5BD7", bg: "#E7EEFF", label: "Open" };
    case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD": return { color: "#C9871F", bg: "#FEF3C7", label: "In Progress" };
    case "RESOLVED": case "CLOSED":                      return { color: "#1E8A5B", bg: "#E6F4EC", label: "Resolved" };
    default: return { color: C.muted, bg: "#F3F5FA", label: (s || "").replace(/_/g, " ") };
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

export default function ActivityScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading]      = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseUTC = (dt: string) =>
    new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(dt) ? dt : dt + "Z");

  const fetchActivity = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // /api/grievances/citizen/{id} doesn't exist — GET /api/grievances/
      // derives the citizen from the JWT.
      const { data } = await api.get(`/api/grievances/?page=1&per_page=50`);
      const list: any[] = data?.data?.items ?? [];
      setComplaints(
        list.map((g: any) => ({
          id: g._id || g.id,
          title: g.title || g.description || "",
          status: g.status || "NEW",
          category: ([g.categoryId, g.categoryName, g.category_name, g.category]
            .map((v) => (typeof v === "string" ? v : ""))
            .find((v) => v && !v.match(/^[a-f\d]{24}$/i)) ?? ""),
          createdAt: g.createdAt || g.created_at,
        }))
      );
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const filtered = (() => {
    const statuses = STATUS_MAP[activeFilter] ?? [];
    if (statuses.length === 0) return complaints;
    return complaints.filter((c) =>
      statuses.includes((c.status || "").toUpperCase())
    );
  })();

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = parseUTC(dateStr);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 1)  return tr("Just now");
    if (diffMins < 60) return `${diffMins}m ${tr("ago")}`;
    const h = Math.floor(diffMins / 60);
    if (h < 24) return `${h}h ${tr("ago")}`;
    const days = Math.floor(h / 24);
    if (days === 1) return tr("Yesterday");
    if (days < 7)  return `${days}d ${tr("ago")}`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const renderItem = ({ item }: { item: Complaint }) => {
    const sm  = statusLabel(item.status);
    const cat = getCatColor(item.category);
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => router.push(`/citizen/complaint-detail?id=${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={[s.catIconBox, { backgroundColor: cat.bg }]}>
          <Ionicons name={getCatIcon(item.category)} size={20} color={cat.color} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>
            {item.title || tr("Complaint")}
          </Text>
          <Text style={s.cardMeta}>
            {[item.category?.replace(/_/g, " "), timeAgo(item.createdAt)]
              .filter(Boolean).join(" · ")}
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
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{tr("Activity")}</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push("/citizen/new-complaint" as any)}
        >
          <Ionicons name="add" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Status filter pills */}
      <View style={s.filterBar}>
        {FILTERS.map((f) => {
          const count = f === "All"
            ? complaints.length
            : complaints.filter((c) =>
                STATUS_MAP[f].includes((c.status || "").toUpperCase())
              ).length;
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchActivity(); }}
              colors={[C.primary]}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIllustration}>
                <View style={s.emptyIconBox}>
                  <Ionicons name="receipt-outline" size={48} color={C.mutedLight} />
                </View>
              </View>
              <Text style={s.emptyTitle}>
                {activeFilter === "All"
                  ? tr("No reports yet")
                  : `${tr("No")} ${tr(activeFilter.toLowerCase())} ${tr("complaints")}`}
              </Text>
              <Text style={s.emptyText}>
                {activeFilter === "All"
                  ? tr("When you report an issue, you'll track all the updates right here.")
                  : tr("Try a different filter to see your complaints.")}
              </Text>
              {activeFilter === "All" && (
                <>
                  <TouchableOpacity
                    style={s.emptyBtn}
                    onPress={() => router.push("/citizen/new-complaint" as any)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={s.emptyBtnText}>{tr("Report an issue")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.emptyLink}
                    onPress={() => router.push("/citizen/services" as any)}
                  >
                    <Text style={s.emptyLinkText}>{tr("Explore nearby reports")}</Text>
                  </TouchableOpacity>
                </>
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
    backgroundColor: C.card,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: C.ink },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },

  filterBar: {
    flexDirection: "row", backgroundColor: C.card, paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: C.bg,
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
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  catIconBox: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: C.ink, marginBottom: 3 },
  cardMeta:  { fontSize: 12, color: C.mutedLight },
  pill:      { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  pillText:  { fontSize: 11, fontWeight: "700" },

  /* Empty state */
  empty: {
    flex: 1, alignItems: "center",
    paddingHorizontal: 36, paddingTop: 60, paddingBottom: 40,
  },
  emptyIllustration: {
    width: 140, height: 140, borderRadius: 32,
    backgroundColor: "#EEF1F8",
    alignItems: "center", justifyContent: "center",
    marginBottom: 28,
  },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: "#E4E8F4",
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle:    { fontSize: 20, fontWeight: "800", color: C.ink, marginBottom: 10, textAlign: "center" },
  emptyText:     { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 14, marginBottom: 16,
    elevation: 3, shadowColor: C.primary, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  emptyBtnText:  { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyLink:     { paddingVertical: 6 },
  emptyLinkText: { color: C.primary, fontSize: 14, fontWeight: "600" },
});
