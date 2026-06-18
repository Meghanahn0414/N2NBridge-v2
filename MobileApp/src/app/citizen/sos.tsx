import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const SOS_TYPES = [
  { icon: "🔥", label: "Fire", color: "#DC2626", bg: "#FEF2F2" },
  { icon: "🚑", label: "Medical Emergency", color: "#7C3AED", bg: "#F5F3FF" },
  { icon: "🌊", label: "Flood / Water", color: "#0891B2", bg: "#ECFEFF" },
  { icon: "⚡", label: "Power Hazard", color: "#D97706", bg: "#FFFBEB" },
  { icon: "🛣️", label: "Road Accident", color: "#DC2626", bg: "#FEF2F2" },
  { icon: "🆘", label: "Other Emergency", color: "#64748B", bg: "#F8FAFC" },
];

const HELPLINES = [
  { label: "Police", number: "100", icon: "👮" },
  { label: "Ambulance", number: "108", icon: "🚑" },
  { label: "Fire", number: "101", icon: "🔥" },
  { label: "Disaster", number: "1070", icon: "⚠️" },
];

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState("");
  const [sending, setSending] = useState(false);

  const handleSOS = async () => {
    if (!selected) {
      Alert.alert("Select Type", "Please select the type of emergency.");
      return;
    }
    Alert.alert(
      "Confirm Emergency Alert",
      `Send an emergency SOS for "${selected}"? This will notify local authorities.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            setSending(true);
            try {
              await api.post("/api/grievances", {
                citizenId: user?.id,
                categoryId: "EMERGENCY",
                description: `EMERGENCY SOS: ${selected}`,
                address: "Location via GPS",
                wardId: "1",
                priority: "CRITICAL",
              });
              Alert.alert("SOS Sent", "Your emergency alert has been sent. Help is on the way.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert("Error", "Failed to send SOS. Please call emergency numbers directly.");
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor="#B91C1C" barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🚨 Emergency SOS</Text>
        <Text style={s.headerSub}>Raise an urgent alert to authorities</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Helplines */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>EMERGENCY HELPLINES</Text>
          <View style={s.helpGrid}>
            {HELPLINES.map((h) => (
              <TouchableOpacity
                key={h.number}
                style={s.helpCard}
                onPress={() => Linking.openURL(`tel:${h.number}`)}
              >
                <Text style={s.helpIcon}>{h.icon}</Text>
                <Text style={s.helpLabel}>{h.label}</Text>
                <Text style={s.helpNumber}>{h.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SOS Type */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>SELECT EMERGENCY TYPE</Text>
          <View style={s.sosGrid}>
            {SOS_TYPES.map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[s.sosCard, { backgroundColor: t.bg }, selected === t.label && s.sosCardActive]}
                onPress={() => setSelected(t.label)}
              >
                <Text style={s.sosIcon}>{t.icon}</Text>
                <Text style={[s.sosLabel, { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[s.sosBtn, (!selected || sending) && s.sosBtnDisabled]}
          onPress={handleSOS}
          disabled={!selected || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.sosBtnText}>🆘 Send Emergency Alert</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" },
  header: {
    backgroundColor: "#DC2626", paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  backBtn: { color: "#FCA5A5", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#FCA5A5", fontSize: 13, marginTop: 4 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, margin: 16, marginBottom: 0,
    padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 14 },
  helpGrid: { flexDirection: "row", gap: 8 },
  helpCard: {
    flex: 1, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#FECACA",
  },
  helpIcon: { fontSize: 22, marginBottom: 4 },
  helpLabel: { fontSize: 11, color: "#374151", fontWeight: "600" },
  helpNumber: { fontSize: 16, fontWeight: "800", color: "#DC2626", marginTop: 2 },
  sosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sosCard: {
    width: "47%", borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  sosCardActive: { borderColor: "#DC2626" },
  sosIcon: { fontSize: 28, marginBottom: 6 },
  sosLabel: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  sosBtn: {
    backgroundColor: "#DC2626", margin: 16, borderRadius: 14,
    paddingVertical: 18, alignItems: "center", elevation: 4,
  },
  sosBtnDisabled: { opacity: 0.5 },
  sosBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
