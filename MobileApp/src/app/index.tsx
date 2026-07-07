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
import { useRepresentativesStore } from "../store/representativesStore";
import { changeLanguage, getCurrentLanguage, initLanguage } from "../i18n";
import { useT } from "../i18n/useT";
import { API_BASE } from "../config";
import {
  fetchConstituencies, resolveRepresentative,
  ConstituencyOption, ResolvedRepresentative, RepType,
} from "../services/lookupApi";
import { serverApi } from "../services/repApi";

// Which representative category chip the citizen picks — this drives the
// real Lookup Service flow below (fetchConstituencies / resolveRepresentative),
// not just decoration.
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

// ── Citizen sign-in wizard steps ──
// category → constituency → confirm → contact → otp
// Matches: pick MLA/MP/Councillor → pick your address/constituency →
// Lookup Service resolves which representative's own server that is →
// mobile number → that representative's server sends the OTP → verify.
type CitizenStep = "category" | "constituency" | "confirm" | "contact" | "otp";

// Representative / Admin / Field Officer / Constituency Manager still sign
// in the old way — central OTP against the shared Backend, no representative
// to resolve (they already know their own account).
type StaffStep = "input" | "otp";

export default function LoginScreen() {
  const tr = useT();
  const router  = useRouter();
  const rootNavState = useRootNavigationState();
  const { setAuth } = useAuthStore();
  const addRepLink = useRepresentativesStore((s) => s.addLink);

  const [ready,   setReady]   = useState(false);
  const [lang,     setLang]     = useState(getCurrentLanguage());
  const [langOpen, setLangOpen] = useState(false);

  // Which sign-in experience is showing — citizens are the default; staff
  // reach their (unchanged) central-OTP form via the link at the bottom.
  const [flowMode, setFlowMode] = useState<"citizen" | "staff">("citizen");

  // ── Citizen wizard state ──
  const [cStep,     setCStep]     = useState<CitizenStep>("category");
  const [cRepType,  setCRepType]  = useState<RepType | null>(null);
  const [cOptions,  setCOptions]  = useState<ConstituencyOption[]>([]);
  const [cFilter,   setCFilter]   = useState("");
  const [cChosen,   setCChosen]   = useState<ConstituencyOption | null>(null);
  const [cResolved, setCResolved] = useState<ResolvedRepresentative | null>(null);
  const [cMethod,   setCMethod]   = useState<Method>("phone");
  const [cContact,  setCContact]  = useState("");
  const [cOtp,      setCOtp]      = useState("");
  const [cLoading,  setCLoading]  = useState(false);
  const [cError,    setCError]    = useState<string | null>(null);

  // ── Staff (Rep/Admin/Field/Manager) state — same central-OTP flow as before ──
  const [staffStep,   setStaffStep]   = useState<StaffStep>("input");
  const [staffMethod, setStaffMethod] = useState<Method>("phone");
  const [staffValue,  setStaffValue]  = useState("");
  const [staffOtp,     setStaffOtp]    = useState("");
  const [loading,      setLoading]     = useState(false);

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
        if (role === "CITIZEN") {
          // Every citizen login lands here first — pre-filled with whatever
          // is already saved (required=1 only if there's truly nothing saved
          // yet; postLogin=1 tells edit-profile.tsx to continue into the app
          // on save instead of just going back, since there's no prior
          // screen to return to in this flow).
          router.replace((cached.profileComplete
            ? "/citizen/edit-profile?postLogin=1"
            : "/citizen/edit-profile?required=1") as any);
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
        if (role === "CITIZEN") {
          router.replace((profileComplete
            ? "/citizen/edit-profile?postLogin=1"
            : "/citizen/edit-profile?required=1") as any);
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

  // ─────────────────────────────────────────────
  // ── Citizen wizard handlers ──
  // ─────────────────────────────────────────────

  async function pickCategory(catKey: RepCategory) {
    const rt = catKey.toUpperCase() as RepType;
    setCRepType(rt);
    setCLoading(true);
    setCError(null);
    try {
      const items = await fetchConstituencies(rt);
      setCOptions(items);
      setCStep("constituency");
    } catch (e: any) {
      setCError(e?.response?.data?.detail || e?.message || "Could not reach the Lookup Service");
    } finally {
      setCLoading(false);
    }
  }

  async function pickConstituency(opt: ConstituencyOption) {
    if (!cRepType) return;
    setCChosen(opt);
    setCLoading(true);
    setCError(null);
    try {
      const rep = await resolveRepresentative(cRepType, {
        assemblyName: opt.assembly_name,
        parliamentaryName: opt.parliamentary_name,
        wardId: opt.ward_id,
      });
      setCResolved(rep);
      setCStep("confirm");
    } catch (e: any) {
      setCError(e?.response?.data?.detail || e?.message || "No active representative found there");
    } finally {
      setCLoading(false);
    }
  }

  async function sendCitizenOtp() {
    if (!cResolved) return;
    if (!cContact.trim()) {
      Alert.alert(tr('common.error'), cMethod === "phone" ? tr('auth.errEnterPhone') : tr('auth.errEnterEmail'));
      return;
    }
    setCLoading(true);
    setCError(null);
    try {
      await serverApi(cResolved.server_url).post("/api/auth/citizen/send-otp", {
        type: cMethod, value: cContact.trim(),
      });
      setCStep("otp");
    } catch (e: any) {
      setCError(e?.response?.data?.detail || e?.message || tr('auth.errSendOtpFailed'));
    } finally {
      setCLoading(false);
    }
  }

  async function verifyCitizenOtp() {
    if (!cResolved || !cRepType) return;
    if (!cOtp.trim()) { Alert.alert(tr('common.error'), tr('auth.errEnterOtp')); return; }
    setCLoading(true);
    setCError(null);
    try {
      const { data } = await serverApi(cResolved.server_url).post("/api/auth/citizen/register", {
        value: cContact.trim(),
        otp:   cOtp.trim(),
        rep_type: cRepType,
        assembly_name: cChosen?.assembly_name,
        parliamentary_name: cChosen?.parliamentary_name,
        ward_id: cChosen?.ward_id,
      });
      const u = data.user;

      const hasProfile = !!(
        u.fullName &&
        u.fullName.trim() &&
        !u.fullName.startsWith("otp-") &&
        !u.email?.startsWith("otp-")
      );
      const realEmail = u.email && !u.email.startsWith("otp-") ? u.email : "";
      const realMobile = u.mobile && !u.mobile.startsWith("otp-")
        ? u.mobile
        : (cMethod === "phone" ? cContact.trim().replace(/\D/g, "") : "");

      setAuth(
        data.accessToken,
        {
          id:     u._id || u.id,
          name:   u.fullName || u.name || realEmail,
          email:  u.email,
          mobile: realMobile,
          role:   "CITIZEN",
          repType: cRepType,
        },
        cResolved.server_url,
      );
      useAuthStore.getState().setProfileComplete(hasProfile);

      // Mirror into the local multi-rep-link store too, so the "Your
      // Representative" / "Link a representative" screens correctly show
      // this one as already linked instead of offering to link it again.
      addRepLink({
        repType:      cRepType,
        repCode:      cResolved.rep_code,
        serverUrl:    cResolved.server_url,
        token:        data.accessToken,
        citizenId:    u._id || u.id,
        name:         u.fullName || realEmail || realMobile,
        repName:      cResolved.name,
        constituency: cChosen?.label || "",
        profileComplete: hasProfile,
        linkedAt:     new Date().toISOString(),
      });

      if (!hasProfile) {
        // Representative + constituency are already resolved and saved on
        // the citizen record by /api/auth/citizen/register above — tell
        // edit-profile.tsx not to ask for them again and not to re-resolve
        // a tenant (see "resolved=1" handling there).
        router.replace(
          `/citizen/edit-profile?required=1&repType=${cRepType}&resolved=1&repArea=${encodeURIComponent(cChosen?.label || "")}` as any
        );
      } else {
        router.replace(`/citizen/edit-profile?postLogin=1` as any);
      }
    } catch (e: any) {
      Alert.alert(tr('auth.verificationFailed'), e?.response?.data?.detail || tr('auth.errInvalidOtp'));
    } finally {
      setCLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  // ── Staff (Rep/Admin/Field/Manager) handlers — unchanged central OTP flow ──
  // ─────────────────────────────────────────────

  async function handleStaffSendOtp() {
    if (!staffValue.trim()) {
      Alert.alert(tr('common.error'), staffMethod === "phone" ? tr('auth.errEnterPhone') : tr('auth.errEnterEmail'));
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/auth/send-otp`, {
        type: staffMethod,
        value: staffValue.trim(),
      });
      setStaffStep("otp");
    } catch (err: any) {
      Alert.alert(tr('common.error'), err?.response?.data?.detail ?? tr('auth.errSendOtpFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleStaffVerifyOtp() {
    if (!staffOtp.trim()) { Alert.alert(tr('common.error'), tr('auth.errEnterOtp')); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        value: staffValue.trim(),
        otp:   staffOtp.trim(),
      });
      const u = data.user;
      const role = u.role as string;

      const hasProfile = !!(
        u.fullName &&
        u.fullName.trim() &&
        !u.fullName.startsWith("otp-") &&
        !u.email?.startsWith("otp-")
      );
      const realEmail = u.email && !u.email.startsWith("otp-") ? u.email : "";
      const realMobile = u.mobile && !u.mobile.startsWith("otp-")
        ? u.mobile
        : (staffMethod === "phone" ? staffValue.trim().replace(/\D/g, "") : "");

      setAuth(data.accessToken, {
        id:     u._id || u.id,
        name:   u.fullName || u.name || u.full_name || realEmail,
        email:  u.email,
        mobile: realMobile,
        role,
      });
      useAuthStore.getState().setProfileComplete(hasProfile);

      if (role === "CITIZEN") {
        // A citizen landing here (e.g. an old bookmark) still goes through
        // the normal profile-completion path — representative/constituency
        // not yet resolved, exactly like before.
        if (!hasProfile) {
          router.replace(`/citizen/edit-profile?required=1` as any);
        } else {
          router.replace(`/citizen/edit-profile?postLogin=1` as any);
        }
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

  function handleBack() {
    if (flowMode === "staff") {
      if (staffStep === "otp") { setStaffStep("input"); setStaffOtp(""); return; }
      if (router.canGoBack?.()) router.back();
      return;
    }
    switch (cStep) {
      case "otp":           setCStep("contact"); setCOtp(""); setCError(null); return;
      case "contact":       setCStep("confirm"); setCError(null); return;
      case "confirm":       setCStep("constituency"); setCError(null); return;
      case "constituency":  setCStep("category"); setCRepType(null); setCOptions([]); setCFilter(""); setCError(null); return;
      case "category":
      default:
        if (router.canGoBack?.()) router.back();
    }
  }

  const filteredCOptions = cOptions.filter((o) =>
    !cFilter.trim() || o.label.toLowerCase().includes(cFilter.trim().toLowerCase())
  );

  const heading = (() => {
    if (flowMode === "staff") {
      return staffStep === "input"
        ? { title: tr('auth.welcomeHeading'), sub: tr('auth.welcomeSubtitle') }
        : { title: tr('auth.enterOtp'), sub: `${tr('auth.otpSent')} ${staffValue}. ${tr('auth.enterItBelow')}` };
    }
    switch (cStep) {
      case "category":
        return { title: tr('auth.welcomeHeading'), sub: "Who do you want to reach — your Councillor, MLA, or MP?" };
      case "constituency":
        return {
          title: cRepType === "MLA" ? "Select your Assembly Constituency"
               : cRepType === "MP"  ? "Select your Parliamentary Constituency"
               : "Select your Ward",
          sub: "This tells us which representative's office you belong to.",
        };
      case "confirm":
        return { title: "Is this your representative?", sub: "Confirm before we send you a one-time code." };
      case "contact":
        return { title: "Verify it's you", sub: "We'll text or email a one-time code to sign you in." };
      case "otp":
      default:
        return { title: tr('auth.enterOtp'), sub: `${tr('auth.otpSent')} ${cContact}. ${tr('auth.enterItBelow')}` };
    }
  })();

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

        {/* Back arrow — always visible; steps back within the current wizard, or out of the screen entirely */}
        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={s.welcome}>{heading.title}</Text>
        <Text style={s.sub}>{heading.sub}</Text>

        {/* ══════════════ CITIZEN WIZARD ══════════════ */}
        {flowMode === "citizen" && (
          <>
            {cError && (
              <View style={s.errorBox}><Text style={s.errorText}>{cError}</Text></View>
            )}

            {cStep === "category" && (
              <>
                <View style={s.categoryRow}>
                  {REP_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={s.categoryCard}
                      onPress={() => pickCategory(cat.key)}
                      activeOpacity={0.8}
                      disabled={cLoading}
                    >
                      <Text style={s.categoryIcon}>{cat.icon}</Text>
                      <Text style={s.categoryLabel}>{tr(cat.labelKey)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {cLoading && <ActivityIndicator color="#1D4ED8" style={{ marginTop: 4, marginBottom: 20 }} />}
              </>
            )}

            {cStep === "constituency" && (
              <>
                <TextInput
                  style={s.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  value={cFilter}
                  onChangeText={setCFilter}
                />
                {cLoading ? (
                  <ActivityIndicator color="#1D4ED8" style={{ marginTop: 16 }} />
                ) : filteredCOptions.length === 0 ? (
                  <Text style={s.emptyText}>No {cRepType} registered yet for any constituency.</Text>
                ) : (
                  filteredCOptions.map((opt, i) => (
                    <TouchableOpacity key={i} style={s.listRow} onPress={() => pickConstituency(opt)}>
                      <Text style={s.listRowLabel}>{opt.label}</Text>
                      <Text style={s.listRowSub}>{opt.rep_name}{opt.district ? ` · ${opt.district}` : ""}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {cStep === "confirm" && cResolved && (
              <>
                <View style={s.confirmCard}>
                  <Text style={s.confirmName}>{cResolved.name}</Text>
                  <Text style={s.confirmMeta}>{cResolved.rep_type} · {cChosen?.label}</Text>
                  {cResolved.district ? <Text style={s.confirmMeta}>{cResolved.district}, {cResolved.state}</Text> : null}
                </View>
                <TouchableOpacity style={s.btnPrimary} onPress={() => setCStep("contact")}>
                  <Text style={s.btnPrimaryText}>Yes, continue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.resendBtn} onPress={() => setCStep("constituency")}>
                  <Text style={s.resendText}>Choose a different one</Text>
                </TouchableOpacity>
              </>
            )}

            {cStep === "contact" && (
              <>
                <View style={s.toggleRow}>
                  <TouchableOpacity
                    style={[s.toggleBtn, cMethod === "phone" && s.toggleActive]}
                    onPress={() => { setCMethod("phone"); setCContact(""); }}
                  >
                    <Text style={[s.toggleText, cMethod === "phone" && s.toggleTextActive]}>
                      📱 {tr('auth.phone')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.toggleBtn, cMethod === "email" && s.toggleActive]}
                    onPress={() => { setCMethod("email"); setCContact(""); }}
                  >
                    <Text style={[s.toggleText, cMethod === "email" && s.toggleTextActive]}>
                      ✉️ {tr('auth.email')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.label}>
                  {cMethod === "phone" ? tr('auth.phoneNumber') : tr('auth.emailAddress')}
                </Text>
                <View style={s.inputRow}>
                  {cMethod === "phone" && (
                    <View style={s.countryCodeBox}>
                      <Text style={s.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                  )}
                  {cMethod === "email" && <Text style={s.inputIcon}>✉️</Text>}
                  <TextInput
                    style={s.input}
                    placeholder={cMethod === "phone" ? "98765 43210" : "you@example.com"}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={cMethod === "phone" ? "phone-pad" : "email-address"}
                    autoCapitalize="none"
                    value={cContact}
                    onChangeText={setCContact}
                  />
                  {cMethod === "phone" && cContact.replace(/\D/g, "").length === 10 && (
                    <Text style={s.checkIcon}>✅</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, cLoading && s.btnDisabled]}
                  onPress={sendCitizenOtp}
                  disabled={cLoading}
                >
                  {cLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>{tr('auth.sendOtp')}</Text>}
                </TouchableOpacity>

                <View style={s.verifiedRow}>
                  <Text style={s.verifiedIcon}>🛡️</Text>
                  <Text style={s.verifiedText}>{tr('auth.verifiedByConstituency')}</Text>
                </View>
              </>
            )}

            {cStep === "otp" && (
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
                    value={cOtp}
                    onChangeText={setCOtp}
                  />
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, cLoading && s.btnDisabled]}
                  onPress={verifyCitizenOtp}
                  disabled={cLoading}
                >
                  {cLoading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>{tr('auth.signInBtn')}</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={s.resendBtn} onPress={sendCitizenOtp} disabled={cLoading}>
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

            <TouchableOpacity onPress={() => setFlowMode("staff")} style={s.modeSwitch}>
              <Text style={s.modeSwitchText}>
                Representative, Admin, or Staff? <Text style={s.modeSwitchLink}>Sign in here</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══════════════ STAFF SIGN-IN (unchanged central OTP) ══════════════ */}
        {flowMode === "staff" && (
          <>
            {staffStep === "input" && (
              <>
                <View style={s.toggleRow}>
                  <TouchableOpacity
                    style={[s.toggleBtn, staffMethod === "phone" && s.toggleActive]}
                    onPress={() => { setStaffMethod("phone"); setStaffValue(""); }}
                  >
                    <Text style={[s.toggleText, staffMethod === "phone" && s.toggleTextActive]}>
                      📱 {tr('auth.phone')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.toggleBtn, staffMethod === "email" && s.toggleActive]}
                    onPress={() => { setStaffMethod("email"); setStaffValue(""); }}
                  >
                    <Text style={[s.toggleText, staffMethod === "email" && s.toggleTextActive]}>
                      ✉️ {tr('auth.email')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.label}>
                  {staffMethod === "phone" ? tr('auth.phoneNumber') : tr('auth.emailAddress')}
                </Text>
                <View style={s.inputRow}>
                  {staffMethod === "phone" && (
                    <View style={s.countryCodeBox}>
                      <Text style={s.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                  )}
                  {staffMethod === "email" && <Text style={s.inputIcon}>✉️</Text>}
                  <TextInput
                    style={s.input}
                    placeholder={staffMethod === "phone" ? "98765 43210" : "you@example.com"}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={staffMethod === "phone" ? "phone-pad" : "email-address"}
                    autoCapitalize="none"
                    value={staffValue}
                    onChangeText={setStaffValue}
                  />
                  {staffMethod === "phone" && staffValue.replace(/\D/g, "").length === 10 && (
                    <Text style={s.checkIcon}>✅</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, loading && s.btnDisabled]}
                  onPress={handleStaffSendOtp}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>{tr('auth.sendOtp')}</Text>}
                </TouchableOpacity>
              </>
            )}

            {staffStep === "otp" && (
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
                    value={staffOtp}
                    onChangeText={setStaffOtp}
                  />
                </View>

                <TouchableOpacity
                  style={[s.btnPrimary, loading && s.btnDisabled]}
                  onPress={handleStaffVerifyOtp}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>{tr('auth.signInBtn')}</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={s.resendBtn} onPress={handleStaffSendOtp} disabled={loading}>
                  <Text style={s.resendText}>{tr('auth.resendOtp')}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={() => setFlowMode("citizen")} style={s.modeSwitch}>
              <Text style={s.modeSwitchText}>
                Citizen? <Text style={s.modeSwitchLink}>Sign in here</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}

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

  categoryRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  categoryCard: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC",
  },
  categoryCardActive: { borderColor: "#1D4ED8", backgroundColor: "#EEF2FF" },
  categoryIcon:        { fontSize: 20 },
  categoryLabel:        { fontSize: 12, fontWeight: "700", color: "#64748B" },
  categoryLabelActive:  { color: "#1D4ED8" },

  errorBox: { backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#FECACA" },
  errorText: { color: "#EF4444", fontSize: 13 },

  searchInput: { backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12, color: "#0F172A" },
  emptyText: { color: "#64748B", fontSize: 13, textAlign: "center", marginTop: 24 },
  listRow: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#E2E8F0" },
  listRowLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  listRowSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

  confirmCard: { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center" },
  confirmName: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  confirmMeta: { fontSize: 13, color: "#64748B" },

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

  footer:     { flexDirection: "row", justifyContent: "center", marginTop: 8, paddingTop: 16 },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#1D4ED8", fontSize: 14, fontWeight: "700" },

  modeSwitch:     { alignItems: "center", paddingVertical: 10, marginTop: 12 },
  modeSwitchText: { color: "#64748B", fontSize: 12.5 },
  modeSwitchLink: { color: "#1D4ED8", fontWeight: "700" },

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
