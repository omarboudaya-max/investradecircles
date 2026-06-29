import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, LogOut, User, MessageCircle, Bookmark, Shield, Sun, Moon, Languages } from 'lucide-react';
import SearchBar from '@/components/layout/SearchBar';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from '@/components/layout/NotificationBell';
import ShortcutsModal from '@/components/layout/ShortcutsModal';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Navbar({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const { isArabic, toggleLanguage } = useLanguage();
  const t = useTranslation();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const { data: userProfile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data?.[0],
  });
  const avatarUrl = userProfile?.avatar_url || null;

  // Unread messages count
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => supabase.from('DirectMessage').select('*').match({ recipient_id: user?.id, is_read: false }).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });
  const hasUnreadMessages = unreadMessages.length > 0;
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 px-4 md:px-6 h-16 flex items-center justify-between shrink-0">
      <Link to="/home" className="flex items-center gap-2 shrink-0">
        {/* Logo: stylized "i" inside light blue circle */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md"
          style={{ background: 'white' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            {/* Stem */}
            <rect x="13" y="13" width="6" height="14" rx="3" fill="url(#iGrad)"/>
            {/* Dot */}
            <circle cx="16" cy="7" r="3.5" fill="url(#dotGrad)"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-white hidden sm:block">Investraders</span>
      </Link>

      <div className="flex-1 max-w-md mx-4">
        <SearchBar />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShortcutsOpen(true)}
          className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <LayoutGrid className="w-4 h-4 text-white" />
        </button>
        <Link
          to="/messages"
          className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors relative"
        >
          <MessageCircle className="w-4 h-4 text-white" />
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-600" />
          )}
        </Link>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white text-xs font-bold"
          title={isArabic ? t.navbar.switchToEnglish : t.navbar.switchToArabic}
          aria-label="Toggle language"
        >
          {isArabic ? 'EN' : 'ع'}
        </button>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          title={isDark ? t.navbar.switchToLight : t.navbar.switchToDark}
        >
          {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}
        </button>
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ml-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-sm">
                  {initials}
                </div>
              )}
              <span className="text-sm font-medium hidden md:block text-white">{displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isArabic ? 'start' : 'end'}>
            <DropdownMenuItem asChild>
              <Link to="/profile"><User className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.navbar.myProfile}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/saved"><Bookmark className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.navbar.savedPosts}</Link>
            </DropdownMenuItem>
            {user?.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link to="/admin"><Shield className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.navbar.adminDashboard}</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
              <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t.navbar.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} user={user} />
    </nav>
  );
}
