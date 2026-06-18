import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const C = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  bg: '#F8F9FF',
  card: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  open: '#3B82F6',
  inProgress: '#F59E0B',
  resolved: '#10B981',
  error: '#DC2626',
  warning: '#D97706',
  success: '#059669',
};

type Stats = { open: number; in_progress: number; resolved: number };
type Complaint = {
  id: string;
  title?: string;
  description: string;
  status: string;
  priority: string;
  createdAt?: string;
  created_at?: string;
};

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ open: 0, in_progress: 0, resolved: 0 });
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get(`/api/grievances/stats/citizen/${user?.id}`),
        api.get(`/api/grievances/citizen/${user?.id}?page=1`),
      ]);

      const s = sRes.data?.data ?? sRes.data;
      const byStatus: Record<string, number> = s.byStatus ?? {};
      setStats({
        open: byStatus.NEW ?? s.open ?? 0,
        in_progress: (byStatus.IN_PROGRESS ?? 0) + (byStatus.ASSIGNED ?? 0) + (byStatus.ON_HOLD ?? 0),
        resolved: (byStatus.RESOLVED ?? 0) + (byStatus.CLOSED ?? 0),
      });

      const c = cRes.data;
      const list = Array.isArray(c) ? c : (c.items ?? c.results ?? c.data ?? []);
      setRecent(list.slice(0, 3).map((g: any) => ({
        id: g._id || g.id,
        title: g.title,
        description: g.description || '',
        status: g.status || 'NEW',
        priority: g.priority || 'MEDIUM',
        createdAt: g.createdAt || g.created_at,
      })));
    } catch (_) {
      // silent — show empty states
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

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

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const ACTIONS = [
    { label: 'File\nComplaint', icon: '📋', route: '/citizen/new-complaint', bg: '#EEF2FF' },
    { label: 'My\nComplaints', icon: '📁', route: '/citizen/complaints', bg: '#F0FDF4' },
    { label: 'Events', icon: '📅', route: '/citizen/events', bg: '#FFF7ED' },
    { label: 'Campaigns', icon: '📢', route: '/citizen/campaigns', bg: '#FDF4FF' },
  ];

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.primaryDark} barStyle="light-content" />

      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Namaste,</Text>
          <Text style={s.userName}>{user?.name || 'Citizen'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/citizen/profile' as any)} style={s.avatar}>
          <Text style={s.avatarText}>{(user?.name || 'C').charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Open', val: stats.open, color: C.open },
            { label: 'In Progress', val: stats.in_progress, color: C.inProgress },
            { label: 'Resolved', val: stats.resolved, color: C.resolved },
          ].map((item) => (
            <View key={item.label} style={[s.statCard, { borderTopColor: item.color }]}>
              <Text style={[s.statNum, { color: item.color }]}>{item.val}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionCard, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route as any)}
            >
              <Text style={s.actionIcon}>{a.icon}</Text>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Complaints */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity onPress={() => router.push('/citizen/complaints' as any)}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>No complaints yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/citizen/new-complaint' as any)}>
              <Text style={s.emptyBtnText}>File your first complaint</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recent.map((c) => (
            <View key={c.id} style={s.complaintCard}>
              <View style={s.cardTop}>
                <Text style={s.cardDesc} numberOfLines={2}>{c.title || c.description}</Text>
                <View style={[s.statusBadge, { backgroundColor: `${statusColor(c.status)}18` }]}>
                  <Text style={[s.statusText, { color: statusColor(c.status) }]}>
                    {c.status?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <View style={[s.priorityBadge, { backgroundColor: priorityColor(c.priority) }]}>
                  <Text style={s.priorityText}>{c.priority}</Text>
                </View>
                <Text style={s.cardDate}>
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'Recently'}
                </Text>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: {
    backgroundColor: C.primary, paddingTop: 52, paddingBottom: 22,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { color: '#BFDBFE', fontSize: 13 },
  userName: { color: '#FFF', fontSize: 22, fontWeight: '700', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#93C5FD',
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderTopWidth: 3, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 10, color: C.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  actionCard: {
    width: '47%', borderRadius: 16, padding: 20, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  actionIcon: { fontSize: 30, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },
  complaintCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardDesc: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  priorityText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: C.textMuted },
  emptyCard: { backgroundColor: C.card, borderRadius: 14, padding: 32, alignItems: 'center', elevation: 1 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 15, color: C.textMuted, marginBottom: 18 },
  emptyBtn: { backgroundColor: C.primary, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
