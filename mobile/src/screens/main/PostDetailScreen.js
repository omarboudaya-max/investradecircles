import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Send, Heart, MessageSquare } from 'lucide-react-native';

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params || {};
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId]);

  const fetchPostAndComments = async () => {
    try {
      const { data: postData } = await supabase
        .from('Post')
        .select('*')
        .eq('id', postId)
        .single();

      if (postData) setPost(postData);

      const { data: commentsData } = await supabase
        .from('Comment')
        .select('*')
        .eq('post_id', postId)
        .order('created_date', { ascending: true });

      setComments(commentsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('Comment')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment.trim(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error posting comment:', error);
      } else if (data) {
        setComments(prev => [...prev, data]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }) => {
    const createdDate = item.created_date || item.created_at;
    return (
      <View style={styles.commentItem}>
        <Text style={styles.commentAuthor}>Trader Member</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentTime}>
          {createdDate ? new Date(createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Discussion</Text>
      </View>

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
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderComment}
            contentContainerStyle={styles.listPadding}
            ListHeaderComponent={
              <View style={styles.postCard}>
                <Text style={styles.authorName}>Trader Author</Text>
                <Text style={styles.postTime}>
                  {post?.created_date || post?.created_at ? new Date(post.created_date || post.created_at).toLocaleString() : ''}
                </Text>
                <Text style={styles.postContent}>{post?.content}</Text>
                
                <View style={styles.postMetaRow}>
                  <View style={styles.metaItem}>
                    <Heart size={16} color="#94a3b8" />
                    <Text style={styles.metaCount}>{post?.likes_count || 0} Likes</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MessageSquare size={16} color="#94a3b8" />
                    <Text style={styles.metaCount}>{comments.length} Comments</Text>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
            }
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#94a3b8"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !newComment.trim() && { opacity: 0.5 }]}
              onPress={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={18} color="#ffffff" />
              )}
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
    fontWeight: '700',
    color: '#f8fafc',
  },
  listPadding: {
    padding: 16,
  },
  postCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  postTime: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  postContent: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 14,
  },
  postMetaRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCount: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 6,
  },
  commentItem: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryLight,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#f8fafc',
  },
  commentTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  noCommentsText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.cardDark,
    borderTopWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0b1329',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
