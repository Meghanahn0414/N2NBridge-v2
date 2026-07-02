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
import { API_BASE } from "../config";

// Purely visual — which representative category chip is highlighted. Not
// wired to any backend filter/routing; the OTP login flow below is identical
// no matter which one (or none) is selected.
type RepCategory = "councillor" | "mla" | "mp";
const REP_CATEGORIES: { key: RepCategory; icon: string; label: string; labelKey: string }[] = [
  { key: "councillor", icon: "👥", label: "Councillor", labelKey: "auth.catCouncillor" },
  { key: "mla",        icon: "🖋️", label: "MLA",        labelKey: "auth.catMla" },
  { key: "mp",         icon: "🏛️", label: "MP",         labelKey: "auth.catMp" },
];

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
  const [repCategory, setRepCategory] = useState<RepCategory | null>(null);

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
      Alert.alert(tr('common.error'), method === "phone" ? tr('auth.errEnterPhone') : tr('auth.errEnterEmail'));
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
      Alert.alert(tr('common.error'), err?.response?.data?.detail ?? tr('auth.errSendOtpFailed'));
    } finally {
      setLoading(false);
    }
  }

  // ── Verify OTP ──
  async function handleVerifyOtp() {
    if (!otp.trim()) { Alert.alert(tr('common.error'), tr('auth.errEnterOtp')); return; }
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

      // Don't let a synthetic OTP placeholder email (e.g. "otp-xxxx@otp.local",
      // generated server-side for phone-only signups with no email on file)
      // leak into the display name / profile form — fall back to a real,
      // non-placeholder email only.
      const realEmail = u.email && !u.email.startsWith("otp-") ? u.email : "";

      // Same idea for mobile — a fresh placeholder account has no real
      // number on file yet, only whatever the citizen just typed to send
      // the OTP. Prefer the backend's value (a returning citizen's real,
      // saved number) and fall back to what was typed here so the profile
      // completion form isn't left blank for a first-time phone signup.
      const realMobile = u.mobile && !u.mobile.startsWith("otp-")
        ? u.mobile
        : (method === "phone" ? value.trim().replace(/\D/g, "") : "");

      // Backend's OtpResponse model returns the token as `accessToken`, not
      // `token` — this was reading the wrong field, so setAuth() was always
      // storing `undefined` as the session token. Once navigation reached
      // any /citizen/* route, citizen/_layout.tsx saw no token and bounced
      // to /citizen/onboarding (an alias of the root onboarding screen) —
      // that's the "Your city, in your hands" page showing up after every
      // OTP verification.
      setAuth(data.accessToken, {
        id:     u._id || u.id,
        name:   u.fullName || u.name || u.full_name || realEmail,
        email:  u.email,
        mobile: realMobile,
        role,
      });
      // Sync the store so the rest of the app is also up to date
      useAuthStore.getState().setProfileComplete(hasProfile);

      if (role === "CITIZEN" && !hasProfile) {
        // Carry the representative category chip picked on this screen
        // through to the completion form so it doesn't have to be picked
        // twice — it's otherwise decorative here (doesn't affect the OTP
        // call itself), so this is the only place its value is used.
        const repTypeParam = repCategory ? `&repType=${repCategory.toUpperCase()}` : "";
        router.replace(`/citizen/edit-profile?required=1${repTypeParam}` as any);
      } else {
        router.replace((ROLE_ROUTES[role] ?? "/citizen/") as any);
      }
    } catch (err: any) {
      Alert.alert(tr('auth.verificationFailed'), err?.response?.data?.detail ?? tr('auth.errInvalidOtp'));
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

        {/* Back arrow — always visible; steps back out of OTP, or out of the screen entirely */}
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            if (step === "otp") { setStep("input"); setOtp(""); return; }
            if (router.canGoBack?.()) router.back();
          }}
        >
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={s.welcome}>
          {step === "input" ? tr('auth.welcomeHeading') : tr('auth.enterOtp')}
        </Text>
        <Text style={s.sub}>
          {step === "input"
            ? tr('auth.welcomeSubtitle')
            : `${tr('auth.otpSent')} ${value}. ${tr('auth.enterItBelow')}`}
        </Text>

        {/* ── Input step ── */}
        {step === "input" && (
          <>
            {/* Representative category — decorative only, doesn't affect the OTP flow below */}
            <View style={s.categoryRow}>
              {REP_CATEGORIES.map((cat) => {
                const active = repCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.categoryCard, active && s.categoryCardActive]}
                    onPress={() => setRepCategory(active ? null : cat.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.categoryIcon}>{cat.icon}</Text>
                    <Text style={[s.categoryLabel, active && s.categoryLabelActive]}>{tr(cat.labelKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
              {method === "phone" && (
                <View style={s.countryCodeBox}>
                  <Text style={s.countryCodeText}>🇮🇳 +91</Text>
                </View>
              )}
              {method === "email" && <Text style={s.inputIcon}>✉️</Text>}
              <TextInput
                style={s.input}
                placeholder={method === "phone" ? "98765 43210" : "you@example.com"}
                placeholderTextColor="#9CA3AF"
                keyboardType={method === "phone" ? "phone-pad" : "email-address"}
                autoCapitalize="none"
                value={value}
                onChangeText={setValue}
              />
              {method === "phone" && value.replace(/\D/g, "").length === 10 && (
                <Text style={s.checkIcon}>✅</Text>
              )}
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

            <View style={s.verifiedRow}>
              <Text style={s.verifiedIcon}>🛡️</Text>
              <Text style={s.verifiedText}>{tr('auth.verifiedByConstituency')}</Text>
            </View>
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
  sub:     { fontSize: 15, color: "#64748B", lineHeight: 22, marginBottom: 28 },

  categoryRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  categoryCard: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC",
  },
  categoryCardActive: { borderColor: "#1D4ED8", backgroundColor: "#EEF2FF" },
  categoryIcon:        { fontSize: 20 },
  categoryLabel:        { fontSize: 12, fontWeight: "700", color: "#64748B" },
  categoryLabelActive:  { color: "#1D4ED8" },

  countryCodeBox: {
    flexDirection: "row", alignItems: "center",
    paddingRight: 10, marginRight: 8,
    borderRightWidth: 1, borderRightColor: "#E2E8F0",
  },
  countryCodeText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  checkIcon:       { fontSize: 15, marginLeft: 6 },

  verifiedRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 },
  verifiedIcon: { fontSize: 13 },
  verifiedText: { fontSize: 12, fontWeight: "600", color: "#16A34A" },

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

  langFloatWrap:       { position: "absolute", top: (StatusBar.currentHeight ?? 24) + 8, right: 16, zIndex: 999 },
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
