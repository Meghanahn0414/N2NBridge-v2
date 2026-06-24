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
  primary: "#1D4ED8",
  primaryDark: "#1E3A8A",
  bg: "#F0F4FF",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  border: "#F1F5F9",
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
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr('settings.title')}</Text>
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
              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
              thumbColor={notif.statusUpdates ? C.primary : "#CBD5E1"}
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
              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
              thumbColor={notif.announcements ? C.primary : "#CBD5E1"}
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
              trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
              thumbColor={notif.polls ? C.primary : "#CBD5E1"}
            />
          </View>
        </View>

        {/* Language */}
        <View style={s.card}>
          <Text style={s.groupLabel}>{tr('settings.language')}</Text>
          <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={s.toggleLeft}>
              <View style={s.iconBox}>
                <Ionicons name="language-outline" size={17} color={C.primary} />
              </View>
              <Text style={s.toggleText}>{tr('language.selectLanguage')}</Text>
            </View>
            <View style={s.langBtns}>
              {([
                { code: 'en', label: 'EN' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'te', label: 'తెలుగు' },
              ] as const).map(({ code, label }) => (
                <TouchableOpacity
                  key={code}
                  style={[s.langBtn, currentLang === code && s.langBtnActive]}
                  onPress={() => handleLanguageChange(code)}
                >
                  <Text style={[s.langBtnText, currentLang === code && s.langBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card,
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.text },

  card: {
    backgroundColor: C.card,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
  },
  groupLabel: {
    fontSize: 11, fontWeight: "700", color: C.muted,
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },

  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleText: { fontSize: 14, color: C.text, fontWeight: "500" },

  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
  },

  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 12,
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: "500", color: C.text },
  menuRight: { fontSize: 13, color: C.muted, marginRight: 4 },

  signOutRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, marginHorizontal: 16, marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: 16,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6,
  },
  signOutText: { fontSize: 14, fontWeight: "600", color: "#EF4444", flex: 1 },
  version: { textAlign: "center", color: "#CBD5E1", fontSize: 12, marginTop: 24 },

  langBtns: { flexDirection: "row", gap: 8 },
  langBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  langBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  langBtnText: { fontSize: 13, fontWeight: "600", color: C.muted },
  langBtnTextActive: { color: "#fff" },

  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 16,
    elevation: 8,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16,
  },
  loadingText: { fontSize: 15, fontWeight: "600", color: "#1E293B" },

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
  dialogTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 8 },
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
