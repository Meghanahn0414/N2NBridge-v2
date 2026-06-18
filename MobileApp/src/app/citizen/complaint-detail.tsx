import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../services/api";

type TimelineItem = {
  status: string;
  timestamp?: string;
  note?: string;
  updatedAt?: string;
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
  statusHistory?: TimelineItem[];
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "#3B82F6", OPEN: "#3B82F6",
  ASSIGNED: "#F59E0B", IN_PROGRESS: "#F59E0B", ON_HOLD: "#F59E0B",
  RESOLVED: "#10B981", CLOSED: "#10B981",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#059669", MEDIUM: "#D97706", HIGH: "#DC2626", CRITICAL: "#7C3AED",
};

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/grievances/${id}`)
      .then(({ data }) => {
        const g = data?.data ?? data;
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
          timeline: g.timeline || g.statusHistory || [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatDateTime = (dt?: string) => {
    if (!dt) return "";
    return new Date(dt).toLocaleString("en-IN", {
      day: "numeric", month: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const statusColor = complaint?.status
    ? STATUS_COLOR[complaint.status.toUpperCase()] ?? "#64748B"
    : "#64748B";

  const priorityColor = complaint?.priority
    ? PRIORITY_COLOR[complaint.priority.toUpperCase()] ?? "#64748B"
    : "#64748B";

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={s.center}>
        <Text style={{ color: "#64748B" }}>Complaint not found.</Text>
      </View>
    );
  }

  const timeline: TimelineItem[] = complaint.timeline?.length
    ? complaint.timeline
    : [{ status: complaint.status || "NEW", timestamp: complaint.createdAt, note: "Complaint Submitted" }];

  return (
    <View style={s.container}>
      <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerRef} numberOfLines={1}>
            {complaint.complaintNumber || `#${complaint.id?.slice(-10).toUpperCase()}`}
          </Text>
          <View style={[s.statusPill, { backgroundColor: statusColor }]}>
            <Text style={s.statusPillText}>{complaint.status?.replace(/_/g, " ")}</Text>
          </View>
        </View>
        <Text style={s.headerSub}>
          Submitted {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString("en-IN") : ""}
        </Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Title card */}
        <View style={s.card}>
          <Text style={s.complaintTitle}>{complaint.title || complaint.description}</Text>
          <Text style={s.complaintMeta}>
            {[complaint.categoryId, complaint.wardId ? `Ward ${complaint.wardId}` : null, complaint.address]
              .filter(Boolean).join(" · ")}
          </Text>
        </View>

        {/* Timeline */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>TIMELINE</Text>
          {timeline.map((item, i) => (
            <View key={i} style={s.timelineRow}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, { backgroundColor: STATUS_COLOR[item.status?.toUpperCase()] ?? "#94A3B8" }]} />
                {i < timeline.length - 1 && <View style={s.timelineLine} />}
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineStatus}>
                  {item.note || item.status?.replace(/_/g, " ")}
                </Text>
                <Text style={s.timelineDate}>{formatDateTime(item.timestamp || item.updatedAt)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Rate Response */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>RATE THIS RESPONSE</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={[s.star, star <= rating && s.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Details */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>DETAILS</Text>
          <Text style={s.detailDesc}>{complaint.description}</Text>
          <View style={s.detailGrid}>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>CATEGORY</Text>
              <Text style={s.detailValue}>{complaint.categoryId || "—"}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>PRIORITY</Text>
              <Text style={[s.detailValue, { color: priorityColor }]}>{complaint.priority}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>WARD</Text>
              <Text style={s.detailValue}>{complaint.wardId || "—"}</Text>
            </View>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>STATUS</Text>
              <Text style={[s.detailValue, { color: statusColor }]}>
                {complaint.status?.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
          {complaint.address && (
            <View style={s.addressRow}>
              <Text style={s.detailLabel}>ADDRESS</Text>
              <Text style={s.detailValue}>{complaint.address}</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#1D4ED8", paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 10 },
  backText: { color: "#BFDBFE", fontSize: 15, fontWeight: "600" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  headerRef: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  headerSub: { color: "#BFDBFE", fontSize: 12 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, margin: 16, marginBottom: 0,
    padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 14 },
  complaintTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  complaintMeta: { fontSize: 13, color: "#64748B" },
  timelineRow: { flexDirection: "row", marginBottom: 4 },
  timelineLeft: { alignItems: "center", marginRight: 14, width: 16 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineStatus: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  timelineDate: { fontSize: 12, color: "#64748B", marginTop: 2 },
  starsRow: { flexDirection: "row", gap: 8 },
  star: { fontSize: 28, color: "#E2E8F0" },
  starFilled: { color: "#F59E0B" },
  detailDesc: { fontSize: 14, color: "#475569", marginBottom: 16 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { width: "45%" },
  detailLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  addressRow: { marginTop: 12 },
});
