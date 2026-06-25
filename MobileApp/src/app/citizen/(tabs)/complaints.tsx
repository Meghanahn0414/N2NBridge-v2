import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useT } from "../../../i18n/useT";

const C = {
  primary:    "#2B5BD7",
  primaryDark:"#1B3C8F",
  bg:         "#F3F5FA",
  card:       "#FFFFFF",
  ink:        "#16233C",
  muted:      "#5A6678",
  mutedLight: "#9AA3B5",
  border:     "#EDF0F6",
};

type ActivityItem = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  STATUS_UPDATE: { icon: "checkmark-circle-outline", color: "#1E8A5B", bg: "#E6F4EC" },
  COMPLAINT:     { icon: "document-text-outline",    color: "#2B5BD7", bg: "#E7EEFF" },
  REPLY:         { icon: "chatbubble-outline",        color: "#6B4FD8", bg: "#EDEAFB" },
  EVENT:         { icon: "calendar-outline",          color: "#6B4FD8", bg: "#EDEAFB" },
  CAMPAIGN:      { icon: "megaphone-outline",         color: "#C9871F", bg: "#FEF3C7" },
  POLL:          { icon: "bar-chart-outline",         color: "#6B4FD8", bg: "#EDEAFB" },
  GENERAL:       { icon: "notifications-outline",     color: "#5A6678", bg: "#F3F5FA" },
};
const DEFAULT_META = { icon: "notifications-outline" as keyof typeof Ionicons.glyphMap, color: "#5A6678", bg: "#F3F5FA" };

export default function ActivityScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems]       = useState<ActivityItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications?page=1&per_page=50");
      const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      setItems(list.map((n: any) => ({
        id: n._id || n.id,
        title: n.title,
        message: n.message || n.body,
        type: n.type || n.notificationType,
        isRead: n.isRead || n.read,
        createdAt: n.createdAt || n.created_at,
      })));
      // Mark all read silently
      api.post("/api/notifications/mark-all-read").catch(() => {});
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const formatTime = (dt?: string) => {
    if (!dt) return "";
    const d = new Date(dt);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 60)  return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)  return `${diffDays} days ago`;
    return d.toLocaleDateString("en-IN");
  };

  const today   = items.filter((n) => n.createdAt && Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86400000) < 1);
  const earlier = items.filter((n) => !n.createdAt || Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86400000) >= 1);

  const renderItem = (item: ActivityItem) => {
    const meta = TYPE_META[(item.type || "").toUpperCase()] ?? DEFAULT_META;
    return (
      <View key={item.id} style={[s.card, !item.isRead && s.cardUnread]}>
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={s.cardBody}>
          {item.title
            ? <Text style={s.cardTitle}>{item.title}</Text>
            : item.message
            ? <Text style={s.cardTitle} numberOfLines={2}>{item.message}</Text>
            : null}
          {item.title && item.message && (
            <Text style={s.cardMsg} numberOfLines={2}>{item.message}</Text>
          )}
          <Text style={s.cardTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={s.unreadDot} />}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Activity</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => fetchActivity()}>
            <Text style={s.markReadBtn}>Mark read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : items.length === 0 ? (
        /* ── Empty state ── */
        <View style={s.empty}>
          <View style={s.emptyIllustration}>
            <View style={s.emptyIconBox}>
              <Ionicons name="receipt-outline" size={48} color={C.mutedLight} />
            </View>
          </View>
          <Text style={s.emptyTitle}>No reports yet</Text>
          <Text style={s.emptyText}>
            When you report an issue or follow one nearby, you'll track all the updates right here.
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => router.push("/citizen/new-complaint" as any)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.emptyBtnText}>Report an issue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.emptyLink}
            onPress={() => router.push("/citizen/services" as any)}
          >
            <Text style={s.emptyLinkText}>Explore nearby reports</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchActivity(); }}
              colors={[C.primary]}
            />
          }
        >
          {today.length > 0 && (
            <>
              <Text style={s.sectionLabel}>TODAY</Text>
              {today.map(renderItem)}
            </>
          )}
          {earlier.length > 0 && (
            <>
              <Text style={s.sectionLabel}>EARLIER</Text>
              {earlier.map(renderItem)}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
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
  headerTitle:  { fontSize: 28, fontWeight: "800", color: C.ink },
  markReadBtn:  { fontSize: 13, color: C.primary, fontWeight: "600", paddingBottom: 2 },

  list: { padding: 16, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: C.mutedLight,
    textTransform: "uppercase", letterSpacing: 0.7,
    marginBottom: 10, marginTop: 6,
  },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    marginBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: C.primary,
    backgroundColor: "#FAFBFF",
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: C.ink, marginBottom: 2, lineHeight: 20 },
  cardMsg:   { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 2 },
  cardTime:  { fontSize: 11, color: C.mutedLight, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6, flexShrink: 0 },

  /* Empty state */
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 36, paddingBottom: 40,
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
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.ink, marginBottom: 10, textAlign: "center" },
  emptyText:  { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 14, marginBottom: 16,
    elevation: 3, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyLink:    { paddingVertical: 6 },
  emptyLinkText:{ color: C.primary, fontSize: 14, fontWeight: "600" },
});
