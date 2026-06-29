import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function WebsiteNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const t = useTranslation();
  const { isArabic, toggleLanguage } = useLanguage();

  const links = [
    { name: t.websiteNav.institutions, path: '/institutions' },
    { name: t.websiteNav.businesses, path: '/contact' },
    { name: t.websiteNav.individuals, path: '/individuals' },
    { name: t.websiteNav.threeM, path: '/3m' },
  ];

  return (
    <header className="relative z-20">
      <nav className={`max-w-6xl mx-auto px-6 py-6 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#030914] font-bold italic font-serif">i</div>
            <div className="font-bold tracking-tight text-white text-xl">investrade</div>
          </Link>
        </div>

        <div className={`hidden sm:flex items-center gap-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {links.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`text-sm ${path === link.path ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
        
        <div className={`hidden sm:flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="text-sm text-gray-300 hover:text-white font-bold transition-colors w-8 h-8 rounded-full border border-gray-600 hover:border-white flex items-center justify-center"
            title={isArabic ? t.navbar.switchToEnglish : t.navbar.switchToArabic}
          >
            {isArabic ? 'EN' : 'ع'}
          </button>
          <Link to="/login" className="text-sm text-gray-300 hover:text-white font-medium transition-colors">{t.websiteNav.signIn}</Link>
          <Link to="/register" className="px-5 py-2 rounded-full bg-[#38bdf8] text-[#030914] font-bold text-sm hover:bg-[#7dd3fc] transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)]">{t.websiteNav.getStarted}</Link>
        </div>

        <div className="sm:hidden">
          <button onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} className="p-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors">
            {!isOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            )}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="sm:hidden px-4 pb-6 absolute w-full bg-[#071025] z-50 shadow-xl border-b border-white/10 animate-in slide-in-from-top-2">
          <div className={`flex flex-col gap-4 max-w-3xl mx-auto pt-2 ${isArabic ? 'text-right' : 'text-left'}`}>
            {links.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)}
                className={`text-base block py-1 ${path === link.path ? 'text-white font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-white/10 my-2 pt-4 flex flex-col gap-3">
              {/* Language toggle in mobile menu */}
              <button
                onClick={() => { toggleLanguage(); setIsOpen(false); }}
                className="text-white font-semibold py-2 text-center rounded-lg bg-white/5 hover:bg-white/10"
              >
                {isArabic ? 'English' : 'عربي'}
              </button>
              <Link to="/login" className="text-white font-semibold py-2 text-center rounded-lg bg-white/5 hover:bg-white/10" onClick={() => setIsOpen(false)}>{t.websiteNav.signIn}</Link>
              <Link to="/register" className="text-[#030914] font-bold py-2 text-center rounded-lg bg-[#38bdf8] hover:bg-[#7dd3fc]" onClick={() => setIsOpen(false)}>{t.websiteNav.getStarted}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
