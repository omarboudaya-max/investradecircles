import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Search, Settings, Bell } from 'lucide-react-native';

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('DirectMessage')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('Error fetching DirectMessage table:', error);
      } else {
        const userIds = [...new Set((data || []).flatMap(m => [m.sender_id, m.recipient_id]).filter(id => id && id !== user.id))];
        let profilesMap = {};

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', userIds);

          (profilesData || []).forEach(prof => {
            profilesMap[prof.id] = prof;
          });
        }

        // Group by conversation
        const convMap = {};
        (data || []).forEach(msg => {
          const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
          const convId = msg.conversation_id || makeConversationId(user.id, partnerId);
          
          if (!convMap[convId] || new Date(msg.created_date || msg.created_at) > new Date(convMap[convId].lastDate)) {
            convMap[convId] = {
              convId,
              partnerId,
              partnerProfile: profilesMap[partnerId] || { full_name: 'Trader' },
              lastMessage: msg.content,
              lastDate: msg.created_date || msg.created_at,
              isMine: msg.sender_id === user.id,
              unreadCount: (data || []).filter(m => (m.conversation_id === convId || m.sender_id === partnerId) && m.recipient_id === user.id && !m.is_read).length,
            };
          }
        });

        const convList = Object.values(convMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
        setConversations(convList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const filteredConversations = conversations.filter(c =>
    !searchQuery ||
    c.partnerProfile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = (item) => {
    navigation.navigate('Chat', {
      conversationId: item.convId,
      partnerId: item.partnerId,
      partnerName: item.partnerProfile?.full_name || 'Trader',
      partnerAvatar: item.partnerProfile?.avatar_url,
    });
  };

  const renderItem = ({ item }) => {
    const partnerName = item.partnerProfile?.full_name || 'Trader Partner';
    const initial = partnerName.charAt(0).toUpperCase();

    return (
      <TouchableOpacity style={styles.msgCard} activeOpacity={0.85} onPress={() => openChat(item)}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
          {item.unreadCount > 0 && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.msgMeta}>
          <View style={styles.msgHeaderRow}>
            <Text style={[styles.partnerName, item.unreadCount > 0 && styles.unreadText]}>{partnerName}</Text>
            <Text style={styles.timeText}>
              {item.lastDate ? new Date(item.lastDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
          </View>
          <View style={styles.snippetRow}>
            <Text style={[styles.msgSnippet, item.unreadCount > 0 && styles.unreadSnippet]} numberOfLines={1}>
              {item.isMine ? `You: ${item.lastMessage}` : item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Direct Messages</Text>
          <View style={styles.headerIconsRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={20} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.convId}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MessageSquare size={48} color="#475569" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No conversations yet.</Text>
              <Text style={styles.emptySubtext}>Visit a member's profile or circle to start chatting!</Text>
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
  topHeader: {
    backgroundColor: theme.colors.cardDark,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  listPadding: {
    padding: 16,
  },
  msgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: theme.colors.cardDark,
  },
  msgMeta: {
    flex: 1,
  },
  msgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  unreadText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
  },
  snippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  msgSnippet: {
    fontSize: 13,
    color: '#94a3b8',
    flex: 1,
  },
  unreadSnippet: {
    color: '#93c5fd',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
