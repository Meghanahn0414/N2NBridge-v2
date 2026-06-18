import { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";

// TODO: Replace WEB_APP_URL with your actual web admin portal URL
const WEB_APP_URL = "https://your-web-app.com";
const ROLE_WEB_ROUTES: Record<string, string> = {
  ADMIN: "/admin",
  REPRESENTATIVE: "/mla",
  CONSTITUENCY_MANAGER: "/manager",
  FIELD_OFFICER: "/field",
};

export default function WebAppScreen() {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const role = user?.role ?? "ADMIN";
  const webRoute = ROLE_WEB_ROUTES[role] ?? "/admin";
  const fullUrl = `${WEB_APP_URL}${webRoute}`;

  // Inject auth credentials into the web app's sessionStorage on page load
  const injectedJS = `
    (function() {
      try {
        sessionStorage.setItem('token', ${JSON.stringify(token ?? "")});
        sessionStorage.setItem('role',  ${JSON.stringify(role)});
        sessionStorage.setItem('user',  ${JSON.stringify(JSON.stringify({
          id:       user?.id    ?? "",
          name:     user?.name  ?? "",
          fullName: user?.name  ?? "",
          email:    user?.email ?? "",
          role:     role,
        }))});
      } catch(e) {}
    })();
    true;
  `;

  function handleLogout() {
    Alert.alert("Sign Out", "Sign out and return to login?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: () => { logout(); router.replace("/"); },
      },
    ]);
  }

  const roleLabel: Record<string, string> = {
    ADMIN:                "Admin Portal",
    REPRESENTATIVE:       "MLA Dashboard",
    CONSTITUENCY_MANAGER: "Manager Dashboard",
    FIELD_OFFICER:        "Field Officer",
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {canGoBack && (
          <TouchableOpacity onPress={() => webviewRef.current?.goBack()} style={styles.navBtn}>
            <Text style={styles.navBtnText}>‹ Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleGroup}>
          <Text style={styles.topTitle}>{roleLabel[role] ?? "Portal"}</Text>
          <Text style={styles.topSub} numberOfLines={1}>
            {user?.name ?? ""}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load portal</Text>
          <Text style={styles.errorSub}>
            Make sure the web app is running and the URL in config.ts is correct.
            {"\n\n"}URL: {fullUrl}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(false); setLoading(true); webviewRef.current?.reload(); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri: fullUrl }}
          injectedJavaScript={injectedJS}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures={Platform.OS === "ios"}
          style={styles.webview}
        />
      )}

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading {roleLabel[role] ?? "portal"}…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1D4ED8" },
  webview: { flex: 1 },

  topBar: {
    backgroundColor: "#1D4ED8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8,
  },
  navBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  titleGroup: { flex: 1 },
  topTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  topSub: { color: "#BFDBFE", fontSize: 11, marginTop: 1 },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  loadingOverlay: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    top: 52,
  },
  loadingText: { color: "#6B7280", fontSize: 14 },

  errorBox: {
    flex: 1, backgroundColor: "#F9FAFB",
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 10 },
  errorSub: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 24, backgroundColor: "#1D4ED8",
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
