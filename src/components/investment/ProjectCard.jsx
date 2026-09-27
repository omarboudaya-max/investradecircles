import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, ArrowRight, Star } from 'lucide-react';
import { STAGE_LABELS, formatMTND, sectorIcon } from '@/lib/investment';

export default function ProjectCard({ project, governorate, sector, index = 0 }) {
  const Icon = sectorIcon(sector?.icon);
  const color = sector?.color || '#0891b2';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.05 }}
    >
      <Link
        to={`/investment-project/${project.id}`}
        className="block h-full rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group"
      >
        <div className="h-1.5" style={{ background: color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {project.is_verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 flex-wrap">
            <MapPin className="w-3.5 h-3.5" />
            <span>{governorate?.name || '—'}</span>
            {sector && <span>· {sector.name}</span>}
            {project.featured && <Star className="w-3.5 h-3.5 ml-1 text-amber-500 fill-amber-500" />}
          </div>

          <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.short_description || project.description}</p>

          <div className="flex items-end justify-between pt-3 border-t">
            <div>
              <div className="text-lg font-bold text-primary">{formatMTND(project.investment_required)}</div>
              <div className="text-[11px] text-muted-foreground">{STAGE_LABELS[project.investment_stage]}</div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
