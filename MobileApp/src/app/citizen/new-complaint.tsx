import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Image, Platform,
  Switch, KeyboardAvoidingView, StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

const PRIMARY   = "#1D3A8A";
const PRIMARY_L = "#2B5BD7";

const CATEGORIES = [
  { key: "Roads",       icon: "🛣️" },
  { key: "Water",       icon: "💧" },
  { key: "Power",       icon: "⚡" },
  { key: "Waste",       icon: "🗑️" },
  { key: "Noise",       icon: "🔊" },
  { key: "Other",       icon: "📋" },
];

const CATEGORY_MAP: Record<string, string> = {
  Roads: "ROAD_ISSUE", Water: "WATER_SUPPLY", Power: "ELECTRICITY",
  Waste: "GARBAGE",   Noise: "NOISE_POLLUTION", Other: "OTHER",
};

const NOTIF_CHANNELS = [
  { key: "Email",         icon: "mail-outline" as const },
  { key: "SMS",           icon: "chatbubble-outline" as const },
  { key: "Notifications", icon: "notifications-outline" as const },
];

export default function NewComplaintScreen() {
  const tr = useT();
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const user = useAuthStore((s) => s.user);
  const profileComplete = useAuthStore((s) => s.profileComplete);

  const [category,     setCategory]     = useState("Roads");
  const [showAllCats,  setShowAllCats]  = useState(false);
  const [description,  setDescription]  = useState("");
  const [address,      setAddress]      = useState("");
  const [latitude,     setLatitude]     = useState<number | null>(null);
  const [longitude,    setLongitude]    = useState<number | null>(null);
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [photos,       setPhotos]       = useState<(string | null)[]>([null, null, null]);
  const [wardNo,       setWardNo]       = useState("");
  const [anonymous,    setAnonymous]    = useState(false);
  const [notifChannel, setNotifChannel] = useState("Email");
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  // Guard: profile must be complete
  useEffect(() => {
    if (!profileComplete) router.replace("/citizen/edit-profile?required=1" as any);
  }, [profileComplete]);

  // Pre-populate photo if launched from camera shortcut
  useEffect(() => {
    if (photoUri) {
      const p: (string | null)[] = [null, null, null];
      p[0] = decodeURIComponent(photoUri);
      setPhotos(p);
    }
  }, [photoUri]);

  const catLabel = (key: string) => tr(key);

  /* ── Photo handling ── */
  const pickPhoto = async (slot: number) => {
    if (photos[slot]) { removePhoto(slot); return; }
    const filled = photos.filter(Boolean).length;
    if (filled >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      const next = [...photos];
      next[slot] = result.assets[0].uri;
      setPhotos(next);
    }
  };

  const removePhoto = (slot: number) => {
    const next = [...photos];
    next[slot] = null;
    setPhotos(next);
  };

  /* ── GPS ── */
  const getGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(tr("Permission denied"), tr("Allow location access in your device settings."));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      setErrors((e) => ({ ...e, address: "" }));
    } catch {
      Alert.alert(tr("Error"), tr("Could not get your location. Please enter manually."));
    } finally {
      setGpsLoading(false);
    }
  };

  /* ── Validation ── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = tr("Please describe the issue");
    if (!address.trim())     e.address      = tr("Please enter the location");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.id) { Alert.alert(tr("Error"), tr("Please log in again.")); return; }
    setLoading(true);
    try {
      // Backend's GrievanceCreate requires `title` (str) — there's no
      // dedicated title field in this form, so generate one from the
      // category + description. category_id must be a grievance_categories
      // ObjectId (for SLA lookup), not the CATEGORY_MAP enum string — that
      // enum string belongs in the free-text `category` field instead.
      // isAnonymous / gpsLocation / citizenId / wardId aren't fields the
      // backend model accepts at all; location is a flat {lat, lng}, and the
      // ward number (no backend slot for it) gets folded into the address
      // so it isn't silently dropped.
      const trimmedDesc = description.trim();
      const title = `${category}: ${trimmedDesc.slice(0, 50)}${trimmedDesc.length > 50 ? "…" : ""}`;
      const fullAddress = wardNo.trim() ? `${address.trim()} (Ward ${wardNo.trim()})` : address.trim();

      const payload: Record<string, any> = {
        title,
        description: trimmedDesc,
        category:    CATEGORY_MAP[category] || category,
        address:     fullAddress,
        priority:    "Medium",
      };
      if (latitude && longitude) payload.location = { lat: latitude, lng: longitude };

      const { data } = await api.post("/api/grievances/", payload);
      const payloadRes = data?.data ?? data;
      const complaintId = payloadRes.id || payloadRes._id || payloadRes.grievance_no;

      // Upload photos
      for (const uri of photos.filter(Boolean) as string[]) {
        try {
          const fd = new FormData();
          if (Platform.OS === "web") {
            const res  = await fetch(uri);
            const blob = await res.blob();
            fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
          } else {
            fd.append("file", { uri, name: "photo.jpg", type: "image/jpeg" } as any);
          }
          await api.post(`/api/grievances/${complaintId}/upload`, fd);
        } catch { /* non-fatal */ }
      }

      // Save notification preference — /api/users/{id} is rep/staff-only and
      // 403s for a citizen; /api/citizens/me is the citizen-safe equivalent
      // (note: CitizenProfileUpdate doesn't have a notifPreferences field
      // yet, so this won't persist until that's added — non-fatal either way).
      try {
        await api.put(`/api/citizens/me`, {
          notifPreferences: { channel: notifChannel },
        });
      } catch { /* non-fatal */ }

      Alert.alert(
        tr("Submitted!"),
        tr("Your complaint has been registered successfully."),
        [{ text: tr("View My Reports"), onPress: () => router.replace("/citizen/complaint-list" as any) }],
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || tr("Failed to submit. Please try again.");
      Alert.alert(tr("Error"), String(msg));
    } finally {
      setLoading(false);
    }
  };

  const visibleCats = showAllCats ? CATEGORIES : CATEGORIES.slice(0, 3);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/citizen/(tabs)/complaints" as any)}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr("New grievance")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Section 1: What happened ── */}
        <View style={s.card}>
          <View style={s.secHead}>
            <View style={s.secNum}><Text style={s.secNumTxt}>1</Text></View>
            <Text style={s.secTitle}>{tr("What happened")}</Text>
          </View>

          {/* Category chips */}
          <View style={s.chipRow}>
            {visibleCats.map(({ key }) => (
              <TouchableOpacity
                key={key}
                style={[s.chip, category === key && s.chipOn]}
                onPress={() => setCategory(key)}
              >
                <Text style={[s.chipTxt, category === key && s.chipTxtOn]}>
                  {catLabel(key)}
                </Text>
              </TouchableOpacity>
            ))}
            {!showAllCats && (
              <TouchableOpacity style={s.chip} onPress={() => setShowAllCats(true)}>
                <Text style={s.chipTxt}>{tr("+ more")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <TextInput
            style={[s.textarea, errors.description && s.inputErr]}
            placeholder={tr("Describe the issue...")}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={description}
            onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: "" })); }}
          />
          <Text style={s.charCount}>{description.length}/500</Text>
          {errors.description ? <Text style={s.errTxt}>{errors.description}</Text> : null}
        </View>

        {/* ── Section 2: Where is it ── */}
        <View style={s.card}>
          <View style={s.secHead}>
            <View style={s.secNum}><Text style={s.secNumTxt}>2</Text></View>
            <Text style={s.secTitle}>{tr("Where is it")}</Text>
          </View>

          {/* Address input */}
          <View style={[s.addrRow, errors.address && s.inputErr]}>
            <Ionicons name="location-outline" size={18} color="#94A3B8" />
            <TextInput
              style={s.addrInput}
              placeholder={tr("Search address or drop a pin")}
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={(v) => { setAddress(v); setErrors((e) => ({ ...e, address: "" })); }}
            />
          </View>
          {errors.address ? <Text style={s.errTxt}>{errors.address}</Text> : null}

          {/* Ward No input */}
          <View style={s.wardRow}>
            <Ionicons name="business-outline" size={18} color="#94A3B8" />
            <TextInput
              style={s.wardInput}
              placeholder={tr("Ward No. (optional)")}
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={wardNo}
              onChangeText={(v) => setWardNo(v.replace(/[^0-9]/g, ""))}
              maxLength={4}
            />
          </View>

          {/* Map / GPS area */}
          <TouchableOpacity style={s.mapBox} onPress={getGPS} activeOpacity={0.8}>
            {gpsLoading ? (
              <ActivityIndicator color={PRIMARY_L} size="large" />
            ) : latitude ? (
              <View style={s.mapLocated}>
                <Ionicons name="location" size={36} color={PRIMARY_L} />
                <Text style={s.mapCoords}>
                  {latitude.toFixed(4)}, {longitude?.toFixed(4)}
                </Text>
                <Text style={s.mapHint}>{tr("Tap to re-capture")}</Text>
              </View>
            ) : (
              <View style={s.mapEmpty}>
                <View style={s.mapStripes} />
                <View style={s.mapPinOverlay}>
                  <Ionicons name="location-outline" size={32} color="#94A3B8" />
                  <Text style={s.mapEmptyTxt}>{tr("Tap to capture GPS")}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Section 3: Add proof ── */}
        <View style={s.card}>
          <View style={s.secHead}>
            <View style={s.secNum}><Text style={s.secNumTxt}>3</Text></View>
            <Text style={s.secTitle}>{tr("Add proof")}</Text>
          </View>

          <View style={s.photoRow}>
            {[0, 1, 2].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[s.photoSlot, slot === 0 && !photos[slot] && s.photoSlotPlus]}
                onPress={() => pickPhoto(slot)}
                activeOpacity={0.75}
              >
                {photos[slot] ? (
                  <>
                    <Image source={{ uri: photos[slot]! }} style={s.photoImg} />
                    <TouchableOpacity
                      style={s.photoX}
                      onPress={() => removePhoto(slot)}
                      hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                    >
                      <Text style={s.photoXTxt}>✕</Text>
                    </TouchableOpacity>
                  </>
                ) : slot === 0 ? (
                  <Text style={s.plusTxt}>+</Text>
                ) : (
                  <View style={s.photoGray} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.photoHint}>{tr("Add up to 3 photos as evidence")}</Text>
        </View>

        {/* ── Section 4: About you ── */}
        <View style={s.card}>
          <View style={s.secHead}>
            <View style={s.secNum}><Text style={s.secNumTxt}>4</Text></View>
            <Text style={s.secTitle}>{tr("About you")}</Text>
          </View>

          {/* Anonymous toggle */}
          <View style={s.toggleRow}>
            <Text style={s.toggleLbl}>{tr("Submit anonymously")}</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: "#E2E8F0", true: PRIMARY_L }}
              thumbColor="#fff"
            />
          </View>

          {/* Keep me updated by */}
          <Text style={s.notifTitle}>{tr("Keep me updated by")}</Text>
          <View style={s.notifRow}>
            {NOTIF_CHANNELS.map(({ key, icon }) => (
              <TouchableOpacity
                key={key}
                style={s.notifOpt}
                onPress={() => setNotifChannel(key)}
                activeOpacity={0.7}
              >
                <View style={[s.radio, notifChannel === key && s.radioOn]}>
                  {notifChannel === key && <View style={s.radioDot} />}
                </View>
                <Text style={[s.notifOptTxt, notifChannel === key && s.notifOptTxtOn]}>
                  {tr(key)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Submit button ── */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitOff]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.87}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitTxt}>{tr("Submit grievance")} →</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF2FB" },

  header: {
    backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },

  scroll: { padding: 14, paddingBottom: 10 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  secHead:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  secNum:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  secNumTxt: { fontSize: 13, fontWeight: "800", color: PRIMARY },
  secTitle:  { fontSize: 15, fontWeight: "700", color: "#1E293B" },

  chipRow:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip:       { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: "#F8FAFC" },
  chipOn:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipTxt:    { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTxtOn:  { color: "#fff", fontWeight: "600" },

  textarea:   {
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
    padding: 12, fontSize: 14, color: "#0F172A", backgroundColor: "#F8FAFC",
    minHeight: 100, textAlignVertical: "top", fontStyle: "italic",
  },
  charCount:  { fontSize: 11, color: "#94A3B8", textAlign: "right", marginTop: 4 },
  inputErr:   { borderColor: "#EF4444" },
  errTxt:     { fontSize: 12, color: "#EF4444", marginTop: 4 },

  addrRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F8FAFC", marginBottom: 12,
  },
  addrInput: { flex: 1, fontSize: 14, color: "#0F172A" },

  wardRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F8FAFC", marginBottom: 12,
  },
  wardInput: { flex: 1, fontSize: 14, color: "#0F172A" },

  mapBox: {
    height: 130, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0",
    alignItems: "center", justifyContent: "center",
  },
  mapEmpty:   { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  mapStripes: {
    position: "absolute", width: "100%", height: "100%",
    backgroundColor: "#E9EDF5",
    // diagonal stripe effect via opacity layers
  },
  mapPinOverlay: { alignItems: "center", gap: 6 },
  mapEmptyTxt: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  mapLocated:  { alignItems: "center", gap: 6 },
  mapCoords:   { fontSize: 14, color: PRIMARY_L, fontWeight: "700" },
  mapHint:     { fontSize: 11, color: "#94A3B8" },

  photoRow:      { flexDirection: "row", gap: 12, marginBottom: 8 },
  photoSlot:     { width: 80, height: 80, borderRadius: 12, overflow: "hidden", position: "relative", backgroundColor: "#E2E8F0" },
  photoSlotPlus: { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", backgroundColor: "#fff" },
  photoImg:      { width: "100%", height: "100%" },
  plusTxt:       { fontSize: 32, color: "#94A3B8", fontWeight: "300", textAlign: "center", lineHeight: 80 },
  photoGray:     { flex: 1, backgroundColor: "#E2E8F0" },
  photoX: {
    position: "absolute", top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  photoXTxt:  { color: "#fff", fontSize: 9, fontWeight: "700" },
  photoHint:  { fontSize: 12, color: "#94A3B8" },

  toggleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", marginBottom: 16,
  },
  toggleLbl: { fontSize: 14, fontWeight: "600", color: "#1E293B" },

  notifTitle: { fontSize: 13, fontWeight: "700", color: PRIMARY_L, marginBottom: 12 },
  notifRow:   { flexDirection: "row", gap: 0, flexWrap: "wrap" },
  notifOpt:   { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 20, marginBottom: 4 },
  radio:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center" },
  radioOn:    { borderColor: PRIMARY },
  radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  notifOptTxt:    { fontSize: 14, color: "#374151" },
  notifOptTxtOn:  { color: PRIMARY, fontWeight: "600" },

  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 18,
    alignItems: "center", marginTop: 4,
    elevation: 4, shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  submitOff: { opacity: 0.6 },
  submitTxt: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});
