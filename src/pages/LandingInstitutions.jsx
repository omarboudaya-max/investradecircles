import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';

export default function LandingInstitutions() {
  const { user, isLoadingAuth } = useAuth();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold mb-4">For Institutions</h1>
        <p className="text-gray-300 mb-6">We provide tools tailored for Chambers of Commerce, Stock Exchanges, Universities, and governments to increase visibility, build ecosystems and drive measurable outcomes.</p>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Chambers of Commerce</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">Create national and international directories, host events, and foster trade relations with partner institutions.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Stock Exchanges & Regulators</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">Curated company profiles, verified listings, and analytics to support investor relations and market transparency.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Universities & Research</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">Enable alumni networks, spin-out visibility, and industry-academia collaboration spaces.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Government & Development Agencies</h3>
            <p className="text-gray-300 mt-2 text-sm leading-relaxed">Showcase national champions, enable investment promotion, and coordinate regional trade initiatives.</p>
          </div>
        </section>

        <section className="mt-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 p-6 rounded-lg border border-cyan-500/20">
          <h3 className="font-semibold text-xl">Institution Onboarding</h3>
          <p className="text-gray-300 mt-2">We offer onboarding, data migration, and dedicated support to integrate your institution's members and resources.</p>
          <div className="mt-6">
            <Link to="/contact" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">Request Institutional Demo</Link>
          </div>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
