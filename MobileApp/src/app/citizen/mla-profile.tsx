import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, StatusBar, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { API_BASE } from "../../config";
import { useT } from "../../i18n/useT";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  primary:     "#1D4ED8",
  primaryDark: "#1E3A8A",
  accent:      "#3B82F6",
  bg:          "#F0F4FF",
  card:        "#FFFFFF",
  text:        "#1E293B",
  muted:       "#64748B",
  border:      "#F1F5F9",
  green:       "#10B981",
  amber:       "#F59E0B",
  red:         "#EF4444",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
}

function approvalColor(pct: number) {
  if (pct >= 65) return C.green;
  if (pct >= 40) return C.amber;
  return C.red;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function InfoRow({
  icon, label, value, isLast,
}: { icon: any; label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[row.wrap, isLast && { borderBottomWidth: 0 }]}>
      <View style={row.iconBox}>
        <Ionicons name={icon} size={16} color={C.primary} />
      </View>
      <View style={row.body}>
        <Text style={row.label}>{label}</Text>
        <Text style={row.value} numberOfLines={3}>{value}</Text>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13,
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

// ─── Approval gauge (simple arc using View) ──────────────────────────────────
function ApprovalGauge({ pct, approvalLabel }: { pct: number; approvalLabel: string }) {
  const color = approvalColor(pct);
  return (
    <View style={gauge.wrap}>
      {/* Background track */}
      <View style={[gauge.track, { borderColor: "#E2E8F0" }]} />
      {/* Filled arc — faked with an overlay using rotation */}
      <View style={[gauge.fill, {
        borderColor: color,
        transform: [{ rotate: `${(pct / 100) * 180 - 90}deg` }],
      }]} />
      {/* Center text */}
      <View style={gauge.center}>
        <Text style={[gauge.pct, { color }]}>{Math.round(pct)}%</Text>
        <Text style={gauge.label}>{approvalLabel}</Text>
      </View>
    </View>
  );
}

const gauge = StyleSheet.create({
  wrap: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  track: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 10, borderColor: "#E2E8F0",
  },
  fill: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 10, borderColor: C.green,
    borderTopColor: "transparent", borderRightColor: "transparent",
  },
  center: { alignItems: "center" },
  pct:   { fontSize: 22, fontWeight: "800", color: C.green },
  label: { fontSize: 11, color: C.muted, fontWeight: "600" },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
type MlaProfile = {
  id: string;
  fullName: string | null;
  title: string | null;
  bio: string | null;
  profileImage: string | null;
  constituencyName: string | null;
  email: string | null;
  officePhone: string | null;
  officeAddress: string | null;
  showApprovalRating: boolean;
  showResolvedCount: boolean;
  approvalPct: number | null;
  resolvedCount: number | null;
};

export default function MlaProfileScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mla, setMla] = useState<MlaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      // Use existing /api/users/?role=REPRESENTATIVE endpoint — no new backend route needed
      const res = await api.get("/api/users/", {
        params: { role: "REPRESENTATIVE", per_page: 1 },
      });

      // Response is a plain array (not wrapped in success_response)
      const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      if (!list.length) {
        setErrorMsg(tr('mlaProfile.noRepresentativeRegistered'));
        return;
      }

      const u = list[0];

      // Pull approval % from /api/mla/insights (already works)
      let approvalPct: number | null = null;
      let resolvedCount: number | null = null;

      if (u.showApprovalRating !== false) {
        try {
          const ins = await api.get("/api/mla/insights", { params: { days: 90 } });
          const insData = ins.data?.data ?? ins.data;
          const sentiment = insData?.publicSentiment;
          if (sentiment?.positive?.pct != null) {
            approvalPct = Math.round(sentiment.positive.pct * 10) / 10;
          }
        } catch (_) {}
      }

      if (u.showResolvedCount !== false) {
        try {
          const stats = await api.get("/api/analytics/dashboard", { params: { days: 365 } });
          const d = stats.data?.data ?? stats.data;
          // shape: { grievances: { byStatus: { RESOLVED: N } } }
          resolvedCount =
            d?.grievances?.byStatus?.RESOLVED ??
            d?.grievances?.byStatus?.resolved ??
            d?.complaintsByStatus?.RESOLVED ??
            null;
        } catch (_) {}
      }

      // Filter out OTP placeholder emails
      const realEmail = (e: string | null | undefined) =>
        e && !e.startsWith("otp-") ? e : null;

      const mlaData: MlaProfile = {
        id:                  u._id || u.id,
        fullName:            u.fullName || u.name || null,
        title:               u.title || "MLA",
        bio:                 u.bio || null,
        profileImage:        toAbsoluteUrl(u.profileImage || u.profilePhoto) ?? null,
        constituencyName:    u.constituencyId || null,
        email:               realEmail(u.email),
        officePhone:         u.officePhone || null,
        officeAddress:       u.officeAddress || null,
        showApprovalRating:  u.showApprovalRating !== false,
        showResolvedCount:   u.showResolvedCount !== false,
        approvalPct,
        resolvedCount,
      };
      setMla(mlaData);
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Unknown error";
      setErrorMsg(`${status ?? "Network error"}: ${detail}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={s.center}>
        <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!mla) {
    return (
      <View style={s.center}>
        <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
        <Ionicons name="person-remove-outline" size={52} color="#CBD5E1" />
        <Text style={s.noDataTitle}>{tr('mlaProfile.noRepresentativeFound')}</Text>
        {errorMsg ? (
          <Text style={[s.noDataSub, { color: "#DC2626", fontSize: 12, fontFamily: "monospace" }]}>
            {errorMsg}
          </Text>
        ) : (
          <Text style={s.noDataSub}>{tr('mlaProfile.noRepresentativeMsg')}</Text>
        )}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>{tr('mlaProfile.goBack')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: "#6B7280", marginTop: 8 }]}
          onPress={() => { setLoading(true); load(); }}
        >
          <Text style={s.backBtnText}>{tr('mlaProfile.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = (mla.fullName || "R")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasStats = mla.showApprovalRating || mla.showResolvedCount;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          {/* Back button */}
          <TouchableOpacity style={s.backCircle} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            {mla.profileImage && !photoError ? (
              <Image
                source={{ uri: mla.profileImage }}
                style={s.avatarImg}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <View style={s.avatarInner}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={s.repName}>{mla.fullName || tr('mlaProfile.yourRepresentative')}</Text>
          <Text style={s.repTitle}>{mla.title || "MLA"}</Text>

          {mla.constituencyName && (
            <View style={s.constitBadge}>
              <Ionicons name="location-outline" size={11} color="#BFDBFE" />
              <Text style={s.constitText}>{mla.constituencyName}</Text>
            </View>
          )}

          {/* "Your Representative" chip */}
          <View style={s.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#BFDBFE" />
            <Text style={s.verifiedText}>{tr('mlaProfile.yourRepresentative')}</Text>
          </View>
        </View>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        {mla.bio ? (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>{tr('mlaProfile.about')}</Text>
            </View>
            <Text style={s.bioText}>{mla.bio}</Text>
          </View>
        ) : null}

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {hasStats && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>{tr('mlaProfile.performance')}</Text>
            </View>
            {(mla.approvalPct == null && mla.resolvedCount == null) ? (
              <Text style={{ padding: 20, color: C.muted, fontSize: 13, textAlign: "center" }}>
                {tr('mlaProfile.performanceDataPending')}
              </Text>
            ) : (
              <View style={s.statsRow}>
                {mla.showApprovalRating && mla.approvalPct != null && (
                  <View style={s.statBox}>
                    <ApprovalGauge pct={mla.approvalPct} approvalLabel={tr('mlaProfile.approval')} />
                  </View>
                )}
                {mla.showResolvedCount && mla.resolvedCount != null && (
                  <View style={[s.statBox, { flex: 1 }]}>
                    <View style={s.resolvedIconWrap}>
                      <Ionicons name="checkmark-done-circle" size={36} color={C.green} />
                    </View>
                    <Text style={s.resolvedCount}>
                      {mla.resolvedCount.toLocaleString("en-IN")}
                    </Text>
                    <Text style={s.resolvedLabel}>{tr('mlaProfile.complaintsResolved')}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{tr('mlaProfile.contact')}</Text>
          </View>
          <InfoRow
            icon="mail-outline"
            label={tr('mlaProfile.email')}
            value={mla.email || tr('mlaProfile.notProvided')}
          />
          <InfoRow
            icon="call-outline"
            label={tr('mlaProfile.officePhone')}
            value={mla.officePhone || tr('mlaProfile.notProvided')}
          />
          <InfoRow
            icon="business-outline"
            label={tr('mlaProfile.officeAddress')}
            value={mla.officeAddress || tr('mlaProfile.notProvided')}
            isLast
          />
          {mla.officePhone && (
            <TouchableOpacity
              style={s.callBtn}
              onPress={() => Linking.openURL(`tel:${mla.officePhone}`)}
            >
              <Ionicons name="call" size={16} color={C.primary} />
              <Text style={s.callBtnText}>{tr('mlaProfile.callOffice')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push("/citizen/new-complaint" as any)}
        >
          <Ionicons name="document-text-outline" size={18} color="#fff" />
          <Text style={s.ctaBtnText}>{tr('mlaProfile.fileComplaint')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: C.bg, paddingHorizontal: 32, gap: 12,
  },

  // Header
  header: {
    backgroundColor: C.primaryDark,
    paddingTop: 56, paddingBottom: 32,
    alignItems: "center",
    position: "relative",
  },
  backCircle: {
    position: "absolute", top: 56, left: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden", marginBottom: 14,
  },
  avatarImg:   { width: "100%", height: "100%" },
  avatarInner: { flex: 1, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  avatarText:  { color: "#fff", fontSize: 32, fontWeight: "700" },
  repName:     { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  repTitle:    { color: "#93C5FD", fontSize: 14, fontWeight: "500", marginBottom: 8 },
  constitBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10,
  },
  constitText: { color: "#BFDBFE", fontSize: 13 },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  verifiedText: { color: "#BFDBFE", fontSize: 12, fontWeight: "600" },

  // Cards
  card: {
    backgroundColor: C.card,
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardHeader: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: C.text },

  // Bio
  bioText: { padding: 16, fontSize: 14, lineHeight: 22, color: C.text },

  // Stats
  statsRow: {
    flexDirection: "row",
    padding: 20, gap: 16,
    justifyContent: "space-around", alignItems: "center",
  },
  statBox: { alignItems: "center", justifyContent: "center" },
  resolvedIconWrap: { marginBottom: 6 },
  resolvedCount: { fontSize: 32, fontWeight: "800", color: C.text },
  resolvedLabel: { fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 18 },

  // Contact
  callBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginVertical: 14,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 10, alignSelf: "flex-start",
  },
  callBtnText: { fontSize: 14, fontWeight: "600", color: C.primary },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary,
    marginHorizontal: 16, marginTop: 20,
    paddingVertical: 16, borderRadius: 14,
    elevation: 2, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Not found
  noDataTitle: { fontSize: 18, fontWeight: "700", color: C.text, textAlign: "center" },
  noDataSub:   { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 20 },
  backBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 28,
    backgroundColor: C.primary, borderRadius: 12,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
