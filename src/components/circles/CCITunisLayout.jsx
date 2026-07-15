import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  Landmark, Globe, Users, Briefcase, BookOpen, Map, Sparkles, TrendingUp, TrendingDown,
  FileText, ShieldCheck, Search, Download, GraduationCap, Calendar, MessageCircle, Send, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import CircleVisual from '@/components/circles/CircleVisual';

// Simulated Market Ticker (Reused from ChamberOfCommerceLayout but stylized)
function formatPrice(symbol, price) {
  if (!price && price !== 0) return '—';
  const tunisian = ['SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];
  if (tunisian.includes(symbol)) return `${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
  return Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MarketTicker({ isDark }) {
  const { data: marketData = [] } = useQuery({
    queryKey: ['market-data-cci'],
    queryFn: () => supabase.from('MarketData').select('*').limit(10).then(res => res.data || []),
  });

  if (!marketData.length) return null;
  const doubled = [...marketData, ...marketData];

  return (
    <div
      className="w-full overflow-hidden py-1.5 border-b cursor-pointer transition-colors duration-300"
      style={{
        background: isDark ? 'linear-gradient(90deg,#0a192f,#020c1b)' : 'linear-gradient(90deg,#e6f0fa,#ffffff)',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}
    >
      <div className="ticker-track flex flex-nowrap w-max" style={{ animation: `ticker-scroll 30s linear infinite` }}>
        {doubled.map((t, i) => {
          const up = (t.change_pct || 0) >= 0;
          return (
            <div key={`${t.symbol}-${i}`} className="flex items-center gap-1.5 shrink-0 px-5">
              <span className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-[11px] font-semibold`}>{t.symbol}</span>
              <span className={`${isDark ? 'text-white' : 'text-slate-950'} text-[11px] font-bold`}>{formatPrice(t.symbol, t.price)}</span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {t.change_pct != null ? `${up ? '+' : ''}${Number(t.change_pct).toFixed(2)}%` : '—'}
              </span>
              <span className={`${isDark ? 'text-blue-300/20' : 'text-stone-300'} text-[10px] ml-3`}>|</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

// 1. Export Toolkit (Interactive AI feature)
function ExportToolkitTab({ isDark }) {
  const [product, setProduct] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = () => {
    if (!product || !destination) return;
    setLoading(true);
    setTimeout(() => {
      setResult({
        needsOrigin: true,
        needsATA: destination.toLowerCase().includes('eu') || destination.toLowerCase() === 'france',
        message: `L'exportation de "${product}" vers "${destination}" nécessite un Certificat d'Origine. ${destination.toLowerCase() === 'france' ? 'Un carnet ATA est recommandé pour les échantillons temporaires.' : ''}`
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Map className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Export Readiness Toolkit (Formalités à l'export)</h3>
      </div>
      <p className={`text-sm ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
        Vérifiez instantanément les documents requis (Certificats d'origine, Carnet ATA) pour vos produits.
      </p>

      <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-950/20 border-blue-500/20' : 'bg-blue-50/50 border-blue-200'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input 
            placeholder="Nom du produit (ex: Huile d'olive)" 
            value={product} onChange={e => setProduct(e.target.value)}
            className={isDark ? 'bg-black/20 border-white/10 text-white' : ''}
          />
          <Input 
            placeholder="Pays de destination (ex: France)" 
            value={destination} onChange={e => setDestination(e.target.value)}
            className={isDark ? 'bg-black/20 border-white/10 text-white' : ''}
          />
          <Button onClick={handleCheck} disabled={loading || !product || !destination} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Analyse...' : 'Vérifier'}
          </Button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-white/5 dark:bg-black/20 rounded-lg border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.message}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className={`text-xs h-8 ${isDark ? 'border-blue-500/30 text-blue-300' : 'border-blue-200 text-blue-700'}`}>
                    <FileText className="w-3 h-3 mr-1" /> Demander un Certificat
                  </Button>
                  {result.needsATA && (
                    <Button size="sm" variant="outline" className={`text-xs h-8 ${isDark ? 'border-amber-500/30 text-amber-300' : 'border-amber-200 text-amber-700'}`}>
                      <FileText className="w-3 h-3 mr-1" /> Demander Carnet ATA
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// 2. Smart B2B Matchmaking (Tunisia Trading)
function B2BMatchmakingTab({ isDark }) {
  const opportunities = [
    { type: 'Tender', title: 'Fourniture d\'équipements IT pour la région MENA', org: 'European Union (Interreg NEXT MED)', val: '1.2M TND', match: 94 },
    { type: 'Partner', title: 'Recherche de distributeurs de produits agroalimentaires', org: 'ASCAME Network', val: 'Partenariat', match: 88 },
    { type: 'Tender', title: 'Projet SPEEDUP: Accompagnement de startups', org: 'CCI Tunis / SMAC', val: '250K TND', match: 82 }
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Briefcase className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`} />
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tunisia Trading B2B Matchmaking</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
          AI POWERED
        </span>
      </div>
      <p className={`text-sm ${isDark ? 'text-purple-200/70' : 'text-slate-600'}`}>
        Opportunités générées automatiquement en fonction du profil de votre entreprise.
      </p>

      <div className="space-y-3">
        {opportunities.map((opp, i) => (
          <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-md'} transition-all cursor-pointer`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{opp.type}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold`}>{opp.match}% Match</span>
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{opp.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{opp.org}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{opp.val}</span>
              <Button size="sm" variant="ghost" className={`mt-2 h-7 text-[11px] ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:bg-purple-50'}`}>View Details</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. EPC Academy
function EPCAcademyTab({ isDark }) {
  const courses = [
    { title: 'Executive Master en Commerce Électronique', type: 'Formation Longue', status: 'Inscriptions Ouvertes' },
    { title: 'Maîtrisez l’Intelligence Artificielle (IA)', type: 'Formation Courte', status: 'Nouveau' },
    { title: 'Transport et Logistique Internationale (TLI)', type: 'Cycle de formation', status: 'Bientôt' }
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>École Pratique de Commerce (EPC)</h3>
      </div>
      <p className={`text-sm ${isDark ? 'text-amber-200/70' : 'text-slate-600'}`}>
        Développez vos compétences avec nos programmes Executive Education certifiants.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'}`}>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
            <p className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.title}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-amber-200/60' : 'text-slate-500'}`}>{c.type}</p>
            <Button size="sm" className="w-full mt-3 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">S'inscrire</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Info Tab
function CCIInfoTab({ isDark }) {
  return (
    <div className="p-5 space-y-4">
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
          <BookOpen className="w-4 h-4" /> Présentation
        </h4>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-100/80' : 'text-slate-700'}`}>
          La Chambre de Commerce et d'Industrie de Tunis (CCI Tunis) est un établissement public d'intérêt économique.
          Elle a pour mission de représenter, d'appuyer et de développer les entreprises de la région (Tunis, Ariana, Ben Arous, Manouba, Zaghouan, Bizerte).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <Sparkles className="w-3.5 h-3.5" /> Notre Vision
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Être le partenaire incontournable et le moteur d'innovation pour le développement économique et la compétitivité des entreprises à l'échelle nationale et internationale.
            </p>
          </div>
          
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Nos Valeurs
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Engagement, Proximité, Excellence, et Innovation au service des commerçants, industriels et prestataires de services de notre région.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href="https://ccitunis.org.tn/adhesion-en-ligne-eservice/" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all bg-blue-600 text-white hover:bg-blue-700 border-transparent`}>
            Adhésion en ligne (e-service)
          </a>
          <a href="https://ccitunis.org.tn/" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-800 border-slate-200'}`}>
            <Globe className="w-3.5 h-3.5" /> Visiter ccitunis.org.tn
          </a>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'info', label: 'Info & Adhésion', Icon: Landmark },
  { id: 'export', label: 'Export Toolkit', Icon: Map },
  { id: 'b2b', label: 'B2B Matchmaking', Icon: Briefcase },
  { id: 'epc', label: 'EPC Academy', Icon: GraduationCap },
  { id: 'discussion', label: 'Discussions', Icon: MessageCircle },
];

export default function CCITunisLayout({
  circle, user, circleId,
  memberNames, memberProfiles, activeQuestion, selectedResponseData, setSelectedResponseData,
  responses, isMember, isAdmin, isModerator,
  newResponse, setNewResponse, submitResponse,
  newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
  allMemberIds,
}) {
  const [activeTab, setActiveTab] = useState('info');
  const { isDark } = useTheme();

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300" style={{ background: isDark ? 'linear-gradient(160deg,#040e25 0%,#010510 100%)' : 'linear-gradient(160deg,#f4f7fc 0%,#ffffff 100%)' }}>
      
      {/* ── CCI Tunis Header ── */}
      <div className="relative p-[2px] transition-all duration-300" style={{ background: isDark ? 'linear-gradient(135deg,rgba(37,99,235,0.6),rgba(245,158,11,0.4))' : 'linear-gradient(135deg,rgba(37,99,235,0.5),rgba(245,158,11,0.5))' }}>
        <div className="rounded-t-2xl px-6 py-6 transition-colors duration-300" style={{ background: isDark ? 'linear-gradient(135deg,#0a192f,#020c1b)' : 'linear-gradient(135deg,#ffffff,#f0f4fa)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-1 shadow-md border border-blue-100">
                <img src="https://ccitunis.org.tn/wp-content/uploads/2025/11/ccit.png" alt="CCI Tunis" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Official Chamber</span>
                  <VerifiedBadge label="Institution" size="sm" dark={isDark} />
                </div>
                <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Chambre de Commerce et d'Industrie de Tunis</h1>
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 mt-4 text-[11px] transition-colors duration-300 ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {allMemberIds.length} Members</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {circle?.privacy || 'Public'}</span>
          </div>
        </div>
      </div>

      <MarketTicker isDark={isDark} />

      {/* ── Tabs ── */}
      <div className="flex border-b overflow-x-auto scrollbar-none whitespace-nowrap transition-colors duration-300" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? isDark ? 'border-blue-400 text-blue-300 bg-blue-900/20' : 'border-blue-600 text-blue-700 bg-blue-50/50'
                : isDark ? 'text-slate-400 hover:text-white border-transparent hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-black/5'
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
          {activeTab === 'info' && <CCIInfoTab isDark={isDark} />}
          {activeTab === 'export' && <ExportToolkitTab isDark={isDark} />}
          {activeTab === 'b2b' && <B2BMatchmakingTab isDark={isDark} />}
          {activeTab === 'epc' && <EPCAcademyTab isDark={isDark} />}
          
          {activeTab === 'discussion' && (
            <div style={{ color: isDark ? 'white' : '#1c1917' }}>
              <CircleVisual
                members={memberNames}
                question={activeQuestion?.question_text}
                selectedResponse={selectedResponseData}
                questionNumber={activeQuestion?.question_number}
                closesAt={activeQuestion?.closes_at}
                totalResponses={responses.length}
                totalMembers={allMemberIds.length}
                circleName="CCI Tunis"
                memberProfiles={memberProfiles}
                isDark={isDark}
                allResponses={responses}
              />
              {Array.isArray(responses) && responses.length > 0 && (
                <div className="px-6 pb-4 mt-4">
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-blue-200' : 'text-slate-800'}`}>
                    <MessageCircle className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} /> Réponses
                  </h3>
                  <div className="space-y-2">
                    {responses.map((r) => {
                      const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                      const avatar = rProfile?.avatar_url || r.author_avatar;
                      return (
                        <div key={r.id} className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                              {avatar ? <img src={avatar} alt={r.author_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">{r.author_name?.[0]?.toUpperCase()}</div>}
                            </div>
                            <span className={`text-[11px] font-semibold ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>{r.author_name}</span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white/90' : 'text-slate-900'}`}>{r.response_text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
