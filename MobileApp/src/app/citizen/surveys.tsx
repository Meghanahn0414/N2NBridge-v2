import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useT } from "../../i18n/useT";

const C = {
  primary:  "#2B5BD7",
  bg:       "#F3F5FA",
  card:     "#FFFFFF",
  ink:      "#16233C",
  muted:    "#5A6678",
  mutedLight: "#9AA3B5",
  border:   "#EDF0F6",
  green:    "#1E8A5B",
  greenBg:  "#E6F4EC",
};

type Survey = {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  status: string;
  createdAt?: string;
  alreadyResponded?: boolean;
};

export default function SurveysScreen() {
  const tr = useT();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSurveys = useCallback(async () => {
    try {
      const { data } = await api.get("/api/surveys?status=ACTIVE");
      const raw: any[] = Array.isArray(data)
        ? data
        : (data?.data ?? data?.items ?? data?.surveys ?? []);
      setSurveys(
        raw.map((s: any) => ({
          id: s._id || s.id,
          title: s.title,
          description: s.description,
          questions: s.questions ?? [],
          status: s.status,
          createdAt: s.createdAt,
          alreadyResponded: s.alreadyResponded ?? false,
        }))
      );
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const onRefresh = () => { setRefreshing(true); fetchSurveys(); };

  const renderItem = ({ item }: { item: Survey }) => (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.8}
      onPress={() =>
        router.push(`/citizen/survey-detail?id=${item.id}` as any)
      }
    >
      <View style={s.cardRow}>
        <View style={[s.iconBox, { backgroundColor: "#E7EEFF" }]}>
          <Ionicons name="clipboard-outline" size={22} color={C.primary} />
        </View>
        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          {item.description ? (
            <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={s.metaRow}>
            <Text style={s.metaText}>{item.questions.length} {tr("questions")}</Text>
            {item.alreadyResponded && (
              <View style={s.donePill}>
                <Ionicons name="checkmark-circle" size={12} color={C.green} />
                <Text style={s.donePillText}>{tr("Submitted")}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.mutedLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.card} barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>{tr("Surveys")}</Text>
          <Text style={s.headerSub}>{tr("Share your feedback")}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="clipboard-outline" size={52} color={C.mutedLight} />
              <Text style={s.emptyTitle}>{tr("No active surveys")}</Text>
              <Text style={s.emptyText}>{tr("Check back later for new surveys from your representative.")}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    backgroundColor: C.card,
    paddingTop: 56, paddingBottom: 18, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.ink },
  headerSub:   { fontSize: 13, color: C.muted, marginTop: 1 },

  list: { padding: 18, gap: 12, paddingBottom: 48 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardRow:  { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox:  { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1 },
  cardTitle:{ fontSize: 15, fontWeight: "700", color: C.ink, lineHeight: 21, marginBottom: 3 },
  cardDesc: { fontSize: 13, color: C.muted, lineHeight: 18, marginBottom: 6 },

  metaRow:   { flexDirection: "row", alignItems: "center", gap: 10 },
  metaText:  { fontSize: 12, color: C.mutedLight },
  donePill:  { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.greenBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  donePillText: { fontSize: 11, fontWeight: "700", color: C.green },

  empty:      { alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.ink, marginTop: 16, marginBottom: 8 },
  emptyText:  { fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 21 },
});
