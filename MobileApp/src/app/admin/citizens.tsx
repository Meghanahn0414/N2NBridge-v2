import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import api from "../../services/api";

interface Citizen {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  ward?: string;
  constituency?: string;
  createdAt?: string;
}

export default function AdminCitizens() {
  const [items, setItems] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = { role: "CITIZEN", per_page: "50" };
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/api/users/", { params });
      const list = (data.items ?? data).map((u: any) => ({
        id: u._id || u.id,
        fullName: u.fullName || u.full_name || u.name || u.email,
        email: u.email || "",
        mobile: u.mobile || u.phone || "",
        ward: u.ward || "",
        constituency: u.constituency || "",
        createdAt: u.createdAt || u.created_at,
      }));
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citizens</Text>
        <Text style={styles.headerCount}>{items.length} registered</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search citizens..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => { setLoading(true); load(); }}
        returnKeyType="search"
      />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No citizens found</Text>
          </View>
        ) : (
          items.map((c) => {
            const initials = c.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{c.fullName}</Text>
                  <Text style={styles.email}>{c.email}</Text>
                  {(c.mobile || c.ward) && (
                    <Text style={styles.sub}>
                      {[c.mobile, c.ward && `Ward: ${c.ward}`].filter(Boolean).join("  •  ")}
                    </Text>
                  )}
                </View>
                {c.createdAt && (
                  <Text style={styles.date}>
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </Text>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#DDD6FE" },
  search: {
    margin: 16, marginBottom: 12, backgroundColor: "#fff",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: "#111827", elevation: 1,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginBottom: 10,
    padding: 14, elevation: 1,
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#7C3AED", fontSize: 15, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: "#111827" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  date: { fontSize: 11, color: "#9CA3AF", textAlign: "right" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
