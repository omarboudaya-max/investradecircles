import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Send, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '💡'];
const COMMENT_EMOJIS = ['😀','😂','❤️','🔥','👍','🎉','💰','📈','💡','🚀','😎','🤔','💪','🙏','✅','⚡','🌟','😮','👏','🤑'];

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [sort, setSort] = useState('newest');
  const [pickerFor, setPickerFor] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => supabase.from('Comment').select('*').match({ post_id: postId }).order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  const addComment = useMutation({
    mutationFn: (content) =>
      supabase.from('Comment').insert({
        post_id: postId,
        content,
        author_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        author_avatar: user?.avatar_url || null,
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
              {c.author_avatar ? (
                <img src={c.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-border/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                  {(c.author_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="bg-muted/40 rounded-2xl px-3 py-2">
                  <p className="text-xs font-semibold mb-0.5">{c.author_name}</p>
                  <p className="text-sm leading-relaxed">{c.content}</p>
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
            onChange={(e) => setComment(e.target.value)}
            className="h-8 text-sm rounded-full pr-8"
          />
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
