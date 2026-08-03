import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { theme } from '../../theme/theme';
import { Users, ArrowLeft, Heart, MessageSquare } from 'lucide-react-native';

export default function CircleDetailScreen({ route, navigation }) {
  const { circleId, circleName } = route.params || {};
  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircleDetails();
  }, [circleId]);

  const fetchCircleDetails = async () => {
    try {
      const { data: circleData } = await supabase
        .from('Circle')
        .select('*')
        .eq('id', circleId)
        .single();

      if (circleData) setCircle(circleData);

      const { data: circlePosts } = await supabase
        .from('Post')
        .select('*')
        .eq('circle_id', circleId)
        .order('created_date', { ascending: false });

      setPosts(circlePosts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }) => {
    const createdDate = item.created_date || item.created_at;
    return (
      <View style={styles.postCard}>
        <Text style={styles.authorName}>Circle Member</Text>
        <Text style={styles.postDate}>{createdDate ? new Date(createdDate).toLocaleDateString() : 'Recently'}</Text>
        <Text style={styles.postContent}>{item.content}</Text>
        <View style={styles.postFooter}>
          <View style={styles.actionBtn}>
            <Heart size={16} color="#94a3b8" />
            <Text style={styles.actionCount}>{item.likes_count || 0}</Text>
          </View>
          <View style={styles.actionBtn}>
            <MessageSquare size={16} color="#94a3b8" />
            <Text style={styles.actionCount}>{item.comments_count || 0}</Text>
          </View>
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
        <Text style={styles.headerTitle}>{circleName || circle?.name || 'Circle Details'}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.listPadding}
          ListHeaderComponent={
            <View style={styles.bannerCard}>
              <View style={styles.circleHeaderRow}>
                <View style={styles.iconCircle}>
                  <Users size={28} color={theme.colors.primaryLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.circleTitle}>{circle?.name}</Text>
                  <Text style={styles.memberCount}>
                    {Array.isArray(circle?.member_ids) ? circle.member_ids.length : 0} Traders Joined
                  </Text>
                </View>
              </View>
              <Text style={styles.circleDesc}>
                {circle?.description || 'Exclusive discussions and trade ideas.'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No posts in this circle yet.</Text>
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
    fontWeight: '700',
    color: '#f8fafc',
  },
  listPadding: {
    padding: 16,
  },
  bannerCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  circleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  circleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  memberCount: {
    fontSize: 13,
    color: theme.colors.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  circleDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  postCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  postDate: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
