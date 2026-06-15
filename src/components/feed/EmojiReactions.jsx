import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '🎉'];

export default function EmojiReactions({ post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const reactions = post.reactions || {};

  const toggleReaction = useMutation({
    mutationFn: async (emoji) => {
      const current = reactions[emoji] || [];
      const hasReacted = current.includes(user?.id);
      const updated = hasReacted
        ? current.filter((id) => id !== user?.id)
        : [...current, user?.id];

      const newReactions = { ...reactions, [emoji]: updated };
      // Clean up empty arrays
      Object.keys(newReactions).forEach((k) => {
        if (newReactions[k].length === 0) delete newReactions[k];
      });

      await supabase.from('Post').update({ reactions: newReactions }).eq('id', post.id);
    },
    onSuccess: () => {
      setPickerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const activeReactions = Object.entries(reactions).filter(([, users]) => users.length > 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {/* Existing reaction pills */}
      {activeReactions.map(([emoji, users]) => {
        const reacted = users.includes(user?.id);
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction.mutate(emoji)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
              reacted
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <span>{emoji}</span>
            <span>{users.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted transition-colors"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card border border-border rounded-2xl shadow-lg px-2 py-1.5 z-10"
            >
              {REACTIONS.map((emoji) => {
                const reacted = (reactions[emoji] || []).includes(user?.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction.mutate(emoji)}
                    className={`text-lg hover:scale-125 transition-transform p-0.5 rounded-lg ${reacted ? 'bg-primary/10' : ''}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}