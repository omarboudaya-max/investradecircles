import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Bookmark, Users, Globe, MessageCircle, Bell, 
  ChevronDown, ChevronUp, Settings, HelpCircle, LogOut, 
  Moon, Sun, Languages, Lock, ShieldCheck, Eye, CircleDot, FileText, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

import PrivacySettingsModal from '@/components/layout/PrivacySettingsModal';
import TermsPrivacyModal from '@/components/layout/TermsPrivacyModal';
import ContactSupportModal from '@/components/layout/ContactSupportModal';
import DownloadAppButton from '@/components/layout/DownloadAppButton';

import CircleIcon from '@/components/circles/CircleIcon';

export default function MobileMenuDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isArabic, toggleLanguage } = useLanguage();
  const t = useTranslation();
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Modals state
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  // Background Scroll Locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch profile
  const { data: userProfile } = useQuery({
    queryKey: ['my-profile-drawer', user?.id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data?.[0],
  });
  const avatarUrl = userProfile?.avatar_url || null;

  // Fetch my circles for shortcuts
  const { data: myCircles = [] } = useQuery({
    queryKey: ['my-circles-shortcuts', user?.id],
    queryFn: () => supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(10).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data.filter((c) => c.created_by_id === user?.id || (c.member_ids || []).includes(user?.id)),
  });

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop with Fade In / Out */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose} 
            />

            {/* Slide Drawer Content with Smooth Slide In / Slide Out */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative w-[85%] max-w-sm h-full bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              {/* Top Header */}
              <div className="p-4 bg-background border-b flex items-center justify-between sticky top-0 z-20">
                <h2 className="text-xl font-bold text-foreground">Menu</h2>
                <button 
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-5 flex-1">
                
                {/* User Profile Card */}
                <div 
                  onClick={() => handleNav('/profile')}
                  className="bg-background rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border border-primary/20" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground truncate">{displayName}</h3>
                    <p className="text-xs text-muted-foreground">View your profile</p>
                  </div>
                </div>

                {/* Download App Action Button */}
                <DownloadAppButton className="w-full py-3 text-sm shadow-md" />

                {/* Your Shortcuts */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2.5 px-1 uppercase tracking-wider">Your Shortcuts</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    <div 
                      onClick={() => handleNav('/all-circles')}
                      className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer w-20"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                        <Globe className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-medium text-center truncate w-full text-foreground">All Circles</span>
                    </div>

                    {myCircles.map((circle) => (
                      <div 
                        key={circle.id}
                        onClick={() => handleNav(`/circle/${circle.id}`)}
                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer w-20 group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-card border-2 border-primary/20 flex items-center justify-center text-primary shadow-sm overflow-hidden p-1 transition-transform group-hover:scale-105">
                          {circle.website_url ? (
                            <img src={`https://www.google.com/s2/favicons?domain=${circle.website_url}&sz=128`} alt="" className="w-8 h-8 rounded-lg object-contain" />
                          ) : (
                            <CircleIcon category={circle.category} size="md" websiteUrl={circle.website_url} />
                          )}
                        </div>
                        <span className="text-xs font-medium text-center truncate w-full text-foreground group-hover:text-primary transition-colors">{circle.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2-Column Menu Tiles Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => handleNav('/saved')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Bookmark className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-semibold text-foreground">Saved Posts</span>
                  </div>

                  <div 
                    onClick={() => handleNav('/my-circles')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Users className="w-6 h-6 text-emerald-600" />
                    <span className="text-sm font-semibold text-foreground">My Circles</span>
                  </div>

                  <div 
                    onClick={() => handleNav('/all-circles')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Globe className="w-6 h-6 text-purple-600" />
                    <span className="text-sm font-semibold text-foreground">Explore Circles</span>
                  </div>

                  <div 
                    onClick={() => handleNav('/messages')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6 text-sky-600" />
                    <span className="text-sm font-semibold text-foreground">Messages</span>
                  </div>

                  <div 
                    onClick={() => handleNav('/notifications')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <Bell className="w-6 h-6 text-amber-600" />
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                  </div>

                  <div 
                    onClick={() => handleNav('/profile')}
                    className="bg-background rounded-2xl p-3.5 shadow-sm border border-border flex flex-col gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <User className="w-6 h-6 text-rose-600" />
                    <span className="text-sm font-semibold text-foreground">My Profile</span>
                  </div>

                  {/* Admin Dashboard Tile for Admin Accounts */}
                  {(user?.role === 'admin' || user?.is_admin || userProfile?.role === 'admin' || userProfile?.is_admin || user?.app_metadata?.role === 'admin') && (
                    <div 
                      onClick={() => handleNav('/admin')}
                      className="bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl p-3.5 shadow-sm border border-amber-500/40 flex flex-col gap-2 cursor-pointer hover:bg-amber-500/20 transition-all col-span-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-6 h-6 text-amber-500" />
                          <span className="text-sm font-bold text-foreground">Admin Dashboard</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">Admin Only</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Manage users, circles, posts, and audit logs</p>
                    </div>
                  )}
                </div>

                {/* Expandable Section 1: Settings and privacy */}
                <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-sm text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <span>Settings and privacy</span>
                    </div>
                    {settingsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {settingsOpen && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-3 animate-in fade-in duration-200">
                      {/* Language Switcher */}
                      <button 
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between py-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Languages className="w-4 h-4 text-blue-600" />
                          <span>Language</span>
                        </div>
                        <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{isArabic ? 'العربية' : 'English'}</span>
                      </button>

                      {/* Dark Mode Switcher */}
                      <button 
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between py-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-600" />}
                          <span>Theme</span>
                        </div>
                        <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">{isDark ? 'Dark' : 'Light'}</span>
                      </button>

                      {/* Password & Security */}
                      <button 
                        onClick={() => handleNav('/forgot-password')}
                        className="w-full flex items-center gap-2.5 py-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>Password & Security</span>
                      </button>

                      {/* Privacy Settings Modal Trigger */}
                      <button 
                        onClick={() => setPrivacyModalOpen(true)}
                        className="w-full flex items-center gap-2.5 py-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Eye className="w-4 h-4 text-sky-600" />
                        <span>Privacy Settings</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expandable Section 2: Help and support */}
                <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setHelpOpen(!helpOpen)}
                    className="w-full px-4 py-3.5 flex items-center justify-between font-semibold text-sm text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                      <span>Help and support</span>
                    </div>
                    {helpOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {helpOpen && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-3 animate-in fade-in duration-200 text-xs">
                      {/* Contact Support Trigger */}
                      <button
                        onClick={() => setContactModalOpen(true)}
                        className="w-full flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>Contact Support</span>
                      </button>

                      {/* Terms & Privacy Policy Trigger */}
                      <button
                        onClick={() => setTermsModalOpen(true)}
                        className="w-full flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Terms & Privacy Policy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    onClose();
                    supabase.auth.signOut();
                  }}
                  className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <PrivacySettingsModal isOpen={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
      <TermsPrivacyModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
      <ContactSupportModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} user={user} />
    </>
  );
}
