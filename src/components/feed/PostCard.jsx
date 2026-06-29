import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, FileText, Download, FileSpreadsheet, File, Trash2, Flag, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmojiReactions from '@/components/feed/EmojiReactions';
import CommentSection from '@/components/feed/CommentSection';
import SharePostModal from '@/components/feed/SharePostModal';
import ImageLightbox from '@/components/ui/ImageLightbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { getAppUrl } from '@/lib/app-url';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function PostCard({ post, onDeleted, readOnly = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslation();
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

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => supabase.from('Comment').select('*').match({ post_id: post.id }).order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  const topComment = comments.length > 0 ? [...comments].sort((a, b) => {
    const aScore = Object.values(a.reactions || {}).reduce((sum, list) => sum + (list?.length || 0), 0);
    const bScore = Object.values(b.reactions || {}).reduce((sum, list) => sum + (list?.length || 0), 0);
    if (aScore !== bScore) return bScore - aScore;
    return new Date(b.created_date) - new Date(a.created_date);
  })[0] : null;

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
    onError: (error) => toast({ title: t.postCard.postError || 'Failed to like post', description: error.message, variant: 'destructive' }),
  });

  const deletePost = useMutation({
    mutationFn: () => supabase.from('Post').delete().eq('id', post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      if (onDeleted) onDeleted(post.id);
      toast({ title: t.postCard.postDeleted });
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

  const renderContent = (text) => {
    if (!text) return null;
    const regex = /(@\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('@[')) {
        const m = /@\[([^\]]+)\]\(([^)]+)\)/.exec(token);
        if (m) {
          parts.push(
            <Link key={match.index} to={`/profile/${m[2]}`} className="text-primary font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
              {m[1]}
            </Link>
          );
        } else {
          parts.push(token);
        }
      } else {
        parts.push(
          <a key={match.index} href={token} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => e.stopPropagation()}>
            {token}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.created_by_id}`} className="shrink-0">
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={post.author_name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-base ring-2 ring-primary/20">
                {post.author_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>
          <div>
            <Link to={`/profile/${post.created_by_id}`} className="hover:underline">
              <p className="text-sm font-semibold">{post.author_name || t.postCard.unknown}</p>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {post.visibility || t.postCard.public}
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
              toast({ title: t.postCard.linkCopied });
            }}>
              <LinkIcon className="w-4 h-4 mr-2" /> {t.postCard.copyLink}
            </DropdownMenuItem>
            {isOwn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deletePost.mutate()}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> {t.postCard.deletePost}
                </DropdownMenuItem>
              </>
            )}
            {!isOwn && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-orange-600 focus:text-orange-600"
                  onClick={() => toast({ title: t.postCard.postReported, description: t.postCard.reportThankYou })}
                >
                  <Flag className="w-4 h-4 mr-2" /> {t.postCard.reportPost}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
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
              <p className="text-sm font-medium text-amber-800 truncate">{post.file_name || t.postCard.attachedDocument}</p>
              <p className="text-xs text-amber-600">{t.postCard.clickToOpen}</p>
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

      {!readOnly && (
        <div className="px-4 pb-3">
          <EmojiReactions post={post} />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => !readOnly && toggleLike.mutate()}
            disabled={readOnly}
            className={`flex items-center gap-1.5 text-sm transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : ''} ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span>{post.likes || 0}</span>
          </button>
          <button
            onClick={() => !readOnly && setShowComments(!showComments)}
            disabled={readOnly}
            className={`flex items-center gap-1.5 text-sm transition-colors ${readOnly ? 'opacity-50 cursor-not-allowed' : ''} ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{comments.length > 0 ? comments.length : t.postCard.comment}</span>
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

      {!showComments && topComment && (
        <div className="px-4 pb-4 cursor-pointer" onClick={() => setShowComments(true)}>
          <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl p-3 text-sm border border-border/50">
             <div className="flex items-center gap-2 mb-1.5">
               <Link to={`/profile/${topComment.created_by_id}`} className="shrink-0">
                 {topComment.author_avatar ? (
                   <img src={topComment.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover hover:opacity-90 transition-opacity" />
                 ) : (
                   <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary hover:opacity-90 transition-opacity">
                     {topComment.author_name?.charAt(0)?.toUpperCase()}
                   </div>
                 )}
               </Link>
               <Link to={`/profile/${topComment.created_by_id}`} className="hover:underline">
                 <span className="font-semibold text-foreground text-xs">{topComment.author_name}</span>
               </Link>
               <span className="text-[10px] text-muted-foreground ml-auto">{topComment.created_date ? formatDistanceToNow(new Date(topComment.created_date), { addSuffix: true }) : ''}</span>
             </div>
             <p className="text-foreground/90 pl-7 whitespace-pre-wrap">{renderContent(topComment.content)}</p>
          </div>
        </div>
      )}

      {showComments && (
        <div className="px-4 pb-4 border-t pt-3">
          <CommentSection postId={post.id} postAuthorId={post.created_by_id} />
        </div>
      )}

      {showShare && <SharePostModal post={post} onClose={() => setShowShare(false)} />}
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
