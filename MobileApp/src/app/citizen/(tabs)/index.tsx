import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar, Alert, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useT } from "../../../i18n/useT";
import { API_BASE } from "../../../config";

const toAbsoluteUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

const C = {
  primary:      "#2B5BD7",
  primaryDark:  "#1B3C8F",
  bg:           "#F3F5FA",
  card:         "#FFFFFF",
  ink:          "#16233C",
  muted:        "#5A6678",
  mutedLight:   "#9AA3B5",
  border:       "#EDF0F6",
  progressBg:   "#FFF3E0",
  progressColor:"#C9871F",
  resolvedBg:   "#E6F4EC",
  resolvedColor:"#1E8A5B",
  newBg:        "#E7EEFF",
  newColor:     "#2B5BD7",
};

type Complaint = {
  id: string; title?: string; description: string;
  status: string; category?: string; categoryId?: string;
  createdAt?: string; created_at?: string;
};
type Announcement = {
  id: string; title?: string; message?: string; createdAt?: string;
};

export default function CitizenDashboard() {
  const tr = useT();
  const { user } = useAuthStore();
  const [recent, setRecent]       = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return tr("greeting.morning");
    if (h >= 12 && h < 17) return tr("greeting.afternoon");
    if (h >= 17 && h < 21) return tr("greeting.evening");
    return tr("greeting.night");
  };

  const fetchData = useCallback(async () => {
    try {
      const [cRes, nRes, pRes] = await Promise.all([
        api.get(`/api/grievances/citizen/${user?.id}?page=1`),
        api.get(`/api/notifications?page=1&per_page=20`).catch(() => ({ data: [] })),
        user?.id ? api.get(`/api/users/${user.id}`).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);

      // Recent complaints
      const c = cRes.data;
      const list = Array.isArray(c) ? c : (c.items ?? c.results ?? c.data ?? []);
      setRecent(list.slice(0, 4).map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description || "",
        status: g.status || "NEW",
        category: g.category,
        categoryId: g.categoryId,
        createdAt: g.createdAt || g.created_at,
      })));

      // Notifications — split unread count vs announcements
      const nList = Array.isArray(nRes.data) ? nRes.data : (nRes.data?.items ?? nRes.data?.data ?? []);
      setUnreadCount(nList.filter((n: any) => !n.isRead && !n.read).length);
      const ann = nList
        .filter((n: any) => ["CAMPAIGN", "EVENT", "GENERAL"].includes((n.type || "").toUpperCase()))
        .slice(0, 2)
        .map((n: any) => ({
          id: n._id || n.id,
          title: n.title,
          message: n.message || n.body,
          createdAt: n.createdAt || n.created_at,
        }));
      setAnnouncements(ann);

      // Profile (ward info + photo)
      if (pRes.data) {
        const p = pRes.data?.data ?? pRes.data;
        if (p?.profileImage) p.profileImage = toAbsoluteUrl(p.profileImage);
        setProfile(p);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const statusMeta = (st: string) => {
    switch ((st || "").toUpperCase()) {
      case "OPEN": case "NEW":
        return { color: C.newColor, bg: C.newBg, label: "Open" };
      case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD":
        return { color: C.progressColor, bg: C.progressBg, label: "In progress" };
      case "RESOLVED": case "CLOSED":
        return { color: C.resolvedColor, bg: C.resolvedBg, label: "Resolved" };
      default:
        return { color: C.muted, bg: "#F3F5FA", label: (st || "").replace(/_/g, " ") };
    }
  };

  const getCatIcon = (cat?: string): keyof typeof Ionicons.glyphMap => {
    const c = (cat || "").toUpperCase();
    if (c.includes("ROAD") || c.includes("POTHOLE"))   return "construct-outline";
    if (c.includes("WATER"))                            return "water-outline";
    if (c.includes("GARBAGE") || c.includes("WASTE") || c.includes("SANIT")) return "trash-outline";
    if (c.includes("ELECTRIC") || c.includes("LIGHT")) return "flash-outline";
    if (c.includes("PARK"))                             return "leaf-outline";
    return "document-text-outline";
  };

  const getCatColor = (cat?: string) => {
    const c = (cat || "").toUpperCase();
    if (c.includes("ROAD") || c.includes("POTHOLE"))   return { color: "#C9871F", bg: "#FEF3C7" };
    if (c.includes("WATER"))                            return { color: "#0891B2", bg: "#E0F7FA" };
    if (c.includes("GARBAGE") || c.includes("SANIT"))  return { color: "#1E8A5B", bg: "#E6F4EC" };
    if (c.includes("ELECTRIC") || c.includes("LIGHT")) return { color: "#C9871F", bg: "#FEF3C7" };
    if (c.includes("PARK"))                             return { color: "#1E8A5B", bg: "#E6F4EC" };
    return { color: C.primary, bg: C.newBg };
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return tr("Recently");
    const parseUTC = (dt: string) =>
      new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(dt) ? dt : dt + "Z");
    const d = parseUTC(dateStr);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    const hrs  = Math.floor((Date.now() - d.getTime()) / 3600000);
    const ago  = tr("ago");
    if (hrs < 1)   return tr("Just now");
    if (hrs < 24)  return `${hrs}h ${ago}`;
    if (days === 1) return tr("Yesterday");
    if (days < 7)  return `${days}d ${ago}`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const firstName = (user?.name || "Citizen").split(" ")[0];
  const wardLabel  = profile?.wardId ? `Ward ${profile.wardId}` : null;
  const areaLabel  = profile?.address || null;
  const locationStr = [areaLabel, wardLabel].filter(Boolean).join(" · ");

  const handleCameraPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to attach a photo to your complaint.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"], quality: 0.7, allowsEditing: false,
    }).catch(() =>
      // fallback to gallery if camera not available (e.g. simulator)
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 })
    );
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      router.push(`/citizen/new-complaint?photoUri=${encodeURIComponent(uri)}` as any);
    } else {
      // No photo taken — just go to form
      router.push("/citizen/new-complaint" as any);
    }
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.greeting}>{getGreeting()}</Text>
          <Text style={s.userName}>{firstName}</Text>
          {locationStr ? (
            <View style={s.locationPill}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={s.locationText}>{locationStr}</Text>
              <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.55)" />
            </View>
          ) : null}
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push("/citizen/notification" as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.85)" />
            {unreadCount > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.avatar}
            onPress={() => router.push("/citizen/profile" as any)}
          >
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={s.avatarImg}
              />
            ) : (
              <Text style={s.avatarText}>{firstName[0].toUpperCase()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Report CTA ── */}
        <TouchableOpacity
          style={s.ctaCard}
          onPress={() => router.push("/citizen/new-complaint" as any)}
          activeOpacity={0.85}
        >
          <View style={s.ctaLeft}>
            <Text style={s.ctaTitle}>{tr("Report an issue")}</Text>
            <Text style={s.ctaSub}>{tr("Photo + location in 30 seconds")}</Text>
          </View>
          <TouchableOpacity style={s.ctaIconBox} onPress={handleCameraPress} activeOpacity={0.75}>
            <Ionicons name="camera-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── Near you ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{tr("Near you")}</Text>
          <TouchableOpacity onPress={() => router.push("/citizen/complaint-list" as any)}>
            <Text style={s.seeAll}>{tr("See all")}</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIconBox}>
              <Ionicons name="inbox-outline" size={44} color={C.mutedLight} />
            </View>
            <Text style={s.emptyTitle}>{tr("No reports yet")}</Text>
            <Text style={s.emptyBody}>{tr("Tap 'Report an issue' to submit your first complaint.")}</Text>
          </View>
        ) : (
          recent.map((c) => {
            const sm  = statusMeta(c.status);
            const cat = getCatColor(c.categoryId || c.category);
            const icon = getCatIcon(c.categoryId || c.category);
            return (
              <TouchableOpacity
                key={c.id}
                style={s.nearCard}
                onPress={() => router.push(`/citizen/complaint-detail?id=${c.id}` as any)}
                activeOpacity={0.78}
              >
                {/* Photo placeholder */}
                <View style={s.photoPlaceholder}>
                  <View style={[s.photoIcon, { backgroundColor: cat.bg }]}>
                    <Ionicons name={icon} size={28} color={cat.color} />
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: sm.bg }]}>
                    <Text style={[s.statusBadgeText, { color: sm.color }]}>{tr(sm.label)}</Text>
                  </View>
                </View>
                {/* Info */}
                <View style={s.nearCardBody}>
                  <Text style={s.nearCardTitle} numberOfLines={2}>
                    {c.title || c.description || "Complaint"}
                  </Text>
                  <Text style={s.nearCardMeta}>
                    {[c.category, timeAgo(c.createdAt)].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Announcements ── */}
        {announcements.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 24 }]}>{tr("Announcements")}</Text>
            {announcements.map((a) => (
              <View key={a.id} style={s.announcementCard}>
                <View style={s.annIconBox}>
                  <Ionicons name="megaphone-outline" size={18} color={C.primary} />
                </View>
                <View style={s.annBody}>
                  {a.title && <Text style={s.annTitle} numberOfLines={2}>{a.title}</Text>}
                  {a.message && !a.title && <Text style={s.annTitle} numberOfLines={2}>{a.message}</Text>}
                  <Text style={s.annTime}>{timeAgo(a.createdAt)}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 54, paddingBottom: 22, paddingHorizontal: 22,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  headerLeft:   {},
  greeting:     { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500" },
  userName:     { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2, marginBottom: 8 },
  locationPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: "flex-start",
  },
  locationText: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 },
  iconBtn:      { position: "relative", padding: 6 },
  notifBadge: {
    position: "absolute", top: 2, right: 2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#F59E0B", borderWidth: 1.5, borderColor: C.primaryDark,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
  },
  notifBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  avatarImg:  { width: 40, height: 40, borderRadius: 20 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 18, paddingTop: 20 },

  ctaCard: {
    backgroundColor: C.primary,
    borderRadius: 18, padding: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 26,
    elevation: 4, shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  ctaLeft:    { flex: 1 },
  ctaTitle:   { color: "#fff", fontSize: 18, fontWeight: "800" },
  ctaSub:     { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 },
  ctaIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.ink },
  seeAll:       { fontSize: 13, color: C.primary, fontWeight: "600" },

  // Near you cards
  nearCard: {
    backgroundColor: C.card, borderRadius: 18, marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  photoPlaceholder: {
    height: 130, backgroundColor: "#EEF1F8",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  photoIcon: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  statusBadge: {
    position: "absolute", top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  nearCardBody: { padding: 14 },
  nearCardTitle: { fontSize: 15, fontWeight: "700", color: C.ink, marginBottom: 5, lineHeight: 21 },
  nearCardMeta:  { fontSize: 12, color: C.muted },

  // Announcements
  announcementCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  annIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  annBody:  { flex: 1 },
  annTitle: { fontSize: 14, fontWeight: "600", color: C.ink, lineHeight: 20, marginBottom: 3 },
  annTime:  { fontSize: 12, color: C.mutedLight },

  emptyCard: {
    backgroundColor: C.card, borderRadius: 18, padding: 36,
    alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  emptyIconBox: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: "#F3F5FA",
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.ink, marginBottom: 6 },
  emptyBody:  { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20 },
});
