import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, FileText, Download, FileSpreadsheet, File, Trash2, Flag, Link as LinkIcon } from 'lucide-react';
import EmojiReactions from '@/components/feed/EmojiReactions';
import CommentSection from '@/components/feed/CommentSection';
import SharePostModal from '@/components/feed/SharePostModal';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { getAppUrl } from '@/lib/app-url';

export default function PostCard({ post, onDeleted }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const liked = post.liked_by?.includes(user?.id);
  const isOwn = post.created_by_id === user?.id;
  const saved = post.saved_by?.includes(user?.id);

  // Always look up the author's current profile avatar to stay fresh
  const { data: authorProfile } = useQuery({
    queryKey: ['author-profile', post.created_by_id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: post.created_by_id }).then(res => res.data || []),
    enabled: !!post.created_by_id,
    select: (data) => data?.[0],
    staleTime: 5 * 60 * 1000,
  });
  const resolvedAvatar = authorProfile?.avatar_url || post.author_avatar || null;

  const toggleLike = useMutation({
    mutationFn: async () => {
      const likedBy = post.liked_by || [];
      const newLikedBy = liked ? likedBy.filter((id) => id !== user?.id) : [...likedBy, user?.id];
      const { error } = await supabase.from('Post').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
    },
    onError: (error) => toast({ title: 'Failed to like post', description: error.message, variant: 'destructive' }),
  });

  const deletePost = useMutation({
    mutationFn: () => supabase.from('Post').delete().eq('id', post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      if (onDeleted) onDeleted(post.id);
      toast({ title: 'Post deleted' });
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      const savedBy = post.saved_by || [];
      const newSavedBy = saved ? savedBy.filter((id) => id !== user?.id) : [...savedBy, user?.id];
      await supabase.from('Post').update({ saved_by: newSavedBy }).eq('id', post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts', user?.id] });
    },
  });

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={post.author_name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              onClick={() => setLightboxSrc(resolvedAvatar)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-base ring-2 ring-primary/20 shrink-0">
              {post.author_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">{post.author_name || 'Unknown'}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {post.visibility || 'Public'}
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`${getAppUrl()}/post/${post.id}`);
              toast({ title: 'Link copied!' });
            }}>
              <LinkIcon className="w-4 h-4 mr-2" /> Copy Link
            </DropdownMenuItem>
            {isOwn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deletePost.mutate()}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </DropdownMenuItem>
              </>
            )}
            {!isOwn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-orange-600 focus:text-orange-600"
                  onClick={() => toast({ title: 'Post reported', description: 'Thank you for your report.' })}
                >
                  <Flag className="w-4 h-4 mr-2" /> Report Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
      </div>

      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={post.image_url}
            alt=""
            className="w-full rounded-xl object-contain max-h-96 cursor-zoom-in hover:brightness-95 transition-all"
            onClick={() => setLightboxSrc(post.image_url)}
          />
        </div>
      )}

      {post.video_url && (
        <div className="px-4 pb-3">
          <video src={post.video_url} controls className="w-full rounded-xl max-h-96 bg-black" />
        </div>
      )}

      {post.file_url && (
        <div className="px-4 pb-3">
          <a
            href={post.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors group"
          >
            {post.file_type?.includes('spreadsheet') || post.file_name?.match(/\.(xls|xlsx|csv)$/i)
              ? <FileSpreadsheet className="w-8 h-8 text-green-600 shrink-0" />
              : post.file_type?.includes('pdf') || post.file_name?.match(/\.pdf$/i)
              ? <FileText className="w-8 h-8 text-red-500 shrink-0" />
              : <File className="w-8 h-8 text-amber-600 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 truncate">{post.file_name || 'Attached Document'}</p>
              <p className="text-xs text-amber-600">Click to open</p>
            </div>
            <Download className="w-4 h-4 text-amber-500 group-hover:text-amber-700 shrink-0" />
          </a>
        </div>
      )}

      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground">
          {post.created_date ? format(new Date(post.created_date), 'dd MMM yyyy') : ''}
        </p>
      </div>

      <div className="px-4 pb-3">
        <EmojiReactions post={post} />
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => toggleLike.mutate()}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{post.likes || 0}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Comment</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleSave.mutate()}
            className={`transition-colors ${saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="px-4 pb-4 border-t pt-3">
          <CommentSection postId={post.id} />
        </div>
      )}

      {showShare && <SharePostModal post={post} onClose={() => setShowShare(false)} />}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
