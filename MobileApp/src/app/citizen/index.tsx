import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

interface Stats { open: number; inProgress: number; resolved: number }
interface Campaign { id: string; name: string; type: string; message?: string }
interface Complaint { id: string; title: string; status: string }

export default function CitizenDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [sRes, cRes, rRes] = await Promise.all([
        api.get(`/api/grievances/stats/citizen/${user.id}`),
        api.get("/api/campaigns/?status=ACTIVE&per_page=3"),
        api.get(`/api/grievances/?citizen_id=${user.id}&per_page=5`),
      ]);
      const s = sRes.data;
      const by: Record<string, number> = s.byStatus || {};
      setStats({
        open: by.NEW ?? s.open ?? 0,
        inProgress: (by.IN_PROGRESS ?? 0) + (by.ASSIGNED ?? 0) + (by.ON_HOLD ?? 0),
        resolved: (by.RESOLVED ?? 0) + (by.CLOSED ?? 0),
      });
      const cData = cRes.data;
      setCampaigns((cData.items ?? cData).map((c: any) => ({
        id: c._id || c.id, name: c.name, type: c.type, message: c.message,
      })));
      const rData = rRes.data;
      setRecent((rData.items ?? rData).map((c: any) => ({
        id: c._id || c.id, title: c.title, status: c.status,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  function handleLogout() {
    logout();
    router.replace("/" as any);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0]} 👋</Text>
          <Text style={styles.subGreeting}>Your overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <KPICard label="Open" value={stats.open} color="#EF4444" />
        <KPICard label="In Progress" value={stats.inProgress} color="#F59E0B" />
        <KPICard label="Resolved" value={stats.resolved} color="#10B981" />
      </View>

      {/* New Complaint Button */}
      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => router.push("/citizen/new-complaint" as any)}
      >
        <Text style={styles.newBtnText}>+ File New Complaint</Text>
      </TouchableOpacity>

      {/* Active Campaigns */}
      {campaigns.length > 0 && (
        <Section title="Active Campaigns">
          {campaigns.map((c) => (
            <View key={c.id} style={styles.campaignCard}>
              <View style={styles.campaignType}>
                <Text style={styles.campaignTypeText}>{c.type}</Text>
              </View>
              <Text style={styles.campaignName}>{c.name}</Text>
              {c.message ? <Text style={styles.campaignMsg} numberOfLines={2}>{c.message}</Text> : null}
            </View>
          ))}
        </Section>
      )}

      {/* Recent Complaints */}
      {recent.length > 0 && (
        <Section title="Recent Complaints">
          {recent.map((c) => (
            <View key={c.id} style={styles.complaintRow}>
              <Text style={styles.complaintTitle} numberOfLines={1}>{c.title}</Text>
              <StatusBadge status={c.status} />
            </View>
          ))}
          <TouchableOpacity onPress={() => router.push("/citizen/complaints" as any)}>
            <Text style={styles.seeAll}>See all complaints →</Text>
          </TouchableOpacity>
        </Section>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEW: "#DBEAFE", ASSIGNED: "#FEF3C7", IN_PROGRESS: "#FEF3C7",
    RESOLVED: "#D1FAE5", CLOSED: "#D1FAE5", ON_HOLD: "#F3F4F6",
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[status] || "#F3F4F6" }]}>
      <Text style={styles.badgeText}>{status.replace("_", " ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: "#1D4ED8",
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#BFDBFE", marginTop: 2 },
  logoutText: { color: "#BFDBFE", fontSize: 13 },
  kpiRow: { flexDirection: "row", gap: 10, padding: 16 },
  kpiCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderTopWidth: 3, alignItems: "center", elevation: 2,
  },
  kpiValue: { fontSize: 30, fontWeight: "700" },
  kpiLabel: { fontSize: 11, color: "#6B7280", marginTop: 3 },
  newBtn: {
    marginHorizontal: 16, backgroundColor: "#1D4ED8",
    borderRadius: 12, paddingVertical: 15, alignItems: "center",
  },
  newBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  campaignCard: {
    backgroundColor: "#EFF6FF", borderRadius: 12,
    padding: 14, marginBottom: 8,
  },
  campaignType: {
    alignSelf: "flex-start", backgroundColor: "#BFDBFE",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6,
  },
  campaignTypeText: { fontSize: 11, color: "#1D4ED8", fontWeight: "600" },
  campaignName: { fontSize: 14, fontWeight: "600", color: "#1E3A8A" },
  campaignMsg: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  complaintRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, elevation: 1,
  },
  complaintTitle: { fontSize: 14, color: "#111827", flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, color: "#374151", fontWeight: "600" },
  seeAll: { color: "#1D4ED8", fontSize: 13, fontWeight: "600", marginTop: 4 },
});
