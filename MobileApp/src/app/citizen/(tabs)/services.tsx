import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/authStore";

interface Service {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  route: string;
}

const SERVICES: Service[] = [
  {
    icon: "📝",
    title: "File Complaint",
    subtitle: "Report a civic issue",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    route: "/citizen/new-complaint",
  },
  {
    icon: "📋",
    title: "My Complaints",
    subtitle: "Track your submissions",
    color: "#7C3AED",
    bg: "#F5F3FF",
    route: "/citizen/complaints",
  },
  {
    icon: "📢",
    title: "Campaigns",
    subtitle: "Active government programs",
    color: "#0891B2",
    bg: "#ECFEFF",
    route: "/citizen/campaigns",
  },
  {
    icon: "⭐",
    title: "Feedback",
    subtitle: "Rate services & officers",
    color: "#D97706",
    bg: "#FFFBEB",
    route: "/citizen/feedback",
  },
  {
    icon: "🚨",
    title: "Emergency SOS",
    subtitle: "Raise an urgent alert",
    color: "#DC2626",
    bg: "#FEF2F2",
    route: "/citizen/sos",
  },
  {
    icon: "👤",
    title: "My Profile",
    subtitle: "View & update your info",
    color: "#059669",
    bg: "#ECFDF5",
    route: "/citizen/profile",
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSub}>Everything you need in one place</Text>
      </View>

      <View style={styles.welcomeStrip}>
        <Text style={styles.welcomeText}>
          👋  Hello, {(user?.name || "Citizen").split(" ")[0]}
        </Text>
        <Text style={styles.welcomeSub}>What can we help you with today?</Text>
      </View>

      <View style={styles.grid}>
        {SERVICES.map((s) => (
          <TouchableOpacity
            key={s.title}
            style={[styles.card, { backgroundColor: s.bg }]}
            onPress={() => router.push(s.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: s.color + "20" }]}>
              <Text style={styles.icon}>{s.icon}</Text>
            </View>
            <Text style={[styles.cardTitle, { color: s.color }]}>{s.title}</Text>
            <Text style={styles.cardSub}>{s.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          Contact your local ward office or raise a complaint and a field officer will be assigned to assist you.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  content: { paddingBottom: 32 },

  header: {
    backgroundColor: "#1D4ED8",
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSub: { color: "#BFDBFE", fontSize: 13, marginTop: 4 },

  welcomeStrip: {
    backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  welcomeText: { fontSize: 16, fontWeight: "700", color: "#1E3A8A" },
  welcomeSub: { fontSize: 12, color: "#6B7280", marginTop: 3 },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, marginTop: 12, gap: 10,
  },
  card: {
    width: "47%",
    borderRadius: 16, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 22 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  cardSub: { fontSize: 11, color: "#6B7280", lineHeight: 16 },

  helpCard: {
    backgroundColor: "#1D4ED8",
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
  },
  helpTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  helpText: { color: "#BFDBFE", fontSize: 13, lineHeight: 20 },
});
