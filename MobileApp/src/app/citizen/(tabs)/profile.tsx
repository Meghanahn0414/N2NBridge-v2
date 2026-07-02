import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, RefreshControl, StatusBar, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../store/authStore";
import api from "../../../services/api";
import { useRouter, useFocusEffect } from "expo-router";
import { API_BASE } from "../../../config";
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

const realEmail = (e: string | null | undefined) => (e && !e.startsWith("otp-") ? e : "");
const toAbsoluteUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

type RecentComplaint = {
  id: string; title?: string; description?: string;
  status: string; category?: string; categoryId?: string;
  createdAt?: string;
};

const statusMeta = (st: string) => {
  switch ((st || "").toUpperCase()) {
    case "OPEN": case "NEW":
      return { color: "#2B5BD7", bg: "#E7EEFF", label: "Open" };
    case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD":
      return { color: "#C9871F", bg: "#FEF3C7", label: "In progress" };
    case "RESOLVED": case "CLOSED":
      return { color: "#1E8A5B", bg: "#E6F4EC", label: "Resolved" };
    default:
      return { color: C.muted, bg: "#F3F5FA", label: (st || "").replace(/_/g, " ") };
  }
};

const getCatIcon = (cat?: string): keyof typeof Ionicons.glyphMap => {
  const c = (cat || "").toUpperCase();
  if (c.includes("ROAD") || c.includes("POTHOLE"))   return "construct-outline";
  if (c.includes("WATER"))                            return "water-outline";
  if (c.includes("GARBAGE") || c.includes("SANIT"))  return "trash-outline";
  if (c.includes("ELECTRIC") || c.includes("LIGHT")) return "flash-outline";
  if (c.includes("PARK"))                             return "leaf-outline";
  return "document-text-outline";
};

const getCatStyle = (cat?: string) => {
  const c = (cat || "").toUpperCase();
  if (c.includes("ROAD") || c.includes("POTHOLE"))   return { color: "#C9871F", bg: "#FEF3C7" };
  if (c.includes("WATER"))                            return { color: "#0891B2", bg: "#E0F7FA" };
  if (c.includes("GARBAGE") || c.includes("SANIT"))  return { color: "#1E8A5B", bg: "#E6F4EC" };
  if (c.includes("ELECTRIC") || c.includes("LIGHT")) return { color: "#6B4FD8", bg: "#EDEAFB" };
  if (c.includes("PARK"))                             return { color: "#1E8A5B", bg: "#E6F4EC" };
  return { color: C.primary, bg: "#E7EEFF" };
};

