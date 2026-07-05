import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, ActivityIndicator, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useT } from "../../i18n/useT";

// "Discover representatives" — lets a citizen browse and follow ANY MLA, MP,
// or Councillor in the system, not just the one representative they
// registered under. Backed by GET/POST /api/discovery/* (Backend/src/discovery),
// which reads across every representative's tenant database via the shared
// master registry — see Backend/src/discovery/service.py for how that works.

const C = {
  primary:    "#2B5BD7",
  primaryDark:"#1B3C8F",
  bg:         "#F3F5FA",
  card:       "#FFFFFF",
  ink:        "#16233C",
  muted:      "#5A6678",
  mutedLight: "#9AA3B5",
  border:     "#EDF0F6",
};

type RepType = "MLA" | "MP" | "COUNCILLOR";

type Representative = {
  name?: string;
  rep_type?: RepType;
  db_name: string;
  assembly_name?: string;
  parliamentary_name?: string;
  ward_name?: string;
  district?: string;
  state?: string;
};

type FollowEntry = { db_name: string };

const FILTERS: Array<{ key: RepType | "ALL"; label: string }> = [
  { key: "ALL",        label: "All" },
  { key: "MLA",        label: "MLA" },
  { key: "MP",         label: "MP" },
  { key: "COUNCILLOR", label: "Councillor" },
];

const areaOf = (r: Representative) =>
  r.assembly_name || r.parliamentary_name || r.ward_name || r.district || "";

export default function DiscoverRepresentativesScreen() {
  const tr = useT();
  const router = useRouter();
  const [filter, setFilter] = useState<RepType | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Representative[]>([]);
  const [following, setFollowing] = useState<FollowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const isFollowing = (r: Representative) =>
    following.some((f) => f.db_name === r.db_name);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter !== "ALL") params.rep_type = filter;
      if (q.trim()) params.q = q.trim();

      const [repRes, followRes] = await Promise.all([
        api.get("/api/discovery/representatives", { params }),
        api.get("/api/discovery/following").catch(() => ({ data: { data: { items: [] } } })),
      ]);
      const repPayload = repRes.data?.data ?? repRes.data;
      setItems(repPayload?.items ?? []);

      const followPayload = followRes.data?.data ?? followRes.data;
      setFollowing(followPayload?.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async (r: Representative) => {
    const key = r.db_name;
    setBusyKey(key);
    try {
      if (isFollowing(r)) {
        await api.delete(`/api/discovery/follow/${r.db_name}`);
        setFollowing((prev) => prev.filter((f) => f.db_name !== r.db_name));
      } else {
        await api.post("/api/discovery/follow", { db_name: r.db_name, rep_type: r.rep_type });
        setFollowing((prev) => [...prev, { db_name: r.db_name }]);
      }
    } catch {
      // silent — button just stays in its previous state
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={C.ink} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{tr("Discover representatives")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.mutedLight} />
          <TextInput
            style={s.searchInput}
            placeholder={tr("Search by name, constituency, or ward")}
            placeholderTextColor={C.mutedLight}
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, filter === f.key && s.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>
                {tr(f.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="people-outline" size={44} color={C.mutedLight} />
              <Text style={s.emptyTitle}>{tr("No representatives found")}</Text>
              <Text style={s.emptyBody}>{tr("Try a different search or filter.")}</Text>
            </View>
          ) : (
            items.map((r) => {
              const key = r.db_name;
              const followed = isFollowing(r);
              return (
                <TouchableOpacity
                  key={key}
                  style={s.repCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/citizen/representative-detail?dbName=${r.db_name}` as any)}
                >
                  <View style={s.repAvatar}>
                    <Text style={s.repAvatarText}>{(r.name || "?")[0].toUpperCase()}</Text>
                  </View>
                  <View style={s.repBody}>
                    <Text style={s.repName} numberOfLines={1}>{r.name || tr("Representative")}</Text>
                    <View style={s.repMetaRow}>
                      <View style={s.typeBadge}>
                        <Text style={s.typeBadgeText}>{r.rep_type}</Text>
                      </View>
                      <Text style={s.repMeta} numberOfLines={1}>{areaOf(r)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[s.followBtn, followed && s.followBtnActive]}
                    onPress={() => toggleFollow(r)}
                    disabled={busyKey === key}
                    activeOpacity={0.8}
                  >
                    {busyKey === key ? (
                      <ActivityIndicator size="small" color={followed ? C.primary : "#fff"} />
                    ) : (
                      <Text style={[s.followBtnText, followed && s.followBtnTextActive]}>
                        {followed ? tr("Following") : tr("Follow")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.ink },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.bg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, padding: 0 },

  filterRow: { flexDirection: "row" },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, marginRight: 8,
  },
  filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterChipText: { fontSize: 12, fontWeight: "700", color: C.muted },
  filterChipTextActive: { color: "#fff" },

  scroll: { flex: 1 },
  content: { padding: 18 },

  repCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  repAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: "#E7EEFF",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  repAvatarText: { fontSize: 18, fontWeight: "800", color: C.primary },
  repBody: { flex: 1 },
  repName: { fontSize: 15, fontWeight: "700", color: C.ink, marginBottom: 4 },
  repMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { backgroundColor: "#EDEAFB", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: "800", color: "#6B4FD8" },
  repMeta: { fontSize: 12, color: C.muted, flexShrink: 1 },

  followBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: C.primary, minWidth: 84, alignItems: "center", justifyContent: "center",
  },
  followBtnActive: { backgroundColor: "#fff", borderWidth: 1, borderColor: C.primary },
  followBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  followBtnTextActive: { color: C.primary },

  emptyCard: {
    marginTop: 24, backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, alignItems: "center",
    paddingVertical: 40, paddingHorizontal: 20, gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  emptyBody: { fontSize: 13, color: C.mutedLight, textAlign: "center", lineHeight: 19 },
});
