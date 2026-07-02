import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
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

type Campaign = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  message?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  // Distinguishes a real event (db.events, needs Register) from a campaign
  // (db.campaigns, tappable through to campaign-detail). Both are shown
  // together here since, from a citizen's point of view, both are just
  // "things this rep is running" — see CommunicationCenter.jsx on the rep
  // side, which merges the same two collections for the same reason.
  kind?: 'campaign' | 'event';
  location?: string;
};

// Every list endpoint here wraps its payload as
// {success, message, data: {items, total, page, per_page}}. The previous
// unwrap logic checked top-level `data.items` (never present) before
// `data.data` (the paginated object itself, not an array), so it grabbed the
// wrong thing and `.filter()` threw — silently caught, which is why this
// screen always rendered as empty regardless of what the API returned.
// Drill into `data.data` (or a bare array) first, then look for `.items`.
const extractItems = (data: any, altKeys: string[] = []): any[] => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  const payload = data.data ?? data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  for (const key of altKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const TYPE_ICONS: Record<string, string> = {
  AWARENESS: '📌', HEALTH: '🏥', EDUCATION: '📚',
  INFRASTRUCTURE: '🏗️', ENVIRONMENT: '🌿', WELFARE: '🤝', DEFAULT: '📢',
};
const TYPE_COLORS: Record<string, string> = {
  AWARENESS: '#8B5CF6', HEALTH: '#EF4444', EDUCATION: '#3B82F6',
  INFRASTRUCTURE: '#F59E0B', ENVIRONMENT: '#10B981', WELFARE: '#EC4899', DEFAULT: '#1D4ED8',
};

export default function Campaigns() {
  const tr = useT();
  const user = useAuthStore((s) => s.user);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const fetchCampaigns = useCallback(async () => {
    try {
      // Compare by calendar day, not exact timestamp — an event/campaign
      // dated "today" (commonly stored at midnight, or just earlier than the
      // current time-of-day) must still count as upcoming for the rest of
      // today, not get filtered out the moment the clock passes its stored
      // time. Using the current instant here previously hid same-day items.
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [campaignsRes, eventsRes] = await Promise.allSettled([
        api.get('/api/campaigns/?page=1&per_page=20&status=ACTIVE'),
        api.get('/api/events/?page=1&per_page=20&status=PUBLISHED'),
      ]);

      let campaignItems: Campaign[] = [];
      if (campaignsRes.status === 'fulfilled') {
        const raw = extractItems(campaignsRes.value.data, ['campaigns']);
        campaignItems = raw
          .filter((c: any) => {
            const end = c.endDate || c.end_date;
            return !end || new Date(end) >= today;
          })
          .map((c: any) => ({
            id: c._id || c.id,
            name: c.name || c.title,
            description: c.description || c.message,
            type: c.type,
            status: c.status,
            startDate: c.startDate || c.start_date,
            endDate: c.endDate || c.end_date,
            kind: 'campaign' as const,
          }));
      }

      let eventItems: Campaign[] = [];
      if (eventsRes.status === 'fulfilled') {
        const raw = extractItems(eventsRes.value.data, ['events']);
        const upcoming = raw.filter((e: any) => {
          // Same "still upcoming" filter as the dedicated Events screen —
          // a published event that already happened isn't worth showing here.
          const eventDate = e.eventDate || e.event_date || e.date;
          return !eventDate || new Date(eventDate) >= today;
        });
        eventItems = upcoming.map((e: any) => ({
          id: e._id || e.id,
          name: e.eventName || e.event_name || e.title || e.name,
          description: e.description,
          type: e.eventType || e.type,
          status: e.status,
          startDate: e.eventDate || e.event_date || e.date,
          location: e.venue || e.location,
          kind: 'event' as const,
        }));

        // The backend now tells us, per event, whether this citizen already
        // registered — seed local state from that instead of only relying
        // on the in-memory Set from a handleRegister call in this session,
        // which reset to empty on every remount (navigating away and back)
        // even though the registration was still there server-side.
        const alreadyRegistered = upcoming
          .filter((e: any) => e.registered)
          .map((e: any) => e._id || e.id);
        if (alreadyRegistered.length) {
          setRegisteredIds((prev) => {
            const next = new Set(prev);
            alreadyRegistered.forEach((id: string) => next.add(id));
            return next;
          });
        }
      }

      console.log('[campaigns.tsx] final eventItems count:', eventItems.length, 'campaignItems count:', campaignItems.length);
      setCampaigns([...eventItems, ...campaignItems]);
    } catch (err) {
      console.log('[campaigns.tsx] fetchCampaigns threw:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  const onRefresh = () => { setRefreshing(true); fetchCampaigns(); };

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const handleRegister = async (eventId: string) => {
    if (!user?.id) {
      Alert.alert(tr("Error"), tr("Please log in again to register."));
      return;
    }
    setRegistering(eventId);
    try {
      const res = await api.post(`/api/events/${eventId}/register`, { citizenId: user.id });
      const alreadyHad = res?.data?.message === "Already registered";
      setRegisteredIds((prev) => new Set(prev).add(eventId));
      Alert.alert(
        alreadyHad ? tr("Already Joined") : tr("Joined!"),
        alreadyHad ? tr("You have already joined this event.") : tr("You have successfully joined this event."),
      );
    } catch (err: any) {
      const d = err?.response?.data;
      const msg = d?.detail || d?.message || tr("Failed to register. Try again.");
      Alert.alert(tr("Error"), String(msg));
    } finally {
      setRegistering(null);
    }
  };

  const renderItem = ({ item }: { item: Campaign }) => {
    const isEvent = item.kind === 'event';
    const typeKey = item.type?.toUpperCase() ?? 'DEFAULT';
    const icon = TYPE_ICONS[typeKey] ?? TYPE_ICONS.DEFAULT;
    const color = TYPE_COLORS[typeKey] ?? TYPE_COLORS.DEFAULT;
    const displayTitle = item.name || item.title || (isEvent ? 'Untitled Event' : 'Untitled Campaign');

    // Every card (event or campaign) now shows the same full-width action
    // button at the bottom, instead of events getting a real button while
    // campaigns just got a plain "Tap to view & join" text link — same look
    // regardless of which collection the item actually lives in.
    return (
      <View style={s.card}>
        <View style={[s.typeStrip, { backgroundColor: color }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.icon}>{isEvent ? '📅' : icon}</Text>
            <View style={s.cardContent}>
              <View style={s.titleRow}>
                <Text style={s.cardTitle} numberOfLines={2}>{displayTitle}</Text>
                {item.status === 'ACTIVE' && (
                  <View style={s.activeBadge}><Text style={s.activeBadgeText}>{tr("Active")}</Text></View>
                )}
              </View>
              {(item.type || isEvent) && (
                <Text style={[s.typeLabel, { color }]}>{isEvent ? (item.type || tr('Event')) : item.type}</Text>
              )}
            </View>
          </View>
          {item.description && (
            <Text style={s.cardDesc} numberOfLines={3}>{item.description}</Text>
          )}
          {(item.startDate) && (
            <Text style={s.dateText}>
              📅 {formatDate(item.startDate)}
              {item.endDate ? ` → ${formatDate(item.endDate)}` : ''}
            </Text>
          )}
          {isEvent && item.location && (
            <Text style={s.dateText}>📍 {item.location}</Text>
          )}
          <TouchableOpacity
            style={[
              s.registerBtn,
              isEvent && (registering === item.id || registeredIds.has(item.id)) && s.registerBtnDone,
            ]}
            onPress={() =>
              isEvent
                ? handleRegister(item.id)
                : router.push(`/citizen/campaign-detail?id=${item.id}` as any)
            }
            disabled={isEvent && (registering === item.id || registeredIds.has(item.id))}
            activeOpacity={0.85}
          >
            <Text style={s.registerBtnText}>
              {isEvent
                ? registering === item.id
                  ? tr('Joining…')
                  : registeredIds.has(item.id)
                  ? `✓ ${tr('Joined')}`
                  : tr('Join Event')
                : tr('Join Campaign')}
            </Text>
          </TouchableOpacity>
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
          <Text style={s.headerTitle}>{tr('campaigns.title')}</Text>
          <Text style={s.headerSub}>{tr('campaigns.subtitle')}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📢</Text>
              <Text style={s.emptyTitle}>{tr('campaigns.noActive')}</Text>
              <Text style={s.emptyText}>{tr('campaigns.noActiveText')}</Text>
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
    backgroundColor: C.card, borderRadius: 14, marginBottom: 12, flexDirection: 'row',
    overflow: 'hidden', elevation: 2, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  typeStrip: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  icon: { fontSize: 26, marginRight: 10, marginTop: 2 },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  activeBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 10, color: '#166534', fontWeight: '700' },
  typeLabel: { fontSize: 12, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardDesc: { fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 8 },
  dateText: { fontSize: 12, color: C.textMuted },
  tapHint: { marginTop: 8 },
  tapHintText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  registerBtn: {
    backgroundColor: "#1D4ED8", borderRadius: 8,
    paddingVertical: 10, alignItems: "center", marginTop: 10,
  },
  registerBtnDone: {
    backgroundColor: "#16A34A",
  },
  registerBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
