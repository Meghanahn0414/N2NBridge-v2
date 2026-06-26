import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, RefreshControl, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { API_BASE } from "../../config";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

const C = {
  primary:     "#1D4ED8",
  primaryDark: "#1E3A8A",
  bg:          "#F8F9FF",
  card:        "#FFFFFF",
  text:        "#1E293B",
  muted:       "#64748B",
  border:      "#E2E8F0",
};

const TYPE_ICONS: Record<string, string> = {
  AWARENESS: "📌", HEALTH: "🏥", EDUCATION: "📚",
  INFRASTRUCTURE: "🏗️", ENVIRONMENT: "🌿", WELFARE: "🤝",
  ACHIEVEMENT: "🏆", EVENT: "📅", UPDATE: "📢", DEFAULT: "📢",
};
const TYPE_COLORS: Record<string, string> = {
  AWARENESS: "#8B5CF6", HEALTH: "#EF4444", EDUCATION: "#3B82F6",
  INFRASTRUCTURE: "#F59E0B", ENVIRONMENT: "#10B981", WELFARE: "#EC4899",
  ACHIEVEMENT: "#F59E0B", EVENT: "#6B4FD8", UPDATE: "#1D4ED8", DEFAULT: "#1D4ED8",
};

type Campaign = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  message?: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  reach?: number;
  engagement?: number;
  channels?: string[];
  wardId?: string;
  participants?: string[];
};

