import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';

export default function Landing3M() {
  const { user, isLoadingAuth } = useAuth();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold mb-4">3M — Make Money Meanwhile</h1>
        <p className="text-gray-300 mb-6 text-lg">3M is our monetization framework designed to help communities, institutions, and individuals earn revenue while the platform creates value.</p>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-amber-400">Subscriptions & Memberships</h3>
            <p className="text-gray-300 mt-2">Offer tiers, paid groups, and premium content to members and partners.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-cyan-400">Paid Events & Webinars</h3>
            <p className="text-gray-300 mt-2">Organize ticketed events with integrated promotion and attendee management.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg text-blue-400">Consulting & Marketplace</h3>
            <p className="text-gray-300 mt-2">Facilitate paid services, B2B introductions, and project-based matchmaking.</p>
          </div>
        </section>

        <div className="mt-8 bg-white/5 p-6 rounded-lg border border-white/10">
          <h3 className="font-semibold text-xl mb-3">How institutions earn</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Subscription revenue from members</li>
            <li>Event ticket sales and sponsor revenue</li>
            <li>Service marketplace fees</li>
          </ul>
          <div className="mt-6">
            <Link to="/contact" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">Talk to Sales</Link>
          </div>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
