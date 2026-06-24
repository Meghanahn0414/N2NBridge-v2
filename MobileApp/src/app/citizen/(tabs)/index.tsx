import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useT } from "../../../i18n/useT";

const C = {
  primary: "#1D4ED8",
  primaryDark: "#1E3A8A",
  bg: "#F0F4FF",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  open: "#3B82F6",
  inProgress: "#F59E0B",
  resolved: "#10B981",
  error: "#DC2626",
};

type Stats = { open: number; in_progress: number; resolved: number };
type Complaint = {
  id: string; title?: string; description: string;
  status: string; priority: string; createdAt?: string; created_at?: string;
  categoryId?: string; category?: string;
};

export default function CitizenDashboard() {
  const tr = useT();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);


  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return tr('greeting.morning');
    if (h >= 12 && h < 17) return tr('greeting.afternoon');
    if (h >= 17 && h < 21) return tr('greeting.evening');
    return tr('greeting.night');
  };

  const QUICK_ACTIONS = [
    { label: tr('home.fileComplaint'), icon: "document-text-outline" as const, route: "/citizen/new-complaint", color: C.primary, bg: "#EEF2FF" },
    { label: tr('home.myActivity'),    icon: "list-outline" as const,          route: "/citizen/complaints",    color: "#7C3AED",  bg: "#F5F3FF" },
    { label: tr('home.events'),        icon: "calendar-outline" as const,       route: "/citizen/events",        color: "#0891B2",  bg: "#ECFEFF" },
    { label: tr('home.emergency'),     icon: "warning-outline" as const,        route: "/citizen/sos",           color: "#DC2626",  bg: "#FEF2F2" },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [sRes, cRes, nRes] = await Promise.all([
        api.get(`/api/grievances/stats/citizen/${user?.id}`),
        api.get(`/api/grievances/citizen/${user?.id}?page=1`),
        api.get(`/api/notifications?page=1&per_page=20`).catch(() => ({ data: [] })),
      ]);

      const s = sRes.data?.data ?? sRes.data;
      const byStatus: Record<string, number> = s.byStatus ?? {};
      setStats({
        open:        byStatus.NEW ?? s.open ?? 0,
        in_progress: (byStatus.IN_PROGRESS ?? 0) + (byStatus.ASSIGNED ?? 0) + (byStatus.ON_HOLD ?? 0),
        resolved:    (byStatus.RESOLVED ?? 0) + (byStatus.CLOSED ?? 0),
      });

      const c = cRes.data;
      const list = Array.isArray(c) ? c : (c.items ?? c.results ?? c.data ?? []);
      setRecent(list.slice(0, 4).map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description || "",
        status: g.status || "NEW",
        priority: g.priority || "MEDIUM",
        createdAt: g.createdAt || g.created_at,
        categoryId: g.categoryId,
        category: g.category,
      })));

      const nList = Array.isArray(nRes.data) ? nRes.data : (nRes.data?.items ?? nRes.data?.data ?? []);
      setUnreadCount(nList.filter((n: any) => !n.isRead && !n.read).length);
    } catch {
      // silent — show empty states
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statusColor = (st: string) => {
    switch ((st || "").toUpperCase()) {
      case "OPEN": case "NEW": return C.open;
      case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD": return C.inProgress;
      case "RESOLVED": case "CLOSED": return C.resolved;
      default: return C.muted;
    }
  };

  const statusLabel = (st: string) => {
    switch ((st || "").toUpperCase()) {
      case "NEW": return tr('complaints.open');
      case "IN_PROGRESS": return tr('complaints.inProgress');
      case "ASSIGNED": return tr('complaints.assigned');
      case "RESOLVED": return tr('complaints.resolved');
      case "CLOSED": return tr('complaints.closed');
      default: return (st || "").replace(/_/g, " ");
    }
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return tr('common.recently');
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return tr('common.today');
    if (days === 1) return `1 ${tr('common.daysAgo')}`;
    if (days < 7)  return `${days} ${tr('common.daysAgo')}`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getCatIcon = (cat?: string) => {
    const c = (cat || "").toUpperCase();
    if (c.includes("ROAD"))    return "🛣️";
    if (c.includes("WATER"))   return "💧";
    if (c.includes("GARBAGE") || c.includes("WASTE")) return "🗑️";
    if (c.includes("ELECTRIC")) return "⚡";
    if (c.includes("NOISE"))   return "🔊";
    return "📋";
  };

  const firstName = (user?.name || "Citizen").split(" ")[0];

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.userName}>{firstName}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push("/citizen/notification" as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="#BFDBFE" />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unreadCount > 9 ? "9+" : String(unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.avatarBtn}
            onPress={() => router.push("/citizen/profile" as any)}
          >
            <Text style={s.avatarText}>{firstName[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats row ── */}
        <View style={s.statsRow}>
          {[
            { label: tr('home.open'),        val: stats.open,        color: C.open },
            { label: tr('home.inProgress'),  val: stats.in_progress, color: C.inProgress },
            { label: tr('home.resolved'),    val: stats.resolved,    color: C.resolved },
          ].map((item) => (
            <View key={item.label} style={[s.statCard, { borderTopColor: item.color }]}>
              <Text style={[s.statNum, { color: item.color }]}>{item.val}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={s.sectionTitle}>{tr('home.quickActions')}</Text>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionCard, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.75}
            >
              <View style={[s.actionIconCircle, { backgroundColor: `${a.color}18` }]}>
                <Ionicons name={a.icon} size={24} color={a.color} />
              </View>
              <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent reports ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{tr('home.recentReports')}</Text>
          <TouchableOpacity onPress={() => router.push("/citizen/complaints" as any)}>
            <Text style={s.seeAll}>{tr('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyTitle}>{tr('home.noReportsYet')}</Text>
            <Text style={s.emptyBody}>{tr('home.tapToFile')}</Text>
          </View>
        ) : (
          <View style={s.reportsCard}>
            {recent.map((c, idx) => {
              const sc = statusColor(c.status);
              const isLast = idx === recent.length - 1;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[s.reportRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => router.push(`/citizen/complaint-detail?id=${c.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[s.reportIconBox, { backgroundColor: `${sc}15` }]}>
                    <Text style={{ fontSize: 18 }}>{getCatIcon(c.categoryId || c.category)}</Text>
                  </View>
                  <View style={s.reportBody}>
                    <Text style={s.reportTitle} numberOfLines={1}>
                      {c.title || c.description || "Complaint"}
                    </Text>
                    <Text style={s.reportTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: `${sc}18` }]}>
                    <Text style={[s.statusPillText, { color: sc }]}>
                      {statusLabel(c.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerLeft: {},
  greeting: { color: "#BFDBFE", fontSize: 12, fontWeight: "500" },
  userName: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { position: "relative", padding: 4 },
  notifBadge: {
    position: "absolute", top: 2, right: 2,
    backgroundColor: "#EF4444", borderRadius: 7,
    minWidth: 14, height: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.primaryDark,
  },
  notifBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#93C5FD",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: "center", borderTopWidth: 3, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  statNum: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 10, color: C.muted, marginTop: 3, fontWeight: "600", textTransform: "uppercase" },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: "600" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  actionCard: {
    width: "47%", borderRadius: 16, padding: 18,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
  },
  actionIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  actionLabel: { fontSize: 13, fontWeight: "700" },

  reportsCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
  },
  reportRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC", gap: 12,
  },
  reportIconBox: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  reportBody: { flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 },
  reportTime: { fontSize: 12, color: C.muted },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  emptyCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 32,
    alignItems: "center", elevation: 1,
  },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19 },
});
