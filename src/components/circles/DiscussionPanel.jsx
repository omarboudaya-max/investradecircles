import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MessageCircle, Plus, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { analyzeSentiment } from '@/lib/intelligence/sentiment';
import SentimentBadge, { SentimentMeter } from '@/components/intelligence/SentimentBadge';

export function ResponseVotes({ response, userId }) {
  const queryClient = useQueryClient();
  const upvoted = (response.upvoted_by || []).includes(userId);
  const downvoted = (response.downvoted_by || []).includes(userId);
  const score = (response.upvoted_by?.length || 0) - (response.downvoted_by?.length || 0);

  const vote = useMutation({
    mutationFn: async (type) => {
      const without = (list) => (list || []).filter((id) => id !== userId);
      const upvoted_by = type === 'up' && !upvoted ? [...without(response.upvoted_by), userId] : without(response.upvoted_by);
      const downvoted_by = type === 'down' && !downvoted ? [...without(response.downvoted_by), userId] : without(response.downvoted_by);
      const { error } = await supabase.from('CircleResponse').update({ upvoted_by, downvoted_by }).eq('id', response.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-responses'] }),
  });

  const pill = (active, tone) => `flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition-colors ${
    active
      ? tone === 'up' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
      : 'border-border bg-muted text-muted-foreground hover:text-foreground'
  }`;

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <button disabled={!userId || vote.isPending} onClick={(e) => { e.stopPropagation(); vote.mutate('up'); }} className={pill(upvoted, 'up')} aria-label="Upvote">
        <ChevronUp className="h-3.5 w-3.5" /> {response.upvoted_by?.length || 0}
      </button>
      <span className={`text-xs font-bold ${score > 0 ? 'text-emerald-600 dark:text-emerald-400' : score < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>{score}</span>
      <button disabled={!userId || vote.isPending} onClick={(e) => { e.stopPropagation(); vote.mutate('down'); }} className={pill(downvoted, 'down')} aria-label="Downvote">
        <ChevronDown className="h-3.5 w-3.5" /> {response.downvoted_by?.length || 0}
      </button>
    </div>
  );
}

/**
 * The answers to a circle's active question, with voting, a reply box for members and
 * a "new question" form for the people who run the circle. Used by every circle layout.
 */
export default function DiscussionPanel({
  user,
  activeQuestion,
  responses = [],
  memberProfiles = [],
  isMember,
  canAsk,
  newResponse, setNewResponse, submitResponse,
  newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
  selectedResponseData, setSelectedResponseData,
}) {
  const { toast } = useToast();
  const [sort, setSort] = useState('top');

  const scored = useMemo(() => responses.map((r) => ({
    ...r,
    sentiment: analyzeSentiment(r.response_text),
    votes: (r.upvoted_by?.length || 0) - (r.downvoted_by?.length || 0),
  })), [responses]);

  const ordered = useMemo(() => [...scored].sort((a, b) => (sort === 'top'
    ? b.votes - a.votes || new Date(b.created_date) - new Date(a.created_date)
    : new Date(b.created_date) - new Date(a.created_date))), [scored, sort]);

  const tally = useMemo(() => scored.reduce((acc, r) => { acc[r.sentiment.label] += 1; return acc; }, { positive: 0, neutral: 0, negative: 0 }), [scored]);
  const alreadyAnswered = responses.some((r) => r.created_by_id === user?.id);

  const send = (e) => {
    e.preventDefault();
    const text = (newResponse || '').trim();
    if (!text) return;
    submitResponse.mutate(text, {
      onError: (error) => toast({ title: 'Your answer was not sent', description: error.message, variant: 'destructive' }),
    });
  };

  const ask = () => {
    const text = (newQuestion || '').trim();
    if (!text) return;
    createQuestion.mutate(text, {
      onError: (error) => toast({ title: 'The question was not posted', description: error.message, variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-5 px-4 pb-5 sm:px-6">
      {!activeQuestion && (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {canAsk ? 'No question is open. Ask one to start the discussion.' : 'No question is open yet. The circle’s organisers will post one soon.'}
        </p>
      )}

      {scored.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" /> {scored.length} answer{scored.length === 1 ? '' : 's'}
            </h3>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {[['top', 'Top voted'], ['recent', 'Most recent']].map(([id, label]) => (
                <button key={id} onClick={() => setSort(id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${sort === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {scored.length >= 3 && (
            <div className="mb-3 rounded-xl border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">How members feel about this question</p>
              <SentimentMeter positive={tally.positive} neutral={tally.neutral} negative={tally.negative} />
            </div>
          )}

          <ul className="space-y-2">
            {ordered.map((r) => {
              const profile = memberProfiles.find((p) => p.id === r.created_by_id);
              const avatar = profile?.avatar_url || r.author_avatar;
              const selected = selectedResponseData?.id === r.id;
              return (
                <li
                  key={r.id}
                  onClick={() => setSelectedResponseData?.(selected ? null : r)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors ${selected ? 'border-primary/40 bg-primary/5' : 'bg-card hover:bg-muted/50'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {avatar
                      ? <img src={avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{r.author_name?.charAt(0)?.toUpperCase() || '?'}</span>}
                    {r.created_by_id
                      ? <Link to={`/profile/${r.created_by_id}`} onClick={(e) => e.stopPropagation()} className="text-sm font-medium text-foreground hover:underline">{r.author_name}</Link>
                      : <span className="text-sm font-medium text-foreground">{r.author_name}</span>}
                    {r.sentiment.label !== 'neutral' && r.sentiment.confidence >= 0.3 && <SentimentBadge sentiment={r.sentiment} />}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap pl-9 text-sm text-foreground/90">{r.response_text}</p>
                  <div className="pl-9"><ResponseVotes response={r} userId={user?.id} /></div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isMember && activeQuestion && (
        <form onSubmit={send} className="flex gap-2">
          <Input
            placeholder={alreadyAnswered ? 'Add another point…' : 'Share your answer…'}
            value={newResponse || ''}
            onChange={(e) => setNewResponse(e.target.value)}
            maxLength={1500}
            className="h-10 flex-1 rounded-full"
          />
          <Button type="submit" size="icon" disabled={!(newResponse || '').trim() || submitResponse.isPending} className="h-10 w-10 rounded-full" aria-label="Send answer">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {!isMember && activeQuestion && (
        <p className="text-center text-xs text-muted-foreground">Join the circle to answer and vote.</p>
      )}

      {canAsk && (
        showQuestionForm ? (
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <Textarea placeholder="Ask your members a question…" value={newQuestion || ''} onChange={(e) => setNewQuestion(e.target.value)} maxLength={500} className="min-h-[80px] bg-background" />
            <p className="text-xs text-muted-foreground">Every member is notified. The question stays open for 48 hours.</p>
            <div className="flex gap-2">
              <Button onClick={ask} disabled={!(newQuestion || '').trim() || createQuestion.isPending} className="rounded-full">{createQuestion.isPending ? 'Posting…' : 'Post question'}</Button>
              <Button variant="outline" onClick={() => setShowQuestionForm(false)} className="rounded-full">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setShowQuestionForm(true)} variant="outline" className="w-full rounded-full border-dashed">
            <Plus className="mr-2 h-4 w-4" /> Ask a new question
          </Button>
        )
      )}
    </div>
  );
}
