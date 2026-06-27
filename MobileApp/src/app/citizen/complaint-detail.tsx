import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Image, FlatList, Dimensions, Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../services/api";
import { API_BASE } from "../../config";
import { useT } from "../../i18n/useT";

const { width: SCREEN_W } = Dimensions.get("window");

type TimelineItem = {
  status: string;
  timestamp?: string | null;
  note?: string;
  label?: string;
};

type ComplaintDetail = {
  id: string;
  complaintNumber?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  categoryId?: string;
  category?: string;
  address?: string;
  wardId?: string;
  createdAt?: string;
  timeline?: TimelineItem[];
  photos?: string[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "#3B82F6", OPEN: "#3B82F6",
  ASSIGNED: "#F59E0B", IN_PROGRESS: "#F59E0B", ON_HOLD: "#F59E0B",
  RESOLVED: "#10B981", CLOSED: "#10B981",
};

// STATUS_LABEL and TIMELINE_LABEL will be computed inside the component using tr()
const toAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

// Extract photo URLs — covers every common API shape
function extractPhotos(g: any): string[] {
  const toUrl = (p: any): string | null => {
    const raw = typeof p === "string" ? p : p?.url || p?.fileUrl || p?.uri || p?.path || null;
    return toAbsoluteUrl(raw);
  };

  for (const key of ["photos", "images", "photoUrls", "mediaUrls", "fileUrls", "files", "attachments", "uploads", "media"]) {
    if (Array.isArray(g[key]) && g[key].length > 0) {
      const urls = g[key].map(toUrl).filter(Boolean) as string[];
      if (urls.length > 0) return urls;
    }
  }

  for (const key of ["photo", "photoUrl", "image", "imageUrl", "mediaUrl", "fileUrl", "uploadUrl"]) {
    if (typeof g[key] === "string" && g[key].trim()) return [toAbsoluteUrl(g[key])!];
  }

  return [];
}

const TRACKER_STEP_KEYS = [
  { status: "NEW",         labelKey: "complaints.complaintSubmitted", noteKey: "complaints.receivedNote" },
  { status: "ASSIGNED",    labelKey: "complaints.assigned",           noteKey: "complaints.assignedNote" },
  { status: "IN_PROGRESS", labelKey: "complaints.inProgress",        noteKey: "complaints.investigatingNote" },
  { status: "RESOLVED",    labelKey: "complaints.resolved",          noteKey: "complaints.resolvedNote" },
];

const STATUS_ORDER = ["NEW", "OPEN", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"];

function statusRank(s: string) {
  return STATUS_ORDER.indexOf((s || "NEW").toUpperCase());
}

function buildTimeline(g: any, tr: (key: string) => string): TimelineItem[] {
  const currentRank = statusRank(g.status || "NEW");

  const historyMap: Record<string, any> = {};
  const rawHistory: any[] = Array.isArray(g.history)
    ? g.history
    : Array.isArray(g.statusHistory)
    ? g.statusHistory
    : [];
  for (const h of rawHistory) {
    const key = (h.newStatus || h.status || "").toUpperCase();
    if (key) historyMap[key] = h;
  }

  return TRACKER_STEP_KEYS.map((step) => {
    const rank = statusRank(step.status);
    const isDone = rank <= currentRank;
    const h = historyMap[step.status];
    return {
      status: isDone ? step.status : "PENDING",
      timestamp: step.status === "NEW"
        ? (g.createdAt || g.created_at)
        : h?.createdAt || h?.updatedAt || null,
      note: h?.remarks || h?.message || tr(step.noteKey as any),
      label: tr(step.labelKey as any),
    } as any;
  });
}

export default function ComplaintDetailScreen() {
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/grievances/${id}`)
      .then(({ data }) => {
        const g = data?.data ?? data;
        if (__DEV__) console.log("[complaint-detail] full grievance:", JSON.stringify(g, null, 2));
        setComplaint({
          id: g._id || g.id,
          complaintNumber: g.complaintNumber || g.grievanceId,
          title: g.title || g.description,
          description: g.description,
          status: g.status,
          priority: g.priority,
          categoryId: g.categoryId || g.category,
          address: g.address,
          wardId: g.wardId,
          createdAt: g.createdAt || g.created_at,
          timeline: buildTimeline(g, tr),
          photos: extractPhotos(g),
        });
        if (g.feedback?.rating) setRating(g.feedback.rating);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const getStatusLabel = (statusKey: string): string => {
    const map: Record<string, string> = {
      NEW: tr('complaints.open'),
      OPEN: tr('complaints.open'),
      ASSIGNED: tr('complaints.assigned'),
      IN_PROGRESS: tr('complaints.inProgress'),
      ON_HOLD: tr('complaints.onHold'),
      RESOLVED: tr('complaints.resolved'),
      CLOSED: tr('complaints.closed'),
    };
    return map[statusKey] ?? statusKey.replace(/_/g, " ");
  };

  const formatDate = (dt?: string) => {
    if (!dt) return "";
    return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleShare = async () => {
    const refNum = complaint?.complaintNumber || `RD-${(complaint?.id || "").slice(-6).toUpperCase()}`;
    const title  = complaint?.title || complaint?.description || tr('complaintDetail.defaultTitle');
    const status = getStatusLabel((complaint?.status || "NEW").toUpperCase());
    try {
      await Share.share({
        title: `${tr('complaintDetail.defaultTitle')} #${refNum}`,
        message: `Neta to Nagarika\n${tr('complaintDetail.defaultTitle')}: ${title}\n${tr('complaintDetail.refPrefix')}${refNum}\nStatus: ${status}${complaint?.address ? `\nLocation: ${complaint.address}` : ""}`,
      });
    } catch { /* user cancelled */ }
  };

  const handleRate = async (star: number) => {
    if (ratingSubmitted) return;
    setRating(star);
    try {
      await api.post(`/api/grievances/${id}/feedback`, {
        rating: star, comments: "", submittedAt: new Date().toISOString(),
      });
      setRatingSubmitted(true);
    } catch { /* silent */ }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  if (!complaint) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
        <Text style={s.notFound}>{tr('complaints.notFound')}</Text>
        <TouchableOpacity style={s.goBack} onPress={() => router.back()}>
          <Text style={s.goBackText}>{tr('complaints.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusKey  = (complaint.status || "NEW").toUpperCase();
  const sc         = STATUS_COLOR[statusKey] ?? "#64748B";
  const statusText = getStatusLabel(statusKey);

  const timeline: TimelineItem[] = complaint.timeline?.length
    ? complaint.timeline
    : [{ status: complaint.status || "NEW", timestamp: complaint.createdAt }];

  const metaParts = [
    complaint.address,
    complaint.wardId ? `${tr('profile.ward')} ${complaint.wardId}` : null,
    complaint.categoryId,
  ].filter(Boolean);

  const refNum = complaint.complaintNumber || `RD-${(complaint.id || "").slice(-6).toUpperCase()}`;
  const photos = complaint.photos ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* ── Floating top bar (back + share) ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.topBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity style={s.topBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* ── Photo area ── */}
      {photos.length > 0 ? (
        <View style={s.photoCarousel}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
            }
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={s.photoImg} resizeMode="cover" />
            )}
          />
          {photos.length > 1 && (
            <View style={s.photoDots}>
              {photos.map((_, i) => (
                <View key={i} style={[s.photoDot, i === photoIndex && s.photoDotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={s.photoPlaceholder}>
          <Ionicons name="image-outline" size={32} color="#CBD5E1" />
          <Text style={s.photoLabel}>{tr('complaints.noPhoto')}</Text>
        </View>
      )}

      {/* ── Scrollable content ── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status + Ref row */}
        <View style={s.statusRefRow}>
          <View style={[s.statusChip, { backgroundColor: `${sc}15`, borderColor: `${sc}40` }]}>
            <View style={[s.statusDot, { backgroundColor: sc }]} />
            <Text style={[s.statusChipText, { color: sc }]}>{statusText}</Text>
          </View>
          <Text style={s.refText}>{tr('complaintDetail.refPrefix')}{refNum}</Text>
        </View>

        {/* Title */}
        <Text style={s.title}>{complaint.title || complaint.description || tr('complaintDetail.defaultTitle')}</Text>

        {/* Location row */}
        {metaParts.length > 0 && (
          <View style={s.locationRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={s.locationText}>{metaParts.join(" · ")}</Text>
          </View>
        )}

        {/* Description */}
        {complaint.description && complaint.description !== complaint.title && (
          <Text style={s.description}>{complaint.description}</Text>
        )}

        {/* ── Progress / Timeline ── */}
        <Text style={s.sectionHeading}>{tr('complaints.progress')}</Text>
        <View style={s.timelineBlock}>
          {timeline.map((item, i) => {
            const isPending = item.status === "PENDING";
            const tColor    = isPending ? "#CBD5E1" : (STATUS_COLOR[item.status] ?? "#3B82F6");
            const isLast    = i === timeline.length - 1;
            const date      = item.timestamp;
            const title     = item.label || item.status?.replace(/_/g, " ") || tr('complaintDetail.defaultUpdate');
            const desc      = item.note;

            return (
              <View key={i} style={s.timelineRow}>
                <View style={s.timelineLeft}>
                  <View style={[s.dot, { backgroundColor: isPending ? "#fff" : tColor, borderColor: tColor, borderWidth: isPending ? 2 : 0 }]}>
                    {!isPending && <View style={s.dotInner} />}
                  </View>
                  {!isLast && <View style={[s.line, { backgroundColor: isPending ? "#E2E8F0" : `${tColor}60` }]} />}
                </View>

                <View style={s.timelineRight}>
                  <Text style={[s.timelineTitle, isPending && { color: "#94A3B8" }]}>{title}</Text>
                  {date ? (
                    <Text style={s.timelineDate}>
                      {new Date(date).toLocaleString("en-IN", {
                        day: "numeric", month: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })}
                    </Text>
                  ) : null}
                  {desc ? (
                    <Text style={s.timelineDesc}>{desc}</Text>
                  ) : i === 0 ? (
                    <Text style={s.timelineDesc}>{tr('complaints.receivedNote')}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Rate response (resolved only) ── */}
        {["RESOLVED", "CLOSED"].includes(statusKey) && (
          <View style={s.rateCard}>
            <Text style={s.sectionHeading}>{tr('complaints.rateResponse')}</Text>
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRate(star)} disabled={ratingSubmitted} activeOpacity={0.7}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {ratingSubmitted && <Text style={s.ratedMsg}>{tr('complaints.thankYouFeedback')}</Text>}
          </View>
        )}

        {/* ── Details grid ── */}
        <Text style={s.sectionHeading}>{tr('complaints.details')}</Text>
        <View style={s.detailsGrid}>
          <DetailItem label={tr('complaints.category')}  value={complaint.categoryId || "—"} />
          <DetailItem label={tr('complaints.priority')}  value={complaint.priority || "—"} color={
            complaint.priority === "HIGH" || complaint.priority === "CRITICAL" ? "#DC2626" :
            complaint.priority === "MEDIUM" ? "#D97706" : "#059669"
          } />
          <DetailItem label={tr('profile.ward')}      value={complaint.wardId ? `${tr('profile.ward')} ${complaint.wardId}` : "—"} />
          <DetailItem label={tr('complaints.submitted')} value={formatDate(complaint.createdAt) || "—"} />
        </View>
        {complaint.address && (
          <View style={s.addressRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginTop: 1 }} />
            <Text style={s.addressText}>{complaint.address}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={s.detailItem}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  notFound: { fontSize: 15, color: "#64748B", marginTop: 8 },
  goBack: { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  goBackText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", justifyContent: "space-between",
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 10,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4,
  },

  photoCarousel: { height: 220 },
  photoImg: { width: SCREEN_W, height: 220 },
  photoPlaceholder: {
    height: 220, backgroundColor: "#E8EDF2",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  photoLabel: { fontSize: 13, color: "#94A3B8" },
  photoDots: {
    position: "absolute", bottom: 10, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  photoDotActive: { backgroundColor: "#fff", width: 18, borderRadius: 3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  statusRefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipText: { fontSize: 12, fontWeight: "700" },
  refText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", lineHeight: 30, marginBottom: 10 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 },
  locationText: { fontSize: 13, color: "#64748B", flex: 1 },
  description: {
    fontSize: 14, color: "#475569", lineHeight: 22,
    marginBottom: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },

  sectionHeading: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 16, marginTop: 4 },

  timelineBlock: { marginBottom: 28 },
  timelineRow: { flexDirection: "row" },
  timelineLeft: { alignItems: "center", marginRight: 14, width: 22 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  line: { width: 2, flex: 1, minHeight: 24, marginTop: 3 },
  timelineRight: { flex: 1, paddingBottom: 20 },
  timelineTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 20 },
  timelineDate:  { fontSize: 12, color: "#94A3B8", marginTop: 2, marginBottom: 3 },
  timelineDesc:  { fontSize: 13, color: "#64748B", lineHeight: 18 },

  rateCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 24, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  starsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  ratedMsg: { fontSize: 13, color: "#10B981", fontWeight: "600", marginTop: 4 },

  detailsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  detailItem:  { width: "50%", paddingVertical: 10, paddingHorizontal: 4 },
  detailLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.8, marginBottom: 3 },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  addressRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  addressText: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 20 },
});
