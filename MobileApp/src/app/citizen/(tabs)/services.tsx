import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { useT } from "../../../i18n/useT";

const C = {
  primary:     "#2B5BD7",
  primaryDark: "#1B3C8F",
  bg:          "#F3F5FA",
  card:        "#FFFFFF",
  ink:         "#16233C",
  muted:       "#5A6678",
  mutedLight:  "#9AA3B5",
  border:      "#EDF0F6",
};

type Category = {
  key: string;
  keywords: string[];   // substrings matched against API categoryId/category
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

type Complaint = {
  id: string; title?: string; description?: string;
  status: string; category?: string; createdAt?: string;
};

const CATEGORIES: Category[] = [
  { key: "road",  keywords: ["road"],          label: "Roads",    icon: "construct-outline",   color: "#C9871F", bg: "#FEF3C7" },
  { key: "light", keywords: ["light", "power", "electr"], label: "Power",   icon: "flash-outline",       color: "#6B4FD8", bg: "#EDEAFB" },
  { key: "garb",  keywords: ["garb", "sanit", "waste"],  label: "Waste",   icon: "trash-outline",       color: "#1E8A5B", bg: "#E6F4EC" },
  { key: "water", keywords: ["water"],         label: "Water",    icon: "water-outline",       color: "#2B5BD7", bg: "#E7EEFF" },
  { key: "noise", keywords: ["noise"],         label: "Noise",    icon: "volume-high-outline", color: "#C8453A", bg: "#FEF2F2" },
];

const catMatches = (apiCat: string, cat: Category) =>
  cat.keywords.some((kw) => apiCat.includes(kw));

const statusMeta = (st: string) => {
  switch ((st || "").toUpperCase()) {
    case "OPEN": case "NEW":                              return { color: "#2B5BD7", bg: "#E7EEFF", label: "Open" };
    case "IN_PROGRESS": case "ASSIGNED": case "ON_HOLD": return { color: "#C9871F", bg: "#FEF3C7", label: "In progress" };
    case "RESOLVED": case "CLOSED":                      return { color: "#1E8A5B", bg: "#E6F4EC", label: "Resolved" };
    default: return { color: C.muted, bg: "#F3F5FA", label: (st || "").replace(/_/g, " ") };
  }
};

export default function ExploreScreen() {
  const tr = useT();
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch]     = useState("");
  const [counts, setCounts]     = useState<Record<string, number>>({});
  const [trending, setTrending] = useState<Array<{ id: string; title: string; count: number }>>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch only this citizen's own complaints
      const { data } = await api.get(`/api/grievances/citizen/${user?.id}?page=1`).catch(() => ({ data: [] }));
      // Handle all common nesting: [], { items }, { data: [] }, { data: { items } }
      const raw  = data?.data ?? data;
      const list: any[] = Array.isArray(raw) ? raw
        : Array.isArray(raw?.items)   ? raw.items
        : Array.isArray(raw?.results) ? raw.results
        : [];
      const ct: Record<string, number> = {};
      list.forEach((g: any) => {
        const cat = ([g.categoryId, g.categoryName, g.category_name, g.category]
          .map((v) => (typeof v === "string" ? v : ""))
          .find((v) => v && !v.match(/^[a-f\d]{24}$/i)) ?? "").toLowerCase();
        const st  = (g.status || "").toUpperCase();
        const isOpen = ["NEW", "OPEN", "IN_PROGRESS", "ASSIGNED", "ON_HOLD"].includes(st);
        if (!isOpen) return;
        CATEGORIES.forEach((c) => {
          if (catMatches(cat, c)) ct[c.key] = (ct[c.key] ?? 0) + 1;
        });
      });
      setCounts(ct);
      const top = list
        .filter((g: any) => g.title && ["NEW", "OPEN", "IN_PROGRESS"].includes((g.status || "").toUpperCase()))
        .slice(0, 3)
        .map((g: any) => ({ id: g._id || g.id, title: g.title, count: g.supportCount || g.upvoteCount || 0 }));
      setTrending(top);
      // Cache all complaints for search
      // g.categoryId is the readable label ("ROAD_ISSUE"); g.category may be a MongoDB ObjectId
      setAllComplaints(list.map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description,
        status: g.status || "NEW",
        category: [g.categoryId, g.categoryName, g.category_name, g.category]
          .map((v) => (typeof v === "string" ? v : ""))
          .find((v) => v && !v.match(/^[a-f\d]{24}$/i)) ?? "",
        createdAt: g.createdAt || g.created_at,
      })));
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Intercept hardware back button — clear search instead of leaving tab
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (search.trim().length > 0) {
          setSearch("");
          return true; // consumed — don't navigate away
        }
        return false; // let default back behaviour run
      });
      return () => sub.remove();
    }, [search]),
  );

  // Search results: filter locally by title/description/category
  const searchResults: Complaint[] = search.trim().length >= 1
    ? allComplaints.filter((c) => {
        const q    = search.toLowerCase();
        const cat  = (c.category || "").toLowerCase();
        // Direct text match
        if (c.title?.toLowerCase().includes(q))       return true;
        if (c.description?.toLowerCase().includes(q)) return true;
        if (cat.includes(q))                           return true;
        // Label→keywords match: "Garbage" → keywords ["garb","sanit"] → matches "GARBAGE_COLLECTION" or "SANITATION"
        const matchedCat = CATEGORIES.find((ca) => ca.label.toLowerCase().includes(q));
        if (matchedCat && catMatches(cat, matchedCat)) return true;
        return false;
      })
    : [];

  const isSearching = search.trim().length > 0;
  const filteredCategories = CATEGORIES.filter((cat) =>
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  const clearSearch = () => setSearch("");

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        {isSearching ? (
          <View style={s.searchHeader}>
            <TouchableOpacity
              style={s.backArrow}
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={C.ink} />
            </TouchableOpacity>
            <View style={[s.searchBar, { flex: 1 }]}>
              <Ionicons name="search-outline" size={18} color={C.mutedLight} />
              <TextInput
                style={s.searchInput}
                placeholder={tr("Search reports, streets, topics")}
                placeholderTextColor={C.mutedLight}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoFocus
              />
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={C.mutedLight} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={s.headerTitle}>{tr("Explore")}</Text>
            <View style={s.searchBar}>
              <Ionicons name="search-outline" size={18} color={C.mutedLight} />
              <TextInput
                style={s.searchInput}
                placeholder={tr("Search reports, streets, topics")}
                placeholderTextColor={C.mutedLight}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
            </View>
          </>
        )}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Search results mode ── */}
        {isSearching ? (
          <>
            <Text style={s.sectionLabel}>
              {searchResults.length} {tr(searchResults.length !== 1 ? "results" : "result")} {tr("for")} "{search}"
            </Text>

            {searchResults.length === 0 ? (
              <View style={s.noResults}>
                <Ionicons name="document-text-outline" size={44} color={C.mutedLight} />
                <Text style={s.noResultsTitle}>{tr("0 complaints found")}</Text>
                <Text style={s.noResultsText}>{tr("No complaints match")} "{search}". {tr("Try a different keyword.")}</Text>
              </View>
            ) : (
              <View style={s.resultsList}>
                {searchResults.map((c, idx) => {
                  const sm = statusMeta(c.status);
                  const isLast = idx === searchResults.length - 1;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.resultRow, isLast && { borderBottomWidth: 0 }]}
                      onPress={() => router.push(`/citizen/complaint-detail?id=${c.id}` as any)}
                      activeOpacity={0.75}
                    >
                      <View style={s.resultBody}>
                        <Text style={s.resultTitle} numberOfLines={2}>
                          {c.title || c.description || tr("Complaint")}
                        </Text>
                        {c.category && (
                          <Text style={s.resultMeta}>{c.category}</Text>
                        )}
                      </View>
                      <View style={[s.pill, { backgroundColor: sm.bg }]}>
                        <Text style={[s.pillText, { color: sm.color }]}>{tr(sm.label)}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* ── Categories ── */}
            <Text style={s.sectionLabel}>{tr("Categories")}</Text>
            <View style={s.grid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={s.catCard}
                  onPress={() => setSearch(cat.label)}
                  activeOpacity={0.75}
                >
                  <View style={[s.catIconBox, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon} size={22} color={cat.color} />
                  </View>
                  <Text style={s.catLabel}>{tr(cat.label)}</Text>
                  {counts[cat.key] ? <Text style={s.catCount}>{counts[cat.key]} {tr("open")}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Trending ── */}
            {trending.length > 0 && (
              <>
                <Text style={s.sectionLabel}>{tr("Trending")}</Text>
                <View style={s.trendCard}>
                  {trending.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.trendRow, idx === trending.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => router.push(`/citizen/complaint-detail?id=${item.id}` as any)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.trendNum}>0{idx + 1}</Text>
                      <View style={s.trendBody}>
                        <Text style={s.trendTitle} numberOfLines={2}>{item.title}</Text>
                        {item.count > 0 && <Text style={s.trendSubs}>{item.count} {tr("supporters")}</Text>}
                      </View>
                      <Ionicons name="trending-up-outline" size={18} color={C.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ── Services ── */}
            <Text style={s.sectionLabel}>{tr("Services")}</Text>
            <View style={s.linkList}>
              {[
                { icon: "document-text-outline" as const, label: "File a complaint",    route: "/citizen/new-complaint", color: C.primary, bg: "#E7EEFF" },
                { icon: "megaphone-outline"     as const, label: "Campaigns & updates", route: "/citizen/campaigns",     color: "#6B4FD8", bg: "#EDEAFB" },
                { icon: "clipboard-outline"     as const, label: "Surveys",             route: "/citizen/surveys",       color: "#0891B2", bg: "#E0F7FA" },
                { icon: "star-outline"          as const, label: "Rate a service",      route: "/citizen/feedback",      color: "#C9871F", bg: "#FEF3C7" },
                { icon: "people-outline"        as const, label: "My representative",   route: "/citizen/mla-profile",   color: "#1E8A5B", bg: "#E6F4EC" },
                { icon: "warning-outline"       as const, label: "Emergency SOS",       route: "/citizen/sos",           color: "#C8453A", bg: "#FEF2F2" },
              ].map((item, idx, arr) => (
                <TouchableOpacity
                  key={item.route}
                  style={[s.linkRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.75}
                >
                  <View style={[s.linkIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={19} color={item.color} />
                  </View>
                  <Text style={s.linkLabel}>{tr(item.label)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.mutedLight} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 32 },

  header: {
    backgroundColor: C.card,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: C.ink, marginBottom: 14 },
  searchHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backArrow: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0, outlineStyle: "none" } as any,

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: C.mutedLight,
    textTransform: "uppercase", letterSpacing: 0.7,
    marginHorizontal: 18, marginTop: 24, marginBottom: 14,
  },

  // Categories
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10 },
  catCard: {
    width: "47%", backgroundColor: C.card,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  catIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  catLabel: { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 3 },
  catCount: { fontSize: 12, color: C.muted },

  // Trending
  trendCard: {
    backgroundColor: C.card, marginHorizontal: 18, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  trendRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  trendNum:   { fontSize: 20, fontWeight: "800", color: C.primary, width: 28 },
  trendBody:  { flex: 1 },
  trendTitle: { fontSize: 14, fontWeight: "600", color: C.ink, lineHeight: 20 },
  trendSubs:  { fontSize: 12, color: C.muted, marginTop: 2 },

  // Services
  linkList: {
    backgroundColor: C.card, marginHorizontal: 18, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  linkRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  linkIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: C.ink },

  // Search results
  resultsList: {
    backgroundColor: C.card, marginHorizontal: 18, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  resultRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  resultBody:  { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: "600", color: C.ink, lineHeight: 20, marginBottom: 2 },
  resultMeta:  { fontSize: 12, color: C.muted },
  pill:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  pillText:    { fontSize: 11, fontWeight: "700" },

  // No results
  noResults: { alignItems: "center", paddingHorizontal: 18, paddingTop: 32 },
  noResultsTitle: { fontSize: 17, fontWeight: "700", color: C.ink, marginTop: 14, marginBottom: 6 },
  noResultsText:  { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21 },
});
