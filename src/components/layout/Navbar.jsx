import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, MessageCircle } from 'lucide-react';
import SearchBar from '@/components/layout/SearchBar';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import NotificationBell from '@/components/layout/NotificationBell';
import MobileMenuDrawer from '@/components/layout/MobileMenuDrawer';

import DownloadAppButton from '@/components/layout/DownloadAppButton';

export default function Navbar({ user }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Unread messages count
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => supabase.from('DirectMessage').select('*').match({ recipient_id: user?.id, is_read: false }).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });
  const hasUnreadMessages = unreadMessages.length > 0;

  return (
    <>
      <nav className="bg-blue-600 px-3 md:px-6 pt-safe pb-2 min-h-[60px] flex items-center justify-between shrink-0 shadow-md">
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          {/* Logo: stylized "i" inside light blue circle */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md"
            style={{ background: 'white' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="iGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8"/>
                  <stop offset="100%" stopColor="#0ea5e9"/>
                </linearGradient>
                <radialGradient id="dotGrad" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#38bdf8"/>
                  <stop offset="100%" stopColor="#1d4ed8"/>
                </radialGradient>
              </defs>
              <rect x="13" y="13" width="6" height="14" rx="3" fill="url(#iGrad)"/>
              <circle cx="16" cy="7" r="3.5" fill="url(#dotGrad)"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">Investraders</span>
        </Link>

        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/messages"
            className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors relative"
            title="Messages"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            {hasUnreadMessages && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-600" />
            )}
          </Link>

          <DownloadAppButton variant="compact" className="hidden xs:flex" />

          <NotificationBell />

          {/* 3-Line Hamburger Menu Icon Trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white ml-1"
            title="Menu"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </nav>

      {/* Facebook-style Push Menu Drawer */}
      <MobileMenuDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