export default function ProfileScreen() {
  const tr = useT();
  const router = useRouter();
  const { user, profileComplete } = useAuthStore();
  const [profile, setProfile]           = useState<any>(null);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [statsData, setStatsData]       = useState({ total: 0, resolved: 0 });
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError]     = useState(false);

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return tr("Today");
    if (days === 1) return tr("Updated yesterday");
    if (days < 7)  return `${tr("Updated")} ${days}d ${tr("ago")}`;
    const date = new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${tr("Updated")} ${date}`;
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    // /api/citizens/me requires a tenant (db_name) claim on the token,
    // which only exists once profile completion has resolved a
    // representative. A citizen who's only done OTP verification so far has
    // a bare master-DB account with no db_name yet — calling this early
    // always 400s (harmless since it's caught below, but pure console
    // noise and a wasted request). Skip until profile setup is done.
    if (!profileComplete) { setLoading(false); setRefreshing(false); return; }
    try {
      // /api/users/{id} is rep/staff-only (403s for a citizen) — the
      // citizen-safe equivalent is /api/citizens/me. /api/grievances/
      // citizen/{id} and /api/grievances/stats/citizen/{id} don't exist at
      // all; there's no dedicated stats endpoint, so counts are computed
      // client-side from the (large-page) grievances list instead.
      const [pRes, cRes] = await Promise.all([
        api.get(`/api/citizens/me`),
        api.get(`/api/grievances/?page=1&per_page=100`).catch(() => ({ data: null })),
      ]);
      const p = pRes.data?.data ?? pRes.data;
      if (p?.profileImage) p.profileImage = toAbsoluteUrl(p.profileImage);
      setPhotoError(false);
      setProfile(p);

      const list = cRes.data?.data?.items ?? [];
      const total = cRes.data?.data?.total ?? list.length;
      const resolved = list.filter((g: any) => ["Resolved", "Closed"].includes(g.status)).length;
      setStatsData({ total, resolved });

      setRecentComplaints(list.slice(0, 3).map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description,
        status: g.status || "NEW",
        category: g.category,
        categoryId: g.categoryId,
        createdAt: g.createdAt || g.created_at,
      })));
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id, profileComplete]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePhotoUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const localUri = result.assets[0].uri;
    setProfile((p: any) => ({ ...p, profileImage: localUri }));
    setPhotoError(false);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      if (Platform.OS === "web") {
        const res = await fetch(localUri);
        const blob = await res.blob();
        fd.append("file", new File([blob], "profile.jpg", { type: "image/jpeg" }));
      } else {
        fd.append("file", { uri: localUri, name: "profile.jpg", type: "image/jpeg" } as any);
      }
      // /api/users/{id}/upload-profile-photo is rep/staff-only and writes to
      // the wrong collection for a citizen — /api/citizens/me/upload-photo
      // is the working equivalent (see edit-profile.tsx).
      const { data } = await api.post(`/api/citizens/me/upload-photo`, fd);
      const rawUri = data?.profileImage || data?.data?.profileImage;
      if (rawUri) setProfile((p: any) => ({ ...p, profileImage: toAbsoluteUrl(rawUri) }));
    } catch { /* keep local preview */ }
    finally { setUploadingPhoto(false); }
  };

  const initials = (profile?.fullName || user?.name || user?.email || "C")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const wardLabel  = profile?.ward_id ? `${tr("Ward")} ${profile.ward_id}` : null;
  const areaLabel  = profile?.address || null;
  const locationStr = [areaLabel, wardLabel, tr("Verified resident")].filter(Boolean).join(" · ");

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const totalComplaints = statsData.total || profile?.totalComplaints || 0;
  const resolvedCount   = statsData.resolved || profile?.resolvedComplaints || 0;
  const supportsCount   = profile?.supportCount ?? profile?.supports ?? 0;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[C.primary]} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.cogBtn} onPress={() => router.push("/citizen/settings" as any)}>
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          <TouchableOpacity style={s.avatarWrap} onPress={handlePhotoUpload} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <View style={s.avatarInner}><ActivityIndicator color="#fff" /></View>
            ) : profile?.profileImage && !photoError ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={s.avatarImg}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <View style={s.avatarInner}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={s.name}>{profile?.fullName || user?.name || "Citizen"}</Text>
          <Text style={s.location} numberOfLines={1}>{locationStr}</Text>
        </View>

        {/* ── Stats strip ── */}
        <View style={s.statsStrip}>
          {[
            { label: "Reports",  val: totalComplaints },
            { label: "Resolved", val: resolvedCount },
            { label: "Supports", val: supportsCount },
          ].map((item, i, arr) => (
            <View key={i} style={[s.statItem, i < arr.length - 1 && s.statItemBorder]}>
              <Text style={s.statVal}>{item.val}</Text>
              <Text style={s.statLbl}>{tr(item.label)}</Text>
            </View>
          ))}
        </View>

        {/* ── Your reports ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{tr("Your reports")}</Text>
            <TouchableOpacity onPress={() => router.push("/citizen/complaint-list" as any)}>
              <Text style={s.seeAll}>{tr("See all")}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            {recentComplaints.length === 0 ? (
              <View style={s.reportsEmpty}>
                <Text style={s.reportsEmptyText}>{tr("No reports filed yet.")}</Text>
                <TouchableOpacity onPress={() => router.push("/citizen/new-complaint" as any)}>
                  <Text style={s.reportsEmptyLink}>{tr("File your first complaint")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentComplaints.map((c, idx) => {
                const sm  = statusMeta(c.status);
                const cat = getCatStyle(c.categoryId || c.category);
                const icon = getCatIcon(c.categoryId || c.category);
                const isLast = idx === recentComplaints.length - 1;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.reportRow, isLast && { borderBottomWidth: 0 }]}
                    onPress={() => router.push(`/citizen/complaint-detail?id=${c.id}` as any)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.reportIconBox, { backgroundColor: cat.bg }]}>
                      <Ionicons name={icon} size={18} color={cat.color} />
                    </View>
                    <View style={s.reportBody}>
                      <Text style={s.reportTitle} numberOfLines={1}>
                        {c.title || c.description || tr("Complaint")}
                      </Text>
                      <Text style={s.reportTime}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <View style={[s.pill, { backgroundColor: sm.bg }]}>
                      <Text style={[s.pillText, { color: sm.color }]}>{tr(sm.label)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* ── Account details ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{tr("Personal details")}</Text>
            <TouchableOpacity onPress={() => router.push("/citizen/edit-profile" as any)}>
              <Text style={s.seeAll}>{tr("Edit")}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            {[
              { icon: "person-outline"   as const, label: "Full name",   value: profile?.fullName || user?.name || "—" },
              { icon: "call-outline"     as const, label: "Phone",       value: profile?.mobile || profile?.phone || "—" },
              { icon: "mail-outline"     as const, label: "Email",       value: realEmail(profile?.email) || realEmail(user?.email) || "—" },
              { icon: "location-outline" as const, label: "Address",     value: profile?.address || "—" },
              { icon: "map-outline"      as const, label: "Ward",        value: profile?.ward_id ? `${tr("Ward")} ${profile.ward_id}` : "—" },
            ].map((row, idx, arr) => (
              <View key={row.label} style={[s.detailRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.detailIconBox}>
                  <Ionicons name={row.icon} size={15} color={C.primary} />
                </View>
                <View style={s.detailBody}>
                  <Text style={s.detailLabel}>{tr(row.label)}</Text>
                  <Text style={s.detailValue} numberOfLines={1}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Settings link ── */}
        <TouchableOpacity style={s.settingsRow} onPress={() => router.push("/citizen/settings" as any)}>
          <View style={s.settingsIcon}>
            <Ionicons name="settings-outline" size={18} color={C.primary} />
          </View>
          <Text style={s.settingsText}>{tr("Settings & account")}</Text>
          <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />
        </TouchableOpacity>

        <Text style={s.version}>Neta to Nagarika v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 56, paddingBottom: 30,
    alignItems: "center", position: "relative",
  },
  cogBtn: {
    position: "absolute", top: 56, right: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2.5, borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden", marginBottom: 14,
  },
  avatarImg:   { width: "100%", height: "100%" },
  avatarInner: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  avatarText:  { color: "#fff", fontSize: 30, fontWeight: "700" },
  name:        { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 6 },
  location:    { color: "rgba(255,255,255,0.65)", fontSize: 12, paddingHorizontal: 32, textAlign: "center" },

  statsStrip: {
    backgroundColor: C.card, flexDirection: "row",
    marginHorizontal: 18, marginTop: 14,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  statItem:       { flex: 1, alignItems: "center", paddingVertical: 16 },
  statItemBorder: { borderRightWidth: 1, borderRightColor: C.border },
  statVal:        { fontSize: 24, fontWeight: "800", color: C.primary },
  statLbl:        { fontSize: 11, color: C.muted, marginTop: 3, fontWeight: "600" },

  section: { marginTop: 20, marginHorizontal: 18 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.ink },
  seeAll:       { fontSize: 13, color: C.primary, fontWeight: "600" },

  card: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },

  // Your reports
  reportsEmpty: { paddingVertical: 24, paddingHorizontal: 16, alignItems: "center" },
  reportsEmptyText: { fontSize: 14, color: C.muted, marginBottom: 6 },
  reportsEmptyLink: { fontSize: 13, color: C.primary, fontWeight: "600" },
  reportRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  reportIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  reportBody:  { flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: "600", color: C.ink, marginBottom: 2 },
  reportTime:  { fontSize: 12, color: C.mutedLight },
  pill:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  pillText:    { fontSize: 11, fontWeight: "700" },

  // Personal details
  detailRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  detailIconBox: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center",
  },
  detailBody:  { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: "700", color: C.mutedLight, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "500", color: C.ink },

  settingsRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, marginHorizontal: 18, marginTop: 14,
    paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  settingsIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#E7EEFF", alignItems: "center", justifyContent: "center",
  },
  settingsText: { flex: 1, fontSize: 14, fontWeight: "500", color: C.ink },
  version:      { textAlign: "center", color: C.mutedLight, fontSize: 12, marginTop: 22 },
});
