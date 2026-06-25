import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
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

type Notif = {
  id: string; title?: string; message?: string;
  type?: string; isRead?: boolean; createdAt?: string;
};

const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  COMPLAINT:     { icon: "document-text-outline", color: "#2B5BD7", bg: "#E7EEFF" },
  EVENT:         { icon: "calendar-outline",       color: "#6B4FD8", bg: "#EDEAFB" },
  CAMPAIGN:      { icon: "megaphone-outline",      color: "#C9871F", bg: "#FEF3C7" },
  STATUS_UPDATE: { icon: "checkmark-circle-outline", color: "#1E8A5B", bg: "#E6F4EC" },
  GENERAL:       { icon: "notifications-outline",  color: "#5A6678", bg: "#F3F5FA" },
};

const DEFAULT_META = { icon: "notifications-outline" as keyof typeof Ionicons.glyphMap, color: "#5A6678", bg: "#F3F5FA" };

export default function NotificationsScreen() {
  const tr = useT();
  const router = useRouter();
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications?page=1&per_page=50");
      const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      setNotifs(list.map((n: any) => ({
        id: n._id || n.id,
        title: n.title,
        message: n.message || n.body,
        type: n.type || n.notificationType,
        isRead: n.isRead || n.read,
        createdAt: n.createdAt || n.created_at,
      })));
      await api.post("/api/notifications/mark-all-read").catch(() => {});
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const formatTime = (dt?: string) => {
    if (!dt) return "";
    const d = new Date(dt);
    const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMins < 60)  return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)  return `${diffDays} days ago`;
    return d.toLocaleDateString("en-IN");
  };

  // Split into Today vs Earlier
  const today = notifs.filter((n) => {
    if (!n.createdAt) return false;
    return Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86400000) < 1;
  });
  const earlier = notifs.filter((n) => {
    if (!n.createdAt) return true;
    return Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 86400000) >= 1;
  });

  const renderItem = ({ item }: { item: Notif }) => {
    const meta = TYPE_META[item.type?.toUpperCase() ?? ""] ?? DEFAULT_META;
    return (
      <View style={[s.card, !item.isRead && s.cardUnread]}>
        <View style={[s.iconBox, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={s.cardBody}>
          {item.title && <Text style={s.cardTitle}>{item.title}</Text>}
          {item.message && <Text style={s.cardMsg} numberOfLines={3}>{item.message}</Text>}
          <Text style={s.cardTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={s.unreadDot} />}
      </View>
    );
  };

  const Section = ({ label, data }: { label: string; data: Notif[] }) =>
    data.length > 0 ? (
      <>
        <Text style={s.sectionLabel}>{label}</Text>
        {data.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </>
    ) : null;

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr("notifications.title")}</Text>
        <TouchableOpacity onPress={() => fetchNotifs()}>
          <Text style={s.markRead}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : notifs.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="notifications-off-outline" size={48} color={C.mutedLight} />
          </View>
          <Text style={s.emptyTitle}>{tr("notifications.noNotifications")}</Text>
          <Text style={s.emptyText}>You're all caught up — no new notifications.</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ""}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} colors={[C.primary]} />
          }
          ListHeaderComponent={
            <View style={s.list}>
              <Section label="Today" data={today} />
              <Section label="Earlier" data={earlier} />
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
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  backBtn:     { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  markRead:    { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },

  list: { padding: 16, paddingBottom: 32 },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: C.mutedLight,
    textTransform: "uppercase", letterSpacing: 0.5,
    marginBottom: 10, marginTop: 6,
  },

  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: C.primary,
    backgroundColor: "#FAFBFF",
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 2, lineHeight: 20 },
  cardMsg:   { fontSize: 13, color: C.muted, lineHeight: 19 },
  cardTime:  { fontSize: 11, color: C.mutedLight, marginTop: 5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 5, flexShrink: 0 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: "#F3F5FA", borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21 },
});
