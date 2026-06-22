import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Trash2, FileText, Bell, CircleDot, BarChart2, MessageCircle, TrendingUp, UserCheck, Hash, ClipboardList, ShieldCheck } from 'lucide-react';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, subDays, isAfter } from 'date-fns';
import { useRBAC } from '@/hooks/useRBAC';
import { logger } from '@/lib/logger';
import { CACHE } from '@/lib/query-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = ['Overview', 'Users', 'Posts', 'Circles', 'Audit Log'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useRBAC();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');

  const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => supabase.from('profiles').select('*').then(res => res.data || []), staleTime: CACHE.short });
  const { data: allPosts = [] } = useQuery({ queryKey: ['admin-posts'], queryFn: () => supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(200).then(res => res.data || []), staleTime: CACHE.short });
  const { data: allCircles = [] } = useQuery({ queryKey: ['admin-circles'], queryFn: () => supabase.from('Circle').select('*').then(res => res.data || []), staleTime: CACHE.medium });
  const { data: allComments = [] } = useQuery({ queryKey: ['admin-comments'], queryFn: () => supabase.from('Comment').select('*').order('created_date', { ascending: false }).limit(200).then(res => res.data || []), staleTime: CACHE.short });
  const { data: allResponses = [] } = useQuery({ queryKey: ['admin-responses-all'], queryFn: () => supabase.from('CircleResponse').select('*').order('created_date', { ascending: false }).limit(200).then(res => res.data || []), staleTime: CACHE.short });

  const addAuditLog = async (action, details) => {
    await supabase.from('AuditLog').insert({
      admin_id: user?.id,
      admin_name: user?.full_name || user?.email || 'Admin',
      action,
      details,
    });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => supabase.from('AuditLog').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    enabled: !!user?.id && isAdmin,
    staleTime: CACHE.short,
  });

  const deletePost = useMutation({
    mutationFn: (id) => supabase.from('Post').delete().eq('id', id),
    onSuccess: (_, id) => {
      logger.track('admin_post_deleted', { post_id: id, admin_id: user?.id });
      addAuditLog('delete_post', `Deleted post ${id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  const deleteCircle = useMutation({
    mutationFn: (id) => supabase.from('Circle').delete().eq('id', id),
    onSuccess: (_, id) => {
      logger.track('admin_circle_deleted', { circle_id: id, admin_id: user?.id });
      addAuditLog('delete_circle', `Deleted circle ${id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-circles'] });
    },
  });

  const changeUserRole = useMutation({
    mutationFn: ({ id, role }) => supabase.from('profiles').update({ role }).eq('id', id),
    onSuccess: (_, vars) => {
      logger.track('admin_role_changed', { target_user: vars.id, new_role: vars.role, admin_id: user?.id });
      addAuditLog('role_change', `Changed user ${vars.id} role to ${vars.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const toggleVerified = useMutation({
    mutationFn: ({ id, is_verified, verified_label }) =>
      supabase.from('Circle').update({ is_verified, verified_label: verified_label || '' }).eq('id', id),
    onSuccess: (_, vars) => {
      addAuditLog(
        vars.is_verified ? 'circle_verified' : 'circle_unverified',
        `${vars.is_verified ? 'Granted' : 'Revoked'} verified badge for circle ${vars.id}`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-circles'] });
    },
  });

  if (!isAdmin) return <Navigate to="/home" replace />;

  const filteredUsers = allUsers.filter((u) =>
    (u.full_name || u.email || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredPosts = allPosts.filter((p) =>
    (p.content || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredCircles = allCircles.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Computed stats
  const last7days = subDays(new Date(), 7);
  const last30days = subDays(new Date(), 30);
  const newUsersLast7 = allUsers.filter((u) => u.created_date && isAfter(new Date(u.created_date), last7days)).length;
  const postsLast7 = allPosts.filter((p) => p.created_date && isAfter(new Date(p.created_date), last7days)).length;
  const postsLast30 = allPosts.filter((p) => p.created_date && isAfter(new Date(p.created_date), last30days)).length;
  const totalMembers = allCircles.reduce((acc, c) => {
    return acc + Array.from(new Set([...(c.member_ids || []), ...(c.created_by_id ? [c.created_by_id] : [])])).length;
  }, 0);
  const avgMembersPerCircle = allCircles.length ? (totalMembers / allCircles.length).toFixed(1) : 0;
  const totalLikes = allPosts.reduce((acc, p) => acc + (p.likes || 0), 0);

  // Top poster
  const posterCounts = {};
  allPosts.forEach((p) => { if (p.author_name) posterCounts[p.author_name] = (posterCounts[p.author_name] || 0) + 1; });
  const topPoster = Object.entries(posterCounts).sort((a, b) => b[1] - a[1])[0];

  // Top circle by members
  const topCircle = [...allCircles].sort((a, b) => {
    const aCount = Array.from(new Set([...(a.member_ids || []), ...(a.created_by_id ? [a.created_by_id] : [])])).length;
    const bCount = Array.from(new Set([...(b.member_ids || []), ...(b.created_by_id ? [b.created_by_id] : [])])).length;
    return bCount - aCount;
  })[0];

  // Posts per day (last 7 days) for chart
  const dailyPostsData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStart = new Date(day.setHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999));
    return {
      day: format(dayStart, 'EEE'),
      Posts: allPosts.filter((p) => p.created_date && new Date(p.created_date) >= dayStart && new Date(p.created_date) <= dayEnd).length,
      Comments: allComments.filter((c) => c.created_date && new Date(c.created_date) >= dayStart && new Date(c.created_date) <= dayEnd).length,
    };
  });

  const statCards = [
    { label: 'Total Users', value: allUsers.length, sub: `+${newUsersLast7} this week`, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Posts', value: allPosts.length, sub: `${postsLast7} this week`, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Total Circles', value: allCircles.length, sub: `Avg ${avgMembersPerCircle} members`, icon: CircleDot, color: 'bg-purple-500' },
    { label: 'Total Comments', value: allComments.length, sub: `${allResponses.length} circle responses`, icon: MessageCircle, color: 'bg-cyan-500' },
    { label: 'Total Likes', value: totalLikes, sub: 'across all posts', icon: TrendingUp, color: 'bg-pink-500' },
    { label: 'Posts (30d)', value: postsLast30, sub: 'last 30 days', icon: BarChart2, color: 'bg-emerald-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform management & oversight</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(''); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab !== 'Overview' && (
        <Input
          placeholder={`Search ${tab.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-sm"
        />
      )}

      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-card border rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Highlights row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPoster && (
              <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Poster</p>
                  <p className="font-semibold text-sm">{topPoster[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{topPoster[1]} posts published</p>
                </div>
              </div>
            )}
            {topCircle && (
              <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Largest Circle</p>
                  <p className="font-semibold text-sm truncate">{topCircle.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Array.from(new Set([...(topCircle.member_ids || []), ...(topCircle.created_by_id ? [topCircle.created_by_id] : [])])).length} members · {topCircle.category}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Daily activity chart */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b font-semibold text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Daily Activity (last 7 days)
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyPostsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="Posts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comments" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Data Controls */}
          <div className="bg-card border rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Live Market Data Sync
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Force a manual refresh of the global scrolling ticker data (Stocks, Forex, Crypto).
                </p>
              </div>
              <Button 
                onClick={async () => {
                  if (!window.confirm('This will fetch fresh data from Yahoo Finance, CoinGecko, and Ilboursa. Continue?')) return;
                  
                  const btn = document.getElementById('market-refresh-btn');
                  const originalText = btn.innerHTML;
                  btn.innerHTML = '<span class="animate-pulse">Fetching...</span>';
                  btn.disabled = true;

                  try {
                    addAuditLog('market_data_refresh', 'Manually refreshed global market ticker data');
                    const updated = [];
                    const timeNow = new Date().toISOString();

                    // 1. CoinGecko (Crypto)
                    try {
                      const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
                      const cgData = await cgRes.json();
                      if (cgData.bitcoin) {
                        await supabase.from('MarketData').upsert({ symbol: 'BTC/USD', price: cgData.bitcoin.usd, change_pct: Number(cgData.bitcoin.usd_24h_change.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
                        updated.push('BTC/USD');
                      }
                      if (cgData.ethereum) {
                        await supabase.from('MarketData').upsert({ symbol: 'ETH/USD', price: cgData.ethereum.usd, change_pct: Number(cgData.ethereum.usd_24h_change.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
                        updated.push('ETH/USD');
                      }
                    } catch (e) { console.error('Crypto error:', e); }

                    // 2. Yahoo Finance via proxy
                    const YAHOO = [
                      { s: 'S&P 500', y: '^GSPC' }, { s: 'NASDAQ', y: '^IXIC' }, { s: 'DOW', y: '^DJI' },
                      { s: 'GOLD', y: 'GC=F' }, { s: 'OIL (WTI)', y: 'CL=F' }, { s: 'EUR/USD', y: 'EURUSD=X' }
                    ];
                    for (const t of YAHOO) {
                      try {
                        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${t.y}?interval=1d&range=2d`)}`;
                        const res = await fetch(url);
                        const data = await res.json();
                        const meta = data?.chart?.result?.[0]?.meta;
                        if (meta) {
                          const price = meta.regularMarketPrice;
                          const prev = meta.chartPreviousClose || meta.previousClose;
                          const pct = prev ? ((price - prev) / prev) * 100 : 0;
                          await supabase.from('MarketData').upsert({ symbol: t.s, price, change_pct: Number(pct.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
                          updated.push(t.s);
                        }
                      } catch (e) { console.error('Yahoo error:', e); }
                    }

                    // 3. Ilboursa via proxy
                    const TUNIS = ['PX1', 'SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];
                    for (const s of TUNIS) {
                      try {
                        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.ilboursa.com/marches/cotation_${s}`)}`;
                        const res = await fetch(url);
                        const html = await res.text();
                        
                        const priceMatch = html.match(/<div class="cot_v1b">([^<]+)<\/div>/i);
                        const changeMatch = html.match(/<div class="quote_(?:up|down|eq|neutral|eqc)\d">([^<]+)<\/div>/i);
                        
                        const rawPrice = priceMatch ? priceMatch[1].replace(/&#xA0;/g, '').replace(/&nbsp;/g, '').trim() : null;
                        const rawChange = changeMatch ? changeMatch[1].trim() : null;
                        
                        const price = rawPrice ? parseFloat(rawPrice.replace(/TND/gi, '').replace(/[\s\xa0]/g, '').replace(',', '.')) : null;
                        const change = rawChange ? parseFloat(rawChange.replace(/&#x2B;/gi, '+').replace(/&#x2D;/gi, '-').replace('%', '').replace(',', '.')) : null;

                        if (price !== null && !isNaN(price)) {
                          const sym = s === 'PX1' ? 'TUNINDEX' : s;
                          await supabase.from('MarketData').upsert({ symbol: sym, price, change_pct: isNaN(change) ? 0 : change, updated_at: timeNow }, { onConflict: 'symbol' });
                          updated.push(sym);
                        }
                      } catch (e) { console.error('Ilboursa error:', e); }
                    }

                    alert(`Successfully refreshed ${updated.length} market assets!`);
                  } catch (err) {
                    alert('Error refreshing data. See console.');
                    console.error(err);
                  } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                  }
                }}
                id="market-refresh-btn"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Actualise Market Data
              </Button>
            </div>
          </div>

          {/* Recent posts */}
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Recent Posts
            </div>
            <div className="divide-y">
              {allPosts.slice(0, 5).map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(p.author_name || 'U').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.content?.slice(0, 80)}</p>
                    <p className="text-xs text-muted-foreground">{p.author_name} · {p.created_date ? format(new Date(p.created_date), 'MMM d') : ''} · {p.likes || 0} likes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b text-xs text-muted-foreground font-medium">
            {filteredUsers.length} users total
          </div>
          <div className="divide-y">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name || u.email || 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · joined {u.created_date ? format(new Date(u.created_date), 'MMM d, yyyy') : '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                  {u.role || 'user'}
                </span>
                {u.id !== user.id && (
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => changeUserRole.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}>
                    {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Posts' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b text-xs text-muted-foreground font-medium">
            {filteredPosts.length} posts
          </div>
          <div className="divide-y">
            {filteredPosts.map((p) => (
              <div key={p.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {(p.author_name || 'U').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{p.content}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.author_name} · {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : ''} · {p.likes || 0} likes · {(p.liked_by || []).length} reactions</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => deletePost.mutate(p.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Audit Log' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center gap-2 font-semibold text-sm">
            <ClipboardList className="w-4 h-4 text-primary" /> Admin Audit Log
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No audit events yet</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.action?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      by {log.admin_name} · {log.created_date ? format(new Date(log.created_date), 'MMM d, yyyy HH:mm') : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'Circles' && (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b text-xs text-muted-foreground font-medium flex items-center gap-2">
            {filteredCircles.length} circles
            <span className="ml-auto flex items-center gap-1 text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              {allCircles.filter((c) => c.is_verified).length} verified
            </span>
          </div>
          <div className="divide-y">
            {filteredCircles.map((c) => {
              const memberCount = Array.from(new Set([...(c.member_ids || []), ...(c.created_by_id ? [c.created_by_id] : [])])).length;
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(c.name || 'C').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      {c.is_verified && <VerifiedBadge label={c.verified_label || 'Verified'} size="sm" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {memberCount} members · {c.category?.replace(/_/g, ' ') || 'general'} · {c.privacy || 'public'} · created {c.created_date ? format(new Date(c.created_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={c.is_verified ? 'default' : 'outline'}
                    className={`h-7 text-xs shrink-0 gap-1 ${c.is_verified ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                    onClick={() => toggleVerified.mutate({
                      id: c.id,
                      is_verified: !c.is_verified,
                      verified_label: c.category === 'institutional'
                        ? (c.verified_label || 'Official')
                        : (c.verified_label || 'Verified'),
                    })}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {c.is_verified ? 'Verified' : 'Verify'}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => deleteCircle.mutate(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
