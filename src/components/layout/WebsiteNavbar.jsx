import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import DownloadAppButton from '@/components/layout/DownloadAppButton';

export default function WebsiteNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const t = useTranslation();
  const { isArabic, toggleLanguage } = useLanguage();

  const links = [
    { name: isArabic ? 'شبكة الاستثمار' : 'Investment Network', path: '/network', badge: 'AI' },
    { name: isArabic ? 'خريطة الاستثمار' : 'Investment Map', path: '/investment-map', badge: 'MAP' },
    { name: isArabic ? 'الذكاء التنفيذي' : 'Executive AI', path: '/executive-intelligence', badge: 'PRO' },
    { name: isArabic ? 'الملتقى 13 أكتوبر' : 'Event 13 Oct', path: '/event' },
    { name: t.websiteNav?.institutions || 'Institutions', path: '/institutions' },
    { name: t.websiteNav?.businesses || 'Businesses', path: '/contact' },
    { name: t.websiteNav?.individuals || 'Individuals', path: '/individuals' },
  ];

  return (
    <header className="relative z-30 w-full border-b border-white/10 bg-[#071025]/85 backdrop-blur-md">
      <nav className="w-full max-w-[98%] 2xl:max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3.5 flex items-center justify-between gap-2 lg:gap-4">
        {/* Logo Left */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#030914] font-bold italic font-serif text-lg shadow-[0_0_12px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
              i
            </div>
            <div className="font-bold tracking-tight text-white text-xl">investraders</div>
          </Link>
        </div>

        {/* Center Nav Links - Utilizing Left & Right Space */}
        <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-3 xl:gap-5 flex-1 mx-2">
          {links.map((link) => {
            const isActive = path === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs lg:text-sm font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap px-2.5 py-1.5 rounded-lg ${
                  isActive
                    ? 'text-white bg-white/10 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] lg:text-[10px] font-black rounded-md bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons Right */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="text-xs lg:text-sm text-slate-300 hover:text-white font-bold transition-colors w-8 h-8 rounded-full border border-slate-700 hover:border-white flex items-center justify-center bg-white/5"
            title={isArabic ? t.navbar?.switchToEnglish || 'Switch to English' : t.navbar?.switchToArabic || 'Switch to Arabic'}
          >
            {isArabic ? 'EN' : 'ع'}
          </button>
          
          <DownloadAppButton variant="compact" />
          
          <Link
            to="/login"
            className="text-xs lg:text-sm text-slate-300 hover:text-[#38bdf8] font-semibold transition-colors px-2.5 lg:px-3 py-2 rounded-lg hover:bg-white/5"
          >
            {t.websiteNav?.signIn || 'Sign In'}
          </Link>
          
          <Link
            to="/register"
            className="px-3.5 lg:px-5 py-2 rounded-full bg-[#38bdf8] text-[#030914] font-bold text-xs lg:text-sm hover:bg-[#7dd3fc] transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:scale-105 whitespace-nowrap"
          >
            {t.websiteNav?.getStarted || 'Get Started'}
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="text-xs text-slate-300 font-bold w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center bg-white/5"
          >
            {isArabic ? 'EN' : 'ع'}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle menu"
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {!isOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-6 absolute w-full bg-[#071025] z-50 shadow-2xl border-b border-white/10 animate-in slide-in-from-top-2">
          <div className={`flex flex-col gap-3 max-w-3xl mx-auto pt-3 ${isArabic ? 'text-right' : 'text-left'}`}>
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm py-2 px-3 rounded-lg flex items-center justify-between ${
                  path === link.path ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-cyan-400 text-slate-950">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="border-t border-white/10 my-2 pt-4 flex flex-col gap-2.5">
              <DownloadAppButton className="w-full" />
              <Link
                to="/login"
                className="text-white font-semibold py-2.5 text-center rounded-xl bg-white/5 hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                {t.websiteNav?.signIn || 'Sign In'}
              </Link>
              <Link
                to="/register"
                className="text-[#030914] font-bold py-2.5 text-center rounded-xl bg-[#38bdf8] hover:bg-[#7dd3fc]"
                onClick={() => setIsOpen(false)}
              >
                {t.websiteNav?.getStarted || 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
