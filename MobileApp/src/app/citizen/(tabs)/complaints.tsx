import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useT } from '../../../i18n/useT';

type Tr = (key: string) => string;

const priorityLabel = (p: string, tr: Tr) => {
  switch (p?.toUpperCase()) {
    case 'LOW':      return tr('complaints.low');
    case 'MEDIUM':   return tr('complaints.medium');
    case 'HIGH':     return tr('complaints.high');
    case 'CRITICAL': return tr('complaints.critical') || 'Critical';
    default:         return p || '';
  }
};

const statusDisplayLabel = (s: string, tr: Tr) => {
  switch (s?.toUpperCase()) {
    case 'NEW':         return tr('complaints.open');
    case 'OPEN':        return tr('complaints.open');
    case 'IN_PROGRESS': return tr('complaints.inProgress');
    case 'ASSIGNED':    return tr('complaints.assigned');
    case 'ON_HOLD':     return tr('complaints.onHold');
    case 'RESOLVED':    return tr('complaints.resolved');
    case 'CLOSED':      return tr('complaints.closed');
    default:            return (s || '').replace(/_/g, ' ');
  }
};

const C = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  bg: '#F8F9FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  open: '#3B82F6',
  inProgress: '#F59E0B',
  resolved: '#10B981',
  error: '#DC2626',
  warning: '#D97706',
  success: '#059669',
};

type Complaint = {
  id: string;
  title?: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  categoryId?: string;
  address?: string;
  createdAt?: string;
  created_at?: string;
};

// Keys stay as English for STATUS_MAP filtering logic
const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Open: ['OPEN', 'NEW'],
  'In Progress': ['IN_PROGRESS', 'ASSIGNED', 'ON_HOLD'],
  Resolved: ['RESOLVED', 'CLOSED'],
};

export default function MyComplaints() {
  const tr = useT();
  const { user } = useAuthStore();
  const [lang, setLang] = useState(0); // kept for compat, not used
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // FILTERS defined inside component so tr() picks up current language on re-render
  const FILTERS = [
    { key: 'All', label: tr('complaints.filterAll') },
    { key: 'Open', label: tr('complaints.filterOpen') },
    { key: 'In Progress', label: tr('complaints.filterInProgress') },
    { key: 'Resolved', label: tr('complaints.filterResolved') },
  ];

  const fetchComplaints = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      const { data } = await api.get(`/api/grievances/citizen/${user?.id}?page=${pageNum}`);
      const list: Complaint[] = Array.isArray(data) ? data : (data.items ?? data.results ?? data.data ?? []);
      const mapped = list.map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description || g.title || '',
        status: g.status || 'NEW',
        priority: g.priority || 'MEDIUM',
        category: g.category,
        categoryId: g.categoryId,
        address: g.address,
        createdAt: g.createdAt || g.created_at,
      }));
      if (refresh || pageNum === 1) {
        setComplaints(mapped);
      } else {
        setComplaints((prev) => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === 10);
      setPage(pageNum);
    } catch (_) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchComplaints(1); }, [fetchComplaints]);

  useEffect(() => {
    const statuses = STATUS_MAP[activeFilter];
    setFiltered(
      statuses.length === 0
        ? complaints
        : complaints.filter((c) => statuses.includes(c.status?.toUpperCase())),
    );
  }, [complaints, activeFilter]);

  const onRefresh = () => { setRefreshing(true); fetchComplaints(1, true); };
  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchComplaints(page + 1);
  };

  const statusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'OPEN': case 'NEW': return C.open;
      case 'IN_PROGRESS': case 'ASSIGNED': case 'ON_HOLD': return C.inProgress;
      case 'RESOLVED': case 'CLOSED': return C.resolved;
      default: return C.textMuted;
    }
  };

  const priorityColor = (p: string) => {
    switch (p?.toUpperCase()) {
      case 'LOW': return C.success;
      case 'MEDIUM': return C.warning;
      case 'HIGH': return C.error;
      case 'CRITICAL': return '#7C3AED';
      default: return C.textMuted;
    }
  };

  const renderItem = ({ item }: { item: Complaint }) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/citizen/complaint-detail?id=${item.id}` as any)}>
      <View style={s.cardHeader}>
        <Text style={s.cardId} numberOfLines={1}>#{item.id?.slice(-10).toUpperCase()}</Text>
        <View style={[s.statusBadge, { backgroundColor: `${statusColor(item.status)}18` }]}>
          <Text style={[s.statusText, { color: statusColor(item.status) }]}>
            {statusDisplayLabel(item.status, tr)}
          </Text>
        </View>
      </View>
      <Text style={s.cardDesc} numberOfLines={2}>{item.title || item.description}</Text>
      {(item.category || item.address) && (
        <Text style={s.cardMeta}>
          {[item.category, item.address].filter(Boolean).join(' · ')}
        </Text>
      )}
      <View style={s.cardFooter}>
        <View style={[s.priorityBadge, { backgroundColor: priorityColor(item.priority) }]}>
          <Text style={s.priorityText}>{priorityLabel(item.priority, tr)}</Text>
        </View>
        <Text style={s.cardDate}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : tr('common.recently')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{tr('complaints.title')}</Text>
          <Text style={s.headerSub}>{tr('complaints.trackSubtitle')}</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => router.push('/citizen/new-complaint' as any)}>
          <Text style={s.newBtnText}>{tr('complaints.newBtn')}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterBar}>
        {FILTERS.map((f) => {
          const count = f.key === 'All'
            ? complaints.length
            : complaints.filter((c) => STATUS_MAP[f.key].includes(c.status?.toUpperCase())).length;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.filterTab, activeFilter === f.key && s.filterTabActive]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>
                {f.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTitle}>{tr('complaints.noComplaints')}</Text>
              <Text style={s.emptyText}>
                {activeFilter === 'All'
                  ? tr('complaints.noComplaintsYetMsg')
                  : tr('complaints.noFilterComplaints').replace('{filter}', activeFilter.toLowerCase())}
              </Text>
              {activeFilter === 'All' && (
                <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/citizen/new-complaint' as any)}>
                  <Text style={s.emptyBtnText}>{tr('complaints.fileComplaint')}</Text>
                </TouchableOpacity>
              )}
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
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#BFDBFE', fontSize: 12 },
  newBtn: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  filterBar: {
    flexDirection: 'row', backgroundColor: C.card, paddingHorizontal: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 6,
  },
  filterTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9' },
  filterTabActive: { backgroundColor: C.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterTextActive: { color: '#FFF' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardId: { fontSize: 12, color: C.textMuted, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardDesc: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: C.textMuted, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  priorityText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: C.textMuted },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textMuted, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
