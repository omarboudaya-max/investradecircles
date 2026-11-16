import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Landmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CommandCenter from '@/components/intelligence/CommandCenter';

export default function ExecutiveIntelligence() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-[1500px] px-0 py-2 sm:px-2">
      <Helmet>
        <title>Intelligence Radar — Investraders</title>
        <meta name="description" content="Live economic intelligence computed from Investraders activity: member sentiment, capital demand, investor coverage and matchmaking opportunities." />
      </Helmet>
      <CommandCenter
        eyebrow="Investraders intelligence radar"
        title="Economic Command Center"
        subtitle="What innovators are asking for, what investors cover, and where the two can meet — recomputed from live platform activity."
        logo="/logo.png"
        toolbar={(
          <>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/matchmaker')}>
              <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Matchmaker</span>
            </Button>
            <Button size="sm" variant="outline" className="hidden gap-1.5 md:inline-flex" onClick={() => navigate('/utica-command')}>
              <Landmark className="h-3.5 w-3.5" /> UTICA view
            </Button>
          </>
        )}
      />
    </div>
  );
}
