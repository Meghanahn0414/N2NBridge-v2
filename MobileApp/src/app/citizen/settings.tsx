import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, StatusBar, Platform, Alert, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { changeLanguage, getCurrentLanguage, initLanguage, clearTranslationCache } from "../../i18n";
import { useT } from "../../i18n/useT";

const C = {
  primary:     "#2B5BD7",
  primaryDark: "#1B3C8F",
  bg:          "#F3F5FA",
  card:        "#FFFFFF",
  text:        "#16233C",
  ink:         "#16233C",
  muted:       "#5A6678",
  mutedLight:  "#9AA3B5",
  border:      "#EDF0F6",
};

export default function SettingsScreen() {
  const tr = useT();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [notif, setNotif] = useState({
    statusUpdates: true,
    announcements: true,
    polls: false,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en'|'kn'|'hi'|'te'>(getCurrentLanguage());
  const [lang, setLang] = useState<'en'|'kn'|'hi'|'te'>(getCurrentLanguage());
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    initLanguage().then(() => {
      setCurrentLang(getCurrentLanguage());
      setLang(getCurrentLanguage());
    });
  }, []);

  const handleLanguageChange = async (l: 'en' | 'kn' | 'hi' | 'te') => {
    if (l === currentLang) return;
    setTranslating(true);
    try {
      await changeLanguage(l);
      setCurrentLang(l);
      setLang(l);
    } finally {
      setTranslating(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      // @ts-ignore
      const ok = typeof window !== "undefined" && window.confirm("Sign out of Jana Seva CRM?");
      if (ok) { logout(); router.replace("/" as any); }
    } else {
      setShowConfirm(true);
    }
  };

  const confirmSignOut = () => {
    setShowConfirm(false);
    logout();
    router.replace("/" as any);
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr("settings.title")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Notifications */}
        <View style={s.card}>
          <Text style={s.groupLabel}>{tr('settings.notifications')}</Text>

          <View style={s.toggleRow}>
            <View style={s.toggleLeft}>
              <View style={s.iconBox}>
                <Ionicons name="refresh-outline" size={17} color={C.primary} />
              </View>
              <Text style={s.toggleText}>{tr('settings.statusUpdates')}</Text>
            </View>
            <Switch
              value={notif.statusUpdates}
              onValueChange={(v) => setNotif((n) => ({ ...n, statusUpdates: v }))}
              trackColor={{ false: "#EDF0F6", true: "#93B5F5" }}
              thumbColor={notif.statusUpdates ? C.primary : "#C2CADA"}
            />
          </View>

          <View style={s.toggleRow}>
            <View style={s.toggleLeft}>
              <View style={s.iconBox}>
                <Ionicons name="megaphone-outline" size={17} color={C.primary} />
              </View>
              <Text style={s.toggleText}>{tr('settings.localAnnouncements')}</Text>
            </View>
            <Switch
              value={notif.announcements}
              onValueChange={(v) => setNotif((n) => ({ ...n, announcements: v }))}
              trackColor={{ false: "#EDF0F6", true: "#93B5F5" }}
              thumbColor={notif.announcements ? C.primary : "#C2CADA"}
            />
          </View>

          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={s.toggleLeft}>
              <View style={s.iconBox}>
                <Ionicons name="bar-chart-outline" size={17} color={C.primary} />
              </View>
              <Text style={s.toggleText}>{tr('settings.pollsSurveys')}</Text>
            </View>
            <Switch
              value={notif.polls}
              onValueChange={(v) => setNotif((n) => ({ ...n, polls: v }))}
              trackColor={{ false: "#EDF0F6", true: "#93B5F5" }}
              thumbColor={notif.polls ? C.primary : "#C2CADA"}
            />
          </View>
        </View>

        {/* Language */}
        <View style={s.card}>
          <Text style={s.groupLabel}>{tr('settings.language')}</Text>
          <View style={s.langGrid}>
            {([
              { code: 'en', native: 'English',  label: 'English' },
              { code: 'kn', native: 'ಕನ್ನಡ',    label: 'Kannada' },
              { code: 'hi', native: 'हिंदी',     label: 'Hindi'   },
              { code: 'te', native: 'తెలుగు',   label: 'Telugu'  },
            ] as const).map(({ code, native, label }) => (
              <TouchableOpacity
                key={code}
                style={[s.langCard, currentLang === code && s.langCardActive]}
                onPress={() => handleLanguageChange(code)}
                activeOpacity={0.75}
              >
                <Text style={[s.langNative, currentLang === code && s.langNativeActive]}>
                  {native}
                </Text>
                <Text style={[s.langLabel, currentLang === code && s.langLabelActive]}>
                  {label}
                </Text>
                {currentLang === code && (
                  <View style={s.langCheck}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 4 }} />
        </View>

        {/* Account */}
        <View style={s.card}>
          <Text style={s.groupLabel}>{tr('settings.account')}</Text>

          <TouchableOpacity
            style={s.menuRow}
            onPress={() => router.push("/citizen/edit-profile" as any)}
          >
            <View style={s.iconBox}>
              <Ionicons name="person-outline" size={17} color={C.primary} />
            </View>
            <Text style={s.menuText}>{tr('settings.editProfile')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuRow}
            onPress={() => router.push("/citizen/edit-profile" as any)}
          >
            <View style={s.iconBox}>
              <Ionicons name="location-outline" size={17} color={C.primary} />
            </View>
            <Text style={s.menuText}>{tr('settings.addressWard')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              if (Platform.OS === "web") {
                if (typeof window !== "undefined")
                  window.alert("Your data is encrypted and never shared with third parties.");
              } else {
                Alert.alert(
                  "Privacy & Data",
                  "Your personal data is encrypted and stored securely. It is never shared with third parties without your consent.",
                  [{ text: "OK" }]
                );
              }
            }}
          >
            <View style={s.iconBox}>
              <Ionicons name="lock-closed-outline" size={17} color={C.primary} />
            </View>
            <Text style={s.menuText}>{tr('settings.privacyData')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutRow} onPress={handleSignOut}>
          <View style={[s.iconBox, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="log-out-outline" size={17} color="#EF4444" />
          </View>
          <Text style={s.signOutText}>{tr('settings.signOut')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>Jana Seva CRM v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Translation loading overlay */}
      {translating && (
        <View style={s.overlay}>
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>Translating…</Text>
          </View>
        </View>
      )}

      {/* Native confirm dialog (non-web only) */}
      {showConfirm && (
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>{tr('settings.signOut')}</Text>
            <Text style={s.dialogMsg}>{tr('settings.signOutConfirm')}</Text>
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={() => setShowConfirm(false)}>
                <Text style={s.dialogCancelText}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dialogConfirm} onPress={confirmSignOut}>
                <Text style={s.dialogConfirmText}>{tr('settings.signOut')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.primaryDark,
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },

  card: {
    backgroundColor: C.card,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  groupLabel: {
    fontSize: 11, fontWeight: "700", color: C.mutedLight,
    letterSpacing: 0.7, textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },

  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleText: { fontSize: 14, color: C.text, fontWeight: "500" },

  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center",
  },

  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  menuText:  { flex: 1, fontSize: 14, fontWeight: "500", color: C.text },
  menuRight: { fontSize: 13, color: C.muted, marginRight: 4 },

  signOutRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1, borderColor: "#FECACA",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  signOutText: { fontSize: 14, fontWeight: "600", color: "#C8453A", flex: 1 },
  version:     { textAlign: "center", color: C.mutedLight, fontSize: 12, marginTop: 24 },

  langGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12, gap: 10,
  },
  langCard: {
    width: "47%", paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: "#F8FAFD",
    alignItems: "center",
    position: "relative",
  },
  langCardActive:   { borderColor: C.primary, backgroundColor: "#EEF4FF" },
  langNative:       { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 4 },
  langNativeActive: { color: C.primary },
  langLabel:        { fontSize: 11, color: C.muted, fontWeight: "500" },
  langLabelActive:  { color: C.primary },
  langCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
  },

  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    gap: 16,
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  loadingText: { fontSize: 15, fontWeight: "600", color: C.ink },

  /* Inline confirm dialog */
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center",
    zIndex: 999,
  },
  dialog: {
    backgroundColor: C.card, borderRadius: 20,
    padding: 24, marginHorizontal: 32, width: "85%",
  },
  dialogTitle: { fontSize: 18, fontWeight: "700", color: C.ink, marginBottom: 8 },
  dialogMsg: { fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 20 },
  dialogBtns: { flexDirection: "row", gap: 12 },
  dialogCancel: {
    flex: 1, borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
  },
  dialogCancelText: { color: C.text, fontWeight: "600", fontSize: 15 },
  dialogConfirm: {
    flex: 1, backgroundColor: "#EF4444",
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
  },
  dialogConfirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
