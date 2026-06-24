import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar,
} from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import axios from "axios";
import { storage } from "../utils/storage";
import { useAuthStore } from "../store/authStore";
import { changeLanguage, getCurrentLanguage, initLanguage } from "../i18n";
import { useT } from "../i18n/useT";

const API_BASE = "https://testing-repository-grevienace-1.onrender.com";

const ROLE_ROUTES: Record<string, string> = {
  CITIZEN:               "/citizen/",
  ADMIN:                 "/admin/",
  REPRESENTATIVE:        "/mla/",
  FIELD_OFFICER:         "/field/",
  CONSTITUENCY_MANAGER:  "/manager/",
};

type Method = "phone" | "email";
type Step   = "input" | "otp";

export default function LoginScreen() {
  const tr = useT();
  const router  = useRouter();
  const rootNavState = useRootNavigationState();
  const { setAuth } = useAuthStore();

  const [ready,   setReady]   = useState(false);
  const [method,  setMethod]  = useState<Method>("phone");
  const [value,   setValue]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [step,    setStep]    = useState<Step>("input");
  const [loading,  setLoading]  = useState(false);
  const [lang,     setLang]     = useState(getCurrentLanguage());
  const [langOpen, setLangOpen] = useState(false);

  const handleLangChange = async (l: 'en' | 'kn' | 'hi' | 'te') => {
    await changeLanguage(l);
    setLang(l);
  };

  // ── On mount: redirect if already logged in, or show onboarding ──
  useEffect(() => { initLanguage().then(() => setLang(getCurrentLanguage())); }, []);

  useEffect(() => {
    if (!rootNavState?.key) return; // Root layout not mounted yet — wait
    (async () => {
      // Fast path: in-memory store already has a session (handles back-button with no flicker)
      const cached = useAuthStore.getState();
      if (cached.token && cached.user?.role) {
        const role = cached.user.role;
        if (role === "CITIZEN" && !cached.profileComplete) {
          router.replace("/citizen/edit-profile?required=1" as any);
        } else {
          router.replace((ROLE_ROUTES[role] ?? "/citizen/") as any);
        }
        return;
      }

      // Slow path: rehydrate from storage (first load or after page refresh)
      await useAuthStore.persist.rehydrate();

      const done = await storage.getItem("onboarding_done");
      if (!done) {
        router.replace("/onboarding");
        return;
      }

      // Check persisted auth (written by Zustand persist middleware)
      const fresh = useAuthStore.getState();
      if (fresh.token && fresh.user?.role) {
        const role            = fresh.user.role;
        const profileComplete = fresh.profileComplete;
        if (role === "CITIZEN" && !profileComplete) {
          router.replace("/citizen/edit-profile?required=1" as any);
        } else {
          router.replace((ROLE_ROUTES[role] ?? "/citizen/") as any);
        }
        return;
      }

      setReady(true);
    })();
  }, [rootNavState?.key]);

  if (!ready) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#1D4ED8" />
    </View>
  );

  // ── Send OTP ──
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
      Alert.alert("Error", err?.response?.data?.detail ?? "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Verify OTP ──
  async function handleVerifyOtp() {
    if (!otp.trim()) { Alert.alert("Error", "Enter the OTP"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        value: value.trim(),
        otp:   otp.trim(),
      });
      const u = data.user;

      // Persist auth
      const role = u.role as string;

      // Determine profile completeness from the API response, not local storage.
      // A citizen has no profile if fullName is missing or is a placeholder OTP value.
      const hasProfile = !!(
        u.fullName &&
        u.fullName.trim() &&
        !u.fullName.startsWith("otp-") &&
        !u.email?.startsWith("otp-")
      );

      setAuth(data.token, {
        id:    u._id || u.id,
        name:  u.fullName || u.name || u.full_name || u.email,
        email: u.email,
        role,
      });
      // Sync the store so the rest of the app is also up to date
      useAuthStore.getState().setProfileComplete(hasProfile);

      if (role === "CITIZEN" && !hasProfile) {
        router.replace("/citizen/edit-profile?required=1" as any);
      } else {
        router.replace((ROLE_ROUTES[role] ?? "/citizen/") as any);
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err?.response?.data?.detail ?? "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  const LANG_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'te', label: 'తెలుగు' },
  ] as const;

  const langLabel = LANG_OPTIONS.find(o => o.code === lang)?.label ?? 'English';

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Language dropdown — outside ScrollView so it's never clipped */}
      <View style={s.langFloatWrap} pointerEvents="box-none">
        <TouchableOpacity style={s.langDropBtn} onPress={() => setLangOpen(o => !o)} activeOpacity={0.8}>
          <Text style={s.langGlobe}>🌐</Text>
          <Text style={s.langDropBtnText}>{langLabel}</Text>
          <Text style={s.langDropArrow}>{langOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {langOpen && (
          <>
            {/* Tap-outside dismissal */}
            <TouchableOpacity style={s.langBackdrop} activeOpacity={1} onPress={() => setLangOpen(false)} />
            <View style={s.langDropList}>
              {LANG_OPTIONS.map(({ code, label }) => (
                <TouchableOpacity
                  key={code}
                  style={[s.langDropItem, lang === code && s.langDropItemActive]}
                  onPress={() => { handleLangChange(code); setLangOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.langDropItemText, lang === code && s.langDropItemTextActive]}>
                    {label}
                  </Text>
                  {lang === code && <Text style={s.langCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Back arrow (OTP step) */}
        {step === "otp" && (
          <TouchableOpacity style={s.backBtn} onPress={() => { setStep("input"); setOtp(""); }}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        )}

        <Text style={s.welcome}>
          {step === "input" ? tr('auth.welcomeBack') : tr('auth.enterOtp')}
        </Text>
        <Text style={s.sub}>
          {step === "input"
            ? tr('auth.signIn')
            : `${tr('auth.otpSent')} ${value}. ${tr('auth.enterItBelow')}`}
        </Text>

        {/* ── Input step ── */}
        {step === "input" && (
          <>
            <View style={s.toggleRow}>
              <TouchableOpacity
                style={[s.toggleBtn, method === "phone" && s.toggleActive]}
                onPress={() => { setMethod("phone"); setValue(""); }}
              >
                <Text style={[s.toggleText, method === "phone" && s.toggleTextActive]}>
                  📱 {tr('auth.phone')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleBtn, method === "email" && s.toggleActive]}
                onPress={() => { setMethod("email"); setValue(""); }}
              >
                <Text style={[s.toggleText, method === "email" && s.toggleTextActive]}>
                  ✉️ {tr('auth.email')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>
              {method === "phone" ? tr('auth.phoneNumber') : tr('auth.emailAddress')}
            </Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>{method === "phone" ? "📱" : "✉️"}</Text>
              <TextInput
                style={s.input}
                placeholder={method === "phone" ? "+91 98765 43210" : "you@example.com"}
                placeholderTextColor="#9CA3AF"
                keyboardType={method === "phone" ? "phone-pad" : "email-address"}
                autoCapitalize="none"
                value={value}
                onChangeText={setValue}
              />
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{tr('auth.sendOtp')}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── OTP step ── */}
        {step === "otp" && (
          <>
            <Text style={s.label}>{tr('auth.oneTimePassword')}</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={[s.input, s.otpInput]}
                placeholder="· · · · · ·"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, loading && s.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnPrimaryText}>{tr('auth.signInBtn')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.resendBtn} onPress={handleSendOtp} disabled={loading}>
              <Text style={s.resendText}>{tr('auth.resendOtp')}</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>{tr('auth.newToApp')} </Text>
          <TouchableOpacity onPress={() => router.replace("/onboarding" as any)}>
            <Text style={s.footerLink}>{tr('auth.createAccount')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#fff" },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 64 },

  backBtn:   { marginBottom: 24 },
  backArrow: { fontSize: 22, color: "#0F172A" },

  welcome: { fontSize: 30, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
  sub:     { fontSize: 15, color: "#64748B", lineHeight: 22, marginBottom: 36 },

  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center",
  },
  toggleActive:     { borderColor: "#1D4ED8", backgroundColor: "#EEF2FF" },
  toggleText:       { fontSize: 14, fontWeight: "600", color: "#64748B" },
  toggleTextActive: { color: "#1D4ED8" },

  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 20, backgroundColor: "#F8FAFC",
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input:     { flex: 1, paddingVertical: 14, fontSize: 15, color: "#0F172A" },
  otpInput:  { letterSpacing: 10, textAlign: "center", fontSize: 20, fontWeight: "700" },

  btnPrimary: {
    backgroundColor: "#1D4ED8", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 16,
  },
  btnDisabled:     { opacity: 0.6 },
  btnPrimaryText:  { color: "#fff", fontSize: 16, fontWeight: "700" },

  resendBtn:  { alignItems: "center", paddingVertical: 8 },
  resendText: { color: "#1D4ED8", fontSize: 14, fontWeight: "600" },

  footer:     { flexDirection: "row", justifyContent: "center", marginTop: "auto", paddingTop: 32 },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#1D4ED8", fontSize: 14, fontWeight: "700" },

  langFloatWrap:       { position: "absolute", top: 16, right: 16, zIndex: 999 },
  langDropBtn:         { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  langGlobe:           { fontSize: 15 },
  langDropBtnText:     { fontSize: 14, fontWeight: "600", color: "#374151" },
  langDropArrow:       { fontSize: 9, color: "#9CA3AF", marginLeft: 2 },
  langBackdrop:        { position: "fixed" as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  langDropList:        { position: "absolute", top: 46, right: 0, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 20, minWidth: 170, zIndex: 999, overflow: "hidden" },
  langDropItem:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  langDropItemActive:  { backgroundColor: "#F0F4FF" },
  langDropItemText:    { fontSize: 14, fontWeight: "500", color: "#374151" },
  langDropItemTextActive: { color: "#1D4ED8", fontWeight: "700" },
  langCheck:           { fontSize: 13, color: "#1D4ED8", fontWeight: "700" },
});
