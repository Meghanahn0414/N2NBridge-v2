import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import api from "../../services/api";

interface Event {
  id: string;
  eventName: string;
  eventDate?: string;
  location?: string;
  description?: string;
  status?: string;
}

export default function MlaEvents() {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/events/?per_page=30");
      setItems((data.items ?? data).map((e: any) => ({
        id: e._id || e.id,
        eventName: e.eventName || e.event_name || e.name || "Untitled Event",
        eventDate: e.eventDate || e.event_date || e.date,
        location: e.location || e.venue,
        description: e.description,
        status: e.status,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerCount}>{items.length} events</Text>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        ) : (
          items.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.datePill}>
                {e.eventDate ? (
                  <>
                    <Text style={styles.dateDay}>{new Date(e.eventDate).getDate()}</Text>
                    <Text style={styles.dateMon}>
                      {new Date(e.eventDate).toLocaleDateString("en-IN", { month: "short" })}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.dateDay}>—</Text>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.eventName}>{e.eventName}</Text>
                {e.location && <Text style={styles.location}>📍 {e.location}</Text>}
                {e.description && (
                  <Text style={styles.desc} numberOfLines={2}>{e.description}</Text>
                )}
                {e.status && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{e.status}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
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
    backgroundColor: "#059669", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerCount: { fontSize: 13, color: "#A7F3D0" },
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14, elevation: 1,
  },
  datePill: {
    width: 48, backgroundColor: "#ECFDF5", borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginRight: 14, paddingVertical: 6,
  },
  dateDay: { fontSize: 20, fontWeight: "700", color: "#059669" },
  dateMon: { fontSize: 11, color: "#059669", fontWeight: "600" },
  cardBody: { flex: 1 },
  eventName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  location: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  desc: { fontSize: 12, color: "#9CA3AF" },
  statusBadge: {
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  statusText: { fontSize: 10, color: "#065F46", fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280" },
});
