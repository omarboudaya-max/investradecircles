import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';

export default function LandingIndividuals() {
  const { user, isLoadingAuth } = useAuth();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative bg-[#071025] min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #071025 0%, #031026 100%)' }}>
      <WebsiteNavbar />
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-bold mb-4">For Individuals</h1>
        <p className="text-gray-300 mb-6">Connect with businesses, mentors, and opportunities. Build a professional profile, join circles, and monetize expertise.</p>

        <section className="space-y-6">
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Profiles & Portfolios</h3>
            <p className="text-gray-300 mt-2">Create a verified profile showcasing work, projects, and affiliations to increase visibility to employers and partners.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Networking & Mentorship</h3>
            <p className="text-gray-300 mt-2">Join local and international circles to access mentorship, jobs, and joint-venture opportunities.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg border border-white/5">
            <h3 className="font-semibold text-lg">Learning & Revenue</h3>
            <p className="text-gray-300 mt-2">Monetize your knowledge: paid webinars, consulting, and community subscriptions.</p>
          </div>
        </section>

        <div className="mt-8">
          <Link to="/register" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-colors">Start as an Individual</Link>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
