import React from 'react';
import CommandCenter from '@/components/intelligence/CommandCenter';

/**
 * Leadership command center for an institution.
 *
 * Inside a circle it is scoped to that circle's members; on the standalone UTICA
 * route it covers the whole platform. All figures are live — see CommandCenter.
 */
export default function UTICABusinessCommandCenter({ circle = null, initialFullscreen = false, onExitFullscreen }) {
  if (circle) {
    return (
      <CommandCenter
        circle={circle}
        eyebrow="Leadership command center"
        title={circle.name}
        subtitle="What your members say, what they need and where capital is flowing — computed from live activity."
        initialFullscreen={initialFullscreen}
        onExitFullscreen={onExitFullscreen}
      />
    );
  }

  return (
    <CommandCenter
      eyebrow="UTICA leadership command center"
      title="Union Tunisienne de l'Industrie, du Commerce et de l'Artisanat"
      subtitle="Tableau de bord d'intelligence économique : écoute des entreprises, besoins en capital et opportunités, calculés à partir de l'activité réelle de la plateforme."
      logo="/images/logos/utica-logo.png"
      initialFullscreen={initialFullscreen}
      onExitFullscreen={onExitFullscreen}
    />
  );
}
