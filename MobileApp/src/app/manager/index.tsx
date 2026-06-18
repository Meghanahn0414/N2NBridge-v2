import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

interface DashStats {
  totalGrievances: number;
  pendingGrievances: number;
  resolvedGrievances: number;
  teamSize: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    totalGrievances: 0, pendingGrievances: 0, resolvedGrievances: 0, teamSize: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [grievRes, teamRes] = await Promise.all([
        api.get("/api/grievances/stats/summary").catch(() => ({ data: {} })),
        api.get("/api/users/?role=FIELD_OFFICER&per_page=100").catch(() => ({ data: [] })),
      ]);
      const g = grievRes.data || {};
      const byStatus: Record<string, number> = g.byStatus || {};
      const teamList = teamRes.data?.items ?? teamRes.data ?? [];
      setStats({
        totalGrievances: g.total ?? 0,
        pendingGrievances: (byStatus.NEW ?? 0) + (byStatus.ASSIGNED ?? 0) + (byStatus.IN_PROGRESS ?? 0),
        resolvedGrievances: (byStatus.RESOLVED ?? 0) + (byStatus.CLOSED ?? 0),
        teamSize: teamList.length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0891B2" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0891B2" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Manager Dashboard</Text>
          <Text style={styles.subGreeting}>Hello, {user?.name?.split(" ")[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => { logout(); router.replace("/"); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <KPICard label="Total Grievances" value={stats.totalGrievances} color="#0891B2" icon="📋" />
        <KPICard label="Pending" value={stats.pendingGrievances} color="#EF4444" icon="⏳" />
        <KPICard label="Resolved" value={stats.resolvedGrievances} color="#10B981" icon="✅" />
        <KPICard label="Team Members" value={stats.teamSize} color="#F59E0B" icon="👥" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionCard icon="📋" title="Grievances" color="#ECFEFF" onPress={() => router.push("/manager/grievances" as any)} />
          <ActionCard icon="👥" title="My Team" color="#FFFBEB" onPress={() => router.push("/manager/team" as any)} />
          <ActionCard icon="📊" title="Reports" color="#EFF6FF" onPress={() => router.push("/manager/grievances" as any)} />
          <ActionCard icon="👤" title="My Profile" color="#F5F3FF" onPress={() => router.push("/manager/profile" as any)} />
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function KPICard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, title, color, onPress }: { icon: string; title: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: "#0891B2",
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#A5F3FC", marginTop: 2 },
  logoutText: { color: "#A5F3FC", fontSize: 13 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 },
  kpiCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderTopWidth: 3, alignItems: "center", elevation: 2,
  },
  kpiIcon: { fontSize: 22, marginBottom: 6 },
  kpiValue: { fontSize: 28, fontWeight: "700" },
  kpiLabel: { fontSize: 11, color: "#6B7280", marginTop: 3, textAlign: "center" },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: { width: "47%", borderRadius: 12, padding: 16, alignItems: "center", elevation: 1 },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
});
