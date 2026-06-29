import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Landing() {
  const { user, isLoadingAuth } = useAuth();
  const t = useTranslation();

  if (!isLoadingAuth && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="antialiased text-white relative min-h-screen flex flex-col font-sans" style={{ background: '#030914' }}>
      <WebsiteNavbar />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-orbit {
          animation: orbit-spin 40s linear infinite;
        }
        .animate-orbit-reverse {
          animation: orbit-spin-reverse 40s linear infinite;
        }
        .animate-orbit-slow {
          animation: orbit-spin 60s linear infinite;
        }
        .animate-orbit-slow-reverse {
          animation: orbit-spin-reverse 60s linear infinite;
        }
        
        .glow-text-blue {
          text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
        }
      `}} />

      <main className="relative overflow-hidden flex-1 pb-24">
        {/* Background glow effects */}
        <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none z-0">
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(3, 9, 20, 0) 70%)' }}></div>
        </div>

        {/* 1. HERO SECTION (global platform) */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0c4a6e] bg-[#0c4a6e]/30 text-[#38bdf8] text-xs font-semibold uppercase tracking-wider mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            GLOBAL PLATFORM
            {t.landing.globalPlatform !== 'GLOBAL PLATFORM' && <> — {t.landing.globalPlatform}</>}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold leading-[1.05] tracking-tight mb-8">
            <span className="block text-[#f8fafc]">{t.landing.heroLine1}</span>
            <span className="block text-[#38bdf8] glow-text-blue">{t.landing.heroLine2}</span>
            <span className="block text-[#f8fafc]">{t.landing.heroLine3}</span>
          </h1>

          <p className="text-xl sm:text-2xl text-[#94a3b8] max-w-3xl mx-auto mb-6">
            {t.landing.heroSubtitle}
          </p>

          <p className="text-base text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.landing.heroDescription}
          </p>

          <div className="inline-flex items-center justify-center border border-amber-500/50 bg-amber-500/10 text-amber-500 px-6 py-2 rounded-full font-semibold mb-10 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            {t.landing.makeMoneyMeanwhile}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-[#38bdf8] text-[#030914] font-bold px-8 py-3.5 rounded-full text-base transition-all hover:bg-[#7dd3fc] shadow-[0_0_20px_rgba(56,189,248,0.4)]">
              {t.landing.getStarted}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-medium px-8 py-3.5 rounded-full text-base transition-colors hover:bg-white/5">
              {t.landing.learnMore}
            </Link>
          </div>
        </section>

        {/* 2. EMPOWER YOUR ECOSYSTEM */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-32 mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-900/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t.landing.forInstitutionsBadge}
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.landing.empowerTitle}</h2>
          <p className="text-xl text-[#94a3b8] mb-12">{t.landing.empowerSubtitle}</p>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {t.landing.tags.map((tag) => (
              <div key={tag} className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-[#cbd5e1] text-sm hover:border-white/20 hover:bg-white/10 transition-colors cursor-default">
                {tag}
              </div>
            ))}
          </div>
        </section>

        {/* 3. THE MISSING LINK & MOBILE UI (cairo chamber) */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 mt-20 mb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-8">
              {/* Missing Link Card */}
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8">
                <h3 className="text-2xl font-bold mb-2">{t.landing.missingLinkTitle}</h3>
                <p className="text-[#94a3b8] mb-6">{t.landing.missingLinkDesc}</p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    t.landing.missingLink1,
                    t.landing.missingLink2,
                    t.landing.missingLink3,
                    t.landing.missingLink4,
                    t.landing.missingLink5
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="text-[#e2e8f0]">{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-[#38bdf8] font-bold text-lg">{t.landing.missingLinkConclusion}</p>
              </div>

              {/* Manage Community Card */}
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 p-8">
                <h3 className="text-2xl font-bold mb-2">{t.landing.manageCommunityTitle}</h3>
                <p className="text-[#94a3b8] mb-6">{t.landing.manageCommunityDesc}</p>
                
                <ul className="space-y-4">
                  {[
                    t.landing.manageCommunity1,
                    t.landing.manageCommunity2,
                    t.landing.manageCommunity3,
                    t.landing.manageCommunity4,
                    t.landing.manageCommunity5,
                    t.landing.manageCommunity6
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-900/50 flex items-center justify-center shrink-0 border border-cyan-500/30">
                        <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-[#e2e8f0]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mobile App Mockup - Cairo Chamber */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[320px] h-[650px] bg-[#1e293b] rounded-[40px] border-[12px] border-[#0f172a] shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-32 h-6 bg-[#0f172a] rounded-b-3xl"></div>
                </div>
                <div className="px-6 pt-2 pb-2 flex justify-between items-center text-[10px] text-white/80 z-40 bg-[#0c4a6e]">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2L2 22zm18-2H6.83L20 6.83V20z"/></svg>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                  </div>
                </div>

                {/* Header App / Mockup UI */}
                <div className="bg-[#0c4a6e] px-4 pt-4 pb-6 relative z-10 rounded-b-3xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white/50 border border-white/5">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg flex items-center gap-1">Cairo Chamber <svg className="w-4 h-4 text-[#38bdf8]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg></h2>
                      <p className="text-white/60 text-xs">247 members • Institution</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 px-2">
                    <div className="text-center">
                      <div className="text-white font-bold text-xl">24</div>
                      <div className="text-white/50 text-xs">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-xl">12</div>
                      <div className="text-white/50 text-xs">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold text-xl">8</div>
                      <div className="text-white/50 text-xs">Markets</div>
                    </div>
                  </div>
                </div>

                {/* Ticker */}
                <div className="flex items-center gap-4 py-2 px-4 bg-[#0f172a] text-[10px] overflow-hidden whitespace-nowrap border-b border-white/5">
                  <span className="text-[#94a3b8]">S&P 500 <span className="text-green-400">+0.74%</span></span>
                  <span className="text-[#94a3b8]">BTC <span className="text-green-400">+2.1%</span></span>
                  <span className="text-[#94a3b8]">Gold <span className="text-red-400">-0.3%</span></span>
                </div>

                <div className="flex gap-4 px-4 py-3 bg-[#0f172a]">
                  <div className="text-[#38bdf8] text-sm font-semibold border-b-2 border-[#38bdf8] pb-1">Feed</div>
                  <div className="text-[#64748b] text-sm font-semibold pb-1">Events</div>
                  <div className="text-[#64748b] text-sm font-semibold pb-1">Members</div>
                </div>

                {/* Feed Content */}
                <div className="flex-1 bg-[#030914] overflow-hidden p-4 space-y-4">
                  <div className="bg-[#0f172a] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500"></div>
                      <div>
                        <div className="text-white text-xs font-bold">Dr. Ahmed Hassan</div>
                        <div className="text-[#64748b] text-[10px]">2h ago</div>
                      </div>
                    </div>
                    <p className="text-white/80 text-xs mb-3 leading-relaxed">New investment opportunities available for Q3 Chamber members — register now!</p>
                    <div className="flex gap-3 text-[#64748b] text-[10px]">
                      <span className="flex items-center gap-1"><svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg> 24</span>
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg> 8</span>
                    </div>
                  </div>

                  <div className="bg-[#0f172a] rounded-xl p-3 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#38bdf8]"></div>
                    <div className="flex items-center gap-1 text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider mb-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      UPCOMING EVENT
                    </div>
                    <h3 className="text-white text-sm font-bold">Business Networking</h3>
                    <p className="text-[#64748b] text-xs mb-2">Jun 25 - 10:00 AM</p>
                    <button className="bg-[#38bdf8] text-[#030914] text-xs font-bold px-4 py-1 rounded-full absolute bottom-3 right-3">Join</button>
                  </div>
                </div>

                <div className="bg-[#0f172a] border-t border-white/5 p-3 flex justify-around text-[#64748b] text-[10px]">
                  <div className="flex flex-col items-center gap-1 text-[#38bdf8]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                    Home
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    Explore
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white relative">
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    Alerts
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Profile
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. YOUR CIRCLE, LIVE & ALIVE */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 mt-32 mb-32">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1e3a8a] bg-[#1e3a8a]/30 text-[#60a5fa] text-xs font-semibold uppercase tracking-wider mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              {t.landing.circleExperienceBadge}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t.landing.yourCircleTitle1}<span className="text-[#38bdf8]">{t.landing.yourCircleTitle2}</span>
            </h2>
            <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto">
              {t.landing.yourCircleDesc}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Orbit Visualization */}
            <div className="relative w-full aspect-square max-w-[550px] mx-auto hidden md:block">
              <div className="absolute top-10 left-0 right-0 text-center z-30">
                <h3 className="text-3xl font-bold text-amber-500" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Investrade</h3>
              </div>

              {/* Center Circle */}
              <div className="absolute inset-0 m-auto w-64 h-64 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] shadow-[0_0_80px_rgba(59,130,246,0.5)] flex flex-col items-center justify-center text-center p-8 z-20 border border-[#60a5fa]/30">
                <span className="text-white/60 text-sm font-semibold mb-2">Q. 2</span>
                <h4 className="text-xl font-bold text-white mb-6">What sector is your top pick for 2026?</h4>
                <div className="text-[#94a3b8] text-xs font-mono">00:00:00</div>
                <div className="text-[#64748b] text-[10px] uppercase mt-1">left to close</div>
              </div>

              {/* Inner Orbit (3 avatars) */}
              <div className="absolute inset-0 m-auto w-[360px] h-[360px] rounded-full border border-dashed border-[#334155] animate-orbit z-10">
                <div className="absolute top-0 left-1/2 -ml-8 -mt-8 flex flex-col items-center animate-orbit-reverse">
                  <div className="absolute -top-10 whitespace-nowrap bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-full border border-amber-500/50 shadow-lg">
                    Tech is my top pick! 🚀
                  </div>
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500 p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=omar" className="w-full h-full rounded-full object-cover" alt="User" />
                  </div>
                  <span className="text-xs text-white/80 mt-1 font-medium bg-[#0f172a]/80 px-2 rounded">Omar</span>
                </div>

                <div className="absolute top-[85%] left-[85%] -ml-6 -mt-6 flex flex-col items-center animate-orbit-reverse">
                  <div className="w-12 h-12 rounded-full border-2 border-[#38bdf8] p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=ahmed" className="w-full h-full rounded-full object-cover" alt="User" />
                  </div>
                  <span className="text-xs text-white/80 mt-1 font-medium bg-[#0f172a]/80 px-2 rounded">Ahmed</span>
                </div>

                <div className="absolute top-[85%] left-[15%] -ml-6 -mt-6 flex flex-col items-center animate-orbit-reverse">
                  <div className="w-12 h-12 rounded-full border-2 border-[#60a5fa] p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=aisha" className="w-full h-full rounded-full object-cover" alt="User" />
                  </div>
                  <span className="text-xs text-white/80 mt-1 font-medium bg-[#0f172a]/80 px-2 rounded">Aisha</span>
                </div>
              </div>

              {/* Outer Orbit (4 avatars) */}
              <div className="absolute inset-0 m-auto w-[520px] h-[520px] rounded-full border border-dashed border-[#334155]/60 animate-orbit-slow z-0">
                <div className="absolute top-[14%] left-[85%] -ml-7 -mt-7 flex flex-col items-center animate-orbit-slow-reverse">
                  <div className="absolute -right-2 top-0 whitespace-nowrap bg-[#1e293b]/50 text-white/50 text-[10px] px-2 py-1 rounded-full border border-white/10">
                    Hedge with gold & BTC 🪙
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-[#10b981] p-0.5 bg-[#0f172a] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <img src="https://i.pravatar.cc/150?u=lina" className="w-full h-full rounded-full object-cover" alt="User" />
                  </div>
                  <span className="text-xs text-white/80 mt-1 font-medium bg-[#0f172a]/80 px-2 rounded">Lina</span>
                </div>

                <div className="absolute top-[14%] left-[15%] -ml-6 -mt-6 flex flex-col items-center animate-orbit-slow-reverse">
                  <div className="absolute -left-20 top-0 whitespace-nowrap bg-[#1e293b]/50 text-white/50 text-[10px] px-2 py-1 rounded-full border border-white/10">
                    Diversify into bonds 📉
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-[#c084fc] p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=sarah" className="w-full h-full rounded-full object-cover" alt="User" />
                  </div>
                  <span className="text-xs text-white/80 mt-1 font-medium bg-[#0f172a]/80 px-2 rounded">Sarah</span>
                </div>

                <div className="absolute top-[86%] left-[75%] -ml-5 -mt-5 flex flex-col items-center animate-orbit-slow-reverse opacity-70">
                  <div className="w-10 h-10 rounded-full border border-white/30 p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=nour" className="w-full h-full rounded-full object-cover grayscale" alt="User" />
                  </div>
                  <span className="text-[10px] text-white/60 mt-1">Nour</span>
                </div>

                <div className="absolute top-[100%] left-[50%] -ml-6 -mt-6 flex flex-col items-center animate-orbit-slow-reverse opacity-70">
                  <div className="w-12 h-12 rounded-full border border-white/30 p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=karim" className="w-full h-full rounded-full object-cover grayscale" alt="User" />
                  </div>
                  <span className="text-[10px] text-white/60 mt-1">Karim</span>
                </div>
                
                <div className="absolute top-[50%] left-[0%] -ml-6 -mt-6 flex flex-col items-center animate-orbit-slow-reverse opacity-70">
                  <div className="w-12 h-12 rounded-full border border-white/30 p-0.5 bg-[#0f172a]">
                    <img src="https://i.pravatar.cc/150?u=carlos" className="w-full h-full rounded-full object-cover grayscale" alt="User" />
                  </div>
                  <span className="text-[10px] text-white/60 mt-1">Carlos</span>
                </div>
              </div>

              {/* Total Response Pill */}
              <div className="absolute -bottom-16 left-0 right-0 flex flex-col items-center justify-center z-30">
                <span className="text-[11px] font-bold tracking-widest text-[#94a3b8] uppercase mb-2">Total Response</span>
                <div className="bg-amber-600 text-white font-bold text-xl px-8 py-3 rounded-full shadow-[0_0_30px_rgba(217,119,6,0.4)] border border-amber-500/50">
                  22 / 15
                </div>
              </div>
            </div>

            {/* Mobile fallback for Orbit */}
            <div className="md:hidden flex flex-col items-center justify-center py-10 bg-[#0f172a] rounded-2xl border border-white/5">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] flex flex-col items-center justify-center text-center p-4 shadow-xl">
                  <span className="text-white/60 text-xs font-semibold mb-1">Q. 2</span>
                  <h4 className="text-base font-bold text-white mb-2">What sector is your top pick for 2026?</h4>
                </div>
                <div className="mt-8 text-center">
                  <span className="text-[10px] font-bold tracking-widest text-[#94a3b8] uppercase mb-2 block">Total Response</span>
                  <div className="bg-amber-600 text-white font-bold text-lg px-6 py-2 rounded-full">
                    22 / 15
                  </div>
                </div>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6">{t.landing.whatMakesSpecial}</h3>
              
              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5 flex gap-4 transition-colors hover:bg-[#1e293b]">
                <div className="w-12 h-12 rounded-lg bg-[#1e3a8a]/50 flex items-center justify-center shrink-0 border border-[#3b82f6]/30 text-[#60a5fa]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.landing.special1Title}</h4>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{t.landing.special1Desc}</p>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5 flex gap-4 transition-colors hover:bg-[#1e293b]">
                <div className="w-12 h-12 rounded-lg bg-[#831843]/50 flex items-center justify-center shrink-0 border border-[#f43f5e]/30 text-[#fb7185]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.landing.special2Title}</h4>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{t.landing.special2Desc}</p>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5 flex gap-4 transition-colors hover:bg-[#1e293b]">
                <div className="w-12 h-12 rounded-lg bg-[#14532d]/50 flex items-center justify-center shrink-0 border border-[#22c55e]/30 text-[#4ade80]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.landing.special3Title}</h4>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{t.landing.special3Desc}</p>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5 flex gap-4 transition-colors hover:bg-[#1e293b]">
                <div className="w-12 h-12 rounded-lg bg-[#701a75]/50 flex items-center justify-center shrink-0 border border-[#d946ef]/30 text-[#f0abfc]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.landing.special4Title}</h4>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{t.landing.special4Desc}</p>
                </div>
              </div>

              <div className="bg-[#0f172a] border border-white/5 rounded-xl p-5 flex gap-4 transition-colors hover:bg-[#1e293b]">
                <div className="w-12 h-12 rounded-lg bg-[#78350f]/50 flex items-center justify-center shrink-0 border border-[#f59e0b]/30 text-[#fbbf24]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.landing.special5Title}</h4>
                  <p className="text-[#94a3b8] text-sm leading-relaxed">{t.landing.special5Desc}</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. BUILT FOR EVERY SECTOR */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 mt-32 mb-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{t.landing.builtForEverySector}</h2>
          <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto mb-16">{t.landing.builtForSubtitle}</p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            {/* Card 1 */}
            <div className="bg-[#0b1120] border border-cyan-500/10 rounded-2xl p-8 hover:border-cyan-500/30 transition-colors">
              <div className="w-12 h-12 bg-[#0c4a6e]/50 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 text-cyan-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 100 2h14a1 1 0 100-2V8a1 1 0 00.504-1.868l-7-4zM6 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm3 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.landing.sector1Title}</h3>
              <p className="text-cyan-400 text-sm font-semibold mb-4">{t.landing.sector1Subtitle}</p>
              <p className="text-[#94a3b8] text-sm mb-4">{t.landing.sector1Desc}</p>
              <p className="text-white text-sm font-serif italic">{t.landing.sector1Quote}</p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-[#0b1120] border border-blue-500/10 rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
              <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.landing.sector2Title}</h3>
              <p className="text-blue-400 text-sm font-semibold mb-4">{t.landing.sector2Subtitle}</p>
              <p className="text-[#94a3b8] text-sm mb-4">{t.landing.sector2Desc}</p>
              <p className="text-white text-sm font-serif italic">{t.landing.sector2Quote}</p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0b1120] border border-purple-500/10 rounded-2xl p-8 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 text-purple-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.168 1.54.66a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3zM3.311 10.604l6.295 2.698a1 1 0 00.788 0l6.295-2.698a1 1 0 00.417-.375L18 10v6.182c0 .41-.21.785-.55 1.01l-7 4.5a1 1 0 01-1.07 0l-7-4.5A1.21 1.21 0 012 16.182V10l.894.229a1 1 0 00.417.375z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.landing.sector3Title}</h3>
              <p className="text-purple-400 text-sm font-semibold mb-4">{t.landing.sector3Subtitle}</p>
              <p className="text-[#94a3b8] text-sm mb-4">{t.landing.sector3Desc}</p>
              <p className="text-white text-sm font-serif italic">{t.landing.sector3Quote}</p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#0b1120] border border-amber-500/10 rounded-2xl p-8 hover:border-amber-500/30 transition-colors">
              <div className="w-12 h-12 bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 text-amber-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.landing.sector4Title}</h3>
              <p className="text-amber-500 text-sm font-semibold mb-4">{t.landing.sector4Subtitle}</p>
              <p className="text-[#94a3b8] text-sm mb-4">{t.landing.sector4Desc}</p>
              <p className="text-white text-sm font-serif italic">{t.landing.sector4Quote}</p>
            </div>
          </div>
        </section>

        {/* 6. WHERE DREAMS BECOME COMMUNITIES */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 mt-32 mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-900/30 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                {t.landing.forIndividualsBadge}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.landing.dreamsTitle1}<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{t.landing.dreamsTitle2}</span></h2>
              <p className="text-[#94a3b8] text-lg mb-8 leading-relaxed max-w-xl">{t.landing.dreamsDesc}</p>
              
              <ul className="space-y-4 mb-10">
                {[t.landing.dreams1, t.landing.dreams2, t.landing.dreams3, t.landing.dreams4].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                    <span className="text-white font-semibold">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {['Technology', 'Finance', 'Sports', 'Education', 'Art', 'Gaming', 'Health', 'Music'].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full border border-white/10 bg-[#0f172a] text-[#94a3b8] text-sm hover:bg-white/10 transition-colors cursor-pointer">{tag}</span>
                ))}
              </div>
            </div>

            {/* The Purple Phone Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[320px] h-[650px] bg-[#1e293b] rounded-[40px] border-[12px] border-[#0f172a] shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                  <div className="w-32 h-6 bg-[#0f172a] rounded-b-3xl"></div>
                </div>

                <div className="px-6 pt-2 pb-2 flex justify-between items-center text-[10px] text-white/80 z-40 bg-[#7e22ce]">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2L2 22zm18-2H6.83L20 6.83V20z"/></svg>
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                  </div>
                </div>

                {/* Header App / Mockup UI (Purple) */}
                <div className="bg-[#7e22ce] px-4 pt-4 pb-6 relative z-10 rounded-b-2xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center border-2 border-white/20 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-white font-bold text-lg leading-tight">Finance<br/>Innovators</h2>
                      <p className="text-white/80 text-[10px] mt-1">1.2k members • Individual</p>
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 transition-colors">
                      + Join
                    </button>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <span className="px-2 py-1 rounded-md bg-white/10 text-white text-[10px] border border-white/20">Investment</span>
                    <span className="px-2 py-1 rounded-md bg-white/10 text-white text-[10px] border border-white/20">Trading</span>
                    <span className="px-2 py-1 rounded-md bg-white/10 text-white text-[10px] border border-white/20">Startups</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 px-4 py-3 bg-[#0f172a] border-b border-white/5">
                  <div className="text-purple-400 text-sm font-semibold border-b-2 border-purple-500 pb-1">Feed</div>
                  <div className="text-[#64748b] text-sm font-semibold pb-1">Circle</div>
                  <div className="text-[#64748b] text-sm font-semibold pb-1">Members</div>
                </div>

                {/* Stories/Top members row */}
                <div className="bg-[#0f172a] px-4 py-3 border-b border-white/5 flex gap-3 overflow-x-auto no-scrollbar">
                   {/* Self */}
                   <div className="flex flex-col items-center gap-1 shrink-0">
                     <div className="w-12 h-12 rounded-full border-2 border-purple-500 p-0.5">
                       <div className="w-full h-full rounded-full bg-purple-600 flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                       </div>
                     </div>
                     <span className="text-[9px] text-[#94a3b8]">You</span>
                   </div>
                   {/* Others */}
                   <div className="flex flex-col items-center gap-1 shrink-0">
                     <div className="w-12 h-12 rounded-full border-2 border-[#64748b] p-0.5">
                       <div className="w-full h-full rounded-full bg-pink-500 flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                       </div>
                     </div>
                     <span className="text-[9px] text-[#94a3b8]">Sarah</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 shrink-0">
                     <div className="w-12 h-12 rounded-full border-2 border-[#64748b] p-0.5">
                       <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                       </div>
                     </div>
                     <span className="text-[9px] text-[#94a3b8]">Mike</span>
                   </div>
                   <div className="flex flex-col items-center gap-1 shrink-0">
                     <div className="w-12 h-12 rounded-full border-2 border-[#64748b] p-0.5">
                       <div className="w-full h-full rounded-full bg-cyan-500 flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>
                       </div>
                     </div>
                     <span className="text-[9px] text-[#94a3b8]">Ana</span>
                   </div>
                </div>

                {/* Feed Content */}
                <div className="flex-1 bg-[#030914] overflow-hidden p-4 space-y-4">
                  
                  {/* Post 1 */}
                  <div className="bg-[#0f172a] rounded-xl p-3 border border-white/5 relative">
                    <div className="absolute top-3 right-3 bg-amber-500/10 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/20">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Top
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-pink-500"></div>
                      <div>
                        <div className="text-white text-xs font-bold">Sarah Chen</div>
                        <div className="text-[#64748b] text-[9px]">1h ago • Investment</div>
                      </div>
                    </div>
                    <p className="text-white/80 text-xs mb-3 leading-relaxed">Best portfolio diversification strategy for 2026 market conditions...</p>
                    <div className="flex gap-4 text-[#64748b] text-[10px]">
                      <span className="flex items-center gap-1"><svg className="w-3 h-3 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg> 47</span>
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg> 12</span>
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> Share</span>
                    </div>
                  </div>

                  {/* Post 2 */}
                  <div className="bg-[#0f172a] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-500"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div className="text-white text-xs font-bold">Mike Trades</div>
                          <div className="text-[#64748b] text-[9px]">3h ago</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/80 text-xs line-clamp-2">🚀 Just hit 200% ROI on my tech portfolio this quarter!</p>
                  </div>

                </div>

                {/* Bottom Navigation */}
                <div className="bg-[#0f172a] border-t border-white/5 p-3 flex justify-around text-[#64748b] text-[10px]">
                  <div className="flex flex-col items-center gap-1 text-purple-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                    Home
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    Explore
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white relative">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    Alerts
                  </div>
                  <div className="flex flex-col items-center gap-1 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Profile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. YOUR TIME IS YOUR MOST VALUABLE ASSET */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 mt-32 mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-500/30 bg-amber-900/20 text-amber-500 text-sm font-semibold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="text-lg leading-none font-bold">$</span> {t.landing.timeIsAssetBadge}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.landing.timeTitle1}<span className="text-amber-500">{t.landing.timeTitle2}</span></h2>
          <p className="text-[#94a3b8] text-lg max-w-3xl mx-auto mb-16 leading-relaxed">
            {t.landing.timeDesc}
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
            {[
              'Build a personal brand', 'Offer products and services',
              'Promote events', 'Share expertise',
              'Create educational content', 'Connect opportunities',
              'Generate business leads', 'Monetize your influence'
            ].map((item) => (
              <div key={item} className="bg-[#0b1120] border border-amber-500/20 rounded-xl p-5 flex items-center gap-4 hover:bg-[#0f172a] hover:border-amber-500/40 transition-all cursor-default">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                <span className="text-[#e2e8f0] font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto border border-amber-500/20 bg-[#0f172a]/50 rounded-2xl p-10 shadow-[0_0_30px_rgba(245,158,11,0.05)]">
            <p className="text-amber-500 text-xl md:text-2xl font-bold italic leading-relaxed">
              {t.landing.timeQuote}
            </p>
          </div>
        </section>

        {/* 8. WHAT DRIVES US */}
        <section className="relative z-10 max-w-5xl mx-auto px-6 mt-32 mb-32 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">{t.landing.whatDrivesUs}</h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-[#0b1120] border border-cyan-500/10 rounded-2xl p-10 hover:border-cyan-500/20 transition-colors">
              <div className="w-12 h-12 bg-[#0c4a6e]/50 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 text-cyan-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t.landing.ourMission}</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                {t.landing.ourMissionDesc}
              </p>
            </div>

            <div className="bg-[#0b1120] border border-blue-500/10 rounded-2xl p-10 hover:border-blue-500/20 transition-colors">
              <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{t.landing.ourVision}</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                {t.landing.ourVisionDesc}
              </p>
            </div>
          </div>
        </section>

        {/* 9. YOUR COMMUNITY STARTS HERE */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 mt-32 mb-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-10">{t.landing.communityStartsHere}<span className="text-[#38bdf8]">{t.landing.communityStartsHere2}</span></h2>
          
          <ul className="text-xl text-[#e2e8f0] space-y-4 mb-12">
            <li>{t.landing.starts1}</li>
            <li>{t.landing.starts2}</li>
            <li>{t.landing.starts3}</li>
            <li>{t.landing.starts4}</li>
          </ul>

          <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-[#38bdf8] text-[#030914] font-bold px-8 py-3.5 rounded-full text-base transition-all hover:bg-[#7dd3fc] shadow-[0_0_20px_rgba(56,189,248,0.4)] mb-8">
            Get Started <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>

          <div className="text-amber-500 font-bold text-sm tracking-widest uppercase">
            {t.landing.timeIsAssetBadge}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 pt-16 pb-8 text-center bg-[#0b1120]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-[#38bdf8] flex items-center justify-center text-[#030914] font-bold italic font-serif text-xs">i</div>
          <span className="text-white font-bold tracking-wide">Investrade Circles</span>
        </div>
        <p className="text-[#64748b] text-sm mb-6">Where Communities Create Opportunities.</p>
        <p className="text-[#475569] text-xs">© 2026 Investrade. All rights reserved.</p>
      </footer>
    </div>
  );
}
