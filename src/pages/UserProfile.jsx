import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PostCard from '@/components/feed/PostCard';
import ConnectionButton from '@/components/profile/ConnectionButton';
import MessageButton from '@/components/messaging/MessageButton';
import CirclesGrid from '@/components/profile/CirclesGrid';
import ReputationBadges from '@/components/profile/ReputationBadges';
import PhotosCard from '@/components/profile/PhotosCard';
import { Camera, MapPin, Edit2, Check, X, Users, Loader2 } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';
import ImageCropModal from '@/components/ui/ImageCropModal';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileId = isOwnProfile ? currentUser?.id : userId;

  const USER_TYPE_LABELS = { innovator: '🚀 Innovator', investor: '💼 Investor' };
  const BUSINESS_TYPE_LABELS = {
    startup: 'Startup', small_business: 'Small Business', enterprise: 'Enterprise',
    freelancer: 'Freelancer / Solo', venture_capital: 'Venture Capital',
    angel_investor: 'Angel Investor', fund_manager: 'Fund Manager', other: 'Other',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'cover' | null
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxCoverOpen, setLightboxCoverOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const pendingUploadTypeRef = React.useRef(null);
  const pendingFileRef = React.useRef(null);
  const [localProfile, setLocalProfile] = useState({
    full_name: '',
    headline: '',
    location: '',
    bio: '',
    avatar_url: '',
    cover_image_url: '',
  });

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Sync localProfile from currentUser when not editing
  useEffect(() => {
    if (currentUser && isOwnProfile && !isEditing) {
      setLocalProfile({
        full_name: currentUser.full_name || '',
        headline: currentUser.headline || '',
        location: currentUser.location || '',
        bio: currentUser.bio || '',
        avatar_url: currentUser.avatar_url || '',
        cover_image_url: currentUser.cover_image_url || '',
      });
    }
  }, [currentUser?.id, isEditing]);

  // Fetch other user's public profile
  const { data: otherProfile, isLoading: loadingOther } = useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      if (error) throw error;
      return data;
    },
    enabled: !isOwnProfile && !!profileId,
  });

  const profile = isOwnProfile ? localProfile : otherProfile;
  const displayName = isOwnProfile
    ? (currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User')
    : (otherProfile?.full_name || otherProfile?.email?.split('@')[0] || 'User');

  // Save profile
  const saveProfile = useMutation({
    mutationFn: async () => {
      const updates = {
        full_name: localProfile.full_name,
        headline: localProfile.headline,
        location: localProfile.location,
        bio: localProfile.bio,
        avatar_url: localProfile.avatar_url,
        cover_image_url: localProfile.cover_image_url,
      };
      await supabase.auth.updateUser({ data: updates });
      const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setIsEditing(false);
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['public-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-story', profileId] });
    },
  });

  const handleImageUpload = async (file, type) => {
    // Open crop modal instead of uploading directly
    pendingUploadTypeRef.current = type;
    pendingFileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  };

  const handleCropConfirm = async (blob) => {
    const type = pendingUploadTypeRef.current;
    setCropSrc(null);
    setUploading(type);
    const croppedFile = new File([blob], pendingFileRef.current?.name || 'image.jpg', { type: 'image/jpeg' });
    const filePath = `user_${currentUser.id}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('media').upload(filePath, croppedFile);
    if (uploadError) throw uploadError;
    const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
    
    const update = type === 'avatar' ? { avatar_url: file_url } : { cover_image_url: file_url };
    await supabase.auth.updateUser({ data: update });
    await supabase.from('profiles').update(update).eq('id', currentUser.id);
    await refreshProfile();
    setLocalProfile((p) => ({ ...p, ...update }));
    setUploading(null);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    pendingUploadTypeRef.current = null;
    pendingFileRef.current = null;
  };

  // Connections count
  const { data: sentConns = [] } = useQuery({
    queryKey: ['profile-conns-sent', profileId],
    queryFn: async () => {
      const { data } = await supabase.from('Connection').select('*').eq('requester_id', profileId);
      return data || [];
    },
    enabled: !!profileId,
  });
  const { data: receivedConns = [] } = useQuery({
    queryKey: ['profile-conns-received', profileId],
    queryFn: async () => {
      const { data } = await supabase.from('Connection').select('*').eq('recipient_id', profileId);
      return data || [];
    },
    enabled: !!profileId,
  });
  const connectionsCount = [...sentConns, ...receivedConns].filter((c) => c.status === 'accepted').length;

  // Posts
  const { data: posts = [] } = useQuery({
    queryKey: ['profile-posts', profileId],
    queryFn: async () => {
      const { data } = await supabase.from('Post').select('*').eq('created_by_id', profileId).order('created_date', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!profileId,
  });

  const avatarUrl = isOwnProfile ? localProfile.avatar_url : otherProfile?.avatar_url;
  const coverUrl = isOwnProfile ? localProfile.cover_image_url : otherProfile?.cover_image_url;

  if (!isOwnProfile && loadingOther) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 pb-8">
      {/* Cover + Avatar */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 rounded-2xl overflow-hidden relative">
          {coverUrl && (
            <img
              src={coverUrl}
              alt="cover"
              className="w-full h-full object-cover cursor-zoom-in hover:brightness-95 transition-all"
              onClick={() => setLightboxCoverOpen(true)}
            />
          )}
          {isOwnProfile && (
            <label className="absolute bottom-3 right-3 cursor-pointer bg-black/40 hover:bg-black/60 text-white p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium">
              {uploading === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Edit Cover
              <input
                ref={coverInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'cover')}
              />
            </label>
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-300 shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => avatarUrl && setLightboxOpen(true)}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 cursor-pointer bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90 transition-colors">
                {uploading === 'avatar' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                <input
                  ref={avatarInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'avatar')}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-card rounded-2xl border shadow-sm pt-16 pb-5 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isOwnProfile && isEditing ? (
              <Input
                value={localProfile.full_name}
                onChange={(e) => setLocalProfile((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Full Name (First and Last Name)"
                className="text-xl font-bold h-10 mb-1"
              />
            ) : (
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            )}

            {/* User type + business type badges */}
            {((isOwnProfile ? currentUser?.user_type : otherProfile?.user_type) || (isOwnProfile ? currentUser?.business_type : otherProfile?.business_type)) && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {(isOwnProfile ? currentUser?.user_type : otherProfile?.user_type) && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {USER_TYPE_LABELS[isOwnProfile ? currentUser.user_type : otherProfile.user_type]}
                  </span>
                )}
                {(isOwnProfile ? currentUser?.business_type : otherProfile?.business_type) && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-200">
                    {BUSINESS_TYPE_LABELS[isOwnProfile ? currentUser.business_type : otherProfile.business_type]}
                  </span>
                )}
              </div>
            )}

            {isOwnProfile && isEditing ? (
              <Input
                value={localProfile.headline}
                onChange={(e) => setLocalProfile((p) => ({ ...p, headline: e.target.value }))}
                placeholder="Headline (e.g. Investor & Crypto Enthusiast)"
                className="mt-1.5 h-8 text-sm"
              />
            ) : (
              profile?.headline && (
                <p className="text-sm text-foreground mt-1">{profile.headline}</p>
              )
            )}

            {isOwnProfile && isEditing ? (
              <div className="flex items-center gap-2 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input
                  value={localProfile.location}
                  onChange={(e) => setLocalProfile((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Location"
                  className="h-7 text-xs"
                />
              </div>
            ) : (
              profile?.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </p>
              )
            )}

            <p className="text-sm text-primary font-medium mt-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {connectionsCount} connection{connectionsCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
            {isOwnProfile ? (
              isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full bg-primary h-8"
                    onClick={() => saveProfile.mutate()}
                    disabled={saveProfile.isPending}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setIsEditing(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full h-8 gap-1.5" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </Button>
              )
            ) : (
              <div className="flex items-center gap-2">
                <ConnectionButton currentUserId={currentUser?.id} targetUserId={profileId} />
                <MessageButton targetUserId={profileId} targetUserName={displayName} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reputation Badges */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <ReputationBadges userId={profileId} />
      </div>

      {/* About */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">About</h2>
        </div>
        {isOwnProfile && isEditing ? (
          <Textarea
            value={localProfile.bio}
            onChange={(e) => setLocalProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell your story — your background, investment philosophy, interests..."
            className="min-h-[100px] text-sm"
          />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile?.bio || (isOwnProfile ? 'Add a bio to tell others about yourself...' : 'No bio yet.')}
          </p>
        )}
      </div>

      {/* Circles */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <h2 className="text-base font-semibold mb-4">Circles</h2>
        <CirclesGrid userId={profileId} />
      </div>

      {/* Photos */}
      <PhotosCard userId={profileId} />

      {/* Recent Activity */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 px-1">Recent Activity</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox — profile picture */}
      {lightboxOpen && avatarUrl && (
        <ImageLightbox src={avatarUrl} alt={displayName} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Lightbox — cover photo */}
      {lightboxCoverOpen && coverUrl && (
        <ImageLightbox src={coverUrl} alt="Cover photo" onClose={() => setLightboxCoverOpen(false)} />
      )}

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={pendingUploadTypeRef.current === 'avatar' ? 1 : 16 / 9}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
