import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, TrendingUp, TrendingDown, Minus, Loader2, SmilePlus } from 'lucide-react';

async function analyzeAndSave({ circleId, productCategory, content, authorName }) {
  // Ask LLM for sentiment
  const result = await supabase.functions.invoke('invoke-llm', { body: {
    prompt: `Analyze the sentiment of this product comment: "${content}"\nRespond ONLY with JSON.`,
    response_json_schema: {
      type: 'object',
      properties: {
        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        score: { type: 'number', description: 'float from -1.0 to 1.0' },
      },
    }
  }});

  const sentiment = result?.data?.sentiment || 'neutral';
  const sentiment_score = result?.data?.score ?? 0;

  await supabase.from('ProductComment').insert({
    circle_id: circleId,
    product_category: productCategory,
    content,
    author_name: authorName,
    sentiment,
    sentiment_score,
  });

  return { sentiment, sentiment_score };
}

function SentimentBadge({ sentiment, score }) {
  if (!sentiment) return null;
  const configs = {
    positive: { icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', label: 'Positive' },
    neutral:  { icon: Minus,      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', label: 'Neutral' },
    negative: { icon: TrendingDown, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'Negative' },
  };
  const cfg = configs[sentiment] || configs.neutral;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
      {score != null && <span className="opacity-60 ml-0.5">({score > 0 ? '+' : ''}{Number(score).toFixed(2)})</span>}
    </span>
  );
}

function SentimentSummaryBar({ comments }) {
  if (!comments.length) return null;
  const pos = comments.filter(c => c.sentiment === 'positive').length;
  const neg = comments.filter(c => c.sentiment === 'negative').length;
  const neu = comments.filter(c => c.sentiment === 'neutral').length;
  const total = comments.length;

  const posW = Math.round((pos / total) * 100);
  const neuW = Math.round((neu / total) * 100);
  const negW = 100 - posW - neuW;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-blue-300/60 font-semibold uppercase tracking-wider flex items-center gap-1">
          <SmilePlus className="w-3 h-3" /> Sentiment Overview
        </span>
        <span className="text-blue-300/40">{total} comment{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {posW > 0 && <div style={{ width: `${posW}%`, background: '#34d399' }} className="transition-all duration-700" />}
        {neuW > 0 && <div style={{ width: `${neuW}%`, background: '#475569' }} className="transition-all duration-700" />}
        {negW > 0 && <div style={{ width: `${negW}%`, background: '#f87171' }} className="transition-all duration-700" />}
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-400">👍 {pos} positive</span>
        <span className="text-slate-400">— {neu} neutral</span>
        <span className="text-red-400">👎 {neg} negative</span>
      </div>
    </div>
  );
}

export default function ProductSentiment({ circleId, productCategory, currentUser }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['product-comments', circleId, productCategory],
    queryFn: () => supabase.from('ProductComment').select('*').match({ circle_id: circleId, product_category: productCategory }, '-created_date', 20).then(res => res.data || []),
    staleTime: 30 * 1000,
    enabled: !!circleId && !!productCategory,
  });

  const submit = useMutation({
    mutationFn: () => analyzeAndSave({
      circleId,
      productCategory,
      content: text.trim(),
      authorName: currentUser?.full_name || currentUser?.email?.split('@')[0] || 'User',
    }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['product-comments', circleId, productCategory] });
    },
  });

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {comments.length > 0 && <SentimentSummaryBar comments={comments} />}

      {/* Comment input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim() && !submit.isPending) submit.mutate(); }}
          placeholder="Share your thoughts on this product…"
          className="flex-1 rounded-full px-3 py-1.5 text-[12px] outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          disabled={submit.isPending}
        />
        <button
          onClick={() => text.trim() && !submit.isPending && submit.mutate()}
          disabled={!text.trim() || submit.isPending}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.35)' }}
        >
          {submit.isPending
            ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            : <Send className="w-3.5 h-3.5 text-amber-400" />
          }
        </button>
      </div>

      {submit.isPending && (
        <p className="text-[10px] text-amber-300/60 text-center animate-pulse">Analyzing sentiment…</p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <p className="text-[10px] text-blue-300/40 text-center py-2">Loading comments…</p>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div className="flex items-center gap-1 mb-1">
            <MessageSquare className="w-3 h-3 text-blue-300/40" />
            <span className="text-[10px] text-blue-300/40 font-semibold uppercase tracking-wider">Comments</span>
          </div>
          <AnimatePresence>
            {comments.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-3 py-2 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/70 text-[11px] font-semibold">{c.author_name}</span>
                  <SentimentBadge sentiment={c.sentiment} score={c.sentiment_score} />
                  <span className="ml-auto text-[9px] text-blue-300/30">
                    {c.created_date ? new Date(c.created_date).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-[10px] text-blue-300/30 text-center py-2">No comments yet. Be the first!</p>
      )}
    </div>
  );
}