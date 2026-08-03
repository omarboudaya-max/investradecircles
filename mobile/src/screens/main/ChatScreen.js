import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, CheckCheck } from 'lucide-react-native';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, partnerId, partnerName, partnerAvatar } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    subscribeToRealtimeMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('DirectMessage')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_date', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
      } else {
        setMessages(data || []);
        markAsRead(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (msgs) => {
    const unreadIds = msgs.filter(m => m.recipient_id === user.id && !m.is_read).map(m => m.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('DirectMessage')
        .update({ is_read: true })
        .in('id', unreadIds);
    }
  };

  const subscribeToRealtimeMessages = () => {
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'DirectMessage',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      const { data, error } = await supabase
        .from('DirectMessage')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: partnerId,
          content: textToSend,
          sender_name: user.full_name || 'User',
          is_read: false,
        })
        .select('*')
        .single();

      if (error) console.error('Error sending message:', error);
    } catch (err) {
      console.error(err);
    }
  };

  const renderBubble = ({ item }) => {
    const isMine = item.sender_id === user.id;
    const createdDate = item.created_date || item.created_at;
    const timeStr = createdDate ? new Date(createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <View style={[styles.bubbleContainer, isMine ? styles.mineContainer : styles.partnerContainer]}>
        <View style={[styles.bubble, isMine ? styles.mineBubble : styles.partnerBubble]}>
          <Text style={[styles.bubbleText, isMine ? styles.mineText : styles.partnerText]}>
            {item.content}
          </Text>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, isMine ? styles.mineTime : styles.partnerTime]}>
              {timeStr}
            </Text>
            {isMine && (
              <CheckCheck size={14} color={item.is_read ? "#93c5fd" : "rgba(255,255,255,0.6)"} style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>{(partnerName || 'T').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerName}>{partnerName || 'Trader'}</Text>
          <Text style={styles.statusOnline}>Online</Text>
        </View>
      </View>

      {/* Chat Messages */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBubble}
            contentContainerStyle={styles.chatListPadding}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Start a conversation with {partnerName} 👋</Text>
              </View>
            }
          />

          {/* Telegram-style Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder={`Message ${partnerName || ''}...`}
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Send size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c1b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.cardDark,
    borderBottomWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  backBtn: {
    marginRight: 12,
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarMiniText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerMeta: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusOnline: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  chatListPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bubbleContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  mineContainer: {
    justifyContent: 'flex-end',
  },
  partnerContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mineBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  partnerBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  mineText: {
    color: '#ffffff',
  },
  partnerText: {
    color: '#f8fafc',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  mineTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  partnerTime: {
    color: '#64748b',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.cardDark,
    borderTopWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0b1329',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#f8fafc',
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
