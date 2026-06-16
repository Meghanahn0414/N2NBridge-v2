import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import api from "../../services/api";

const TYPE_COLORS: Record<string, string> = {
  Awareness: "#DBEAFE",
  Health: "#D1FAE5",
  Education: "#FEF3C7",
  Infrastructure: "#FCE7F3",
  Environment: "#D1FAE5",
  Other: "#F3F4F6",
};

const TYPE_TEXT: Record<string, string> = {
  Awareness: "#1D4ED8",
  Health: "#065F46",
  Education: "#92400E",
  Infrastructure: "#9D174D",
  Environment: "#065F46",
  Other: "#374151",
};

interface Campaign {
  id: string; name: string; type: string;
  message?: string; channels: string[];
  startDate?: string; repeat?: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/campaigns/?status=ACTIVE&per_page=50");
      const items = data.items ?? data;
      setCampaigns(items.map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        type: c.type || "Other",
        message: c.message,
        channels: c.channels || [],
        startDate: c.startDate || c.start_date,
        repeat: c.repeat,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1D4ED8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Campaigns</Text>
        <Text style={styles.headerSub}>{campaigns.length} running</Text>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
      >
        {campaigns.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyText}>No active campaigns right now</Text>
          </View>
        ) : (
          campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const bg = TYPE_COLORS[c.type] || "#F3F4F6";
  const tc = TYPE_TEXT[c.type] || "#374151";
  const date = c.startDate ? new Date(c.startDate).toLocaleDateString() : null;

  return (
    <View style={styles.card}>
      <View style={[styles.typeBanner, { backgroundColor: bg }]}>
        <Text style={[styles.typeText, { color: tc }]}>{c.type}</Text>
      </View>
      <Text style={styles.name}>{c.name}</Text>
      {c.message ? <Text style={styles.message} numberOfLines={3}>{c.message}</Text> : null}
      <View style={styles.meta}>
        {c.channels.length > 0 && (
          <Text style={styles.metaText}>📡 {c.channels.join(", ")}</Text>
        )}
        {date && <Text style={styles.metaText}>🗓 From {date}</Text>}
        {c.repeat && <Text style={styles.metaText}>🔁 {c.repeat}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: "#1D4ED8",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 13, color: "#BFDBFE", marginTop: 2 },
  list: { flex: 1, padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 14, marginBottom: 12, overflow: "hidden", elevation: 2 },
  typeBanner: { paddingHorizontal: 14, paddingVertical: 6 },
  typeText: { fontSize: 12, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "700", color: "#111827", paddingHorizontal: 14, paddingTop: 12 },
  message: { fontSize: 13, color: "#6B7280", paddingHorizontal: 14, paddingTop: 6 },
  meta: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14, gap: 4 },
  metaText: { fontSize: 12, color: "#9CA3AF" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9CA3AF" },
});
