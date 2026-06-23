import { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, RefreshControl, StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../../store/authStore";
import api from "../../../services/api";
import { useRouter, useFocusEffect } from "expo-router";
import { Platform } from "react-native";
import { API_BASE } from "../../../config";

const realEmail = (e: string | null | undefined) =>
  e && !e.startsWith("otp-") ? e : "";

const toAbsoluteUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

const C = {
  primary: "#1D4ED8",
  primaryDark: "#1E3A8A",
  bg: "#F0F4FF",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  border: "#F1F5F9",
};

function DetailRow({ icon, label, value, mono, isLast }: {
  icon: any; label: string; value: string; mono?: boolean; isLast?: boolean;
}) {
  return (
    <View style={[dr.row, isLast && { borderBottomWidth: 0 }]}>
      <View style={dr.iconBox}>
        <Ionicons name={icon} size={16} color={C.primary} />
      </View>
      <View style={dr.body}>
        <Text style={dr.label}>{label}</Text>
        <Text style={[dr.value, mono && { fontFamily: "monospace", fontSize: 12 }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  iconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
  },
  body: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", color: C.muted, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: "500", color: C.text },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const pRes = await api.get(`/api/users/${user.id}`);
      const p = pRes.data?.data ?? pRes.data;
      if (p?.profileImage) p.profileImage = toAbsoluteUrl(p.profileImage);
      setPhotoError(false);
      setProfile(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePhotoUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8,
    });
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
      const { data } = await api.post(`/api/users/${user?.id}/upload-profile-photo`, fd);
      const rawUri = data?.profileImage || data?.data?.profileImage;
      if (rawUri) setProfile((p: any) => ({ ...p, profileImage: toAbsoluteUrl(rawUri) }));
    } catch {
      // keep local preview on failure
    } finally {
      setUploadingPhoto(false);
    }
  };

  const initials = (profile?.fullName || user?.name || user?.email || "C")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const wardLabel = profile?.wardId ? `Ward ${profile.wardId}` : null;
  const areaLabel = profile?.address || "Your ward";
  const locationStr = [areaLabel, wardLabel].filter(Boolean).join(" · ");

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Blue Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.cogBtn}
            onPress={() => router.push("/citizen/settings" as any)}
          >
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.avatarWrap}
            onPress={handlePhotoUpload}
            disabled={uploadingPhoto}
          >
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
          <Text style={s.location}>{locationStr}</Text>
          <View style={s.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#BFDBFE" />
            <Text style={s.verifiedText}>Verified resident</Text>
          </View>
        </View>

        {/* ── Person details ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Personal Details</Text>
          </View>

          <DetailRow icon="person-outline" label="Full Name"
            value={profile?.fullName || user?.name || "Not provided"} />
          <DetailRow icon="call-outline" label="Phone"
            value={profile?.mobile || profile?.phone || "Not provided"} />
          <DetailRow icon="mail-outline" label="Email"
            value={realEmail(profile?.email) || realEmail(user?.email) || "Not provided"} />
          <DetailRow icon="location-outline" label="Address"
            value={profile?.address || "Not provided"} />
          <DetailRow icon="map-outline" label="Ward"
            value={profile?.wardId ? `Ward ${profile.wardId}` : "Not assigned"} />
          {profile?.citizenId && (
            <DetailRow icon="card-outline" label="Citizen ID"
              value={profile.citizenId} mono />
          )}
          <DetailRow icon="calendar-outline" label="Member Since"
            value={profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
              : "—"}
            isLast />
        </View>

        {/* ── Quick link to settings ── */}
        <TouchableOpacity
          style={s.settingsLink}
          onPress={() => router.push("/citizen/settings" as any)}
        >
          <View style={s.settingsLinkIcon}>
            <Ionicons name="settings-outline" size={18} color={C.primary} />
          </View>
          <Text style={s.settingsLinkText}>Settings &amp; Account</Text>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </TouchableOpacity>

        <Text style={s.version}>Jana Seva CRM v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 56, paddingBottom: 32,
    alignItems: "center",
    position: "relative",
  },
  cogBtn: {
    position: "absolute", top: 56, right: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  avatarWrap: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden", marginBottom: 14,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarInner: {
    flex: 1, backgroundColor: "#2563EB",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "700" },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 5 },
  location: { color: "#BFDBFE", fontSize: 13, marginBottom: 10 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { color: "#BFDBFE", fontSize: 12, fontWeight: "600" },

  card: {
    backgroundColor: C.card,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: C.text },

  settingsLink: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 14,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 16,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  settingsLinkIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
  },
  settingsLinkText: { flex: 1, fontSize: 14, fontWeight: "500", color: C.text },
  version: { textAlign: "center", color: "#CBD5E1", fontSize: 12, marginTop: 22 },
});
