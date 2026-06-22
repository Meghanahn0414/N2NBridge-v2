import { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, NativeSyntheticEvent,
  NativeScrollEvent, StatusBar, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { storage } from "../utils/storage";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setCurrent(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  function goNext() {
    if (current < 2) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
      setCurrent(current + 1);
    } else {
      finish();
    }
  }

  async function finish() {
    await storage.setItem("onboarding_done", "1");
    router.replace("/");
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >

        {/* ── SLIDE 1 · Hero ── */}
        <LinearGradient colors={["#1E40AF", "#1D4ED8", "#2563EB"]} style={s.slide}>
          <View style={s.heroTop}>
            <View style={s.bigIcon}>
              <Text style={s.bigIconText}>🏛️</Text>
            </View>
          </View>
          <View style={s.heroCard}>
            <View style={s.dotRow}>
              {[0,1,2].map(i => <View key={i} style={[s.dot, i===0 && s.dotOn]} />)}
            </View>
            <Text style={s.heroTitle}>{"Your city,\nin your hands."}</Text>
            <Text style={s.heroSub}>
              Report issues, track every request, and shape what happens in your neighbourhood.
            </Text>
            <TouchableOpacity style={s.btnBlue} onPress={goNext}>
              <Text style={s.btnBlueText}>Get started →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={finish} style={s.centerLink}>
              <Text style={s.grayLink}>Have an account? <Text style={s.blueLink}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── SLIDE 2 · Features (Civica style) ── */}
        <SafeAreaView style={[s.slide, s.white]}>
          {/* App badge row */}
          <View style={s.badgeRow}>
            <View style={s.appBadge}>
              <Text style={s.appBadgeIcon}>🏛️</Text>
            </View>
            <Text style={s.appBadgeName}>Jana Seva CRM</Text>
          </View>

          {/* Heading */}
          <Text style={s.featTitle}>{"Three ways Jana Seva\nCRM works for you"}</Text>

          {/* Feature list */}
          <View style={s.featList}>
            <View style={s.featRow}>
              <View style={s.featCircle}>
                <Text style={s.featCircleIcon}>⏱</Text>
              </View>
              <View style={s.featText}>
                <Text style={s.featName}>File in seconds</Text>
                <Text style={s.featDesc}>
                  Describe your issue, pick a category, and submit. Water, roads, sanitation — all covered.
                </Text>
              </View>
            </View>

            <View style={s.featRow}>
              <View style={s.featCircle}>
                <Text style={s.featCircleIcon}>📋</Text>
              </View>
              <View style={s.featText}>
                <Text style={s.featName}>Track every complaint</Text>
                <Text style={s.featDesc}>
                  Real-time status updates from submission to resolution, every step of the way.
                </Text>
              </View>
            </View>

            <View style={s.featRow}>
              <View style={s.featCircle}>
                <Text style={s.featCircleIcon}>📢</Text>
              </View>
              <View style={s.featText}>
                <Text style={s.featName}>Have a say</Text>
                <Text style={s.featDesc}>
                  Get alerts, attend events, and hear directly from your ward representatives.
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons pinned to bottom */}
          <View style={s.featButtons}>
            <TouchableOpacity style={s.btnBlue} onPress={goNext}>
              <Text style={s.btnBlueText}>Create account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={finish} style={s.centerLink}>
              <Text style={s.signInPlain}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ── SLIDE 3 · Area ── */}
        <View style={[s.slide, { backgroundColor: "#E0E7FF" }]}>
          {/* Fake map */}
          <View style={s.mapArea}>
            <Text style={{ fontSize: 48, position: "absolute", top: "30%", left: "38%" }}>📍</Text>
            <Text style={{ fontSize: 34, position: "absolute", top: "48%", left: "58%", opacity: 0.7 }}>📍</Text>
            <Text style={{ fontSize: 26, position: "absolute", top: "22%", left: "55%", opacity: 0.5 }}>📍</Text>
          </View>

          {/* Bottom sheet */}
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.dotRow}>
              {[0,1,2].map(i => <View key={i} style={[s.dotDark, i===2 && s.dotDarkOn]} />)}
            </View>
            <Text style={s.sheetTitle}>{"Stay informed\nabout your area"}</Text>
            <Text style={s.sheetSub}>
              See active complaints, upcoming events, and alerts from your ward — all in one place.
            </Text>
            <TouchableOpacity style={s.btnBlue} onPress={goNext}>
              <Text style={s.btnBlueText}>✦  Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={finish} style={s.centerLink}>
              <Text style={s.signInPlain}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1D4ED8" },
  slide: { width, flex: 1 },
  white: { backgroundColor: "#ffffff", justifyContent: "space-between" },

  // ── Slide 1 ──
  heroTop: { flex: 1, alignItems: "center", justifyContent: "center" },
  bigIcon: {
    width: 120, height: 120, borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  bigIconText: { fontSize: 60 },
  heroCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 28, paddingBottom: 48,
  },
  dotRow: { flexDirection: "row", gap: 6, marginBottom: 22 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1" },
  dotOn: { backgroundColor: "#1D4ED8" },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#0F172A", lineHeight: 40, marginBottom: 14 },
  heroSub: { fontSize: 15, color: "#64748B", lineHeight: 23, marginBottom: 30 },

  // ── Slide 2 ──
  badgeRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 4,
  },
  appBadge: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#1D4ED8",
    alignItems: "center", justifyContent: "center",
  },
  appBadgeIcon: { fontSize: 20 },
  appBadgeName: { fontSize: 17, fontWeight: "700", color: "#0F172A" },

  featTitle: {
    fontSize: 28, fontWeight: "800", color: "#0F172A", lineHeight: 36,
    paddingHorizontal: 24, marginTop: 20, marginBottom: 30,
  },
  featList: { paddingHorizontal: 24, gap: 26, flex: 1 },
  featRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  featCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  featCircleIcon: { fontSize: 20 },
  featText: { flex: 1, paddingTop: 2 },
  featName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  featDesc: { fontSize: 13, color: "#64748B", lineHeight: 19 },

  featButtons: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 24 },

  // ── Slide 3 ──
  mapArea: { flex: 1, backgroundColor: "#C7D2FE", position: "relative" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 28, paddingTop: 16, paddingBottom: 48,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0",
    alignSelf: "center", marginBottom: 20,
  },
  dotDark: { width: 28, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0" },
  dotDarkOn: { backgroundColor: "#1D4ED8" },
  sheetTitle: { fontSize: 28, fontWeight: "800", color: "#0F172A", lineHeight: 36, marginBottom: 12, marginTop: 8 },
  sheetSub: { fontSize: 14, color: "#64748B", lineHeight: 21, marginBottom: 28 },

  // ── Shared ──
  btnBlue: {
    backgroundColor: "#1D4ED8", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginBottom: 14,
  },
  btnBlueText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  centerLink: { alignItems: "center", paddingVertical: 6 },
  grayLink: { color: "#64748B", fontSize: 14 },
  blueLink: { color: "#1D4ED8", fontWeight: "700" },
  signInPlain: { color: "#64748B", fontSize: 15, fontWeight: "600" },
});
