import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LandingContact() {
  const { user, isLoadingAuth } = useAuth();
  const [sent, setSent] = useState(false);
  const t = useTranslation();
  const { isArabic } = useLanguage();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new URLSearchParams(new FormData(form));
    const name = form.name.value;
    const mailto = `mailto:hello@investraders.com?subject=Contact%20from%20${encodeURIComponent(name)}&body=${encodeURIComponent(data.toString().replace(/&/g,'\n').replace(/=/g,': '))}`;
    setSent(true);
    window.location.href = mailto;
  };

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className={`max-w-3xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ${isArabic ? 'text-right' : 'text-left'}`}>
        <h1 className="text-3xl font-bold mb-4">{t.contact.title}</h1>
        <p className="text-gray-300 mb-6">{t.contact.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 p-6 rounded-lg border border-white/5">
          <label className="block">
            <span className="text-sm text-gray-200">{t.contact.name}</span>
            <input name="name" required className="w-full mt-1 p-3 rounded bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500 transition-colors" placeholder={t.contact.namePlaceholder} dir={isArabic ? 'rtl' : 'ltr'} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-200">{t.contact.email}</span>
            <input name="email" type="email" required className="w-full mt-1 p-3 rounded bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="you@example.com" dir="ltr" />
          </label>
          <label className="block">
            <span className="text-sm text-gray-200">{t.contact.org}</span>
            <input name="org" className="w-full mt-1 p-3 rounded bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500 transition-colors" placeholder={t.contact.orgPlaceholder} dir={isArabic ? 'rtl' : 'ltr'} />
          </label>
          <label className="block">
            <span className="text-sm text-gray-200">{t.contact.message}</span>
            <textarea name="message" required className="w-full mt-1 p-3 rounded bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-500 transition-colors" rows="5" placeholder={t.contact.messagePlaceholder} dir={isArabic ? 'rtl' : 'ltr'}></textarea>
          </label>

          <div className={`flex items-center gap-4 pt-2 flex-wrap ${isArabic ? 'flex-row-reverse' : ''}`}>
            <button type="submit" className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">{t.contact.send}</button>
            <a href="mailto:hello@investraders.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">{t.contact.orEmail}</a>
          </div>

          {sent && (
            <p className="text-green-400 mt-4 text-sm bg-green-500/10 p-3 rounded border border-green-500/20">
              {t.contact.thankYou}
            </p>
          )}
        </form>
      </main>
      <WebsiteFooter />
    </div>
  );
}
