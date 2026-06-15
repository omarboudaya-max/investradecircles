import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Users, Circle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const q = query.trim().toLowerCase();

  const { data: users = [] } = useQuery({
    queryKey: ['search-users'],
    queryFn: () => supabase.from('profiles').select('*').then(res => res.data || []),
    staleTime: 60000,
  });

  const { data: circles = [] } = useQuery({
    queryKey: ['search-circles'],
    queryFn: () => supabase.from('Circle').select('*').then(res => res.data || []),
    staleTime: 60000,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['search-posts'],
    queryFn: () => supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    staleTime: 30000,
  });

  const matchedUsers = q ? users.filter((u) => (u.full_name || u.email || '').toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedCircles = q ? circles.filter((c) => (c.name || '').toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedPosts = q ? posts.filter((p) => (p.content || '').toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults = matchedUsers.length + matchedCircles.length + matchedPosts.length > 0;

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const go = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, circles, posts..."
          className="w-full h-9 pl-9 pr-8 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-popover border rounded-2xl shadow-xl z-50 overflow-hidden">
          {!hasResults ? (
            <div className="px-4 py-5 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          ) : (
            <div className="py-1">
              {matchedUsers.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">People</p>
                  {matchedUsers.map((u) => (
                    <button key={u.id} onClick={() => go(`/profile/${u.id}`)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.full_name || 'U').charAt(0)}
                      </div>
                      <span className="text-sm">{u.full_name || u.email}</span>
                    </button>
                  ))}
                </>
              )}
              {matchedCircles.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Circles</p>
                  {matchedCircles.map((c) => (
                    <button key={c.id} onClick={() => go(`/circle/${c.id}`)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(c.name || 'C').charAt(0)}
                      </div>
                      <span className="text-sm">{c.name}</span>
                    </button>
                  ))}
                </>
              )}
              {matchedPosts.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Posts</p>
                  {matchedPosts.map((p) => (
                    <button key={p.id} onClick={() => go(`/post/${p.id}`)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{p.content?.slice(0, 60)}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}