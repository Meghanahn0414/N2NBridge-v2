import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Image, Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useT } from "../../i18n/useT";

// Internal English keys kept stable for CATEGORY_MAP lookup
const CATEGORIES = ["Roads", "Water", "Noise", "Electricity", "Waste", "Other"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CATEGORY_MAP: Record<string, string> = {
  Roads: "ROAD_ISSUE", Water: "WATER_SUPPLY", Waste: "GARBAGE",
  Electricity: "ELECTRICITY", Noise: "NOISE_POLLUTION", Other: "OTHER",
};

export default function NewComplaintScreen() {
  const tr = useT();
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const user = useAuthStore((s) => s.user);
  const profileComplete = useAuthStore((s) => s.profileComplete);
  const [step, setStep] = useState(1);

  // Guard: profile must be complete before filing a complaint
  useEffect(() => {
    if (!profileComplete) {
      router.replace("/citizen/edit-profile?required=1" as any);
    }
  }, [profileComplete]);

  // Pre-populate photo if launched from camera shortcut
  useEffect(() => {
    if (photoUri) {
      setForm((f) => ({ ...f, photos: [{ uri: decodeURIComponent(photoUri) }] }));
    }
  }, [photoUri]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    category: "Roads",
    priority: "MEDIUM",
    description: "",
    photos: [] as { uri: string }[],
    address: "",
    wardId: "",
    latitude: null as number | null,
    longitude: null as number | null,
    confirmed: false,
  });

  // Map English category key to translated label
  const categoryLabel: Record<string, string> = {
    Roads: tr('newComplaint.catRoads'),
    Water: tr('newComplaint.catWater'),
    Noise: tr('newComplaint.catNoise'),
    Electricity: tr('newComplaint.catElectricity'),
    Waste: tr('newComplaint.catWaste'),
    Other: tr('newComplaint.catOther'),
  };

  const setField = (key: string, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1 && !form.category) e.category = "Please select a category.";
    if (step === 2 && !form.description.trim()) e.description = "Please describe the issue.";
    if (step === 3) {
      if (!form.address.trim()) e.address = "Please enter a location.";
      if (!form.wardId) e.wardId = "Please select a ward.";
    }
    if (step === 4 && !form.confirmed) e.confirmed = "Please confirm the details are accurate.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickPhoto = async () => {
    if (form.photos.length >= 5) { Alert.alert("Max 5 photos allowed"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsMultipleSelection: false, quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setField("photos", [...form.photos, { uri: result.assets[0].uri }]);
    }
  };

  const getGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission denied", "Enable location in settings."); return; }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setField("latitude", loc.coords.latitude);
      setField("longitude", loc.coords.longitude);
      Alert.alert("Location captured", `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    } catch { Alert.alert("Error", "Could not get location. Enter manually."); }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.id) { Alert.alert("Error", "Session expired. Please login again."); return; }
    setLoading(true);
    try {
      const payload = {
        citizenId: user.id,
        categoryId: CATEGORY_MAP[form.category] || form.category,
        description: form.description.trim(),
        address: form.address.trim(),
        wardId: form.wardId,
        priority: form.priority,
        gpsLocation: form.latitude && form.longitude
          ? { type: "Point", coordinates: [form.longitude, form.latitude] }
          : null,
      };
      const { data } = await api.post("/api/grievances", payload);
      const complaintId = data.id || data._id || data.complaintNumber;

      // Upload photos
      for (const photo of form.photos) {
        try {
          const fd = new FormData();
          if (Platform.OS === "web") {
            const res = await fetch(photo.uri);
            const blob = await res.blob();
            fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
          } else {
            fd.append("file", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" } as any);
          }
          await api.post(`/api/grievances/${complaintId}/upload`, fd);
        } catch { /* continue if photo fails */ }
      }

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Complaint filed successfully!");
        router.replace("/citizen/complaints" as any);
      } else {
        Alert.alert("Success", "Complaint filed successfully!", [
          { text: "View My Reports", onPress: () => router.replace("/citizen/complaints" as any) },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to submit complaint.";
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(String(msg));
      } else {
        Alert.alert("Error", String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Category + Priority ──
  const renderStep1 = () => (
    <View>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{tr('newComplaint.title')}</Text>
        <Text style={styles.stepSubtitle}>{tr('newComplaint.stepCategory')}</Text>
      </View>
      <Text style={styles.label}>{tr('newComplaint.selectCategory')}</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, form.category === cat && styles.chipActive]}
            onPress={() => setField("category", cat)}
          >
            <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
              {categoryLabel[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

      <Text style={[styles.label, { marginTop: 20 }]}>{tr('newComplaint.priorityLevel')}</Text>
      {PRIORITIES.map((p) => (
        <TouchableOpacity key={p} style={styles.radioRow} onPress={() => setField("priority", p)}>
          <View style={styles.radioOuter}>
            {form.priority === p && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>{p}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Step 2: Description + Photos ──
  const renderStep2 = () => (
    <View>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{tr('newComplaint.title')}</Text>
        <Text style={styles.stepSubtitle}>{tr('newComplaint.stepDetails')}</Text>
      </View>
      <Text style={styles.label}>{tr('newComplaint.describeIssue')}</Text>
      <TextInput
        style={[styles.textarea, errors.description && styles.inputError]}
        placeholder="Describe the issue in detail. Include what, where, and when..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={5}
        maxLength={500}
        value={form.description}
        onChangeText={(v) => setField("description", v)}
      />
      <Text style={styles.charCount}>{form.description.length}/500 characters</Text>
      {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

      <Text style={[styles.label, { marginTop: 20 }]}>{tr('newComplaint.attachPhotos')}</Text>
      <TouchableOpacity style={styles.photoUploadBox} onPress={pickPhoto}>
        <Text style={styles.photoIcon}>📷</Text>
        <Text style={styles.photoUploadText}>{tr('newComplaint.tapToAddPhoto')}</Text>
        <Text style={styles.photoUploadHint}>{tr('newComplaint.maxPhotos')}</Text>
      </TouchableOpacity>
      {form.photos.length > 0 && (
        <View style={styles.photoGrid}>
          {form.photos.map((p, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri: p.uri }} style={styles.photoImg} />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => setField("photos", form.photos.filter((_, j) => j !== i))}
              >
                <Text style={{ color: "#fff", fontSize: 10 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {form.photos.length > 0 && (
        <Text style={styles.charCount}>
          {tr('newComplaint.photosAdded').replace('{n}', String(form.photos.length))}
        </Text>
      )}
    </View>
  );

  // ── Step 3: Location ──
  const renderStep3 = () => (
    <View>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{tr('newComplaint.title')}</Text>
        <Text style={styles.stepSubtitle}>{tr('newComplaint.stepLocation')}</Text>
      </View>
      <Text style={styles.label}>{tr('newComplaint.locationDetails')}</Text>
      <TextInput
        style={[styles.input, errors.address && styles.inputError]}
        placeholder={tr('newComplaint.locationPlaceholder')}
        placeholderTextColor="#9CA3AF"
        value={form.address}
        onChangeText={(v) => setField("address", v)}
      />
      {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

      <Text style={[styles.label, { marginTop: 16 }]}>{tr('newComplaint.wardLabel')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={styles.wardRow}>
          {Array.from({ length: 50 }, (_, i) => String(i + 1)).map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.wardChip, form.wardId === w && styles.chipActive]}
              onPress={() => setField("wardId", w)}
            >
              <Text style={[styles.chipText, form.wardId === w && styles.chipTextActive]}>
                {tr('newComplaint.wardChip').replace('{w}', w)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {errors.wardId ? <Text style={styles.errorText}>{errors.wardId}</Text> : null}

      <TouchableOpacity style={styles.gpsBtn} onPress={getGPS}>
        <Text style={styles.gpsBtnText}>📍 {tr('newComplaint.getGPS')}</Text>
      </TouchableOpacity>
      {form.latitude && (
        <Text style={styles.gpsInfo}>
          ✓ {form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)}
        </Text>
      )}
    </View>
  );

  // ── Step 4: Review ──
  const renderStep4 = () => (
    <View>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{tr('newComplaint.title')}</Text>
        <Text style={styles.stepSubtitle}>{tr('newComplaint.stepReview')}</Text>
      </View>
      {[
        [tr('newComplaint.reviewCategory'), categoryLabel[form.category] || form.category],
        [tr('newComplaint.reviewPriority'), form.priority],
        [tr('newComplaint.reviewDescription'), form.description],
        [tr('newComplaint.reviewLocation'), form.address],
        [tr('newComplaint.reviewWard'), tr('newComplaint.wardChip').replace('{w}', form.wardId)],
        form.photos.length > 0
          ? [tr('newComplaint.reviewPhotos'), tr('newComplaint.photosAttached').replace('{n}', String(form.photos.length))]
          : null,
      ].filter((row): row is string[] => row !== null).map(([label, value]) => (
        <View key={label} style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{label}:</Text>
          <Text style={styles.reviewValue} numberOfLines={3}>{value}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setField("confirmed", !form.confirmed)}
      >
        <View style={[styles.checkbox, form.confirmed && styles.checkboxChecked]}>
          {form.confirmed && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>{tr('newComplaint.confirmAccuracy')}</Text>
      </TouchableOpacity>
      {errors.confirmed ? <Text style={styles.errorText}>{errors.confirmed}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backArrowBtn} onPress={() => step > 1 ? setStep(step - 1) : router.canGoBack() ? router.back() : router.replace('/(tabs)/complaints' as any)}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.topHeaderTitle}>{tr('newComplaint.title')}</Text>
          <Text style={styles.topHeaderSub}>{tr('newComplaint.stepOf').replace('{n}', String(step))}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.dot, step === s && styles.dotActive, s < step && styles.dotDone]}>
              <Text style={[styles.dotText, (step === s || s < step) && { color: "#fff" }]}>
                {s < step ? "✓" : s}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, styles.navBack]}
          onPress={() => step > 1 ? setStep(step - 1) : router.back()}
        >
          <Text style={styles.navBackText}>←</Text>
        </TouchableOpacity>

        {step < 4 ? (
          <TouchableOpacity style={[styles.navBtn, styles.navNext]} onPress={() => validate() && setStep(step + 1)}>
            <Text style={styles.navNextText}>{tr('newComplaint.next')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, styles.navSubmit, loading && styles.navDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.navNextText}>{tr('newComplaint.submitComplaint')}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = "#1D3A8A";
const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backArrowBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  backArrowText: { color: "#BFDBFE", fontSize: 20, fontWeight: "600" },
  topHeaderTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  topHeaderSub: { color: "#BFDBFE", fontSize: 12, textAlign: "center", marginTop: 2 },

  progressContainer: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  progressTrack: { height: 6, backgroundColor: "#E2E8F0", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: PRIMARY, borderRadius: 3 },
  stepDots: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingHorizontal: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  dotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dotDone: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  dotText: { fontSize: 12, fontWeight: "700", color: "#94A3B8" },
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 16, paddingBottom: 8 },
  stepHeader: { backgroundColor: PRIMARY, borderRadius: 10, padding: 16, marginBottom: 20 },
  stepTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  stepSubtitle: { color: "#CBD5E1", fontSize: 13, marginTop: 2 },
  label: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 1, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff" },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#1D3A8A", alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  radioLabel: { fontSize: 15, color: "#0F172A" },
  textarea: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 10, padding: 12, fontSize: 14, color: "#0F172A", backgroundColor: "#fff", minHeight: 120, textAlignVertical: "top" },
  charCount: { fontSize: 12, color: "#94A3B8", textAlign: "right", marginTop: 4, marginBottom: 4 },
  photoUploadBox: { borderWidth: 1.5, borderColor: "#CBD5E1", borderStyle: "dashed", borderRadius: 10, padding: 24, alignItems: "center", backgroundColor: "#fff" },
  photoIcon: { fontSize: 28, marginBottom: 4 },
  photoUploadText: { fontSize: 14, color: "#374151", fontWeight: "600" },
  photoUploadHint: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, overflow: "hidden", position: "relative" },
  photoImg: { width: "100%", height: "100%" },
  removePhoto: { position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  input: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 10, padding: 12, fontSize: 14, color: "#0F172A", backgroundColor: "#fff", marginBottom: 4 },
  inputError: { borderColor: "#EF4444" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 2, marginBottom: 8 },
  wardRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  wardChip: { borderWidth: 1.5, borderColor: "#CBD5E1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fff" },
  gpsBtn: { borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  gpsBtnText: { color: PRIMARY, fontWeight: "600", fontSize: 14 },
  gpsInfo: { fontSize: 13, color: "#22C55E", marginTop: 6, fontWeight: "600" },
  reviewRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  reviewLabel: { width: 90, fontSize: 13, fontWeight: "700", color: "#64748B" },
  reviewValue: { flex: 1, fontSize: 13, color: "#0F172A" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 20, padding: 14, backgroundColor: "#F0F9FF", borderRadius: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: "#CBD5E1", borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  checkboxChecked: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  checkLabel: { flex: 1, fontSize: 13, color: "#0F172A", lineHeight: 18 },
  navRow: { flexDirection: "row", gap: 12, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  navBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  navBack: { borderWidth: 1.5, borderColor: "#CBD5E1" },
  navNext: { backgroundColor: PRIMARY },
  navSubmit: { backgroundColor: "#22C55E" },
  navDisabled: { opacity: 0.4 },
  navBackText: { color: "#374151", fontWeight: "600", fontSize: 15 },
  navNextText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
