import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import {
  fetchConstituencies, resolveRepresentative,
  ConstituencyOption, ResolvedRepresentative, RepType,
} from "../../services/directoryApi";
import { serverApi } from "../../services/repApi";
import { useRepresentativesStore } from "../../store/representativesStore";

const C = {
  primary: "#1D4ED8", primaryDark: "#1E3A8A", bg: "#F0F4FF", card: "#FFFFFF",
  text: "#1E293B", muted: "#64748B", border: "#E2E8F0", green: "#10B981", red: "#EF4444",
};

const REP_TYPES: { key: RepType; label: string; icon: string }[] = [
  { key: "COUNCILLOR", label: "Councillor", icon: "👥" },
  { key: "MLA",         label: "MLA",        icon: "🖋️" },
  { key: "MP",          label: "MP",         icon: "🏛️" },
];

type Step = "pick-type" | "pick-constituency" | "confirm" | "contact" | "otp" | "details" | "done";

export default function LinkRepresentativeScreen() {
  const router = useRouter();
  const addLink = useRepresentativesStore((s) => s.addLink);
  const getLink = useRepresentativesStore((s) => s.getLink);

  const [step, setStep] = useState<Step>("pick-type");
  const [repType, setRepType] = useState<RepType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<ConstituencyOption[]>([]);
  const [filter, setFilter] = useState("");
  const [chosen, setChosen] = useState<ConstituencyOption | null>(null);
  const [resolved, setResolved] = useState<ResolvedRepresentative | null>(null);

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [citizenId, setCitizenId] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useFocusEffect(useCallback(() => {
    // Reset every time this screen is (re)entered so linking a 2nd/3rd
    // representative starts clean.
    setStep("pick-type"); setRepType(null); setOptions([]); setFilter("");
    setChosen(null); setResolved(null); setContact(""); setOtp("");
    setToken(null); setCitizenId(null); setNeedsProfile(false);
    setName(""); setEmail(""); setError(null);
  }, []));

  async function pickRepType(rt: RepType) {
    if (getLink(rt)) {
      Alert.alert(
        "Already linked",
        `You already have a ${rt} linked. Unlink it first from your profile if you want to link a different one.`
      );
      return;
    }
    setRepType(rt);
    setLoading(true);
    setError(null);
    try {
      const items = await fetchConstituencies(rt);
      setOptions(items);
      setStep("pick-constituency");
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Could not reach the Directory Service");
    } finally {
      setLoading(false);
    }
  }

  async function pickConstituency(opt: ConstituencyOption) {
    if (!repType) return;
    setChosen(opt);
    setLoading(true);
    setError(null);
    try {
      const rep = await resolveRepresentative(repType, {
        assemblyName: opt.assembly_name,
        parliamentaryName: opt.parliamentary_name,
        wardId: opt.ward_id,
      });
      setResolved(rep);
      setStep("confirm");
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "No active representative found there");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp() {
    if (!resolved || !contact.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await serverApi(resolved.server_url).post("/api/auth/citizen/send-otp", {
        type: method, value: contact.trim(),
      });
      setStep("otp");
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!resolved || !repType || !otp.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await serverApi(resolved.server_url).post("/api/auth/citizen/register", {
        value: contact.trim(),
        otp: otp.trim(),
        rep_type: repType,
        assembly_name: chosen?.assembly_name,
        parliamentary_name: chosen?.parliamentary_name,
        ward_id: chosen?.ward_id,
      });
      const u = data.user;
      const hasProfile = !!(u.fullName && u.fullName.trim() && !u.fullName.startsWith("otp-"));
      setToken(data.accessToken);
      setCitizenId(u._id || u.id);
      setName(hasProfile ? u.fullName : "");
      setEmail(u.email && !u.email.startsWith("otp-") ? u.email : "");
      setNeedsProfile(!hasProfile);
      setStep(hasProfile ? "done" : "details");
      if (hasProfile) finishLink(data.accessToken, u._id || u.id, u.fullName);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  }

  async function saveDetails() {
    if (!resolved || !token || !name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await serverApi(resolved.server_url, token).post("/api/citizens/register-details", {
        name: name.trim(),
        email: email.trim() || undefined,
      });
      finishLink(token, citizenId || "", name.trim());
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  function finishLink(tok: string, cid: string, citizenName: string) {
    if (!resolved || !repType) return;
    addLink({
      repType,
      repCode: resolved.rep_code,
      serverUrl: resolved.server_url,
      token: tok,
      citizenId: cid,
      name: citizenName,
      repName: resolved.name,
      constituency: chosen?.label || "",
      profileComplete: true,
      linkedAt: new Date().toISOString(),
    });
    setStep("done");
  }

  const filteredOptions = options.filter((o) =>
    !filter.trim() || o.label.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity style={s.backCircle} onPress={() => (router.canGoBack?.() ? router.back() : router.replace("/citizen/(tabs)" as any))}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Link a Representative</Text>
        <Text style={s.headerSub}>Your Councillor, MLA, and MP each run on their own server — link each one you want to reach.</Text>
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {error && (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        )}

        {step === "pick-type" && (
          <>
            <Text style={s.stepTitle}>Who do you want to reach?</Text>
            {REP_TYPES.map((rt) => (
              <TouchableOpacity key={rt.key} style={s.bigOption} onPress={() => pickRepType(rt.key)} disabled={loading}>
                <Text style={s.bigOptionIcon}>{rt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.bigOptionLabel}>{rt.label}</Text>
                  {getLink(rt.key) && <Text style={s.linkedTag}>Already linked</Text>}
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </TouchableOpacity>
            ))}
            {loading && <ActivityIndicator color={C.primary} style={{ marginTop: 16 }} />}
          </>
        )}

        {step === "pick-constituency" && repType && (
          <>
            <Text style={s.stepTitle}>
              {repType === "MLA" ? "Select your Assembly constituency" :
               repType === "MP" ? "Select your Parliamentary constituency" :
               "Select your Ward"}
            </Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={filter}
              onChangeText={setFilter}
            />
            {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 16 }} /> : (
              filteredOptions.length === 0 ? (
                <Text style={s.emptyText}>No constituencies registered yet for {repType}.</Text>
              ) : filteredOptions.map((opt, i) => (
                <TouchableOpacity key={i} style={s.listRow} onPress={() => pickConstituency(opt)}>
                  <Text style={s.listRowLabel}>{opt.label}</Text>
                  <Text style={s.listRowSub}>{opt.rep_name}{opt.district ? ` · ${opt.district}` : ""}</Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {step === "confirm" && resolved && (
          <>
            <Text style={s.stepTitle}>Is this your representative?</Text>
            <View style={s.confirmCard}>
              <Text style={s.confirmName}>{resolved.name}</Text>
              <Text style={s.confirmMeta}>{resolved.rep_type} · {chosen?.label}</Text>
              {resolved.district ? <Text style={s.confirmMeta}>{resolved.district}, {resolved.state}</Text> : null}
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setStep("contact")}>
              <Text style={s.primaryBtnText}>Yes, continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep("pick-constituency")}>
              <Text style={s.secondaryBtnText}>Choose a different one</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "contact" && (
          <>
            <Text style={s.stepTitle}>Verify it's you</Text>
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.toggleBtn, method === "phone" && s.toggleActive]} onPress={() => { setMethod("phone"); setContact(""); }}>
                <Text style={[s.toggleText, method === "phone" && s.toggleTextActive]}>📱 Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggleBtn, method === "email" && s.toggleActive]} onPress={() => { setMethod("email"); setContact(""); }}>
                <Text style={[s.toggleText, method === "email" && s.toggleTextActive]}>✉️ Email</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.input}
              placeholder={method === "phone" ? "98765 43210" : "you@example.com"}
              placeholderTextColor="#9CA3AF"
              keyboardType={method === "phone" ? "phone-pad" : "email-address"}
              autoCapitalize="none"
              value={contact}
              onChangeText={setContact}
            />
            <TouchableOpacity style={[s.primaryBtn, loading && s.disabled]} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === "otp" && (
          <>
            <Text style={s.stepTitle}>Enter the OTP sent to {contact}</Text>
            <TextInput
              style={[s.input, s.otpInput]}
              placeholder="· · · · · ·"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity style={[s.primaryBtn, loading && s.disabled]} onPress={verifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Verify & Link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={sendOtp} disabled={loading}>
              <Text style={s.secondaryBtnText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "details" && (
          <>
            <Text style={s.stepTitle}>A few details for {resolved?.name}</Text>
            <TextInput style={s.input} placeholder="Your full name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Email (optional)" placeholderTextColor="#9CA3AF" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TouchableOpacity style={[s.primaryBtn, loading && s.disabled]} onPress={saveDetails} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save & Finish</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === "done" && (
          <View style={s.doneWrap}>
            <Ionicons name="checkmark-circle" size={56} color={C.green} />
            <Text style={s.stepTitle}>{resolved?.name} is now linked</Text>
            <Text style={s.doneSub}>You can raise grievances with them and link more representatives any time.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/citizen/(tabs)" as any)}>
              <Text style={s.primaryBtnText}>Go to my dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep("pick-type")}>
              <Text style={s.secondaryBtnText}>Link another representative</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.primaryDark, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 6 },
  headerSub: { color: "#BFDBFE", fontSize: 13, lineHeight: 19 },

  body: { padding: 20, paddingBottom: 60 },
  stepTitle: { fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 16 },

  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: C.red, fontSize: 13 },

  bigOption: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  bigOptionIcon: { fontSize: 26 },
  bigOptionLabel: { fontSize: 16, fontWeight: "700", color: C.text },
  linkedTag: { fontSize: 11, color: C.green, fontWeight: "700", marginTop: 2 },

  searchInput: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12, color: C.text },
  emptyText: { color: C.muted, fontSize: 13, textAlign: "center", marginTop: 24 },
  listRow: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  listRowLabel: { fontSize: 15, fontWeight: "700", color: C.text },
  listRowSub: { fontSize: 12, color: C.muted, marginTop: 2 },

  confirmCard: { backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: C.border, alignItems: "center" },
  confirmName: { fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 4 },
  confirmMeta: { fontSize: 13, color: C.muted },

  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: "center", backgroundColor: C.card },
  toggleActive: { borderColor: C.primary, backgroundColor: "#EEF2FF" },
  toggleText: { fontSize: 14, fontWeight: "600", color: C.muted },
  toggleTextActive: { color: C.primary },

  input: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: C.text, marginBottom: 16 },
  otpInput: { letterSpacing: 10, textAlign: "center", fontSize: 20, fontWeight: "700" },

  primaryBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 12 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: { color: C.primary, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.6 },

  doneWrap: { alignItems: "center", paddingTop: 20 },
  doneSub: { fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 24, lineHeight: 20 },
});
