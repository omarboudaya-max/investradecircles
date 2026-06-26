import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import CircleVisual from '@/components/circles/CircleVisual';
import CircleLeaderboard from '@/components/circles/CircleLeaderboard';
import CircleEventCalendar from '@/components/circles/CircleEventCalendar';
import CircleAdminDashboard from '@/components/circles/CircleAdminDashboard';
import CircleMemberRoles from '@/components/circles/CircleMemberRoles';
import InviteToCircleModal from '@/components/circles/InviteToCircleModal';
import ShareCircleModal from '@/components/circles/ShareCircleModal';
import { useCircleNotifications } from '@/hooks/useCircleNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Send, Users, MessageCircle, ChevronUp, ChevronDown, UserPlus, Share2, Newspaper, LayoutList } from 'lucide-react';
import CircleIcon from '@/components/circles/CircleIcon';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import CircleFeed from '@/components/circles/CircleFeed';
import { TagBadge } from '@/components/circles/TagPicker';
import InstitutionalCircleLayout from '@/components/circles/InstitutionalCircleLayout';
import CircleMonetization from '@/components/circles/CircleMonetization';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

function ResponseVotes({ response, userId }) {
  const queryClient = useQueryClient();
  const upvoted = (response.upvoted_by || []).includes(userId);
  const downvoted = (response.downvoted_by || []).includes(userId);
  const score = (response.upvoted_by?.length || 0) - (response.downvoted_by?.length || 0);

  const vote = useMutation({
    mutationFn: async (type) => {
      let upvoted_by = [...(response.upvoted_by || [])];
      let downvoted_by = [...(response.downvoted_by || [])];
      if (type === 'up') {
        upvoted_by = upvoted_by.includes(userId)
          ? upvoted_by.filter((id) => id !== userId)
          : [...upvoted_by.filter((id) => id !== userId), userId];
        downvoted_by = downvoted_by.filter((id) => id !== userId);
      } else {
        downvoted_by = downvoted_by.includes(userId)
          ? downvoted_by.filter((id) => id !== userId)
          : [...downvoted_by.filter((id) => id !== userId), userId];
        upvoted_by = upvoted_by.filter((id) => id !== userId);
      }
      await supabase.from('CircleResponse').update({ upvoted_by, downvoted_by }).eq('id', response.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-responses'] }),
  });

  return (
    <div className="flex items-center gap-1.5 ml-9 mt-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); vote.mutate('up'); }}
        className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all ${upvoted ? 'bg-green-100 text-green-700 border-green-300' : 'bg-muted text-muted-foreground hover:bg-green-50 hover:text-green-600 border-border'}`}
      >
        <ChevronUp className="w-3.5 h-3.5" /> {response.upvoted_by?.length || 0}
      </button>
      <span className={`text-xs font-bold ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>{score}</span>
      <button
        onClick={(e) => { e.stopPropagation(); vote.mutate('down'); }}
        className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all ${downvoted ? 'bg-red-100 text-red-700 border-red-300' : 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 border-border'}`}
      >
        <ChevronDown className="w-3.5 h-3.5" /> {response.downvoted_by?.length || 0}
      </button>
    </div>
  );
}

export default function CircleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedResponseData, setSelectedResponseData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('discussion');

  const { data: circle, isLoading: loadingCircle } = useQuery({
    queryKey: ['circle', id],
    queryFn: async () => {
      const circles = await supabase.from('Circle').select('*').match({ id }).then(res => res.data || []);
      return circles[0];
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['circle-questions', id],
    queryFn: () => supabase.from('CircleQuestion').select('*').match({ circle_id: id }).order('created_date', { ascending: false }).limit(10).then(res => res.data || []),
  });

  const activeQuestion = questions.find((q) => q.status === 'active') || questions[0];

  const { data: responses = [] } = useQuery({
    queryKey: ['circle-responses', activeQuestion?.id],
    queryFn: () =>
      activeQuestion ? supabase.from('CircleResponse').select('*').match({ question_id: activeQuestion.id }).then(res => res.data || []) : Promise.resolve([]),
    enabled: !!activeQuestion,
  });

  const createQuestion = useMutation({
    mutationFn: async (text) => {
      const { data, error } = await supabase.from('CircleQuestion').insert({
        circle_id: id,
        question_text: text,
        question_number: questions.length + 1,
        total_members: circle?.member_ids?.length || 0,
        status: 'active',
        closes_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        created_by_id: user?.id,
      }).select();
      if (error) throw error;

      if (circle?.member_ids && circle.member_ids.length > 0) {
        const notifications = circle.member_ids
          .filter(memberId => memberId !== user?.id)
          .map(memberId => ({
            user_id: memberId,
            type: 'circle_question',
            message: `${circle.name} has a new question`,
            circle_id: id,
            circle_name: circle.name,
            target_url: `/circle/${id}`
          }));
        
        if (notifications.length > 0) {
          await supabase.from('Notification').insert(notifications);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-questions', id] });
      setNewQuestion('');
      setShowQuestionForm(false);
    },
  });

  const submitResponse = useMutation({
    mutationFn: (text) =>
      supabase.from('CircleResponse').insert({
        question_id: activeQuestion.id,
        circle_id: id,
        response_text: text,
        author_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        author_avatar: user?.avatar_url || null,
        created_by_id: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-responses', activeQuestion?.id] });
      setNewResponse('');
    },
  });

  const joinCircle = useMutation({
    mutationFn: async () => {
      const members = circle?.member_ids || [];
      if (members.includes(user?.id)) return; // already a member
      if (circle?.privacy?.toLowerCase() === 'private') {
        // Create a join request instead of joining directly
        const { error } = await supabase.from('CircleInvite').insert({
          circle_id: id,
          circle_name: circle.name,
          inviter_id: user.id, // requester
          inviter_name: user.full_name || user.email?.split('@')[0],
          invitee_id: circle.created_by_id, // admin
          status: 'request'
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Circle').update({ member_ids: [...members, user.id] }).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle', id] });
      queryClient.invalidateQueries({ queryKey: ['join-request'] });
    },
  });

  const { data: hasPendingRequest } = useQuery({
    queryKey: ['join-request', id, user?.id],
    queryFn: () => supabase.from('CircleInvite').select('*').match({ circle_id: id, inviter_id: user?.id, status: 'request' }).then(res => res.data || []),
    enabled: !!id && !!user?.id && circle?.privacy?.toLowerCase() === 'private',
  });
  const isRequestPending = hasPendingRequest?.length > 0;

  const isMember = circle?.member_ids?.includes(user?.id) || circle?.created_by_id === user?.id;
  const isAdmin = circle?.created_by_id === user?.id;
  const isModerator = (circle?.moderator_ids || []).includes(user?.id);

  // Precise member count: unique set of member_ids + creator
  const allMemberIds = Array.from(new Set([
    ...(circle?.member_ids || []),
    ...(circle?.created_by_id ? [circle.created_by_id] : []),
  ]));

  useCircleNotifications({ circle, user });

  // Mark all unread notifications for this circle as read when user opens it,
  // and keep checking periodically to catch new notifications that arrive while viewing
  useEffect(() => {
    if (!user?.id || !id) return;

    const markCircleNotifsRead = async () => {
      try {
        const notifs = await supabase.from('Notification').select('*').match({ user_id: user.id, circle_id: id, is_read: false }).then(res => res.data || []);
        if (notifs.length > 0) {
          for (const n of notifs) {
            await supabase.from('Notification').update({ is_read: true }).eq('id', n.id);
          }
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      } catch (_) { /* ignore transient errors */ }
    };

    // Clear immediately on entry
    markCircleNotifsRead();

    // Also poll every 4 seconds to clear notifications that arrive while viewing
    const interval = setInterval(markCircleNotifsRead, 4000);
    return () => clearInterval(interval);
  }, [id, user?.id]);

  // Fetch real user profiles for ALL circle members including creator
  const allCircleMemberIds = Array.from(new Set([
    ...(circle?.member_ids || []),
    ...(circle?.created_by_id ? [circle.created_by_id] : []),
  ]));
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ['circle-member-profiles', allCircleMemberIds.sort().join(',')],
    queryFn: async () => {
      if (!allCircleMemberIds.length) return [];
      return supabase.from('profiles').select('*').in('id', allCircleMemberIds).then(res => res.data || []);
    },
    enabled: !!allCircleMemberIds.length,
  });

  // Build a set of user IDs who have responded to the active question
  // Use both created_by_id and author_name fallback lookup to ensure correctness
  const activeResponderIds = new Set(responses.map((r) => r.created_by_id).filter(Boolean));
  // Also track by author_name for fallback display (when created_by_id is missing)
  const activeResponderNames = new Set(responses.map((r) => r.author_name).filter(Boolean));

  // Build member list with real avatars — include creator even if not in member_ids
  const memberNames = allMemberIds.map((memberId) => {
    const profile = memberProfiles.find((p) => p.id === memberId);
    const name = profile?.full_name || profile?.email?.split('@')[0] || 'User';
    const response = responses.find((r) => r.created_by_id === memberId || r.author_name === name);
    return {
      id: memberId,
      name,
      avatar_url: profile?.avatar_url || null,
      isActive: !!response,
      lastComment: response?.response_text || null,
    };
  });
  while (memberNames.length < 8) memberNames.push({ name: '?', id: null, avatar_url: null, isActive: false, lastComment: null });

  if (loadingCircle) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const isInstitutional = circle?.category === 'institution';

  // Shared institutional layout props
  const institutionalProps = {
    circle, user, circleId: id,
    memberNames, memberProfiles, activeQuestion,
    selectedResponseData, setSelectedResponseData,
    responses, isMember, isAdmin, isModerator,
    newResponse, setNewResponse, submitResponse,
    newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
    allMemberIds,
  };

  return (
    <div className="max-w-2xl mx-auto">
      {showInviteModal && circle && (
        <InviteToCircleModal circle={circle} onClose={() => setShowInviteModal(false)} />
      )}
      {showShareModal && circle && (
        <ShareCircleModal circle={circle} onClose={() => setShowShareModal(false)} onPostAsStory={() => queryClient.invalidateQueries({ queryKey: ['stories'] })} />
      )}

      {circle && (
        <Helmet>
          <title>{`${circle.name} - Investraders`}</title>
          <meta name="description" content={circle.description?.substring(0, 150) || 'Join this circle on Investraders'} />
          <meta property="og:title" content={`${circle.name} - Investraders`} />
          <meta property="og:description" content={circle.description?.substring(0, 150) || 'Join this circle on Investraders'} />
        </Helmet>
      )}

      <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* ── Institutional/Business: premium AI-finance layout ── */}
      {isInstitutional ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowShareModal(true)}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            {isMember && (
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4" /> Invite
              </Button>
            )}
            {!isMember && (
              <Button
                onClick={() => joinCircle.mutate()}
                disabled={joinCircle.isPending || isRequestPending}
                className={`rounded-full ${circle?.privacy?.toLowerCase() === 'private' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary'}`}
              >
                {joinCircle.isPending ? 'Processing...' : isRequestPending ? 'Request Pending' : circle?.privacy?.toLowerCase() === 'private' ? 'Request to Join' : 'Join Circle'}
              </Button>
            )}
          </div>
          {circle?.privacy?.toLowerCase() === 'private' && !isMember ? (
            <div className="bg-card rounded-2xl border shadow-sm p-12 text-center flex flex-col items-center justify-center text-muted-foreground mt-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Private Institution</h3>
              <p className="text-sm max-w-md mx-auto">You must be a member to access exclusive content and discussions.</p>
            </div>
          ) : (
            <InstitutionalCircleLayout {...institutionalProps} />
          )}
        </>
      ) : (
        /* ── Standard layout for all other categories ── */
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {/* Circle Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CircleIcon category={circle?.category} size="xl" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{circle?.name}</h1>
                  {circle?.is_verified && (
                    <VerifiedBadge
                      label={circle.verified_label || 'Verified'}
                      size="md"
                      dark={false}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {allMemberIds.length} members · {circle?.privacy}
                </p>
                {(circle?.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {circle.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowShareModal(true)}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
              {isMember && (
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="w-4 h-4" /> Invite
                </Button>
              )}
              {!isMember && (
                <Button
                  onClick={() => joinCircle.mutate()}
                  disabled={joinCircle.isPending || isRequestPending}
                  className={`rounded-full ${circle?.privacy?.toLowerCase() === 'private' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary'}`}
                >
                  {joinCircle.isPending ? 'Processing...' : isRequestPending ? 'Request Pending' : circle?.privacy?.toLowerCase() === 'private' ? 'Request to Join' : 'Join Circle'}
                </Button>
              )}
            </div>
          </div>

          {circle?.privacy?.toLowerCase() === 'private' && !isMember ? (
            <div className="p-16 text-center flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Private Circle</h3>
              <p className="text-sm max-w-md mx-auto">You must be a member to view discussions, events, and posts in this circle.</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b">
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'discussion' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" /> Discussion
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Newspaper className="w-4 h-4" /> Feed
            </button>
          </div>

          {activeTab === 'feed' ? (
            <CircleFeed circle={circle} user={user} />
          ) : (
            <>
              <CircleVisual
                members={memberNames}
                question={activeQuestion?.question_text}
                selectedResponse={selectedResponseData}
                questionNumber={activeQuestion?.question_number}
                closesAt={activeQuestion?.closes_at}
                totalResponses={responses.length}
                totalMembers={allMemberIds.length}
                circleName={circle?.name}
                memberProfiles={memberProfiles}
                allResponses={responses}
              />

              {responses.length > 0 && (
                <div className="px-6 pb-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" /> Responses
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {responses.map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedResponseData?.id === r.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedResponseData(selectedResponseData?.id === r.id ? null : r)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                              const avatar = rProfile?.avatar_url || r.author_avatar;
                              const isResponderActive = r.created_by_id ? activeResponderIds.has(r.created_by_id) : activeResponderNames.has(r.author_name);
                              
                              const AvatarEl = avatar ? (
                                <img src={avatar} alt={r.author_name} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: isResponderActive ? '2px solid #22c55e' : '2px solid transparent' }} />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-[10px] font-bold" style={{ border: isResponderActive ? '2px solid #22c55e' : 'none' }}>
                                  {r.author_name?.charAt(0)}
                                </div>
                              );

                              return r.created_by_id ? (
                                <Link to={`/profile/${r.created_by_id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:opacity-90 z-10">
                                  {AvatarEl}
                                  <span className="text-sm font-medium hover:underline">{r.author_name}</span>
                                </Link>
                              ) : (
                                <>
                                  {AvatarEl}
                                  <span className="text-sm font-medium">{r.author_name}</span>
                                </>
                              );
                            })()}
                            {(r.created_by_id ? activeResponderIds.has(r.created_by_id) : activeResponderNames.has(r.author_name)) && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium ml-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground ml-9">{r.response_text}</p>
                          <ResponseVotes response={r} userId={user?.id} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {isMember && activeQuestion && (
                <div className="px-6 pb-6">
                  <form onSubmit={(e) => { e.preventDefault(); if (newResponse.trim()) submitResponse.mutate(newResponse); }} className="flex gap-2">
                    <Input placeholder="Share your answer..." value={newResponse} onChange={(e) => setNewResponse(e.target.value)} className="flex-1 rounded-full h-10" />
                    <Button type="submit" disabled={!newResponse.trim()} size="icon" className="rounded-full h-10 w-10 bg-primary">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {isAdmin && <CircleAdminDashboard circleId={id} circle={circle} />}
              <CircleEventCalendar circleId={id} isMember={isMember} isAdmin={isAdmin} isModerator={isModerator} currentUserId={user?.id} />
              <CircleMemberRoles circle={circle} currentUserId={user?.id} />
              <CircleLeaderboard circleId={id} />

              {/* Only admin can post questions */}
              {isAdmin && (
                <div className="px-6 pb-6">
                  {showQuestionForm ? (
                    <div className="space-y-3">
                      <Textarea placeholder="Ask a question to your circle..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="min-h-[80px]" />
                      <div className="flex gap-2">
                        <Button onClick={() => { if (newQuestion.trim()) createQuestion.mutate(newQuestion); }} disabled={!newQuestion.trim() || createQuestion.isPending} className="rounded-full bg-primary">{createQuestion.isPending ? 'Posting...' : 'Post Question'}</Button>
                        <Button variant="outline" onClick={() => setShowQuestionForm(false)} className="rounded-full">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowQuestionForm(true)} variant="outline" className="w-full rounded-full border-dashed">
                      <Plus className="w-4 h-4 mr-2" /> Ask a New Question
                    </Button>
                  )}
                </div>
              )}
              
            <div className="bg-card rounded-2xl border shadow-sm p-12 text-center flex flex-col items-center justify-center text-muted-foreground mt-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Private Institution</h3>
              <p className="text-sm max-w-md mx-auto">You must be a member to access exclusive content and discussions.</p>
            </div>
          ) : (
            <InstitutionalCircleLayout {...institutionalProps} />
          )}
        </>
      ) : (
        /* ── Standard layout for all other categories ── */
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {/* Circle Header */}
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CircleIcon category={circle?.category} size="xl" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{circle?.name}</h1>
                  {circle?.is_verified && (
                    <VerifiedBadge
                      label={circle.verified_label || 'Verified'}
                      size="md"
                      dark={false}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {allMemberIds.length} members · {circle?.privacy}
                </p>
                {(circle?.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {circle.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowShareModal(true)}>
                <Share2 className="w-4 h-4" /> Share
              </Button>
              {isMember && (
                <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="w-4 h-4" /> Invite
                </Button>
              )}
              {!isMember && (
                <Button
                  onClick={() => joinCircle.mutate()}
                  disabled={joinCircle.isPending || isRequestPending}
                  className={`rounded-full ${circle?.privacy?.toLowerCase() === 'private' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary'}`}
                >
                  {joinCircle.isPending ? 'Processing...' : isRequestPending ? 'Request Pending' : circle?.privacy?.toLowerCase() === 'private' ? 'Request to Join' : 'Join Circle'}
                </Button>
              )}
            </div>
          </div>

          {circle?.privacy?.toLowerCase() === 'private' && !isMember ? (
            <div className="p-16 text-center flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Private Circle</h3>
              <p className="text-sm max-w-md mx-auto">You must be a member to view discussions, events, and posts in this circle.</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b">
            <button
              onClick={() => setActiveTab('discussion')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'discussion' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" /> Discussion
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Newspaper className="w-4 h-4" /> Feed
            </button>
          </div>

          {activeTab === 'feed' ? (
            <CircleFeed circle={circle} user={user} />
          ) : (
            <>
              <CircleVisual
                members={memberNames}
                question={activeQuestion?.question_text}
                selectedResponse={selectedResponseData}
                questionNumber={activeQuestion?.question_number}
                closesAt={activeQuestion?.closes_at}
                totalResponses={responses.length}
                totalMembers={allMemberIds.length}
                circleName={circle?.name}
                memberProfiles={memberProfiles}
                allResponses={responses}
              />

              {responses.length > 0 && (
                <div className="px-6 pb-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" /> Responses
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {responses.map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedResponseData?.id === r.id ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted'}`}
                          onClick={() => setSelectedResponseData(selectedResponseData?.id === r.id ? null : r)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {(() => {
                              const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                              const avatar = rProfile?.avatar_url || r.author_avatar;
                              const isResponderActive = r.created_by_id ? activeResponderIds.has(r.created_by_id) : activeResponderNames.has(r.author_name);
                              
                              const AvatarEl = avatar ? (
                                <img src={avatar} alt={r.author_name} className="w-7 h-7 rounded-full object-cover shrink-0" style={{ border: isResponderActive ? '2px solid #22c55e' : '2px solid transparent' }} />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-[10px] font-bold" style={{ border: isResponderActive ? '2px solid #22c55e' : 'none' }}>
                                  {r.author_name?.charAt(0)}
                                </div>
                              );

                              return r.created_by_id ? (
                                <Link to={`/profile/${r.created_by_id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:opacity-90 z-10">
                                  {AvatarEl}
                                  <span className="text-sm font-medium hover:underline">{r.author_name}</span>
                                </Link>
                              ) : (
                                <>
                                  {AvatarEl}
                                  <span className="text-sm font-medium">{r.author_name}</span>
                                </>
                              );
                            })()}
                            {(r.created_by_id ? activeResponderIds.has(r.created_by_id) : activeResponderNames.has(r.author_name)) && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium ml-auto">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground ml-9">{r.response_text}</p>
                          <ResponseVotes response={r} userId={user?.id} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {isMember && activeQuestion && (
                <div className="px-6 pb-6">
                  <form onSubmit={(e) => { e.preventDefault(); if (newResponse.trim()) submitResponse.mutate(newResponse); }} className="flex gap-2">
                    <Input placeholder="Share your answer..." value={newResponse} onChange={(e) => setNewResponse(e.target.value)} className="flex-1 rounded-full h-10" />
                    <Button type="submit" disabled={!newResponse.trim()} size="icon" className="rounded-full h-10 w-10 bg-primary">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {isAdmin && <CircleAdminDashboard circleId={id} circle={circle} />}
              <CircleEventCalendar circleId={id} isMember={isMember} isAdmin={isAdmin} isModerator={isModerator} currentUserId={user?.id} />
              <CircleMemberRoles circle={circle} currentUserId={user?.id} />
              <CircleLeaderboard circleId={id} />

              {/* Only admin can post questions */}
              {isAdmin && (
                <div className="px-6 pb-6">
                  {showQuestionForm ? (
                    <div className="space-y-3">
                      <Textarea placeholder="Ask a question to your circle..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="min-h-[80px]" />
                      <div className="flex gap-2">
                        <Button onClick={() => { if (newQuestion.trim()) createQuestion.mutate(newQuestion); }} disabled={!newQuestion.trim() || createQuestion.isPending} className="rounded-full bg-primary">{createQuestion.isPending ? 'Posting...' : 'Post Question'}</Button>
                        <Button variant="outline" onClick={() => setShowQuestionForm(false)} className="rounded-full">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowQuestionForm(true)} variant="outline" className="w-full rounded-full border-dashed">
                      <Plus className="w-4 h-4 mr-2" /> Ask a New Question
                    </Button>
                  )}
                </div>
              )}
              
              {isAdmin && (
                <div className="px-6 pb-6">
                  <CircleMonetization memberCount={allMemberIds.length} />
                </div>
              )}
            </>
          )}
        </>
      )}
      </div>
    )}
    </div>
  );
}
