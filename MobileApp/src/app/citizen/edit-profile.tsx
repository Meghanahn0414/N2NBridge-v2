import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert, Platform, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { API_BASE } from "../../config";
import { useT } from "../../i18n/useT";

const toAbsoluteUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}/${url}`;
};

const C = {
  primary:     "#1D4ED8",
  primaryMid:  "#2563EB",
  primaryDark: "#1E3A8A",
  accent:      "#3B82F6",
  bg:          "#F0F4FF",
  card:        "#FFFFFF",
  text:        "#1E293B",
  muted:       "#64748B",
  border:      "#E2E8F0",
  inputBg:     "#F8FAFC",
};

type FieldConfig = {
  key: keyof typeof INITIAL_FORM;
  labelKey: string;
  icon: string;
  placeholderKey: string;
  keyboard?: "default" | "email-address" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
  required?: boolean;
};

const INITIAL_FORM = {
  fullName: "",
  email:    "",
  mobile:   "",
  age:      "",
  address:  "",
  wardId:   "",
};

const PERSONAL_FIELDS: FieldConfig[] = [
  { key: "fullName", labelKey: "profile.fullName",  icon: "person-outline",    placeholderKey: "profile.enterFullName",   required: true },
  { key: "email",    labelKey: "profile.email",      icon: "mail-outline",       placeholderKey: "profile.enterEmail",      keyboard: "email-address", autoCapitalize: "none" },
  { key: "mobile",   labelKey: "profile.phone",      icon: "call-outline",       placeholderKey: "profile.enterPhone",      keyboard: "phone-pad" },
  { key: "age",      labelKey: "profile.age",        icon: "calendar-outline",   placeholderKey: "profile.enterAge",        keyboard: "number-pad" },
];

const ADDRESS_FIELDS: FieldConfig[] = [
  { key: "address",  labelKey: "profile.address",    icon: "location-outline",   placeholderKey: "profile.enterAddress",   multiline: true },
  { key: "wardId",   labelKey: "profile.wardNumber", icon: "business-outline",   placeholderKey: "profile.wardNumber",     keyboard: "number-pad" },
];

export default function EditProfileScreen() {
  const tr = useT();
  const router      = useRouter();
  const params      = useLocalSearchParams<{ required?: string }>();
  const isRequired  = params.required === "1";
  const { user, setProfileComplete, updateUser } = useAuthStore();
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUri,       setPhotoUri]       = useState<string | null>(null);
  const [focusedField,   setFocusedField]   = useState<string | null>(null);
  const [form,           setForm]           = useState(INITIAL_FORM);

  useEffect(() => {
    if (!user?.id) {
      setForm((f) => ({ ...f, fullName: user?.name || "", email: user?.email || "" }));
      setLoading(false);
      return;
    }
    api.get(`/api/users/${user.id}`)
      .then(({ data }) => {
        const p = data?.data ?? data;
        setPhotoUri(toAbsoluteUrl(p.profileImage || p.profilePhoto || p.avatar));
        const realEmail = (e: string | null | undefined) =>
          e && !e.startsWith("otp-") ? e : "";
        setForm({
          fullName: p.fullName || p.name || user.name || "",
          email:    realEmail(p.email) || realEmail(user.email) || "",
          mobile:   p.mobile || p.phone || "",
          age:      p.age != null ? String(p.age) : "",
          address:  p.address || "",
          wardId:   p.wardId != null ? String(p.wardId) : "",
        });
      })
      .catch(() => {
        const realEmail = (e: string | null | undefined) =>
          e && !e.startsWith("otp-") ? e : "";
        setForm({
          fullName: user?.name || "",
          email:    realEmail(user?.email) || "",
          mobile:   "",
          age:      "",
          address:  "",
          wardId:   "",
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const showMsg = (title: string, msg: string, onOk?: () => void) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.alert(`${title}: ${msg}`);
      onOk?.();
    } else {
      Alert.alert(title, msg, onOk ? [{ text: "OK", onPress: onOk }] : [{ text: "OK" }]);
    }
  };

  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showMsg("Permission denied", "Allow photo access in your device settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const localUri = result.assets[0].uri;
    setPhotoUri(localUri);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      if (Platform.OS === "web") {
        const res  = await fetch(localUri);
        const blob = await res.blob();
        fd.append("file", new File([blob], "profile.jpg", { type: "image/jpeg" }));
      } else {
        fd.append("file", { uri: localUri, name: "profile.jpg", type: "image/jpeg" } as any);
      }
      const { data } = await api.post(`/api/users/${user?.id}/upload-profile-photo`, fd);
      const rawUri = data?.profileImage || data?.data?.profileImage || data?.profilePhoto || data?.avatar;
      if (rawUri) setPhotoUri(toAbsoluteUrl(rawUri));
    } catch {
      showMsg("Upload failed", "Could not upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      showMsg("Required", "Full name is required");
      return;
    }
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
      showMsg("Invalid", "Please enter a valid email address");
      return;
    }
    setSaving(true);
    const body: Record<string, any> = { fullName: form.fullName.trim() };
    if (form.email.trim())   body.email   = form.email.trim();
    if (form.mobile.trim())  body.mobile  = form.mobile.trim();
    if (form.age.trim())     body.age     = Number(form.age.trim());
    if (form.address.trim()) body.address = form.address.trim();
    if (form.wardId.trim())  body.wardId  = form.wardId.trim();
    try {
      await api.put(`/api/users/${user?.id}`, body).catch(async (e) => {
        if (e?.response?.status === 405) return api.patch(`/api/users/${user?.id}`, body);
        throw e;
      });
      setProfileComplete(true);
      if (form.fullName.trim()) updateUser({ name: form.fullName.trim() });
      if (isRequired) {
        router.replace("/citizen/" as any);
      } else {
        showMsg("Success", "Profile updated successfully!", () => router.back());
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
        : typeof detail === "string" ? detail
        : err?.message || "Failed to update profile. Please try again.";
      showMsg("Error", String(msg));
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.fullName || user?.name || "C")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const renderField = (f: FieldConfig) => {
    const isFocused = focusedField === f.key;
    const value = form[f.key];
    return (
      <View key={f.key} style={[s.fieldRow, isFocused && s.fieldRowFocused]}>
        <View style={[s.fieldIconWrap, isFocused && s.fieldIconWrapFocused]}>
          <Ionicons
            name={f.icon as any}
            size={18}
            color={isFocused ? C.primary : C.muted}
          />
        </View>
        <View style={s.fieldInputWrap}>
          <Text style={[s.fieldLabel, isFocused && s.fieldLabelFocused]}>
            {tr(f.labelKey as any)}{f.required ? " *" : ""}
          </Text>
          <TextInput
            style={[s.input, f.multiline && s.inputMulti]}
            value={value}
            onChangeText={(v) =>
              setField(f.key, (f.key === "wardId" || f.key === "age") ? v.replace(/[^0-9]/g, "") : v)
            }
            placeholder={tr(f.placeholderKey as any)}
            placeholderTextColor="#CBD5E1"
            keyboardType={f.keyboard ?? "default"}
            autoCapitalize={f.autoCapitalize ?? "sentences"}
            multiline={f.multiline}
            numberOfLines={f.multiline ? 3 : 1}
            textAlignVertical={f.multiline ? "top" : "center"}
            onFocus={() => setFocusedField(f.key)}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>{tr('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} bounces>

          {/* ── Gradient banner ── */}
          <View style={s.banner}>
            {!isRequired && (
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <View style={s.bannerTextWrap}>
              <Text style={s.bannerTitle}>
                {isRequired ? tr('profile.completeProfile') : tr('profile.editProfile')}
              </Text>
              <Text style={s.bannerSub}>
                {isRequired ? tr('profile.fillDetails') : tr('profile.updateInfo')}
              </Text>
            </View>

            {isRequired && (
              <View style={s.stepDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[s.dot, i === 0 && s.dotActive]} />
                ))}
              </View>
            )}
          </View>

          {/* ── Avatar (overlaps banner) ── */}
          <View style={s.avatarArea}>
            <TouchableOpacity
              style={s.avatarOuter}
              onPress={handlePhotoUpload}
              disabled={uploadingPhoto}
              activeOpacity={0.85}
            >
              {uploadingPhoto ? (
                <View style={s.avatarCircle}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarCircle}>
                  <Text style={s.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={s.cameraBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={s.photoHint}>
              {uploadingPhoto ? tr('profile.uploading') : tr('profile.tapToChangePhoto')}
            </Text>
          </View>

          {/* ── Personal Information card ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>{tr('profile.personalInfo')}</Text>
            </View>
            <View style={s.card}>
              {PERSONAL_FIELDS.map((f, i) => (
                <View key={f.key}>
                  {renderField(f)}
                  {i < PERSONAL_FIELDS.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>

          {/* ── Address & Ward card ── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>{tr('profile.addressWard')}</Text>
            </View>
            <View style={s.card}>
              {ADDRESS_FIELDS.map((f, i) => (
                <View key={f.key}>
                  {renderField(f)}
                  {i < ADDRESS_FIELDS.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>

          {/* ── Save button ── */}
          <View style={s.savePad}>
            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons
                    name={isRequired ? "arrow-forward-circle-outline" : "checkmark-circle-outline"}
                    size={22}
                    color="#fff"
                  />
                  <Text style={s.saveBtnText}>
                    {isRequired ? tr('profile.saveContinue') : tr('profile.saveChanges')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </View>
  );
}

const BANNER_H = 180;
const AVATAR_SIZE = 96;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: C.muted, fontSize: 14 },

  banner: {
    height: BANNER_H,
    backgroundColor: C.primaryDark,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 48,
    position: "relative",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  bannerTextWrap: { },
  bannerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
  bannerSub:   { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  stepDots: {
    flexDirection: "row", gap: 6,
    position: "absolute", bottom: 20, left: 20,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#fff",
  },

  avatarArea: {
    alignItems: "center",
    marginTop: -(AVATAR_SIZE / 2 + 4),
    marginBottom: 8,
    zIndex: 10,
  },
  avatarOuter: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: C.primaryMid,
    alignItems: "center", justifyContent: "center",
  },
  avatarImg: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitials: { color: "#fff", fontSize: 32, fontWeight: "800" },
  cameraBadge: {
    position: "absolute", bottom: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.bg,
    elevation: 3,
  },
  photoHint: { marginTop: 8, fontSize: 12, color: C.muted, fontWeight: "500" },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionDot: {
    width: 4, height: 18, borderRadius: 2,
    backgroundColor: C.primary,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.text, letterSpacing: 0.3 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#94A3B8",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 58 },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    transition: "background-color 0.2s",
  } as any,
  fieldRowFocused: {
    backgroundColor: "#F8FBFF",
  },
  fieldIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
    marginTop: 14,
  },
  fieldIconWrapFocused: {
    backgroundColor: "#DBEAFE",
  },
  fieldInputWrap: { flex: 1 },
  fieldLabel: {
    fontSize: 11, fontWeight: "600",
    color: C.muted, marginBottom: 4,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  fieldLabelFocused: { color: C.primary },
  input: {
    fontSize: 15, color: C.text,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
    backgroundColor: "transparent",
  },
  inputMulti: { minHeight: 60, paddingTop: 4 },

  savePad: { paddingHorizontal: 16, marginTop: 28 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: C.primary,
    paddingVertical: 16, borderRadius: 16,
    elevation: 4,
    shadowColor: C.primary, shadowOpacity: 0.4,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});
