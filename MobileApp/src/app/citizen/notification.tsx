import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useT } from '../../i18n/useT';

type Notif = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

const TYPE_ICON: Record<string, string> = {
  COMPLAINT: '📋', EVENT: '📅', CAMPAIGN: '📢',
  STATUS_UPDATE: '🔄', GENERAL: '🔔',
};

export default function NotificationsScreen() {
  const tr = useT();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications?page=1&per_page=50');
      const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      setNotifs(list.map((n: any) => ({
        id: n._id || n.id,
        title: n.title,
        message: n.message || n.body,
        type: n.type || n.notificationType,
        isRead: n.isRead || n.read,
        createdAt: n.createdAt || n.created_at,
      })));
      await api.post('/api/notifications/mark-all-read').catch(() => {});
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const formatTime = (dt?: string) => {
    if (!dt) return '';
    const d = new Date(dt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-IN');
  };

  const renderItem = ({ item }: { item: Notif }) => (
    <View style={[s.card, !item.isRead && s.cardUnread]}>
      <View style={s.iconBox}>
        <Text style={s.icon}>{TYPE_ICON[item.type?.toUpperCase() ?? ''] ?? '🔔'}</Text>
      </View>
      <View style={s.content}>
        {item.title && <Text style={s.title}>{item.title}</Text>}
        {item.message && <Text style={s.message} numberOfLines={3}>{item.message}</Text>}
        <Text style={s.time}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={s.unreadDot} />}
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{tr('notifications.title')}</Text>
        <View style={{ width: 50 }} />
      </View>
      {loading ? (
        <View style={s.centered}><ActivityIndicator size="large" color="#1D4ED8" /></View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifs(); }} colors={['#1D4ED8']} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔕</Text>
              <Text style={s.emptyText}>{tr('notifications.noNotifications')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1D4ED8', paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { color: '#BFDBFE', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#1D4ED8' },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  message: { fontSize: 13, color: '#475569', lineHeight: 18 },
  time: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D4ED8', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: '#64748B' },
});
