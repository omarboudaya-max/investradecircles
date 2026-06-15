import React from 'react';
import { Info, Users } from 'lucide-react';

export default function AboutCard({ user }) {
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
      <h3 className="text-base font-semibold text-foreground mb-4">About</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">We plan, we are fans, we appreciate, we cheer.</p>
        </div>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-foreground">57 people follow {displayName}</p>
        </div>
      </div>
    </div>
  );
}