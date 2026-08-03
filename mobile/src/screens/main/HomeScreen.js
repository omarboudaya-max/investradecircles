import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Image,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import StoryBar from '../../components/StoryBar';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Search, 
  Bell, 
  Settings, 
  TrendingUp, 
  Plus, 
  Send, 
  X, 
  Camera, 
  Video, 
  FileText, 
  CircleDot, 
  Image as ImageIcon 
} from 'lucide-react-native';

const FEED_TABS = [
  { key: 'all', label: 'All Feed' },
  { key: 'featured', label: 'Featured' },
  { key: 'markets', label: 'Markets' },
  { key: 'analysis', label: 'Analysis' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedVideo, setAttachedVideo] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);
  
  const displayName = user?.full_name || 'Trader Partner';
  const initial = displayName.charAt(0).toUpperCase();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching Post table:', error);
      } else {
        const authorIds = [...new Set((data || []).map(p => p.author_id || p.user_id).filter(Boolean))];
        let profilesMap = {};
        
        if (authorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', authorIds);
          
          (profilesData || []).forEach(prof => {
            profilesMap[prof.id] = prof;
          });
        }

        const enrichedPosts = (data || []).map(p => ({
          ...p,
          authorProfile: profilesMap[p.author_id || p.user_id] || { full_name: 'Trader Partner' }
        }));

        setPosts(enrichedPosts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setAttachedImage({ uri: result.assets[0].uri });
      setAttachedVideo(null);
      setAttachedFile(null);
    }
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setAttachedVideo({ uri: result.assets[0].uri, name: 'Video Attachment' });
      setAttachedImage(null);
      setAttachedFile(null);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });
    if (!result.canceled && result.assets?.[0]) {
      setAttachedFile({ uri: result.assets[0].uri, name: result.assets[0].name });
      setAttachedImage(null);
      setAttachedVideo(null);
    }
  };

  const clearAttachments = () => {
    setAttachedImage(null);
    setAttachedVideo(null);
    setAttachedFile(null);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !attachedImage && !attachedVideo && !attachedFile) return;
    setSubmittingPost(true);

    try {
      const { error } = await supabase
        .from('Post')
        .insert({
          content: postContent.trim(),
          author_id: user.id,
          created_by_id: user.id,
          author_name: displayName,
          image_url: attachedImage ? attachedImage.uri : null,
          video_url: attachedVideo ? attachedVideo.uri : null,
          file_name: attachedFile ? attachedFile.name : null,
          likes_count: 0,
          comments_count: 0,
        });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setPostContent('');
        clearAttachments();
        setCreateModalOpen(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId, currentLikes = 0) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
    try {
      await supabase
        .from('Post')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', postId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authorProfile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || (p.category || 'markets').toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  });

  const renderPostItem = ({ item }) => {
    const authorName = item.authorProfile?.full_name || 'Trader Partner';
    const authorRole = item.authorProfile?.role || 'Trader';
    const postInitial = authorName.charAt(0).toUpperCase();
    const createdDate = item.created_date || item.created_at;

    return (
      <TouchableOpacity 
        className="bg-card rounded-lg p-4 mx-4 mb-3 border border-border"
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        activeOpacity={0.85}
      >
        <View className="flex-row items-center mb-3">
          <View className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-3">
            {item.authorProfile?.avatar_url ? (
              <Image source={{ uri: item.authorProfile.avatar_url }} className="w-11 h-11 rounded-full" />
            ) : (
              <Text className="text-primary-foreground font-extrabold text-base">{postInitial}</Text>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-[15px] font-bold text-foreground mr-2">{authorName}</Text>
              <View className="bg-blue-500/20 px-2 py-0.5 rounded-md">
                <Text className="text-primary text-[10px] font-bold uppercase">{authorRole}</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {createdDate ? new Date(createdDate).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>

        <Text className="text-[15px] text-foreground leading-6 mb-3">{item.content}</Text>

        {!!(item.image_url || item.media_url) && (
          <Image 
            source={{ uri: item.image_url || item.media_url }} 
            className="w-full h-[200px] rounded-md mb-3" 
            resizeMode="cover" 
          />
        )}

        {!!item.file_name && (
          <View className="flex-row items-center bg-background rounded p-2.5 mb-3 border border-border">
            <FileText size={18} color="#06b6d4" className="mr-2" />
            <Text className="text-foreground text-[13px] font-semibold">{item.file_name}</Text>
          </View>
        )}

        <View className="flex-row items-center border-t border-border pt-2.5 mt-1">
          <TouchableOpacity className="flex-row items-center mr-6" onPress={() => handleLikePost(item.id, item.likes_count || 0)}>
            <Heart size={18} color="#ef4444" />
            <Text className="text-muted-foreground text-[13px] ml-1.5 font-semibold">{item.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center mr-6" onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
            <MessageSquare size={18} color="#64748b" />
            <Text className="text-muted-foreground text-[13px] ml-1.5 font-semibold">{item.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center">
            <Share2 size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View className="bg-card px-4 pt-3 pb-3.5 border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <TrendingUp size={22} color="#06b6d4" className="mr-2" />
            <Text className="text-xl font-black text-foreground tracking-widest">INVESTRADERS</Text>
          </View>
          
          <View className="flex-row items-center gap-2">
            <TouchableOpacity className="flex-row items-center bg-primary px-3 py-1.5 rounded-full" onPress={() => setCreateModalOpen(true)}>
              <Plus size={18} color="#ffffff" className="mr-1" />
              <Text className="text-primary-foreground text-[13px] font-bold">Post</Text>
            </TouchableOpacity>

            <TouchableOpacity className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 items-center justify-center" onPress={() => navigation.navigate('Notifications')}>
              <Bell size={20} color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 items-center justify-center" onPress={() => navigation.navigate('Settings')}>
              <Settings size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-background rounded-md px-3 py-2 border border-border mb-2.5">
          <Search size={18} color="#64748b" className="mr-2" />
          <TextInput
            className="flex-1 text-foreground text-[14px]"
            placeholder="Search posts, market trends & traders..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Tabs */}
        <View className="flex-row gap-2">
          {FEED_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity 
                key={tab.key} 
                className={`px-3 py-1.5 rounded-full ${active ? 'bg-primary' : 'bg-black/5 dark:bg-white/5'}`}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text className={`text-xs ${active ? 'text-primary-foreground font-bold' : 'text-muted-foreground font-semibold'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Feed List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#06b6d4" />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />
          }
          ListHeaderComponent={
            <View>
              <StoryBar />

              <TouchableOpacity 
                className="bg-card rounded-lg p-4 mx-4 mt-3 mb-3.5 border border-border"
                onPress={() => setCreateModalOpen(true)}
                activeOpacity={0.9}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                    <Text className="text-primary-foreground font-extrabold text-base">{initial}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-foreground">{displayName}</Text>
                    <Text className="text-[13px] text-muted-foreground mt-0.5">What's on your mind? Share trades...</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border-t border-border pt-2.5">
                  <TouchableOpacity className="flex-row items-center bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full" onPress={pickPhoto}>
                    <ImageIcon size={16} color="#10b981" className="mr-1.5" />
                    <Text className="text-foreground text-xs font-semibold">Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full" onPress={pickVideo}>
                    <Video size={16} color="#a855f7" className="mr-1.5" />
                    <Text className="text-foreground text-xs font-semibold">Video</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full" onPress={pickDocument}>
                    <FileText size={16} color="#f59e0b" className="mr-1.5" />
                    <Text className="text-foreground text-xs font-semibold">File</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center bg-black/5 dark:bg-white/5 px-2.5 py-1.5 rounded-full" onPress={() => navigation.navigate('CirclesTab')}>
                    <CircleDot size={16} color="#3b82f6" className="mr-1.5" />
                    <Text className="text-foreground text-xs font-semibold">Circle</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Text className="text-muted-foreground text-[15px]">No posts available in this feed topic.</Text>
            </View>
          }
        />
      )}

      {/* Create Post Modal */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-card rounded-t-lg p-5 min-h-[400px]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-extrabold text-foreground">Create Market Post</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)}>
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-background rounded-md p-3.5 text-foreground text-[15px] min-h-[120px] text-top border border-border mb-3"
              placeholder="Share market insights, charts, or analysis..."
              placeholderTextColor="#94a3b8"
              multiline
              autoFocus
              value={postContent}
              onChangeText={setPostContent}
              textAlignVertical="top"
            />

            {(attachedImage || attachedVideo) && (
              <View className="relative mb-3">
                <Image 
                  source={{ uri: (attachedImage || attachedVideo).uri }} 
                  className="w-full h-40 rounded-md" 
                  resizeMode="cover" 
                />
                <TouchableOpacity className="absolute top-2 right-2 bg-black/70 rounded-full p-1" onPress={clearAttachments}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {attachedFile && (
              <View className="flex-row items-center justify-between bg-background rounded p-3 mb-3">
                <Text className="text-foreground text-[13px] flex-1">{attachedFile.name}</Text>
                <TouchableOpacity onPress={clearAttachments}>
                  <X size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row gap-2.5 mb-4">
              <TouchableOpacity className="flex-row items-center bg-background px-3 py-2 rounded-full border border-border" onPress={pickPhoto}>
                <Camera size={18} color="#10b981" />
                <Text className="text-foreground text-[13px] font-semibold ml-1.5">Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center bg-background px-3 py-2 rounded-full border border-border" onPress={pickVideo}>
                <Video size={18} color="#a855f7" />
                <Text className="text-foreground text-[13px] font-semibold ml-1.5">Video</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center bg-background px-3 py-2 rounded-full border border-border" onPress={pickDocument}>
                <FileText size={18} color="#f59e0b" />
                <Text className="text-foreground text-[13px] font-semibold ml-1.5">File</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              className={`bg-primary rounded-md py-3.5 items-center ${(!postContent.trim() && !attachedImage && !attachedVideo && !attachedFile) ? 'opacity-50' : ''}`}
              onPress={handleCreatePost}
              disabled={submittingPost || (!postContent.trim() && !attachedImage && !attachedVideo && !attachedFile)}
            >
              {submittingPost ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View className="flex-row items-center">
                  <Send size={18} color="#ffffff" className="mr-2" />
                  <Text className="text-primary-foreground text-base font-bold">Publish Post</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
