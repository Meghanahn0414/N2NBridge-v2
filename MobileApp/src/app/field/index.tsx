import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

interface DashStats {
  assignedGrievances: number;
  resolvedGrievances: number;
  pendingTasks: number;
  activeAlerts: number;
}

export default function FieldDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    assignedGrievances: 0, resolvedGrievances: 0, pendingTasks: 0, activeAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [dashRes, tasksRes, alertsRes] = await Promise.all([
        api.get("/api/dashboard/officer").catch(() => ({ data: {} })),
        api.get("/api/tasks/?per_page=50").catch(() => ({ data: [] })),
        api.get("/api/alerts/?per_page=20").catch(() => ({ data: [] })),
      ]);
      const d = dashRes.data || {};
      const taskList = tasksRes.data?.items ?? tasksRes.data ?? [];
      const alertList = alertsRes.data?.items ?? alertsRes.data ?? [];
      const pending = taskList.filter((t: any) => t.status !== "COMPLETED").length;
      setStats({
        assignedGrievances: d.assignedGrievances ?? d.totalAssigned ?? 0,
        resolvedGrievances: d.resolvedGrievances ?? d.totalResolved ?? 0,
        pendingTasks: pending,
        activeAlerts: alertList.length,
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#D97706" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Field Officer</Text>
          <Text style={styles.subGreeting}>Hello, {user?.name?.split(" ")[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={() => { logout(); router.replace("/"); }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <KPICard label="Assigned" value={stats.assignedGrievances} color="#D97706" icon="📋" />
        <KPICard label="Resolved" value={stats.resolvedGrievances} color="#10B981" icon="✅" />
        <KPICard label="Pending Tasks" value={stats.pendingTasks} color="#EF4444" icon="⏳" />
        <KPICard label="Alerts" value={stats.activeAlerts} color="#7C3AED" icon="🚨" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionCard icon="✅" title="My Tasks" color="#FFFBEB" onPress={() => router.push("/field/tasks" as any)} />
          <ActionCard icon="🚨" title="Alerts" color="#FFF1F2" onPress={() => router.push("/field/alerts" as any)} />
          <ActionCard icon="📋" title="Grievances" color="#ECFDF5" onPress={() => router.push("/field/tasks" as any)} />
          <ActionCard icon="👤" title="My Profile" color="#F5F3FF" onPress={() => router.push("/field/profile" as any)} />
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
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, backgroundColor: "#D97706",
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 13, color: "#FDE68A", marginTop: 2 },
  logoutText: { color: "#FDE68A", fontSize: 13 },
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
