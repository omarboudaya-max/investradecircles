import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, TrendingUp, TrendingDown, Minus, Loader2, SmilePlus } from 'lucide-react';

async function analyzeAndSave({ circleId, productCategory, content, authorName }) {
  let sentiment = 'neutral';
  let sentiment_score = 0;

  try {
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
    
    if (result.data) {
      sentiment = result.data.sentiment || 'neutral';
      sentiment_score = result.data.score ?? 0;
    } else {
      throw new Error('LLM function returned empty data');
    }
  } catch (err) {
    console.warn('Sentiment Edge Function failed, using client-side fallback:', err);
    // Simple client side keyword sentiment analyzer
    const posWords = ['good', 'great', 'awesome', 'excellent', 'love', 'nice', 'perfect', 'amazing', 'happy', 'cool', 'super', 'best', 'bon', 'bien', 'excellent', 'adore', 'superbe'];
    const negWords = ['bad', 'worst', 'poor', 'hate', 'dislike', 'terrible', 'waste', 'broken', 'cheap', 'slow', 'fail', 'mauvais', 'nul', 'deçu', 'casse', 'lent', 'faible'];
    
    const words = content.toLowerCase().split(/[^a-zA-Z0-9éèàâûîôöüïç]+/);
    let posCount = 0;
    let negCount = 0;
    for (const w of words) {
      if (posWords.includes(w)) posCount++;
      if (negWords.includes(w)) negCount++;
    }
    
    if (posCount > negCount) {
      sentiment = 'positive';
      sentiment_score = 0.5 + (0.1 * Math.min(posCount - negCount, 5));
    } else if (negCount > posCount) {
      sentiment = 'negative';
      sentiment_score = -0.5 - (0.1 * Math.min(negCount - posCount, 5));
    } else {
      sentiment = 'neutral';
      sentiment_score = 0;
    }
  }

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

function SentimentSummaryBar({ comments, isDark }) {
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
        <span className={`${isDark ? 'text-blue-300/60' : 'text-amber-800'} font-semibold uppercase tracking-wider flex items-center gap-1`}>
          <SmilePlus className="w-3 h-3" /> Sentiment Overview
        </span>
        <span className={isDark ? 'text-blue-300/40' : 'text-stone-500'}>{total} comment{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {posW > 0 && <div style={{ width: `${posW}%`, background: '#34d399' }} className="transition-all duration-700" />}
        {neuW > 0 && <div style={{ width: `${neuW}%`, background: isDark ? '#475569' : '#94a3b8' }} className="transition-all duration-700" />}
        {negW > 0 && <div style={{ width: `${negW}%`, background: '#f87171' }} className="transition-all duration-700" />}
      </div>
      <div className="flex gap-3 text-[10px]">
        <span className="text-emerald-500 font-medium">👍 {pos} positive</span>
        <span className={isDark ? 'text-slate-400' : 'text-stone-600'}>— {neu} neutral</span>
        <span className="text-red-500 font-medium">👎 {neg} negative</span>
      </div>
    </div>
  );
}

export default function ProductSentiment({ circleId, productCategory, currentUser, isDark }) {
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
      {comments.length > 0 && <SentimentSummaryBar comments={comments} isDark={isDark} />}

      {/* Comment input */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim() && !submit.isPending) submit.mutate(); }}
          placeholder="Share your thoughts on this product…"
          className="flex-1 rounded-full px-3 py-1.5 text-[12px] outline-none transition-colors duration-300"
          style={{ 
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)', 
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(180,120,20,0.2)', 
            color: isDark ? 'white' : '#1c1917' 
          }}
          disabled={submit.isPending}
        />
        <button
          onClick={() => text.trim() && !submit.isPending && submit.mutate()}
          disabled={!text.trim() || submit.isPending}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          style={{ 
            background: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(180,120,20,0.1)', 
            border: isDark ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(180,120,20,0.25)' 
          }}
        >
          {submit.isPending
            ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            : <Send className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
          }
        </button>
      </div>

      {submit.isPending && (
        <p className={`text-[10px] text-center animate-pulse ${isDark ? 'text-amber-300/60' : 'text-amber-700/80'}`}>Analyzing sentiment…</p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <p className={`text-[10px] text-center py-2 ${isDark ? 'text-blue-300/40' : 'text-stone-500'}`}>Loading comments…</p>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div className="flex items-center gap-1 mb-1">
            <MessageSquare className={`w-3 h-3 ${isDark ? 'text-blue-300/40' : 'text-stone-400'}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-blue-300/40' : 'text-stone-500'}`}>Comments</span>
          </div>
          <AnimatePresence>
            {comments.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-3 py-2 border transition-all duration-300"
                style={{ 
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)', 
                  borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(180,120,20,0.15)' 
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-white/70' : 'text-stone-800'}`}>{c.author_name}</span>
                  <SentimentBadge sentiment={c.sentiment} score={c.sentiment_score} />
                  <span className={`ml-auto text-[9px] ${isDark ? 'text-blue-300/30' : 'text-stone-500'}`}>
                    {c.created_date ? new Date(c.created_date).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/60' : 'text-stone-700'}`}>{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className={`text-[10px] text-center py-2 ${isDark ? 'text-blue-300/30' : 'text-stone-500/80'}`}>No comments yet. Be the first!</p>
      )}
    </div>
  );
}
