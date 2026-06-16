import { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const CATEGORIES = ["Infrastructure", "Health", "Education", "Water Supply", "Electricity", "Sanitation", "Other"];

export default function NewComplaint() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in title and description");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/grievances/", {
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim() || undefined,
        citizenId: user?.id,
        citizenName: user?.name,
      });
      Alert.alert("Success", "Your complaint has been submitted!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "Failed to submit complaint";
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Complaint</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief title of the issue"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe the issue in detail..."
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Area / street / landmark"
          placeholderTextColor="#9CA3AF"
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16, backgroundColor: "#1D4ED8",
  },
  backBtn: { width: 60 },
  backText: { color: "#BFDBFE", fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  form: { flex: 1, padding: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#111827", backgroundColor: "#fff",
  },
  textarea: { height: 120, textAlignVertical: "top" },
  categoryRow: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F3F4F6", marginRight: 8, borderWidth: 1, borderColor: "#E5E7EB",
  },
  catChipActive: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
  catText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  catTextActive: { color: "#fff" },
  submitBtn: {
    backgroundColor: "#1D4ED8", borderRadius: 12,
    paddingVertical: 15, alignItems: "center", marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
