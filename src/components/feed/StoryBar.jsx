import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import StoryViewer from './StoryViewer';
import CreateStoryModal from './CreateStoryModal';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function StoryBar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useTranslation();
  const [viewingStories, setViewingStories] = useState(null); // array of stories to view
  const [showCreate, setShowCreate] = useState(false);

  // Get user's connections
  const { data: sentConns = [] } = useQuery({
    queryKey: ['story-conns-sent', user?.id],
    queryFn: () => supabase.from('Connection').select('*').match({ requester_id: user?.id, status: 'accepted' }).then(res => res.data || []),
    enabled: !!user?.id,
  });
  const { data: receivedConns = [] } = useQuery({
    queryKey: ['story-conns-received', user?.id],
    queryFn: () => supabase.from('Connection').select('*').match({ recipient_id: user?.id, status: 'accepted' }).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const connectionIds = [
    ...sentConns.map((c) => c.recipient_id),
    ...receivedConns.map((c) => c.requester_id),
    user?.id, // include own stories
  ].filter(Boolean);

  // Fetch all active stories (within 24h)
  const { data: allStories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => supabase.from('Story').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    refetchInterval: 30000,
    select: (data) => data.filter((s) => s.expires_at && new Date(s.expires_at) > new Date()),
  });

  // Only stories from connections + own
  const relevantStories = allStories.filter((s) => connectionIds.includes(s.author_id));

  // Group by author
  const grouped = {};
  for (const story of relevantStories) {
    if (!grouped[story.author_id]) grouped[story.author_id] = { author_name: story.author_name, author_avatar: story.author_avatar, stories: [] };
    grouped[story.author_id].stories.push(story);
  }
  const groupedList = Object.entries(grouped).map(([authorId, val]) => ({ authorId, ...val }));

  // Move own stories to front
  const sorted = [
    ...groupedList.filter((g) => g.authorId === user?.id),
    ...groupedList.filter((g) => g.authorId !== user?.id),
  ];

  const hasUnviewed = (group) => group.stories.some((s) => !(s.viewed_by || []).includes(user?.id));

  const { data: userProfile } = useQuery({
    queryKey: ['my-profile-story', user?.id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data?.[0],
  });
  const avatarUrl = userProfile?.avatar_url || null;

  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">{t.storyBar.watchStories}</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {/* My Profile link */}
        <Link to="/profile" className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
          <div className="w-16 h-16 rounded-full border-2 border-blue-400 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="My Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium truncate max-w-[64px] text-center">{t.storyBar.myProfile}</span>
        </Link>

        {/* Create Story */}
        <div className="flex flex-col items-center gap-1 cursor-pointer shrink-0" onClick={() => setShowCreate(true)}>
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xs text-primary font-medium">{t.storyBar.createStory}</span>
        </div>

        {/* Connection stories */}
        {sorted.map((group) => {
          const unviewed = hasUnviewed(group);
          const isOwn = group.authorId === user?.id;
          return (
            <div
              key={group.authorId}
              className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
              onClick={() => setViewingStories(group.stories)}
            >
              <div className={`w-16 h-16 rounded-full p-0.5 ${unviewed ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-300'}`}>
                <div className="w-full h-full rounded-full bg-card p-0.5 overflow-hidden">
                  {group.author_avatar ? (
                    <img src={group.author_avatar} alt={group.author_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-lg font-bold">
                      {group.author_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[64px] text-center">
                {isOwn ? t.storyBar.yourStory : group.author_name?.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {viewingStories && (
        <StoryViewer
          stories={viewingStories}
          onClose={() => setViewingStories(null)}
          onReact={() => queryClient.invalidateQueries({ queryKey: ['stories'] })}
        />
      )}
      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['stories'] })}
        />
      )}
    </div>
  );
}
