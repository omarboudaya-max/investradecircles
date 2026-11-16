import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UTICABusinessCommandCenter from '@/components/circles/UTICABusinessCommandCenter';

export default function UTICACommandCenterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fullscreen = ['true', '1'].includes(searchParams.get('fullscreen'));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>UTICA Command Center — Intelligence Économique | Investraders</title>
        <meta name="description" content="Tableau de bord d'intelligence économique et d'écoute des entreprises tunisiennes, calculé à partir de l'activité réelle de la plateforme Investraders." />
      </Helmet>

      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-background/95 px-4 py-2.5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="gap-1.5 rounded-full text-xs font-semibold">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <Landmark className="h-4 w-4 text-primary" /> UTICA Command Center
          </span>
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">F</kbd> mode présentation ·{' '}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">←</kbd>{' '}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">→</kbd> onglets
        </span>
      </header>

      <main className="mx-auto max-w-[1500px] p-3 sm:p-6">
        <UTICABusinessCommandCenter initialFullscreen={fullscreen} />
      </main>
    </div>
  );
}
