import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const REACTIONS = ['❤️', '🔥', '👏', '😮', '😂'];

export default function StoryViewer({ stories, startIndex = 0, onClose, onReact }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);

  const story = stories[current];

  useEffect(() => {
    if (!story) return;
    // Mark as viewed
    if (user?.id && !(story.viewed_by || []).includes(user.id)) {
      supabase.from('Story').update({
        viewed_by: [...(story.viewed_by || []).eq('id', story.id), user.id],
      });
    }
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          if (current < stories.length - 1) setCurrent((c) => c + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [current, story?.id]);

  if (!story) return null;

  const react = async (emoji) => {
    const reactions = { ...(story.reactions || {}) };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(user.id)) {
      reactions[emoji] = [...reactions[emoji], user.id];
      await supabase.from('Story').update({ reactions }).eq('id', story.id);
      onReact?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-screen max-h-[700px] rounded-2xl overflow-hidden bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Author */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
              {story.author_avatar
                ? <img src={story.author_avatar} className="w-full h-full object-cover" alt="" />
                : story.author_name?.charAt(0)}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow">{story.author_name}</span>
          </div>
          <button onClick={onClose} className="text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {story.video_url
          ? <video src={story.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          : story.image_url
          ? <img src={story.image_url} alt="" className="w-full h-full object-cover" />
          : <div className={`w-full h-full ${story.bg_gradient || 'bg-gradient-to-br from-blue-600 to-cyan-500'} flex items-center justify-center p-8`}>
              <p className="text-white text-2xl font-bold text-center">{story.text}</p>
            </div>
        }
        {story.text && (story.image_url || story.video_url) && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <p className="text-white text-lg font-semibold text-center drop-shadow-lg">{story.text}</p>
          </div>
        )}

        {/* Nav arrows */}
        {current > 0 && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white z-10"
            onClick={(e) => { e.stopPropagation(); setCurrent(current - 1); }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {current < stories.length - 1 && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white z-10"
            onClick={(e) => { e.stopPropagation(); setCurrent(current + 1); }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Reactions */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-10">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="text-2xl hover:scale-125 transition-transform drop-shadow"
              onClick={(e) => { e.stopPropagation(); react(emoji); }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}