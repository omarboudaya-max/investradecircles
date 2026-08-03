import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';
import { Plus, X, Heart, Send } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Create Story Form
  const [storyContent, setStoryContent] = useState('');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, [user]);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('Story')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching Story table:', error);
      } else {
        setStories(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!storyContent.trim() && !storyMediaUrl.trim()) return;
    setPosting(true);

    try {
      const { error } = await supabase.from('Story').insert({
        content: storyContent.trim(),
        media_url: storyMediaUrl.trim() || null,
        author_name: user?.full_name || 'Trader Partner',
        author_avatar: user?.avatar_url || null,
        created_by_id: user?.id,
      });

      if (error) console.error('Error creating story:', error);

      setStoryContent('');
      setStoryMediaUrl('');
      setCreateModalOpen(false);
      fetchStories();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const openStoryViewer = (index) => {
    setActiveStoryIndex(index);
    setViewerModalOpen(true);
  };

  const activeStory = stories[activeStoryIndex];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Create Story Button */}
        <TouchableOpacity style={styles.storyItem} onPress={() => setCreateModalOpen(true)} activeOpacity={0.8}>
          <View style={styles.createAvatarCircle}>
            <Text style={styles.avatarText}>{(user?.full_name || 'U').charAt(0).toUpperCase()}</Text>
            <View style={styles.plusBadge}>
              <Plus size={12} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.storyName}>Your Story</Text>
        </TouchableOpacity>

        {/* Community Trader Stories */}
        {stories.map((story, idx) => {
          const authorInitial = (story.author_name || 'Trader').charAt(0).toUpperCase();

          return (
            <TouchableOpacity key={story.id} style={styles.storyItem} onPress={() => openStoryViewer(idx)} activeOpacity={0.8}>
              <View style={styles.storyRing}>
                <View style={styles.storyAvatar}>
                  {story.author_avatar ? (
                    <Image source={{ uri: story.author_avatar }} style={styles.storyAvatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{authorInitial}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {story.author_name ? story.author_name.split(' ')[0] : 'Trader'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Create Story Modal */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Trader Story</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.storyInput}
              placeholder="Write a quick market update or story..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={storyContent}
              onChangeText={setStoryContent}
            />

            <TextInput
              style={styles.urlInput}
              placeholder="Optional Image URL (https://...)"
              placeholderTextColor="#64748b"
              value={storyMediaUrl}
              onChangeText={setStoryMediaUrl}
            />

            <TouchableOpacity 
              style={[styles.publishBtn, (!storyContent.trim() && !storyMediaUrl.trim()) && { opacity: 0.5 }]}
              onPress={handleCreateStory}
              disabled={posting || (!storyContent.trim() && !storyMediaUrl.trim())}
            >
              {posting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.publishText}>Publish Story</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Story Viewer Modal */}
      <Modal visible={viewerModalOpen} animationType="fade" transparent>
        {activeStory && (
          <View style={styles.viewerOverlay}>
            <SafeAreaView style={styles.viewerContainer}>
              {/* Header */}
              <View style={styles.viewerHeader}>
                <View style={styles.viewerAuthorRow}>
                  <View style={styles.viewerAvatar}>
                    <Text style={styles.avatarText}>{(activeStory.author_name || 'T').charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.viewerAuthorName}>{activeStory.author_name || 'Trader Partner'}</Text>
                </View>

                <TouchableOpacity onPress={() => setViewerModalOpen(false)}>
                  <X size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Story Content Area */}
              <View style={styles.viewerBody}>
                {activeStory.media_url ? (
                  <Image source={{ uri: activeStory.media_url }} style={styles.viewerMedia} resizeMode="contain" />
                ) : null}

                {activeStory.content ? (
                  <View style={styles.storyTextBox}>
                    <Text style={styles.storyBodyText}>{activeStory.content}</Text>
                  </View>
                ) : null}
              </View>

              {/* Story Footer */}
              <View style={styles.viewerFooter}>
                <TouchableOpacity style={styles.reactionBtn} onPress={() => setViewerModalOpen(false)}>
                  <Heart size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  createAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.cardDark,
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  storyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  storyName: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  storyInput: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 14,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  urlInput: {
    backgroundColor: '#0b1329',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  publishBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  publishText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#050b18',
  },
  viewerContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  viewerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  viewerAuthorName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerMedia: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: 16,
  },
  storyTextBox: {
    backgroundColor: 'rgba(17, 28, 56, 0.9)',
    borderRadius: 20,
    padding: 24,
    maxWidth: SCREEN_WIDTH - 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  storyBodyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 28,
  },
  viewerFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reactionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
