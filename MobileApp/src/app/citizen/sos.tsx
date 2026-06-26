import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

export default function SOSScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState("");
  const [sending, setSending] = useState(false);

  // SOS_TYPES defined inside component so tr() picks up current language
  const SOS_TYPES = [
    { icon: "🔥", labelKey: "sos.sosTypeFire",    color: "#DC2626", bg: "#FEF2F2" },
    { icon: "🚑", labelKey: "sos.sosTypeMedical",  color: "#7C3AED", bg: "#F5F3FF" },
    { icon: "🌊", labelKey: "sos.sosTypeFlood",    color: "#0891B2", bg: "#ECFEFF" },
    { icon: "⚡", labelKey: "sos.sosTypePower",    color: "#D97706", bg: "#FFFBEB" },
    { icon: "🛣️", labelKey: "sos.sosTypeRoad",     color: "#DC2626", bg: "#FEF2F2" },
    { icon: "🆘", labelKey: "sos.sosTypeOther",    color: "#64748B", bg: "#F8FAFC" },
  ];

  const HELPLINES = [
    { labelKey: "sos.helplinesPolice",   number: "100", icon: "👮" },
    { labelKey: "sos.helplinesAmbulance",number: "108", icon: "🚑" },
    { labelKey: "sos.helplinesFire",     number: "101", icon: "🔥" },
    { labelKey: "sos.helplinesDisaster", number: "1070", icon: "⚠️" },
  ];

  const handleSOS = async () => {
    if (!selected) {
      Alert.alert(tr('sosAlert.selectTypeTitle'), tr('sosAlert.selectTypeMsg'));
      return;
    }
    Alert.alert(
      tr('sosAlert.confirmTitle'),
      tr('sosAlert.confirmMsg').replace('{type}', selected),
      [
        { text: tr('common.cancel'), style: "cancel" },
        {
          text: tr('sosAlert.sendSOS'),
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
              Alert.alert(tr('sosAlert.sosSentTitle'), tr('sosAlert.sosSentMsg'), [
                { text: tr('sosAlert.ok'), onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert(tr('sosAlert.errTitle'), tr('sosAlert.errMsg'));
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
        <Text style={s.headerTitle}>🚨 {tr('sos.title')}</Text>
        <Text style={s.headerSub}>{tr('sos.raiseUrgentAlert')}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Helplines */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>{tr('sos.emergencyHelplines')}</Text>
          <View style={s.helpGrid}>
            {HELPLINES.map((h) => (
              <TouchableOpacity
                key={h.number}
                style={s.helpCard}
                onPress={() => Linking.openURL(`tel:${h.number}`)}
              >
                <Text style={s.helpIcon}>{h.icon}</Text>
                <Text style={s.helpLabel}>{tr(h.labelKey as any)}</Text>
                <Text style={s.helpNumber}>{h.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SOS Type */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>{tr('sos.selectEmergencyType')}</Text>
          <View style={s.sosGrid}>
            {SOS_TYPES.map((typ) => {
              const label = tr(typ.labelKey as any);
              return (
                <TouchableOpacity
                  key={typ.labelKey}
                  style={[s.sosCard, { backgroundColor: typ.bg }, selected === label && s.sosCardActive]}
                  onPress={() => setSelected(label)}
                >
                  <Text style={s.sosIcon}>{typ.icon}</Text>
                  <Text style={[s.sosLabel, { color: typ.color }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
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
            : <Text style={s.sosBtnText}>🆘 {tr('sos.sendAlert')}</Text>}
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
