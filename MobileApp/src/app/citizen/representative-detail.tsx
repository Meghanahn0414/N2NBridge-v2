import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useT } from "../../i18n/useT";
import { API_BASE } from "../../config";

const C = {
  primary: "#2B5BD7", primaryDark: "#1B3C8F", bg: "#F3F5FA",
  card: "#FFFFFF", ink: "#16233C", muted: "#5A6678",
  mutedLight: "#9AA3B5", border: "#EDF0F6",
};

type Profile = {
  dbName: string; repType?: string;
  fullName?: string; title?: string; bio?: string; profileImage?: string;
  officePhone?: string; officeAddress?: string;
  assemblyName?: string; parliamentaryName?: string; wardName?: string;
  district?: string; state?: string; resolvedCount?: number | null;
};

const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

export default function RepresentativeDetailScreen() {
  const tr = useT();
  const router = useRouter();
  const { dbName } = useLocalSearchParams<{ dbName: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!dbName) return;
    setLoading(true);
    try {
      const [profRes, followRes] = await Promise.all([
        api.get(`/api/discovery/representatives/${dbName}`),
        api.get("/api/discovery/following").catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setProfile(profRes.data?.data ?? profRes.data);
      const followItems = (followRes.data?.data ?? followRes.data)?.items ?? [];
      setFollowing(followItems.some((f: any) => f.db_name === dbName));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [dbName]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      if (following) {
        await api.delete(`/api/discovery/follow/${dbName}`);
        setFollowing(false);
      } else {
        await api.post("/api/discovery/follow", { db_name: dbName, rep_type: profile.repType });
        setFollowing(true);
      }
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }
  if (!profile) {
    return (
      <View style={s.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={C.mutedLight} />
        <Text style={s.emptyTitle}>{tr("Representative not found")}</Text>
      </View>
    );
  }

  const area = profile.assemblyName || profile.parliamentaryName || profile.wardName || profile.district;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.avatarWrap}>
          {profile.profileImage ? (
            <Image source={{ uri: toAbsoluteUrl(profile.profileImage)! }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>{(profile.fullName || "?")[0].toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={s.name}>{profile.fullName}</Text>
        <Text style={s.title}>{profile.title} {area ? `· ${area}` : ""}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[s.followBtn, following && s.followBtnActive]}
          onPress={toggleFollow}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator size="small" color={following ? C.primary : "#fff"} />
          ) : (
            <>
              <Ionicons
                name={following ? "checkmark-circle" : "add-circle-outline"}
                size={18}
                color={following ? C.primary : "#fff"}
              />
              <Text style={[s.followBtnText, following && s.followBtnTextActive]}>
                {following ? tr("Following") : tr("Follow this representative")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {profile.bio ? (
          <View style={s.card}>
            <Text style={s.cardLabel}>{tr("About")}</Text>
            <Text style={s.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.cardLabel}>{tr("Contact")}</Text>
          {profile.officePhone ? (
            <View style={s.row}>
              <Ionicons name="call-outline" size={16} color={C.muted} />
              <Text style={s.rowText}>{profile.officePhone}</Text>
            </View>
          ) : null}
          {profile.officeAddress ? (
            <View style={s.row}>
              <Ionicons name="location-outline" size={16} color={C.muted} />
              <Text style={s.rowText}>{profile.officeAddress}</Text>
            </View>
          ) : null}
          {!profile.officePhone && !profile.officeAddress ? (
            <Text style={s.rowMuted}>{tr("No contact details published yet.")}</Text>
          ) : null}
        </View>

        {profile.resolvedCount != null ? (
          <View style={s.statCard}>
            <Text style={s.statNum}>{profile.resolvedCount}</Text>
            <Text style={s.statLabel}>{tr("Grievances resolved")}</Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.ink },

  header: {
    backgroundColor: C.primaryDark, paddingTop: 56, paddingBottom: 26,
    alignItems: "center", paddingHorizontal: 20,
  },
  backBtn: { position: "absolute", top: 56, left: 18, padding: 4 },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  avatarPlaceholder: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  name: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 4, textAlign: "center" },
  title: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center" },

  scroll: { flex: 1 },
  content: { padding: 18 },

  followBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 18,
  },
  followBtnActive: { backgroundColor: "#fff", borderWidth: 1, borderColor: C.primary },
  followBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  followBtnTextActive: { color: C.primary },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardLabel: {
    fontSize: 12, fontWeight: "700", color: C.mutedLight,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10,
  },
  bio: { fontSize: 14, color: C.ink, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  rowText: { fontSize: 13, color: C.ink, flex: 1 },
  rowMuted: { fontSize: 13, color: C.mutedLight },

  statCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 18, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  statNum: { fontSize: 28, fontWeight: "800", color: C.primary },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 4 },
});
