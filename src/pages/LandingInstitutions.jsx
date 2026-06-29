import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function LandingInstitutions() {
  const { user, isLoadingAuth } = useAuth();
  const t = useTranslation();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold mb-4">{t.institutions.title}</h1>
        <p className="text-gray-300 mb-6">{t.institutions.subtitle}</p>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">{t.institutions.chambersTitle}</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">{t.institutions.chambersDesc}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">{t.institutions.stockTitle}</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">{t.institutions.stockDesc}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">{t.institutions.universitiesTitle}</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">{t.institutions.universitiesDesc}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">{t.institutions.governmentTitle}</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">{t.institutions.governmentDesc}</p>
          </div>
        </section>

        <section className="mt-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 p-6 rounded-lg border border-cyan-500/20">
          <h3 className="font-semibold text-xl">{t.institutions.onboardingTitle}</h3>
          <p className="text-gray-300 mt-2">{t.institutions.onboardingDesc}</p>
          <div className="mt-6">
            <Link to="/contact" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">{t.institutions.requestDemo}</Link>
          </div>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
