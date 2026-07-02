import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, StatusBar, Alert, Platform, Image, Modal, FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { API_BASE } from "../../config";
import { useT } from "../../i18n/useT";

// Photo upload goes to POST /api/citizens/me/upload-photo (tenant `citizens`
// collection) — NOT /api/users/{id}/upload-profile-photo, which is
// representative/staff-only and writes to the wrong collection, so it never
// actually saved anything for a citizen.
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
};

// Representative category — only shown/required on first-time profile
// completion (isRequired), since that's the step that resolves which
// representative's tenant database this citizen belongs to.
type RepCategory = "COUNCILLOR" | "MLA" | "MP";
const REP_CATEGORIES: { key: RepCategory; icon: string; label: string; areaLabel: string; areaPlaceholder: string }[] = [
  { key: "COUNCILLOR", icon: "people-outline",  label: "Councillor", areaLabel: "Ward",                 areaPlaceholder: "Select your ward" },
  { key: "MLA",        icon: "create-outline",  label: "MLA",        areaLabel: "Assembly Constituency", areaPlaceholder: "Select your assembly constituency" },
  { key: "MP",         icon: "business-outline",label: "MP",         areaLabel: "Parliamentary Constituency", areaPlaceholder: "Select your parliamentary constituency" },
];

// One entry per registered representative for the chosen category, as
// returned by GET /api/auth/citizen/constituencies?rep_type=... — `label`
// is shown to the citizen, `value` is the exact string that must be sent
// back (assembly_name / parliamentary_name / ward_id) so it matches the
// representative record precisely on the backend.
type ConstituencyOption = { label: string; value: string; repName?: string; district?: string };

const PERSONAL_FIELDS: FieldConfig[] = [
  { key: "fullName", labelKey: "profile.fullName",  icon: "person-outline",    placeholderKey: "profile.enterFullName",   required: true },
  { key: "email",    labelKey: "profile.email",      icon: "mail-outline",       placeholderKey: "profile.enterEmail",      keyboard: "email-address", autoCapitalize: "none", required: true },
  { key: "mobile",   labelKey: "profile.phone",      icon: "call-outline",       placeholderKey: "profile.enterPhone",      keyboard: "phone-pad", required: true },
  { key: "age",      labelKey: "profile.age",        icon: "calendar-outline",   placeholderKey: "profile.enterAge",        keyboard: "number-pad", required: true },
];

// Ward is rendered separately below (not in this array) — it's a picker
// sourced from GET /api/auth/citizen/constituencies?rep_type=COUNCILLOR
// (see wardId/wardOptions state), always available here regardless of
// whether the citizen picked Councillor as their representative type above,
// and editable on every later profile edit too (not just first-time
// completion).
const ADDRESS_FIELDS: FieldConfig[] = [
  { key: "address",  labelKey: "profile.address",    icon: "location-outline",   placeholderKey: "profile.enterAddress",   multiline: true, required: true },
];

