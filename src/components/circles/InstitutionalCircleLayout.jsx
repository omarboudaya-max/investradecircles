import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Megaphone, Newspaper, LayoutList,
  BarChart2, Globe, Users, Plus, Send, MessageCircle,
  ChevronUp, ChevronDown, Landmark, Sparkles,
  Target, Eye, BookOpen, Briefcase, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import ProductGallery from '@/components/circles/ProductGallery';
import CircleFeed from '@/components/circles/CircleFeed';
import CircleLeaderboard from '@/components/circles/CircleLeaderboard';
import CircleEventCalendar from '@/components/circles/CircleEventCalendar';
import CircleMemberRoles from '@/components/circles/CircleMemberRoles';
import CircleAdminDashboard from '@/components/circles/CircleAdminDashboard';
import CircleVisual from '@/components/circles/CircleVisual';

function formatPrice(symbol, price) {
  if (!price && price !== 0) return '—';
  const crypto = ['BTC/USD', 'ETH/USD'];
  const forex = ['EUR/USD'];
  if (crypto.includes(symbol)) return Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (forex.includes(symbol)) return Number(price).toFixed(4);
  if (symbol === 'GOLD' || symbol === 'OIL (WTI)') return Number(price).toFixed(2);
  return Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TickerItem({ t }) {
  const up = (t.change_pct || 0) >= 0;
  return (
    <div className="flex items-center gap-1.5 shrink-0 px-5">
      <span className="text-blue-300/80 text-[11px] font-semibold">{t.symbol}</span>
      <span className="text-white text-[11px] font-bold">{formatPrice(t.symbol, t.price)}</span>
      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {t.change_pct != null ? `${up ? '+' : ''}${Number(t.change_pct).toFixed(2)}%` : '—'}
      </span>
      <span className="text-blue-300/20 text-[10px] ml-3">|</span>
    </div>
  );
}

function MarketTicker({ marketData }) {
  const items = marketData || [];
  // Duplicate items so the scroll loops seamlessly
  const doubled = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden py-2 border-b"
      style={{ background: 'linear-gradient(90deg,#0f172a,#1e2d5a)' }}
    >
      {items.length === 0 ? (
        <span className="px-4 text-blue-300/50 text-[11px]">Loading market data...</span>
      ) : (
        <div className="ticker-track flex" style={{ animation: `ticker-scroll ${items.length * 4}s linear infinite` }}>
          {doubled.map((t, i) => (
            <TickerItem key={`${t.symbol}-${i}`} t={t} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track { white-space: nowrap; }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

function InfoTab({ circle, user }) {
  const websiteUrl = circle?.website_url;
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!websiteUrl) return;
    setLoading(true);
    supabase.functions.invoke('invoke-llm', { body: {
      prompt: `Visit the website at ${websiteUrl} and extract structured information about the organization.
      
IMPORTANT: First determine if this organization primarily SELLS PRODUCTS (e.g. sportswear, shoes, apparel, electronics, goods, retail merchandise). If yes, set is_product_brand=true and fill the products array with their main product categories and featured products. If they offer services instead (e.g. financial, consulting, education), set is_product_brand=false and fill services instead.

Return ONLY in the exact JSON format specified — no extra text.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          is_product_brand: { type: 'boolean', description: 'true if org sells physical products/retail goods' },
          tagline: { type: 'string', description: 'Brand slogan or tagline if any' },
          mission: { type: 'string' },
          vision: { type: 'string' },
          goals: { type: 'array', items: { type: 'string' } },
          products: {
            type: 'array',
            description: 'Main product categories or featured products if this is a product brand',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', description: 'Product category name e.g. Running Shoes, Basketball Footwear, Shorts' },
                description: { type: 'string', description: 'Brief description of this product line' },
                featured_items: { type: 'array', items: { type: 'string' }, description: 'Notable product names in this category' },
                price_range: { type: 'string', description: 'Approx price range if known e.g. $40–$120' },
                image_url: { type: 'string', description: 'A direct URL to a real product image from the website for this category (must be an actual image URL ending in .jpg .png .webp etc.)' },
              },
            },
          },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
          news: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                title: { type: 'string' },
              },
            },
          },
        },
      },
    }
    }).then((result) => {
      setInfo(result.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [websiteUrl]);

  if (!websiteUrl && !circle?.description) {
    return (
      <div className="p-5">
        <div className="rounded-xl p-6 border text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.12)' }}>
          <BookOpen className="w-8 h-8 text-blue-300/20 mx-auto mb-2" />
          <p className="text-blue-300/60 text-sm">No website configured for this institution.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl p-4 border animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.08)', height: 80 }} />
        ))}
        <p className="text-blue-300/40 text-xs text-center">Extracting institutional info...</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="p-5">
        <div className="rounded-xl p-6 border text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.12)' }}>
          <BookOpen className="w-8 h-8 text-blue-300/20 mx-auto mb-2" />
          <p className="text-blue-300/60 text-sm">Institutional profile information will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Landmark className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-white">{info.name || circle?.name}</span>
        {info.is_product_brand && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-400/15 text-orange-300 border border-orange-400/30">
            <ShoppingBag className="w-2.5 h-2.5" /> Brand
          </span>
        )}
      </div>

      {/* Tagline */}
      {info.tagline && (
        <p className="text-amber-300/70 text-sm italic px-1">"{info.tagline}"</p>
      )}

      {/* ── PRODUCTS visual gallery (shown first for product brands) ── */}
      {info.is_product_brand && info.products?.length > 0 && (
        <ProductGallery
          products={info.products}
          websiteUrl={circle?.website_url}
          brandName={info.name || circle?.name}
          tagline={info.tagline}
          circleId={circle?.id}
          userId={user?.id}
          user={user}
        />
      )}

      {/* Mission */}
      {info.mission && (
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Mission</span>
          </div>
          <p className="text-white/85 text-sm leading-relaxed">{info.mission}</p>
        </div>
      )}

      {/* Vision */}
      {info.vision && (
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(14,165,233,0.06)', borderColor: 'rgba(14,165,233,0.18)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Vision</span>
          </div>
          <p className="text-white/85 text-sm leading-relaxed">{info.vision}</p>
        </div>
      )}

      {/* Goals */}
      {info.goals?.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Goals & Objectives</span>
          </div>
          <ul className="space-y-2">
            {info.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                <span className="text-amber-400 mt-0.5 shrink-0">•</span>{g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Services (only for non-product brands) */}
      {!info.is_product_brand && info.services?.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Services & Initiatives</span>
          </div>
          <div className="space-y-2">
            {info.services.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-2.5 border" style={{ borderColor: 'rgba(100,180,255,0.08)' }}>
                <BookOpen className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-[11px] font-semibold">{s.title}</p>
                  <p className="text-blue-300/55 text-[10px] mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest News */}
      {info.news?.length > 0 && (
        <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(100,180,255,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Latest News</span>
          </div>
          <div className="space-y-1.5">
            {info.news.map((n, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg p-2 -mx-2">
                {n.date && <span className="text-[10px] text-blue-300/50 mt-0.5 shrink-0 w-20">{n.date}</span>}
                <span className="text-white/80 text-[11px] leading-relaxed">{n.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab({ circleId, isAdmin, isModerator, user }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['institutional-announcements', circleId],
    queryFn: () => supabase.from('Post').select('*').match({ circle_id: circleId }).order('created_date', { ascending: false }).limit(30).then(res => res.data || []),
  });

  const announcements = posts.filter((p) => {
    const c = (p.content || '').toLowerCase();
    return ['announce', 'notice', 'official', 'statement', 'press', 'release', 'update', 'new', 'launching', 'scheduled', 'important'].some((kw) => c.includes(kw));
  });

  const createPost = useMutation({
    mutationFn: () => supabase.from('Post').insert({
      content,
      circle_id: circleId,
      visibility: 'circle',
      post_type: 'text',
      author_name: user?.full_name || user?.email?.split('@')[0] || 'Official',
      author_avatar: user?.avatar_url || null,
    }),
    onSuccess: () => {
      setContent('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['institutional-announcements', circleId] });
    },
  });

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Official Announcements</span>
        </div>
        {(isAdmin || isModerator) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-semibold"
          >
            <Plus className="w-3 h-3" /> Post
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-xl p-4 border space-y-3"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <Textarea
            placeholder="Write an official announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-amber-400/20 text-white placeholder:text-blue-300/40 min-h-[80px] text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createPost.mutate()}
              disabled={!content.trim()}
              className="h-8 text-xs rounded-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
            >
              Publish
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="h-8 text-xs text-blue-300 hover:text-white rounded-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-blue-300/40 text-sm text-center py-6">Loading...</p>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8">
          <Megaphone className="w-8 h-8 text-blue-300/20 mx-auto mb-2" />
          <p className="text-blue-300/40 text-sm">No announcements yet.</p>
          {(isAdmin || isModerator) && (
            <p className="text-blue-300/30 text-xs mt-1">Post the first official announcement above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 border"
              style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <Megaphone className="w-2.5 h-2.5" /> OFFICIAL
                </span>
                <span className="text-blue-300/50 text-[10px]">{p.author_name}</span>
                <span className="text-blue-300/30 text-[10px] ml-auto">{p.created_date ? new Date(p.created_date).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{p.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

const INST_TABS = [
  { id: 'info',          label: 'Info',           Icon: BookOpen },
  { id: 'announcements', label: 'Announcements',  Icon: Megaphone },
  { id: 'discussion',    label: 'Discussion',     Icon: LayoutList },
  { id: 'feed',          label: 'Feed',           Icon: Newspaper },
];

export default function InstitutionalCircleLayout({
  circle, user, circleId,
  // discussion props
  memberNames, memberProfiles, activeQuestion, selectedResponseData, setSelectedResponseData,
  responses, isMember, isAdmin, isModerator,
  newResponse, setNewResponse, submitResponse,
  newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
  allMemberIds,
}) {
  const [activeTab, setActiveTab] = useState('info');

  // ── Fetch real market data from entity (updated daily via automation) ──
  const { data: marketData = [] } = useQuery({
    queryKey: ['market-data'],
    queryFn: () => supabase.from('MarketData').select('*').then(res => res.data || []),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#0a0f1e 0%,#0f1e3a 50%,#091428 100%)' }}>

      {/* ── Institutional Header ── */}
      <div
        className="relative p-[2px]"
        style={{ background: 'linear-gradient(135deg,#f59e0b55,#1e3a8a,#0ea5e955)' }}
      >
        <div className="rounded-t-2xl px-6 py-5" style={{ background: 'linear-gradient(135deg,#0a0f1e,#0f1e3a)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 text-xs font-bold tracking-wider uppercase">Institutional Circle</span>
            {circle?.is_verified && (
              <VerifiedBadge label={circle.verified_label || 'Official'} size="sm" dark={true} />
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300/70 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/15">
              <Sparkles className="w-2.5 h-2.5" /> AI Analytics
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{circle?.name}</h1>
          {circle?.description && (
            <p className="text-blue-200/60 text-sm mb-2 line-clamp-2">{circle.description}</p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-blue-300/60">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {allMemberIds.length} members</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {circle?.privacy}</span>
          </div>
          {/* Decorative gold line */}
          <div className="mt-4 h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
        </div>
      </div>

      {/* ── Live Market Ticker ── */}
      <MarketTicker marketData={marketData} />

      {/* ── Tabs ── */}
      <div
        className="flex border-b"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(100,180,255,0.1)' }}
      >
        {INST_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === id
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-blue-300/50 hover:text-blue-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'info' && <InfoTab circle={circle} user={user} />}

          {activeTab === 'announcements' && (
            <AnnouncementsTab
              circleId={circleId}
              isAdmin={isAdmin}
              isModerator={isModerator}
              user={user}
            />
          )}

          {activeTab === 'discussion' && (
            <div style={{ color: 'white' }}>
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
              />

              {responses.length > 0 && (
                <div className="px-6 pb-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-200">
                    <MessageCircle className="w-4 h-4 text-amber-400" /> Responses
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {responses.map((r) => {
                        const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                        const avatar = rProfile?.avatar_url || r.author_avatar;
                        return (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                              selectedResponseData?.id === r.id
                                ? 'border-amber-400/40'
                                : 'hover:bg-white/5 border-white/10'
                            }`}
                            style={selectedResponseData?.id === r.id ? { background: 'rgba(245,158,11,0.08)' } : {}}
                            onClick={() => setSelectedResponseData(selectedResponseData?.id === r.id ? null : r)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {avatar ? (
                                <img src={avatar} alt={r.author_name} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                                  {r.author_name?.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm font-medium text-white">{r.author_name}</span>
                            </div>
                            <p className="text-sm text-blue-200/70 ml-9">{r.response_text}</p>
                            {/* Votes inline */}
                            <div className="flex items-center gap-1.5 ml-9 mt-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border border-white/10 text-blue-300/60 hover:text-emerald-400 hover:border-emerald-400/30"
                              >
                                <ChevronUp className="w-3.5 h-3.5" /> {r.upvoted_by?.length || 0}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border border-white/10 text-blue-300/60 hover:text-red-400 hover:border-red-400/30"
                              >
                                <ChevronDown className="w-3.5 h-3.5" /> {r.downvoted_by?.length || 0}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {isMember && activeQuestion && (
                <div className="px-6 pb-4">
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (newResponse.trim()) submitResponse.mutate(newResponse); }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Share your answer..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      className="flex-1 rounded-full h-10 bg-white/5 border-white/15 text-white placeholder:text-blue-300/40"
                    />
                    <Button type="submit" disabled={!newResponse.trim()} size="icon" className="rounded-full h-10 w-10 bg-amber-500 hover:bg-amber-600">
                      <Send className="w-4 h-4 text-slate-900" />
                    </Button>
                  </form>
                </div>
              )}

              {isAdmin && <CircleAdminDashboard circleId={circleId} circle={circle} />}
              <CircleEventCalendar circleId={circleId} isMember={isMember} isAdmin={isAdmin} isModerator={isModerator} currentUserId={user?.id} />
              <CircleMemberRoles circle={circle} currentUserId={user?.id} />
              <CircleLeaderboard circleId={circleId} />

              {isMember && (
                <div className="px-6 pb-6">
                  {showQuestionForm ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Ask a question to your circle..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="min-h-[80px] bg-white/5 border-white/15 text-white placeholder:text-blue-300/40"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => { if (newQuestion.trim()) createQuestion.mutate(newQuestion); }} disabled={!newQuestion.trim()} className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-900">Post Question</Button>
                        <Button variant="outline" onClick={() => setShowQuestionForm(false)} className="rounded-full border-white/20 text-blue-200 hover:bg-white/10">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowQuestionForm(true)} variant="outline" className="w-full rounded-full border-dashed border-white/20 text-blue-300 hover:bg-white/5">
                      <Plus className="w-4 h-4 mr-2" /> Ask a New Question
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feed' && <CircleFeed circle={circle} user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}