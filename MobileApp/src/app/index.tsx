import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_BASE } from "../config";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email.trim());
      form.append("password", password.trim());

      const { data } = await axios.post(`${API_BASE}/api/auth/login`, form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const u = data.user;
      setAuth(data.access_token, {
        id: u._id || u.id,
        name: u.name || u.full_name || u.email,
        email: u.email,
        role: u.role,
      });

      if (u.role === "CITIZEN") {
        router.replace("/citizen/" as any);
      } else {
        Alert.alert("Info", "Admin portal is on the web app. Citizen login only on mobile.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Login failed. Check your credentials.";
      Alert.alert("Login Failed", String(msg));
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
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>JS</Text>
        </View>
        <Text style={styles.title}>Jan Seva CRM</Text>
        <Text style={styles.subtitle}>Citizen Portal — Sign in</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#EFF6FF" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#1D4ED8", alignSelf: "center",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  logoText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "700", color: "#1E3A8A", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 28, marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#111827", marginBottom: 16, backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#1D4ED8", borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
