import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import api from "../../services/api";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: string;
  assignedCount?: number;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  FIELD_OFFICER:        { bg: "#FFFBEB", text: "#92400E" },
  OFFICER:              { bg: "#EEF2FF", text: "#3730A3" },
  CONSTITUENCY_MANAGER: { bg: "#ECFEFF", text: "#0E7490" },
};

export default function ManagerTeam() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/users/?role=FIELD_OFFICER&per_page=50");
      setItems((data.items ?? data).map((u: any) => ({
        id: u._id || u.id,
        fullName: u.fullName || u.full_name || u.name || u.email,
        email: u.email || "",
        mobile: u.mobile || u.phone || "",
        role: u.role || "FIELD_OFFICER",
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
    return <View style={styles.center}><ActivityIndicator size="large" color="#0891B2" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Team</Text>
        <Text style={styles.headerCount}>{items.length} members</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0891B2" />}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No team members found</Text>
          </View>
        ) : (
          items.map((m) => {
            const initials = m.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const rc = ROLE_COLORS[m.role] || { bg: "#F3F4F6", text: "#374151" };
            return (
              <View key={m.id} style={styles.card}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{m.fullName}</Text>
                  <Text style={styles.email}>{m.email}</Text>
                  {m.mobile ? <Text style={styles.sub}>📱 {m.mobile}</Text> : null}
                </View>
                <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                  <Text style={[styles.roleText, { color: rc.text }]}>
                    {m.role.replace("_", " ")}
                  </Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#0891B2", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#A5F3FC" },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14, elevation: 1,
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#CFFAFE", alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { color: "#0891B2", fontSize: 15, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: "#111827" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 90 },
  roleText: { fontSize: 9, fontWeight: "700", textAlign: "center" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
