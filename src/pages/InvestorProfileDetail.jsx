import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, Wallet, Globe, ShieldCheck, Sparkles, ArrowLeft, 
  CheckCircle2, Briefcase, MapPin, Mail, ExternalLink, Zap
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InvestorProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: investor } = useQuery({
    queryKey: ['investorDetail', id],
    queryFn: async () => {
      const list = await base44.investor.list();
      return list.find(i => i.id === id) || list[0];
    }
  });

  if (!investor) {
    return (
      <div className="min-h-screen bg-[#071A2B] text-slate-100 flex items-center justify-center p-6">
        <p>Loading investor profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071A2B] text-slate-100 font-sans pb-16">
      
      {/* HEADER BAR */}
      <div className="bg-[#051322] border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/investment-network')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Network
          </button>
          <Badge className="bg-[#1769FF]/20 text-blue-300 border-[#1769FF]/30 text-xs">
            Verified Institutional Investor
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* PROFILE CARD */}
        <Card className="bg-slate-900/90 border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            
            <div className="flex items-center gap-4">
              {investor.logo ? (
                <img 
                  src={investor.logo} 
                  alt={investor.name} 
                  className="w-20 h-20 rounded-2xl object-contain bg-slate-950 p-2 border border-slate-800"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-extrabold text-white">
                  {investor.flag || investor.name.substring(0, 2)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{investor.name}</h1>
                  <ShieldCheck className="w-5 h-5 text-[#1769FF]" />
                </div>
                <p className="text-sm text-slate-400 font-medium">{investor.type || 'Venture Capital Fund'}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>📍 {investor.location || 'Tunis & London'}</span>
                  <span>•</span>
                  <span>💰 Investment Range: <strong className="text-emerald-400">{investor.investmentRange}</strong></span>
                </div>
              </div>
            </div>

            {/* AI COMPATIBILITY SCORE BADGE */}
            <div className="bg-[#16C7B7]/10 border border-[#16C7B7]/30 rounded-2xl p-4 text-center min-w-[180px]">
              <span className="text-xs font-bold text-[#16C7B7] uppercase block tracking-wider">
                AI Compatibility
              </span>
              <div className="text-3xl font-extrabold text-[#16C7B7] my-0.5">
                {investor.aiMatchScore || 94}%
              </div>
              <span className="text-[11px] text-slate-300">High alignment for your profile</span>
            </div>

          </div>

          {/* PREFERRED SECTORS & MARKETS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Preferred Markets</span>
              <div className="flex flex-wrap gap-1">
                {['Europe', 'North Africa', 'GCC'].map((m, i) => (
                  <Badge key={i} variant="outline" className="border-slate-700 text-slate-300">{m}</Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Target Sectors</span>
              <div className="flex flex-wrap gap-1">
                {(investor.sectors || ['AI', 'Fintech', 'SaaS', 'Energy']).map((s, i) => (
                  <Badge key={i} className="bg-slate-800 text-slate-200">{s}</Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Portfolio & Track Record</span>
              <div className="text-slate-200 font-semibold">
                48 Investments • 23 Active Pipeline Deals
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate(`/messages?connect=${encodeURIComponent(investor.name)}`)}
              className="bg-[#1769FF] hover:bg-blue-600 text-white text-xs px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
              Request Introduction
            </Button>
            
            <Button 
              onClick={() => navigate('/matchmaker')}
              variant="outline" 
              className="border-slate-700 text-slate-300 hover:text-white text-xs px-6 py-2.5 rounded-xl"
            >
              Run AI Match Score
            </Button>
          </div>
        </Card>

        {/* PROJECTS MATCHING THIS INVESTOR */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#16C7B7]" />
            Projects Matching This Investor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Solar Energy Microgrid — Kasserine', capital: '€4.2M', match: 96 },
              { title: 'Agri-Tech Cold Chain Expansion', capital: '€1.8M', match: 93 },
              { title: 'Tunisian AI SaaS Export Hub', capital: '€2.5M', match: 89 }
            ].map((proj, idx) => (
              <Card key={idx} className="bg-slate-900/90 border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <Badge className="bg-[#16C7B7]/20 text-[#16C7B7] border-[#16C7B7]/30">
                    {proj.match}% AI Match
                  </Badge>
                  <span className="text-emerald-400 font-bold">{proj.capital}</span>
                </div>
                <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/investment-network')}
                  className="w-full text-xs text-[#1769FF] hover:bg-slate-800 p-0 justify-start"
                >
                  View Details ➔
                </Button>
              </Card>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