export default function CampaignDetailScreen() {
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [campaign, setCampaign]   = useState<Campaign | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining]     = useState(false);
  const [joined, setJoined]       = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/campaigns/${id}`);
      const c = data?.data ?? data;
      setCampaign({
        id:          c._id || c.id,
        name:        c.name || c.title,
        type:        c.type,
        status:      c.status,
        message:     c.message || c.description,
        coverImage:  c.coverImage,
        startDate:   c.startDate || c.start_date,
        endDate:     c.endDate   || c.end_date,
        reach:       c.reach ?? 0,
        engagement:  c.engagement ?? 0,
        channels:    c.channels ?? [],
        wardId:      c.wardId,
        participants: c.participants ?? [],
      });
      // Check if current user already joined
      if (user?.id && (c.participants ?? []).includes(user.id)) {
        setJoined(true);
      }
    } catch {
      Alert.alert(tr("Error"), tr("Failed to load campaign details."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const handleJoin = async () => {
    if (!user?.id) {
      Alert.alert(tr("Error"), tr("Please log in again to join."));
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post(`/api/campaigns/${id}/join`, { citizenId: user.id });
      if (data?.alreadyJoined) {
        Alert.alert(tr("Already Joined"), tr("You have already joined this campaign."));
        setJoined(true);
      } else {
        setJoined(true);
        setCampaign((prev) => prev ? { ...prev, reach: (prev.reach ?? 0) + 1 } : prev);
        Alert.alert(tr("Joined!"), tr("You have successfully joined this campaign."));
      }
    } catch {
      Alert.alert(tr("Error"), tr("Failed to join. Please try again."));
    } finally {
      setJoining(false);
    }
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // Relative path from local storage e.g. "uploads/uuid.jpg"
    return `${API_BASE}/${url.replace(/^\//, "")}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={s.centered}>
        <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
        <Text style={s.errorText}>{tr("Campaign not found.")}</Text>
        <TouchableOpacity style={s.backBtnLarge} onPress={() => router.back()}>
          <Text style={s.backBtnLargeText}>{tr("Go back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeKey = campaign.type?.toUpperCase() ?? "DEFAULT";
  const icon    = TYPE_ICONS[typeKey] ?? TYPE_ICONS.DEFAULT;
  const color   = TYPE_COLORS[typeKey] ?? TYPE_COLORS.DEFAULT;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {campaign.name || tr("Campaign")}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCampaign(); }} colors={[C.primary]} />
        }
      >
        {/* Hero card */}
        <View style={s.heroCard}>
          {resolveImageUrl(campaign.coverImage) ? (
            <Image
              source={{ uri: resolveImageUrl(campaign.coverImage)! }}
              style={s.heroCoverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[s.heroIconBox, { backgroundColor: `${color}18` }]}>
              <Text style={s.heroIcon}>{icon}</Text>
            </View>
          )}
          <Text style={s.heroTitle}>{campaign.name || tr("Campaign")}</Text>
          {campaign.type && (
            <View style={[s.typeBadge, { backgroundColor: `${color}18` }]}>
              <Text style={[s.typeBadgeText, { color }]}>{campaign.type.toUpperCase()}</Text>
            </View>
          )}
          {campaign.status === "ACTIVE" && (
            <View style={s.activeBadge}>
              <View style={s.activeDot} />
              <Text style={s.activeBadgeText}>{tr("Active")}</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="people-outline" size={20} color={C.primary} />
            <Text style={s.statVal}>{campaign.reach ?? 0}</Text>
            <Text style={s.statLbl}>{tr("Participants")}</Text>
          </View>
          {(campaign.engagement ?? 0) > 0 && (
            <View style={[s.statBox, s.statBoxBorder]}>
              <Ionicons name="trending-up-outline" size={20} color="#10B981" />
              <Text style={[s.statVal, { color: "#10B981" }]}>{campaign.engagement}%</Text>
              <Text style={s.statLbl}>{tr("Engagement")}</Text>
            </View>
          )}
          {campaign.wardId && (
            <View style={[s.statBox, s.statBoxBorder]}>
              <Ionicons name="map-outline" size={20} color="#6B4FD8" />
              <Text style={s.statVal} numberOfLines={1}>{campaign.wardId}</Text>
              <Text style={s.statLbl}>{tr("Ward")}</Text>
            </View>
          )}
        </View>

        {/* Dates */}
        {(campaign.startDate || campaign.endDate) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{tr("Duration")}</Text>
            <View style={s.card}>
              {campaign.startDate && (
                <View style={s.dateRow}>
                  <Ionicons name="play-circle-outline" size={18} color="#10B981" />
                  <View style={s.dateBody}>
                    <Text style={s.dateLabel}>{tr("Start Date")}</Text>
                    <Text style={s.dateVal}>{formatDate(campaign.startDate)}</Text>
                  </View>
                </View>
              )}
              {campaign.endDate && (
                <View style={[s.dateRow, { borderTopWidth: 1, borderTopColor: C.border, marginTop: 8, paddingTop: 8 }]}>
                  <Ionicons name="stop-circle-outline" size={18} color="#EF4444" />
                  <View style={s.dateBody}>
                    <Text style={s.dateLabel}>{tr("End Date")}</Text>
                    <Text style={s.dateVal}>{formatDate(campaign.endDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Message / Description */}
        {campaign.message && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{tr("About this campaign")}</Text>
            <View style={s.card}>
              <Text style={s.messageText}>{campaign.message}</Text>
            </View>
          </View>
        )}

        {/* Channels */}
        {(campaign.channels?.length ?? 0) > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{tr("Channels")}</Text>
            <View style={s.channelRow}>
              {campaign.channels!.map((ch) => (
                <View key={ch} style={s.channelChip}>
                  <Text style={s.channelText}>{ch}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Join button — fixed at bottom */}
      <View style={s.joinBar}>
        <TouchableOpacity
          style={[s.joinBtn, joined && s.joinBtnDone, joining && s.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={joined || joining}
          activeOpacity={0.85}
        >
          {joining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name={joined ? "checkmark-circle" : "hand-left-outline"}
                size={20}
                color="#fff"
              />
              <Text style={s.joinBtnText}>
                {joined ? tr("Joined") : tr("Join Campaign")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  errorText: { fontSize: 16, color: C.muted, marginBottom: 16 },
  backBtnLarge: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnLargeText: { color: "#fff", fontWeight: "700" },

  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn:     { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },

  scrollContent: { paddingBottom: 32 },

  heroCard: {
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 20,
    borderRadius: 20, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  heroCoverImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 14 },
  heroIconBox: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroIcon:    { fontSize: 40 },
  heroTitle:   { fontSize: 20, fontWeight: "800", color: C.text, textAlign: "center", marginBottom: 10 },
  typeBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 8,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  activeDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: "#16A34A" },
  activeBadgeText: { fontSize: 12, color: "#166534", fontWeight: "700" },

  statsRow: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 14,
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statBoxBorder: { borderLeftWidth: 1, borderLeftColor: C.border },
  statVal: { fontSize: 18, fontWeight: "800", color: C.primary },
  statLbl: { fontSize: 11, color: C.muted, fontWeight: "600" },

  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },

  dateRow:  { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dateBody: { flex: 1 },
  dateLabel: { fontSize: 11, color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  dateVal:   { fontSize: 14, fontWeight: "600", color: C.text },

  messageText: { fontSize: 15, color: C.text, lineHeight: 24 },

  channelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  channelChip: {
    backgroundColor: "#EFF6FF", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "#BFDBFE",
  },
  channelText: { fontSize: 13, color: C.primary, fontWeight: "600" },

  joinBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.card, paddingHorizontal: 20, paddingVertical: 16,
    paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: C.border,
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
  },
  joinBtn: {
    backgroundColor: C.primary, borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    elevation: 4, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  joinBtnDone:     { backgroundColor: "#16A34A" },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },
});