export default function EditProfileScreen() {
  const tr = useT();
  const router      = useRouter();
  const params      = useLocalSearchParams<{ required?: string }>();
  const isRequired  = params.required === "1";
  const { user, setAuth, setProfileComplete, updateUser } = useAuthStore();
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUri,       setPhotoUri]       = useState<string | null>(null);
  // First-time completion has no tenant citizen record to upload a photo to
  // yet (it doesn't exist until complete-profile succeeds) — this holds the
  // picked-but-not-yet-uploaded file so it can go up right after.
  const [pendingPhoto,   setPendingPhoto]   = useState<{ uri: string } | null>(null);
  const [focusedField,   setFocusedField]   = useState<string | null>(null);
  const [form,           setForm]           = useState(INITIAL_FORM);
  const [repType,        setRepType]        = useState<RepCategory | null>(null);
  const [repArea,        setRepArea]        = useState("");
  const [areaOptions,    setAreaOptions]    = useState<ConstituencyOption[]>([]);
  const [areaLoading,    setAreaLoading]    = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [areaSearch,     setAreaSearch]     = useState("");

  // Standalone "Ward" field in the Address & Ward card — available to every
  // citizen (not just first-time completion via the Councillor category
  // above), since a citizen's ward can be relevant/updatable independent of
  // which representative type they picked at signup. Always sourced from
  // the actual registered Councillor wards so it can never drift from a
  // real value the way a free-text field could.
  const [wardId,          setWardId]          = useState("");
  const [wardOptions,     setWardOptions]     = useState<ConstituencyOption[]>([]);
  const [wardLoading,     setWardLoading]     = useState(false);
  const [showWardPicker,  setShowWardPicker]  = useState(false);
  const [wardSearch,      setWardSearch]      = useState("");
  // True until the citizen manually picks a ward from the list (or one was
  // already saved on their profile) — while true, typing the address keeps
  // auto-filling the ward guess; a manual pick "locks" it so further address
  // edits don't silently override an intentional choice.
  const [wardAutoFilled,  setWardAutoFilled]  = useState(true);

  useEffect(() => {
    setWardLoading(true);
    api.get(`/api/auth/citizen/constituencies`, { params: { rep_type: "COUNCILLOR" } })
      .then(({ data }) => {
        const items = (data?.data?.items ?? data?.items ?? []) as any[];
        const opts: ConstituencyOption[] = items.map((it) => ({
          label:    it.label || it.ward_name || it.ward_id || "",
          value:    it.ward_id || it.label || "",
          repName:  it.rep_name,
          district: it.district,
        })).filter((o) => o.value);
        setWardOptions(opts);
      })
      .catch(() => setWardOptions([]))
      .finally(() => setWardLoading(false));
  }, []);

  // Auto-guess the ward from the typed address, without needing real
  // geocoding (no maps/geocoding integration exists in this app). Address
  // is free text like "Madduru, Mandya" — take the last comma-separated
  // segment as the likely district ("Mandya") and match it against each
  // registered ward's district. Only auto-fills when there's exactly one
  // unambiguous match, and never overrides a ward the citizen picked
  // manually (or one already saved on their profile) — see wardAutoFilled.
  useEffect(() => {
    if (!wardAutoFilled) return;
    const parts = form.address.split(",").map((p) => p.trim()).filter(Boolean);
    const districtGuess = parts.length > 1 ? parts[parts.length - 1] : "";
    if (!districtGuess || wardOptions.length === 0) return;
    const guess = districtGuess.toLowerCase();
    const matches = wardOptions.filter((o) => {
      const d = (o.district || "").toLowerCase();
      return d && (d.includes(guess) || guess.includes(d));
    });
    if (matches.length === 1) {
      setWardId(matches[0].value);
    } else if (matches.length === 0) {
      setWardId("");
    }
    // matches.length > 1 (ambiguous): leave whatever's there, let the
    // citizen resolve it via the picker.
  }, [form.address, wardOptions, wardAutoFilled]);

  // Fetch the ACTUAL list of registered constituencies for the chosen
  // category — previously this was a free-text field, so any typo or
  // formatting difference from what the representative registered under
  // (e.g. "BTM Layout" vs "Btm layout ward") meant the citizen's profile
  // never matched their real representative. Picking from this list
  // guarantees an exact match every time.
  useEffect(() => {
    if (!repType) { setAreaOptions([]); return; }
    setAreaLoading(true);
    api.get(`/api/auth/citizen/constituencies`, { params: { rep_type: repType } })
      .then(({ data }) => {
        const items = (data?.data?.items ?? data?.items ?? []) as any[];
        const opts: ConstituencyOption[] = items.map((it) => ({
          label:    it.label || it.ward_name || it.assembly_name || it.parliamentary_name || it.ward_id || "",
          value:    it.assembly_name || it.parliamentary_name || it.ward_id || it.label || "",
          repName:  it.rep_name,
          district: it.district,
        })).filter((o) => o.value);
        setAreaOptions(opts);
      })
      .catch(() => setAreaOptions([]))
      .finally(() => setAreaLoading(false));
  }, [repType]);

  useEffect(() => {
    if (!user?.id) {
      setForm((f) => ({ ...f, fullName: user?.name || "", email: user?.email || "" }));
      setLoading(false);
      return;
    }
    if (isRequired) {
      // First-time completion: this citizen only exists as a tenant-less
      // placeholder until this form is submitted (see verify_otp_compat /
      // complete_citizen_profile), so GET /api/users/{id} is guaranteed to
      // 400 (it requires tenant db_name). Skip the doomed request and go
      // straight to the blank-form defaults.
      const realEmail = (e: string | null | undefined) =>
        e && !e.startsWith("otp-") ? e : "";
      setForm({
        fullName: user?.name || "",
        email:    realEmail(user?.email) || "",
        mobile:   "",
        age:      user?.age != null ? String(user.age) : "",
        address:  "",
      });
      setLoading(false);
      return;
    }
    setWardId("");
    // Returning citizen with an already-completed profile — this is the
    // tenant-scoped self-service endpoint (GET/PUT /api/citizens/me), not
    // /api/users/{id} (that one's representative/staff-only and 403s for a
    // citizen token).
    api.get(`/api/citizens/me`)
      .then(({ data }) => {
        const p = data?.data ?? data;
        setPhotoUri(toAbsoluteUrl(p.profileImage || p.profilePhoto || p.avatar));
        const realEmail = (e: string | null | undefined) =>
          e && !e.startsWith("otp-") ? e : "";
        setWardId(p.ward_id || "");
        setWardAutoFilled(!p.ward_id);
        setForm({
          fullName: p.name || p.fullName || user.name || "",
          email:    realEmail(p.email) || realEmail(user.email) || "",
          mobile:   p.mobile || p.phone || "",
          age:      p.age != null ? String(p.age) : "",
          address:  p.address || "",
        });
      })
      .catch(() => {
        const realEmail = (e: string | null | undefined) =>
          e && !e.startsWith("otp-") ? e : "";
        setForm({
          fullName: user?.name || "",
          email:    realEmail(user?.email) || "",
          mobile:   "",
          age:      user?.age != null ? String(user.age) : "",
          address:  "",
        });
      })
      .finally(() => setLoading(false));
  }, [user?.id, isRequired]);

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

  // Shared by both the immediate-upload path (returning citizen) and the
  // deferred path (first-time completion, called right after complete-profile
  // succeeds and the tenant token is active).
  const uploadPickedPhoto = async (localUri: string) => {
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
      const { data } = await api.post(`/api/citizens/me/upload-photo`, fd);
      const payload = data?.data ?? data;
      if (payload?.profileImage) setPhotoUri(toAbsoluteUrl(payload.profileImage));
    } catch {
      showMsg("Upload failed", "Could not upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
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

    if (isRequired) {
      // No tenant citizen record exists yet at this point — save the picked
      // file and upload it right after complete-profile succeeds below.
      setPendingPhoto({ uri: localUri });
      return;
    }
    await uploadPickedPhoto(localUri);
  };

  const handleSave = async () => {
    if (!user?.id) {
      showMsg("Session expired", "Please log in again.");
      router.replace("/" as any);
      return;
    }
    if (!form.fullName.trim()) {
      showMsg("Required", "Full name is required");
      return;
    }
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email.trim())) {
      showMsg("Invalid", "Please enter a valid email address");
      return;
    }

    // First-time completion resolves the representative and moves the
    // citizen into that representative's tenant database — a different
    // endpoint from a later plain profile edit (see complete_citizen_profile
    // in auth/routes.py for why these two paths differ).
    if (isRequired) {
      // Every field on this page is required for first-time completion.
      if (!form.email.trim())   { showMsg("Required", "Email is required"); return; }
      if (!form.mobile.trim())  { showMsg("Required", "Phone number is required"); return; }
      if (!form.age.trim())     { showMsg("Required", "Age is required"); return; }
      if (!form.address.trim()) { showMsg("Required", "Address is required"); return; }
      if (!repType) {
        showMsg("Required", "Please select Councillor, MLA, or MP");
        return;
      }
      if (!repArea.trim()) {
        const cat = REP_CATEGORIES.find((c) => c.key === repType)!;
        showMsg("Required", `${cat.areaLabel} is required`);
        return;
      }
      setSaving(true);
      try {
        const body: Record<string, any> = {
          fullName: form.fullName.trim(),
          email:    form.email.trim(),
          mobile:   form.mobile.trim(),
          age:      Number(form.age.trim()),
          address:  form.address.trim(),
          rep_type: repType,
        };
        if (repType === "MLA")        body.assembly_name      = repArea.trim();
        if (repType === "MP")         body.parliamentary_name = repArea.trim();
        if (repType === "COUNCILLOR") body.ward_id            = repArea.trim();
        // Standalone Ward field (Address & Ward card) — only fall back to it
        // when the Councillor picker above didn't already set ward_id, so
        // the two never fight over which value wins.
        if (!body.ward_id && wardId.trim()) body.ward_id = wardId.trim();

        const { data } = await api.post("/api/auth/citizen/complete-profile", body);
        const payload = data?.data ?? data;
        const newUser = payload.user ?? {};

        setAuth(payload.accessToken, {
          id:    newUser.id ?? user.id,
          name:  newUser.fullName || form.fullName.trim(),
          email: newUser.email || form.email.trim(),
          role:  "CITIZEN",
          repType,
        });
        setProfileComplete(true);

        // The tenant citizen record now exists (and the store has the new
        // tenant-scoped token) — safe to upload the photo picked earlier.
        if (pendingPhoto) {
          await uploadPickedPhoto(pendingPhoto.uri);
          setPendingPhoto(null);
        }

        router.replace("/citizen/" as any);
      } catch (err: any) {
        const detail = err?.response?.data?.detail;
        const msg = Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
          : typeof detail === "string" ? detail
          : err?.message || "Failed to save profile. Please try again.";
        showMsg("Error", String(msg));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Later edits to an already-completed profile — tenant-scoped self-service
    // endpoint (/api/citizens/me), not /api/users/{id} (rep/staff-only, would
    // 403 for a citizen). Note: mobile isn't editable here — it's tied to the
    // OTP-verified identity, not a plain profile field.
    setSaving(true);
    const body: Record<string, any> = { name: form.fullName.trim() };
    if (form.email.trim())   body.email   = form.email.trim();
    if (form.age.trim())     body.age     = Number(form.age.trim());
    if (form.address.trim()) body.address = form.address.trim();
    if (wardId.trim())       body.ward_id = wardId.trim();
    try {
      await api.put(`/api/citizens/me`, body);
      setProfileComplete(true);
      const savedAge = form.age.trim() ? Number(form.age.trim()) : undefined;
      updateUser({ name: form.fullName.trim(), ...(savedAge != null && { age: savedAge }) });
      showMsg("Success", "Profile updated successfully!", () => router.back());
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
              setField(f.key, f.key === "age" ? v.replace(/[^0-9]/g, "") : v)
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

          {/* ── Your Representative (first-time completion only) ── */}
          {isRequired && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitle}>Your Representative</Text>
              </View>
              <View style={s.card}>
                <View style={s.repRow}>
                  {REP_CATEGORIES.map((cat) => {
                    const active = repType === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[s.repCard, active && s.repCardActive]}
                        onPress={() => { setRepType(cat.key); setRepArea(""); setAreaSearch(""); }}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={20}
                          color={active ? C.primary : C.muted}
                        />
                        <Text style={[s.repCardLabel, active && s.repCardLabelActive]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {repType && (
                  <>
                    <View style={s.divider} />
                    {(() => {
                      const cat = REP_CATEGORIES.find((c) => c.key === repType)!;
                      return (
                        <View style={s.fieldRow}>
                          <View style={s.fieldIconWrap}>
                            <Ionicons name="location-outline" size={18} color={C.muted} />
                          </View>
                          <View style={s.fieldInputWrap}>
                            <Text style={s.fieldLabel}>{cat.areaLabel} *</Text>
                            <TouchableOpacity
                              style={s.input}
                              activeOpacity={0.7}
                              onPress={() => setShowAreaPicker(true)}
                            >
                              <Text style={{ fontSize: 15, color: repArea ? C.text : "#CBD5E1" }}>
                                {repArea || cat.areaPlaceholder}
                              </Text>
                            </TouchableOpacity>
                            {areaLoading && <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Loading…</Text>}
                            {!areaLoading && areaOptions.length === 0 && (
                              <Text style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
                                No {cat.label} registered yet for any constituency.
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })()}
                  </>
                )}
              </View>
            </View>
          )}

          {/* Constituency picker — options come straight from the
              representatives actually registered on the backend, so
              whatever the citizen picks is guaranteed to match exactly
              (previously a free-text field, which silently failed to link
              citizens to their real representative on any typo/formatting
              mismatch). */}
          <Modal visible={showAreaPicker} animationType="slide" transparent onRequestClose={() => setShowAreaPicker(false)}>
            <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}>
              <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>
                    {repType ? REP_CATEGORIES.find((c) => c.key === repType)?.areaLabel : "Select"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                    <Ionicons name="close" size={22} color={C.muted} />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 12 }}>
                  <TextInput
                    style={[s.input, { marginBottom: 0 }]}
                    value={areaSearch}
                    onChangeText={setAreaSearch}
                    placeholder="Search…"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
                <FlatList
                  data={areaOptions.filter((o) => o.label.toLowerCase().includes(areaSearch.trim().toLowerCase()))}
                  keyExtractor={(item, i) => `${item.value}-${i}`}
                  ListEmptyComponent={() => (
                    <Text style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>
                      No matches found.
                    </Text>
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}
                      onPress={() => { setRepArea(item.value); setShowAreaPicker(false); setAreaSearch(""); }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>{item.label}</Text>
                      {(item.repName || item.district) && (
                        <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {[item.repName, item.district].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

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
                  <View style={s.divider} />
                </View>
              ))}
              <View style={s.fieldRow}>
                <View style={s.fieldIconWrap}>
                  <Ionicons name="map-outline" size={18} color={C.muted} />
                </View>
                <View style={s.fieldInputWrap}>
                  <Text style={s.fieldLabel}>Ward</Text>
                  <TouchableOpacity
                    style={s.input}
                    activeOpacity={0.7}
                    onPress={() => setShowWardPicker(true)}
                  >
                    <Text style={{ fontSize: 15, color: wardId ? C.text : "#CBD5E1" }}>
                      {wardId
                        ? (wardOptions.find((o) => o.value === wardId)?.label || wardId)
                        : "Select your ward"}
                    </Text>
                  </TouchableOpacity>
                  {wardLoading && <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Loading…</Text>}
                  {!wardLoading && !!wardId && wardAutoFilled && (
                    <Text style={{ fontSize: 12, color: C.primary, marginTop: 4 }}>
                      Auto-detected from your address — tap to change.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Ward picker — same idea as the constituency picker above: pick
              from the actual registered wards instead of typing freehand, so
              it can't drift from a value that matches nothing. */}
          <Modal visible={showWardPicker} animationType="slide" transparent onRequestClose={() => setShowWardPicker(false)}>
            <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "flex-end" }}>
              <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>Select Ward</Text>
                  <TouchableOpacity onPress={() => setShowWardPicker(false)}>
                    <Ionicons name="close" size={22} color={C.muted} />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 12 }}>
                  <TextInput
                    style={[s.input, { marginBottom: 0 }]}
                    value={wardSearch}
                    onChangeText={setWardSearch}
                    placeholder="Search…"
                    placeholderTextColor="#CBD5E1"
                  />
                </View>
                <FlatList
                  data={wardOptions.filter((o) => o.label.toLowerCase().includes(wardSearch.trim().toLowerCase()))}
                  keyExtractor={(item, i) => `${item.value}-${i}`}
                  ListEmptyComponent={() => (
                    <Text style={{ padding: 20, textAlign: "center", color: C.muted, fontSize: 13 }}>
                      No wards found.
                    </Text>
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}
                      onPress={() => { setWardId(item.value); setWardAutoFilled(false); setShowWardPicker(false); setWardSearch(""); }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: "600", color: C.text }}>{item.label}</Text>
                      {(item.repName || item.district) && (
                        <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {[item.repName, item.district].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

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

  repRow: { flexDirection: "row", gap: 10, padding: 14 },
  repCard: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.inputBg,
  },
  repCardActive: { borderColor: C.primary, backgroundColor: "#EEF2FF" },
  repCardLabel: { fontSize: 12, fontWeight: "700", color: C.muted },
  repCardLabelActive: { color: C.primary },

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
