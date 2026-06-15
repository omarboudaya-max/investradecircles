import React, { useState } from 'react';
import { X, Link2, Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { getAppUrl } from '@/lib/app-url';

export default function ShareCircleModal({ circle, onClose, onPostAsStory }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [postingStory, setPostingStory] = useState(false);
  const [storyPosted, setStoryPosted] = useState(false);

  const circleUrl = `${getAppUrl()}/circle/${circle.id}`;

  const copy = () => {
    navigator.clipboard.writeText(circleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: circle.name, text: circle.description || `Join my circle: ${circle.name}`, url: circleUrl });
    }
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join my circle "${circle.name}" on Investraders! ${circleUrl}`)}`, '_blank');
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my circle "${circle.name}" on Investraders! ${circleUrl}`)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(circleUrl)}&text=${encodeURIComponent(`Join my circle "${circle.name}" on Investraders!`)}`, '_blank');
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(circleUrl)}`, '_blank');
  };

  const postAsStory = async () => {
    setPostingStory(true);
    const userData = await supabase.from('profiles').select('*').match({ id: user.id }).then(res => res.data || []);
    const profile = userData?.[0];
    await supabase.from('Story').insert({
      author_id: user.id,
      author_name: user.full_name || user.email?.split('@')[0],
      author_avatar: profile?.avatar_url || null,
      image_url: circle.cover_image || null,
      text: `Join my circle: ${circle.name}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewed_by: [],
      reactions: {},
    });
    setPostingStory(false);
    setStoryPosted(true);
    onPostAsStory?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share Circle
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Circle preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {circle.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{circle.name}</p>
              <p className="text-xs text-muted-foreground">{circle.member_ids?.length || 0} members</p>
            </div>
          </div>

          {/* Copy link */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Circle Link
            </p>
            <div className="flex gap-2">
              <Input value={circleUrl} readOnly className="h-8 text-xs rounded-lg" />
              <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-lg gap-1" onClick={copy}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social platforms */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Share via</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">💬</div>
                <span className="text-[10px] text-muted-foreground">WhatsApp</span>
              </button>
              <button onClick={shareTwitter} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">𝕏</div>
                <span className="text-[10px] text-muted-foreground">Twitter/X</span>
              </button>
              <button onClick={shareTelegram} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white text-xl">✈️</div>
                <span className="text-[10px] text-muted-foreground">Telegram</span>
              </button>
              <button onClick={shareLinkedIn} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm">in</div>
                <span className="text-[10px] text-muted-foreground">LinkedIn</span>
              </button>
            </div>
            {navigator.share && (
              <Button variant="outline" size="sm" className="w-full mt-2 rounded-full text-xs h-8" onClick={shareNative}>
                More options...
              </Button>
            )}
          </div>

          {/* Post as Story */}
          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-full text-xs h-9 gap-2"
              onClick={postAsStory}
              disabled={postingStory || storyPosted}
            >
              {storyPosted ? (
                <><Check className="w-3.5 h-3.5 text-green-600" /> Posted as Story!</>
              ) : postingStory ? (
                '...'
              ) : (
                '📸 Post as Story'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}