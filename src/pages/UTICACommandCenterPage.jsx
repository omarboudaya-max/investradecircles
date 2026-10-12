import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Landmark, Maximize2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UTICABusinessCommandCenter from '@/components/circles/UTICABusinessCommandCenter';
import { useTheme } from '@/lib/ThemeContext';

export default function UTICACommandCenterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();

  // If URL has ?fullscreen=true or standalone, initialFullscreen is true
  const shouldFullscreen = searchParams.get('fullscreen') === 'true' || searchParams.get('fullscreen') === '1';

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Helmet>
        <title>UTICA Command Center — Intelligence Économique Nationale | Investraders</title>
        <meta
          name="description"
          content="Tableau de bord stratégique d'Intelligence Économique Nationale et d'écoute en temps réel des entreprises tunisiennes — UTICA, Wisdom Net & KAS."
        />
      </Helmet>

      {/* Top Standalone Header Bar */}
      <header className={`sticky top-0 z-50 border-b px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${isDark ? 'border-white/10 bg-slate-950/90 text-white' : 'border-slate-200 bg-white/95 text-slate-900 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className={`rounded-full gap-1.5 text-xs font-semibold ${isDark ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-500" />
            <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              UTICA Command Center
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border hidden md:inline ${isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
              LIVE DEMO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            Astuce : Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px] border border-border">F</kbd> pour le Plein Écran
          </span>
        </div>
      </header>

      {/* Main Command Center Container */}
      <main className="p-2 sm:p-6 max-w-[1700px] mx-auto">
        <UTICABusinessCommandCenter
          isDark={isDark}
          initialFullscreen={shouldFullscreen}
          onExitFullscreen={() => {}}
        />
      </main>
    </div>
  );
}
