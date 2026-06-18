import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE = "https://testing-repository-grevienace-1.onrender.com";

type LoginMethod = "phone" | "email";
type Step = "input" | "otp";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [value, setValue] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!value.trim()) {
      Alert.alert("Error", method === "phone" ? "Enter your phone number" : "Enter your email");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/auth/send-otp`, {
        type: method,
        value: value.trim(),
      });
      setStep("otp");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Failed to send OTP. Try again.";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      Alert.alert("Error", "Enter the OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        value: value.trim(),
        otp: otp.trim(),
      });

      const u = data.user;
      setAuth(data.token, {
        id: u._id || u.id,
        name: u.fullName || u.name || u.full_name || u.email,
        email: u.email,
        role: u.role,
      });

      if (u.role === "CITIZEN") {
        router.replace("/citizen/" as any);
      } else if (u.role === "ADMIN") {
        router.replace("/admin/" as any);
      } else if (u.role === "REPRESENTATIVE") {
        router.replace("/mla/" as any);
      } else if (u.role === "FIELD_OFFICER") {
        router.replace("/field/" as any);
      } else if (u.role === "CONSTITUENCY_MANAGER") {
        router.replace("/manager/" as any);
      } else {
        router.replace("/citizen/" as any);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Invalid or expired OTP.";
      Alert.alert("Verification Failed", String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Jan Seva CRM</Text>
        <Text style={styles.subtitle}>Enter OTP to Access</Text>

        <View style={styles.card}>
          {/* Login Method Toggle */}
          <Text style={styles.sectionLabel}>LOGIN METHOD</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => { setMethod("phone"); setValue(""); setStep("input"); setOtp(""); }}
            >
              <View style={styles.radioOuter}>
                {method === "phone" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Phone</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => { setMethod("email"); setValue(""); setStep("input"); setOtp(""); }}
            >
              <View style={styles.radioOuter}>
                {method === "email" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Email</Text>
            </TouchableOpacity>
          </View>

          {/* Input Step */}
          {step === "input" && (
            <>
              <Text style={styles.label}>
                {method === "phone" ? "PHONE NUMBER" : "EMAIL ADDRESS"}
                <Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={method === "phone" ? "+91 98765 43210" : "you@example.com"}
                placeholderTextColor="#9CA3AF"
                keyboardType={method === "phone" ? "phone-pad" : "email-address"}
                autoCapitalize="none"
                value={value}
                onChangeText={setValue}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>SEND OTP</Text>
                }
              </TouchableOpacity>
            </>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <>
              <Text style={styles.sentMsg}>
                OTP sent to <Text style={{ fontWeight: "700" }}>{value}</Text>
              </Text>
              <Text style={styles.label}>
                ENTER OTP <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="------"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>VERIFY OTP</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => { setStep("input"); setOtp(""); }}
              >
                <Text style={styles.resendText}>
                  ← Change {method === "phone" ? "number" : "email"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F0F9FF" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 26, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 28, marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 10 },
  toggleRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  radioOption: { flexDirection: "row", alignItems: "center", gap: 8 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#1D4ED8",
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1D4ED8" },
  radioLabel: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  label: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 0.8, marginBottom: 8 },
  required: { color: "#EF4444" },
  input: {
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16,
    color: "#0F172A", marginBottom: 16, backgroundColor: "#F8FAFC",
  },
  otpInput: { letterSpacing: 8, textAlign: "center", fontSize: 22, fontWeight: "700" },
  button: {
    backgroundColor: "#1D4ED8", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
  sentMsg: { fontSize: 14, color: "#64748B", marginBottom: 16, lineHeight: 20 },
  resendBtn: { marginTop: 14, alignItems: "center" },
  resendText: { color: "#1D4ED8", fontSize: 14, fontWeight: "600" },
});
