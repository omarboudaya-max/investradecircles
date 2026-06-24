import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Send, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { CACHE } from '@/lib/query-client';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '💡'];
const COMMENT_EMOJIS = ['😀','😂','❤️','🔥','👍','🎉','💰','📈','💡','🚀','😎','🤔','💪','🙏','✅','⚡','🌟','😮','👏','🤑'];

const renderContent = (text) => {
  if (!text) return null;
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <Link key={match.index} to={`/profile/${match[2]}`} className="text-primary font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
        {match[1]}
      </Link>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts;
};

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [sort, setSort] = useState('relevant');
  const [pickerFor, setPickerFor] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef();

  // Tagging states
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => supabase.from('Comment').select('*').match({ post_id: postId }).order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  useEffect(() => {
    const channel = supabase.channel(`public:Comment:${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comment', filter: `post_id=eq.${postId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

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

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setComment(val);

    if (!val.includes('@')) {
      if (showMentions) setShowMentions(false);
      return;
    }

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1 && (lastAtPos === 0 || /[\s\n]/.test(textBeforeCursor[lastAtPos - 1]))) {
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
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
    const before = comment.slice(0, mentionStartIndex);
    const after = comment.slice(inputRef.current?.selectionStart || comment.length);
    const newContent = before + mentionText + ' ' + after;
    setComment(newContent);
    setShowMentions(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = before.length + mentionText.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const addComment = useMutation({
    mutationFn: (content) =>
      supabase.from('Comment').insert({
        post_id: postId,
        content,
        author_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        author_avatar: user?.avatar_url || null,
        created_by_id: user?.id,
      }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const reactToComment = useMutation({
    mutationFn: async ({ commentId, emoji }) => {
      const c = comments.find((x) => x.id === commentId);
      const reactions = { ...(c?.reactions || {}) };
      const users = reactions[emoji] || [];
      reactions[emoji] = users.includes(user?.id)
        ? users.filter((id) => id !== user?.id)
        : [...users, user?.id];
      await supabase.from('Comment').update({ reactions }).eq('id', commentId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  const sorted = [...comments].sort((a, b) => {
    if (sort === 'relevant') {
      const scoreA = Object.values(a.reactions || {}).reduce((s, arr) => s + arr.length, 0);
      const scoreB = Object.values(b.reactions || {}).reduce((s, arr) => s + arr.length, 0);
      return scoreB - scoreA;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div>
      {/* Sort + count */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-1">
          {['newest', 'relevant'].map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                sort === s ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {s === 'newest' ? 'Newest' : 'Most Relevant'}
            </button>
          ))}
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3 mb-3">
        {sorted.map((c) => {
          const activeReactions = Object.entries(c.reactions || {}).filter(([, users]) => users.length > 0);
          return (
            <div key={c.id} className="flex gap-2">
              <Link to={`/profile/${c.created_by_id}`} className="shrink-0 mt-0.5">
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-border/50 hover:opacity-90 transition-opacity" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-[10px] font-bold hover:opacity-90 transition-opacity">
                    {(c.author_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/40 rounded-2xl px-3 py-2">
                  <Link to={`/profile/${c.created_by_id}`} className="hover:underline">
                    <p className="text-xs font-semibold mb-0.5">{c.author_name}</p>
                  </Link>
                  <p className="text-sm leading-relaxed">{renderContent(c.content)}</p>
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-1 ml-1">
                  <span className="text-[10px] text-muted-foreground">
                    {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true }) : ''}
                  </span>

                  {/* Existing reaction pills */}
                  {activeReactions.map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => reactToComment.mutate({ commentId: c.id, emoji })}
                      className={`text-[11px] px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 transition-colors ${
                        users.includes(user?.id)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted border-border text-muted-foreground hover:bg-primary/5'
                      }`}
                    >
                      {emoji} {users.length}
                    </button>
                  ))}

                  {/* React button */}
                  <div className="relative">
                    <button
                      onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}
                      className="text-[10px] text-muted-foreground hover:text-primary font-medium transition-colors"
                    >
                      + React
                    </button>
                    {pickerFor === c.id && (
                      <div className="absolute bottom-5 left-0 bg-card rounded-full border shadow-lg flex gap-1 p-1.5 z-20">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              reactToComment.mutate({ commentId: c.id, emoji });
                              setPickerFor(null);
                            }}
                            className="text-base hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (comment.trim()) addComment.mutate(comment);
        }}
        className="flex gap-2 items-center relative"
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-border/50" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Write a comment..."
            value={comment}
            onChange={handleCommentChange}
            className="h-8 text-sm rounded-full pr-8"
          />

          {/* Mentions Dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute z-50 left-0 bottom-full mb-1 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="p-1">
                {filteredMentions.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
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

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-10 left-0 bg-card rounded-2xl border shadow-xl p-3 z-30 w-64">
              <div className="grid grid-cols-10 gap-1">
                {COMMENT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setComment((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                    className="text-lg hover:scale-125 transition-transform p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!comment.trim()}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-40 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
