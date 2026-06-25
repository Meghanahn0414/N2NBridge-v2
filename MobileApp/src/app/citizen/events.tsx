import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useT } from '../../i18n/useT';
import { useAuthStore } from '../../store/authStore';

const C = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  bg: '#F8F9FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

type Event = {
  id: string;
  eventName?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  event_date?: string;
  date?: string;
  location?: string;
  venue?: string;
  type?: string;
  ward?: string;
  status?: string;
};

const EVENT_ICONS: Record<string, string> = {
  HEALTH: '🏥', EDUCATION: '📚', COMMUNITY: '🤝',
  INFRASTRUCTURE: '🏗️', ENVIRONMENT: '🌿', DEFAULT: '📅',
};

export default function Events() {
  const tr = useT();
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null); // tracks which event is in-flight
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set()); // events already registered

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get('/api/events/?page=1&per_page=30');
      const list: Event[] = Array.isArray(data) ? data : (data.items ?? data.results ?? data.events ?? data.data ?? []);
      setEvents(list.map((e: any) => ({
        id: e._id || e.id,
        eventName: e.eventName || e.event_name || e.title || e.name,
        description: e.description,
        eventDate: e.eventDate || e.event_date || e.date,
        location: e.location || e.venue,
        type: e.type || e.eventType,
        ward: e.ward,
        status: e.status,
      })));
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  const handleRegister = async (eventId: string) => {
    if (!user?.id) {
      Alert.alert("Error", "Please log in again to register.");
      return;
    }
    setRegistering(eventId);
    try {
      const res = await api.post(`/api/events/${eventId}/register`, { citizenId: user.id });
      const alreadyHad = res?.data?.message === "Already registered";
      // Mark as registered so the button disables
      setRegisteredIds((prev) => new Set(prev).add(eventId));
      Alert.alert(
        alreadyHad ? "Already Registered" : "Registered!",
        alreadyHad ? "You have already registered for this event." : "You have successfully registered for this event.",
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to register. Try again.";
      Alert.alert("Error", String(msg));
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return tr('events.dateTbd');
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const isUpcoming = (dateStr?: string) => !dateStr || new Date(dateStr) >= new Date();

  const renderItem = ({ item }: { item: Event }) => {
    const dateStr = item.eventDate;
    const icon = EVENT_ICONS[item.type?.toUpperCase() ?? ''] ?? EVENT_ICONS.DEFAULT;
    const upcoming = isUpcoming(dateStr);
    const displayTitle = item.eventName || item.title || 'Untitled Event';

    return (
      <View style={[s.card, !upcoming && s.cardPast]}>
        <View style={[s.iconBox, { backgroundColor: upcoming ? '#EFF6FF' : '#F1F5F9' }]}>
          <Text style={s.icon}>{icon}</Text>
        </View>
        <View style={s.cardRight}>
          <View style={s.cardTop}>
            <Text style={s.cardTitle} numberOfLines={2}>{displayTitle}</Text>
            {!upcoming && (
              <View style={s.pastBadge}><Text style={s.pastBadgeText}>{tr('events.past')}</Text></View>
            )}
          </View>
          {item.description && (
            <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <Text style={s.metaItem}>📅 {formatDate(dateStr)}</Text>
          {item.location && <Text style={s.metaItem}>📍 {item.location}</Text>}
          {item.ward && <Text style={s.metaItem}>🏘️ {tr('events.ward')} {item.ward}</Text>}
          {item.status && (
            <View style={s.statusBadge}>
              <Text style={s.statusText}>{item.status}</Text>
            </View>
          )}
          {upcoming && (
            <TouchableOpacity
              style={[
                s.registerBtn,
                (registering === item.id || registeredIds.has(item.id)) && s.registerBtnDone,
              ]}
              onPress={() => handleRegister(item.id)}
              disabled={registering === item.id || registeredIds.has(item.id)}
            >
              <Text style={s.registerBtnText}>
                {registering === item.id
                  ? 'Registering…'
                  : registeredIds.has(item.id)
                  ? '✓ Registered'
                  : 'Register'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>{tr('events.title')}</Text>
          <Text style={s.headerSub}>{tr('events.subtitle')}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📅</Text>
              <Text style={s.emptyTitle}>{tr('events.noEvents')}</Text>
              <Text style={s.emptyText}>{tr('events.noEventsText')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: C.primary, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { color: '#BFDBFE', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  headerSub: { color: '#BFDBFE', fontSize: 12, textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12,
    flexDirection: 'row', elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardPast: { opacity: 0.6 },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  icon: { fontSize: 26 },
  cardRight: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  pastBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  pastBadgeText: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: C.textMuted, marginBottom: 6 },
  metaItem: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  statusBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  statusText: { fontSize: 10, color: '#1D4ED8', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  registerBtn: {
    backgroundColor: "#1D4ED8", borderRadius: 8,
    paddingVertical: 10, alignItems: "center", marginTop: 10,
  },
  registerBtnDone: {
    backgroundColor: "#16A34A", // green when registered
  },
  registerBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
