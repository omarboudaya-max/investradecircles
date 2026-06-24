import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, Video, CircleDot, FileText, X, Loader2, Check, ChevronDown, Plus } from 'lucide-react';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkRateLimit } from '@/lib/rateLimiter';
import { validate, validators, sanitize } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/query-client';

const ACCEPTED_FILE = '.pdf,.xls,.xlsx,.csv,.doc,.docx';

export default function CreatePostBox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { url, name, type }
  const [attachedImage, setAttachedImage] = useState(null); // { url, previewUrl }
  const [attachedVideo, setAttachedVideo] = useState(null); // { url, name }
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null); // 'photo' | 'video' | 'file'
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [circleSearch, setCircleSearch] = useState('');
  const [cropSrc, setCropSrc] = useState(null); // raw object URL for crop modal
  const pendingPhotoFileRef = useRef(null);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const navigate = useNavigate();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  // Fetch full user profile to get avatar_url
  const { data: userProfile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data?.[0],
  });

  const avatarUrl = userProfile?.avatar_url || null;

  const [validationError, setValidationError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const { data: circles = [] } = useQuery({
    queryKey: ['my-circles-post'],
    queryFn: () => supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    enabled: !!user?.id,
    staleTime: CACHE.medium,
    select: (data) => data.filter((c) => c.member_ids?.includes(user?.id) || c.created_by_id === user?.id),
  });

  // Fetch all profiles for tagging to ensure dropdown works even without connections
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-profiles-mention'],
    queryFn: () => supabase.from('profiles').select('id, full_name, email, avatar_url').limit(100).then(res => res.data || []),
    staleTime: CACHE.medium,
  });

  const filteredMentions = showMentions && mentionQuery
    ? allProfiles.filter(p => {
        const name = (p.full_name || p.email?.split('@')[0] || '').toLowerCase();
        return name.includes(mentionQuery);
      }).slice(0, 5)
    : [];

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Open crop modal first
    const objectUrl = URL.createObjectURL(file);
    pendingPhotoFileRef.current = file;
    setCropSrc(objectUrl);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploading(true);
    setUploadingType('photo');
    setUploadError(null);
    const previewUrl = URL.createObjectURL(blob);
    const croppedFile = new File([blob], pendingPhotoFileRef.current?.name || 'photo.jpg', { type: 'image/jpeg' });
    const filePath = `post_media/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('media').upload(filePath, croppedFile);
    if (error) {
      setUploadError(`Photo upload failed: ${error.message}`);
      setUploading(false);
      setUploadingType(null);
      return;
    }
    const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
    setAttachedImage({ url: file_url, previewUrl });
    setAttachedFile(null);
    setAttachedVideo(null);
    setUploading(false);
    setUploadingType(null);
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    pendingPhotoFileRef.current = null;
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadingType('video');
    setUploadError(null);
    const filePath = `post_media/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('media').upload(filePath, file);
    if (error) {
      setUploadError(`Video upload failed: ${error.message}`);
      setUploading(false);
      setUploadingType(null);
      e.target.value = '';
      return;
    }
    const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
    setAttachedVideo({ url: file_url, name: file.name });
    setAttachedFile(null);
    setAttachedImage(null);
    setUploading(false);
    setUploadingType(null);
    e.target.value = '';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadingType('file');
    setUploadError(null);
    const filePath = `post_media/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('media').upload(filePath, file);
    if (error) {
      setUploadError(`File upload failed: ${error.message}`);
      setUploading(false);
      setUploadingType(null);
      e.target.value = '';
      return;
    }
    const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
    setAttachedFile({ url: file_url, name: file.name, type: file.type });
    setAttachedImage(null);
    setAttachedVideo(null);
    setUploading(false);
    setUploadingType(null);
    e.target.value = '';
  };

  const clearAttachments = () => {
    setAttachedFile(null);
    setAttachedImage(null);
    setAttachedVideo(null);
  };

  const [postError, setPostError] = useState(null);

  const createPost = useMutation({
    mutationFn: (data) => supabase.from('Post').insert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      clearAttachments();
      setSelectedCircle(null);
      setPostError(null);
    },
    onError: (err) => {
      setPostError(err?.message || 'Failed to create post. Please try again.');
    },
  });

  const handlePost = () => {
    setValidationError(null);
    setRateLimitError(null);

    // Input validation
    const error = validate(content, [
      validators.required,
      validators.minLength(3),
      validators.maxLength(2000),
      validators.noScript,
    ]);
    if (error) { setValidationError(error); return; }

    // Rate limiting: max 5 posts per minute
    const { allowed, remainingMs } = checkRateLimit(`create-post-${user?.id}`, 5, 60_000);
    if (!allowed) {
      const secs = Math.ceil(remainingMs / 1000);
      setRateLimitError(`Too many posts. Please wait ${secs}s before posting again.`);
      return;
    }

    const sanitizedContent = sanitize(content);
    let postType = 'text';
    if (attachedImage) postType = 'photo';
    else if (attachedVideo) postType = 'video';
    else if (attachedFile) postType = 'document';

    logger.track('post_created', { post_type: postType, has_circle: !!selectedCircle });

    const payload = {
      content: sanitizedContent,
      author_name: displayName,
      author_avatar: avatarUrl,
      post_type: postType,
      created_by_id: user?.id,
    };

    if (selectedCircle) {
      payload.visibility = 'circle';
      payload.circle_id = selectedCircle.id;
    } else {
      payload.visibility = 'public';
    }

    if (attachedImage) payload.image_url = attachedImage.url;
    if (attachedVideo) payload.video_url = attachedVideo.url;
    if (attachedFile) {
      payload.file_url = attachedFile.url;
      payload.file_name = attachedFile.name;
      payload.file_type = attachedFile.type;
    }

    createPost.mutate(payload);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (validationError) setValidationError(null);
    if (rateLimitError) setRateLimitError(null);

    // Fast exit if no @
    if (!val.includes('@')) {
      if (showMentions) setShowMentions(false);
      return;
    }

    // Detect @ typing
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    // Check if @ is start of word
    if (lastAtPos !== -1 && (lastAtPos === 0 || /[\s\n]/.test(textBeforeCursor[lastAtPos - 1]))) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      // Fast heuristic to prevent heavy Regex on large text blocks
      if (textAfterAt.length < 30 && !textAfterAt.includes('\n') && !textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionStartIndex(lastAtPos);
        setShowMentions(true);
        return;
      }
    }
    if (showMentions) setShowMentions(false);
  };

  const handleMentionSelect = (profile) => {
    const mentionName = profile.full_name || profile.email?.split('@')[0] || 'User';
    const mentionText = `@[${mentionName}](${profile.id})`;
    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(textareaRef.current?.selectionStart || content.length);
    const newContent = before + mentionText + ' ' + after;
    setContent(newContent);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = before.length + mentionText.length + 1;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-5 shadow-sm relative">
      <div className="flex items-start gap-3 mb-3">
        <Link to={`/profile/${user?.id}`} className="shrink-0 hover:opacity-90 transition-opacity">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
              {displayName.charAt(0)}
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link to={`/profile/${user?.id}`} className="hover:underline">
            <p className="text-sm font-semibold">Hello! {displayName}</p>
          </Link>
          <p className="text-xs text-muted-foreground">What's in your mind to post today..</p>
        </div>
        <button
          onClick={() => navigate('/create-circle')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors shrink-0"
          title="Create a new circle"
        >
          <CircleDot className="w-3.5 h-3.5" />
          <Plus className="w-3 h-3" />
          New Circle
        </button>
      </div>

      {/* Circle badge if selected */}
      {selectedCircle && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-muted-foreground">Posting to:</span>
          <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <CircleDot className="w-3 h-3" /> {selectedCircle.name}
            <button onClick={() => setSelectedCircle(null)} className="ml-1 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Write something what you want post..."
          value={content}
          onChange={handleContentChange}
          className={`min-h-[80px] border-border resize-none mb-1 ${validationError ? 'border-destructive' : ''}`}
        />
        
        {/* Mentions Dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute z-50 left-2 top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-1">
              {filteredMentions.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleMentionSelect(profile)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-secondary text-left"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                      {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate font-medium">{profile.full_name || profile.email?.split('@')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {validationError && <p className="text-xs text-destructive mb-2">{validationError}</p>}
      {rateLimitError && <p className="text-xs text-orange-500 mb-2">{rateLimitError}</p>}
      {postError && <p className="text-xs text-destructive mb-2">{postError}</p>}
      {uploadError && <p className="text-xs text-destructive mb-2">{uploadError}</p>}

      {/* Image preview */}
      {attachedImage && (
        <div className="relative mb-3">
          <img src={attachedImage.previewUrl} alt="Preview" className="w-full rounded-xl object-contain max-h-80" />
          <button
            onClick={clearAttachments}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Video preview */}
      {attachedVideo && (
        <div className="relative mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200">
          <Video className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-xs text-purple-700 font-medium flex-1 truncate">{attachedVideo.name}</span>
          <button onClick={clearAttachments} className="text-purple-400 hover:text-purple-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <FileText className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs text-amber-700 font-medium flex-1 truncate">{attachedFile.name}</span>
          <button onClick={clearAttachments} className="text-amber-400 hover:text-amber-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
      <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE} className="hidden" onChange={handleFileSelect} />

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Circle button */}
          <div className="relative">
            <button
              onClick={() => setShowCirclePicker((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <CircleDot className="w-3.5 h-3.5" />
              Circle
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Circle dropdown — searchable, scrollable, compact */}
            {showCirclePicker && (() => {
              const filtered = circleSearch.trim()
                ? circles.filter((c) => c.name.toLowerCase().includes(circleSearch.toLowerCase()))
                : circles;
              return (
                <div className="absolute left-0 top-9 z-50 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                  {/* Search field */}
                  <div className="px-2 pt-2">
                    <input
                      type="text"
                      value={circleSearch}
                      onChange={(e) => setCircleSearch(e.target.value)}
                      placeholder="Search circles..."
                      className="w-full h-8 text-xs rounded-lg border border-border bg-muted/50 px-2.5 outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/60"
                      autoFocus
                    />
                  </div>
                  {/* Scrollable list (shows ~4 rows) */}
                  <div className="max-h-[148px] overflow-y-auto p-1" style={{ scrollbarWidth: 'none' }}>
                    <button
                      onClick={() => { setSelectedCircle(null); setShowCirclePicker(false); setCircleSearch(''); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary text-left"
                    >
                      <span className="flex-1">Public (no circle)</span>
                      {!selectedCircle && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                    {filtered.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        {circleSearch.trim() ? 'No matching circles.' : "You haven't joined any circles yet."}
                      </p>
                    ) : (
                      filtered.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCircle(c); setShowCirclePicker(false); setCircleSearch(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-secondary text-left"
                        >
                          <CircleDot className="w-3 h-3 text-primary shrink-0" />
                          <span className="flex-1 truncate">{c.name}</span>
                          {selectedCircle?.id === c.id && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Photo button */}
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            {uploading && uploadingType === 'photo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
            Photo
          </button>

          {/* Video button */}
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium hover:bg-purple-500/20 transition-colors disabled:opacity-50"
          >
            {uploading && uploadingType === 'video' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
            Video
          </button>

          {/* File button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {uploading && uploadingType === 'file' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {uploading && uploadingType === 'file' ? 'Uploading...' : 'File'}
          </button>
        </div>

        <Button
          onClick={handlePost}
          disabled={!content.trim() || createPost.isPending}
          size="sm"
          className="rounded-full bg-primary hover:bg-primary/90 px-5"
        >
          {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
        </Button>
      </div>

      {/* Close circle picker on outside click */}
      {showCirclePicker && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowCirclePicker(false); setCircleSearch(''); }} />
      )}

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={undefined}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
