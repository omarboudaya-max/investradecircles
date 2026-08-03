import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Bell, Heart, MessageSquare, Users, ShieldAlert } from 'lucide-react-native';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching Notification table:', error);
      } else {
        setNotifications(data || []);
        markAllRead(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllRead = async (items) => {
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('Notification')
        .update({ is_read: true })
        .in('id', unreadIds);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#ef4444" />;
      case 'comment':
        return <MessageSquare size={20} color="#3b82f6" />;
      case 'circle_invite':
        return <Users size={20} color="#06b6d4" />;
      default:
        return <Bell size={20} color="#f59e0b" />;
    }
  };

  const renderItem = ({ item }) => {
    const createdDate = item.created_date || item.created_at;
    return (
      <View style={[styles.notifCard, !item.is_read && styles.unreadCard]}>
        <View style={styles.iconCircle}>
          {getIcon(item.type)}
        </View>

        <View style={styles.notifMeta}>
          <Text style={styles.notifMessage}>{item.message || item.content || 'New community notification'}</Text>
          <Text style={styles.notifTime}>
            {createdDate ? new Date(createdDate).toLocaleDateString() + ' at ' + new Date(createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }} 
              tintColor={theme.colors.primaryLight} 
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={48} color="#475569" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>You're all caught up!</Text>
              <Text style={styles.emptySubtext}>No new notifications right now.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.cardDark,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  listPadding: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  unreadCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: theme.colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifMeta: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 14,
    color: '#f8fafc',
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
});
