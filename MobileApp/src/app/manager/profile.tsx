import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

interface Profile {
  fullName: string;
  email: string;
  mobile?: string;
  createdAt?: string;
}

export default function ManagerProfile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadProfile() {
    try {
      const { data } = await api.get(`/api/users/${user?.id}`);
      setProfile(data);
    } catch {
      setProfile({ fullName: user?.name || "Manager", email: user?.email || "" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace("/"); } },
    ]);
  }

  const initials = (profile?.fullName || user?.name || "M")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0891B2" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}
    >
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.fullName || user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Constituency Manager</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <InfoRow icon="📧" label="Email" value={profile?.email || user?.email || "—"} />
        {profile?.mobile && <InfoRow icon="📱" label="Mobile" value={profile.mobile} />}
        {profile?.createdAt && (
          <InfoRow icon="📅" label="Joined"
            value={new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Access</Text>
        <MenuRow icon="📋" label="Grievance Management" onPress={() => router.push("/manager/grievances" as any)} />
        <MenuRow icon="👥" label="My Team" onPress={() => router.push("/manager/team" as any)} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Jan Seva CRM · Manager App</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECFEFF" },
  content: { paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#0891B2", paddingTop: 56, paddingBottom: 32, alignItems: "center" },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)", borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  roleText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, marginTop: 16,
    padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  infoIcon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: 14, color: "#111827", fontWeight: "500" },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: "#1F2937", fontWeight: "500" },
  menuArrow: { fontSize: 20, color: "#9CA3AF" },
  logoutBtn: { marginHorizontal: 16, marginTop: 24, backgroundColor: "#FEE2E2", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#DC2626", fontSize: 15, fontWeight: "700" },
  version: { textAlign: "center", color: "#9CA3AF", fontSize: 11, marginTop: 20 },
});
