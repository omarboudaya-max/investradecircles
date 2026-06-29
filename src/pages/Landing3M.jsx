import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Landing3M() {
  const { user, isLoadingAuth } = useAuth();
  const t = useTranslation();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold mb-4">{t.threeM.title}</h1>
        <p className="text-gray-300 mb-6 text-lg">{t.threeM.subtitle}</p>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-amber-400">{t.threeM.subscriptionsTitle}</h3>
            <p className="text-gray-300 mt-2">{t.threeM.subscriptionsDesc}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-cyan-400">{t.threeM.eventsTitle}</h3>
            <p className="text-gray-300 mt-2">{t.threeM.eventsDesc}</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-blue-400">{t.threeM.consultingTitle}</h3>
            <p className="text-gray-300 mt-2">{t.threeM.consultingDesc}</p>
          </div>
        </section>

        <div className="mt-8 bg-white/5 p-6 rounded-lg border border-white/10">
          <h3 className="font-semibold text-xl mb-3">{t.threeM.howInstTitle}</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>{t.threeM.bullet1}</li>
            <li>{t.threeM.bullet2}</li>
            <li>{t.threeM.bullet3}</li>
          </ul>
          <div className="mt-6">
            <Link to="/contact" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">{t.threeM.talkToSales}</Link>
          </div>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
