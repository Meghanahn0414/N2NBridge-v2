import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, Platform,
  type KeyboardTypeOptions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { useRouter } from "expo-router";

interface Profile {
  fullName?: string;
  email?: string;
  mobile?: string;
  address?: string;
  constituencyId?: string;
  wardId?: string;
  createdAt?: string;
  citizenId?: string;
  profileImage?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", mobile: "", address: "", wardId: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/users/${user.id}`);
      setProfile(data);
      setForm({
        fullName: data.fullName || "",
        email: data.email || "",
        mobile: data.mobile || "",
        address: data.address || "",
        wardId: data.wardId || "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(""); setSuccess("");
    try {
      const { data } = await api.put(`/api/users/${user.id}`, {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        address: form.address,
        wardId: form.wardId || null,
      });
      setProfile(data);
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", {
        uri: result.assets[0].uri, name: "profile.jpg", type: "image/jpeg",
      } as any);
      const { data } = await api.post(`/api/users/${user?.id}/upload-profile-photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, profileImage: data.profileImage || data.data?.profileImage }));
      setSuccess("Photo updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => { logout(); router.replace("/" as any); } },
    ]);
  };

  const joinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "-";

  const initials = (profile?.fullName || profile?.mobile || "?")[0].toUpperCase();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <View style={styles.alertRed}><Text style={styles.alertRedText}>{error}</Text></View> : null}
      {success ? <View style={styles.alertGreen}><Text style={styles.alertGreenText}>{success}</Text></View> : null}

      {/* Avatar Card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.profileName}>
              {profile?.fullName || profile?.mobile || "Citizen"}
            </Text>
            {profile?.citizenId && (
              <Text style={styles.citizenId}>ID: {profile.citizenId}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.uploadPhotoBtn, uploadingPhoto && { opacity: 0.5 }]}
            onPress={handlePhotoUpload}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.uploadPhotoBtnText}>📷 Upload</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>

        <Field label="👤 Name" isEditing={isEditing}
          value={isEditing ? form.fullName : (profile?.fullName || "Not provided")}
          onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))} />

        <Field label="✉️ Email" isEditing={isEditing}
          value={isEditing ? form.email : (profile?.email || "Not provided")}
          keyboardType="email-address"
          onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} />

        <Field label="📞 Phone Number" isEditing={isEditing}
          value={isEditing ? form.mobile : (profile?.mobile || "Not provided")}
          keyboardType="phone-pad"
          onChangeText={(v) => setForm((f) => ({ ...f, mobile: v }))} />

        <Field label="📍 Address" isEditing={isEditing} multiline
          value={isEditing ? form.address : (profile?.address || "Not provided")}
          onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />

        <ReadOnlyField label="Constituency" value={profile?.constituencyId || "Not available"} />

        {isEditing ? (
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>📍 Ward</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ward number"
              placeholderTextColor="#9CA3AF"
              value={form.wardId}
              keyboardType="number-pad"
              onChangeText={(v) => setForm((f) => ({ ...f, wardId: v }))}
            />
          </View>
        ) : (
          <ReadOnlyField label="Ward" value={profile?.wardId ? `Ward ${profile.wardId}` : "Not assigned"} />
        )}

        <ReadOnlyField label="Member Since" value={joinedDate} />
        {profile?.citizenId && <ReadOnlyField label="Citizen ID" value={profile.citizenId} mono />}

        {isEditing && (
          <View style={styles.saveCancelRow}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setIsEditing(false); setError(""); setSuccess(""); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Account Security */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Security</Text>
        <TouchableOpacity style={styles.securityBtn}>
          <Text style={styles.securityBtnText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.securityBtn, { marginTop: 10 }]}>
          <Text style={styles.securityBtnText}>Two-Factor Authentication</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Sub-components ──
function Field({ label, value, isEditing, onChangeText, keyboardType, multiline }: {
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText?: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, mono && { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" }]}>
        {value}
      </Text>
    </View>
  );
}

const PRIMARY = "#1D3A8A";
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  editBtn: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  alertRed: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 },
  alertRedText: { color: "#B91C1C", fontSize: 13 },
  alertGreen: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#DCFCE7", borderRadius: 8, padding: 12 },
  alertGreenText: { color: "#166534", fontSize: 13 },
  card: { backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: "hidden" },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#fff", fontSize: 24, fontWeight: "700" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  citizenId: { fontSize: 13, color: "#2563EB", fontWeight: "600", marginTop: 2 },
  uploadPhotoBtn: { backgroundColor: PRIMARY, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  uploadPhotoBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 16 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  fieldValue: { fontSize: 14, color: "#475569" },
  input: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 8, padding: 10, fontSize: 14, color: "#0F172A", backgroundColor: "#F8FAFC" },
  saveCancelRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { color: "#374151", fontWeight: "600", fontSize: 15 },
  securityBtn: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  securityBtnText: { color: "#374151", fontSize: 14, fontWeight: "500" },
  logoutBtn: { marginHorizontal: 16, backgroundColor: "#EF4444", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
