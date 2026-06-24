import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useT } from '../../i18n/useT';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data } = await api.get('/api/campaigns/?page=1&per_page=20&status=ACTIVE');
      const list = Array.isArray(data) ? data : (data.items ?? data.results ?? data.campaigns ?? data.data ?? []);
      setCampaigns(list.map((c: any) => ({
        id: c._id || c.id,
        name: c.name || c.title,
        description: c.description || c.message,
        type: c.type,
        status: c.status,
        startDate: c.startDate || c.start_date,
        endDate: c.endDate || c.end_date,
      })));
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  const onRefresh = () => { setRefreshing(true); fetchCampaigns(); };

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const renderItem = ({ item }: { item: Campaign }) => {
    const typeKey = item.type?.toUpperCase() ?? 'DEFAULT';
    const icon = TYPE_ICONS[typeKey] ?? TYPE_ICONS.DEFAULT;
    const color = TYPE_COLORS[typeKey] ?? TYPE_COLORS.DEFAULT;
    const displayTitle = item.name || item.title || 'Untitled Campaign';

    return (
      <View style={s.card}>
        <View style={[s.typeStrip, { backgroundColor: color }]} />
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.icon}>{icon}</Text>
            <View style={s.cardContent}>
              <View style={s.titleRow}>
                <Text style={s.cardTitle} numberOfLines={2}>{displayTitle}</Text>
                {item.status === 'ACTIVE' && (
                  <View style={s.activeBadge}><Text style={s.activeBadgeText}>ACTIVE</Text></View>
                )}
              </View>
              {item.type && (
                <Text style={[s.typeLabel, { color }]}>{item.type}</Text>
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
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
