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
  totalCitizens: number;
  totalOfficers: number;
  recentActivity?: { message: string; time: string; type: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    totalGrievances: 0, pendingGrievances: 0,
    resolvedGrievances: 0, totalCitizens: 0, totalOfficers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dashRes, grievRes] = await Promise.all([
        api.get("/api/dashboard/admin").catch(() => ({ data: {} })),
        api.get("/api/grievances/stats/summary").catch(() => ({ data: {} })),
      ]);
      const d = dashRes.data || {};
      const g = grievRes.data || {};
      const byStatus: Record<string, number> = g.byStatus || {};
      setStats({
        totalGrievances: g.total ?? d.totalGrievances ?? 0,
        pendingGrievances: (byStatus.NEW ?? 0) + (byStatus.ASSIGNED ?? 0) + (byStatus.IN_PROGRESS ?? 0),
        resolvedGrievances: (byStatus.RESOLVED ?? 0) + (byStatus.CLOSED ?? 0),
        totalCitizens: d.totalCitizens ?? 0,
        totalOfficers: d.totalOfficers ?? d.totalStaff ?? 0,
        recentActivity: d.recentActivity ?? [],
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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subGreeting}>Welcome, {user?.name?.split(" ")[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => { logout(); router.replace("/"); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <KPICard label="Total Grievances" value={stats.totalGrievances} color="#7C3AED" icon="📋" />
        <KPICard label="Pending" value={stats.pendingGrievances} color="#EF4444" icon="⏳" />
        <KPICard label="Resolved" value={stats.resolvedGrievances} color="#10B981" icon="✅" />
        <KPICard label="Citizens" value={stats.totalCitizens} color="#F59E0B" icon="👥" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionCard icon="📋" title="All Grievances" color="#EEF2FF" onPress={() => router.push("/admin/grievances" as any)} />
          <ActionCard icon="👥" title="Citizens" color="#F0FDF4" onPress={() => router.push("/admin/citizens" as any)} />
          <ActionCard icon="📊" title="Reports" color="#FFFBEB" onPress={() => router.push("/admin/grievances" as any)} />
          <ActionCard icon="👤" title="My Profile" color="#FDF4FF" onPress={() => router.push("/admin/profile" as any)} />
        </View>
      </View>

      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.recentActivity.slice(0, 5).map((a, i) => (
            <View key={i} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityMsg} numberOfLines={2}>{a.message}</Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

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
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: "#7C3AED",
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#DDD6FE", marginTop: 2 },
  logoutText: { color: "#DDD6FE", fontSize: 13 },
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
  actionCard: {
    width: "47%", borderRadius: 12, padding: 16,
    alignItems: "center", elevation: 1,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
  activityRow: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, elevation: 1,
  },
  activityDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#7C3AED",
    marginTop: 5, marginRight: 10,
  },
  activityMsg: { fontSize: 13, color: "#1F2937" },
  activityTime: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});
