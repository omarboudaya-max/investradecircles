import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Building2, MapPin, DollarSign, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateInvestorProjectMatch } from '@/lib/investmentNetwork';
import { useNavigate } from 'react-router-dom';
import { formatMTND } from '@/lib/investment';

export default function MatchingResultsModal({
  open,
  onClose,
  mode = 'project-to-investors', // or 'investor-to-projects'
  targetEntity = null, // project object OR investor object
  allOrganizations = [],
  allProjects = [],
  onSelectInterest = null
}) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  if (!targetEntity) return null;

  let matches = [];

  if (mode === 'project-to-investors') {
    // Rank investors for a project
    matches = allOrganizations
      .map((org) => {
        const matchInfo = calculateInvestorProjectMatch(org, targetEntity);
        return {
          entity: org,
          ...matchInfo
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  } else {
    // Rank projects for an investor org
    matches = allProjects
      .map((proj) => {
        const matchInfo = calculateInvestorProjectMatch(targetEntity, proj);
        return {
          entity: proj,
          ...matchInfo
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-48 h-48 text-emerald-400" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Deterministic Match Engine
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {mode === 'project-to-investors' ? (
                <>Matching Capital Partners for <span className="text-emerald-400">{targetEntity.title}</span></>
              ) : (
                <>Compatible Projects for <span className="text-emerald-400">{targetEntity.display_name}</span></>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm max-w-2xl">
              {mode === 'project-to-investors' ? (
                `Found ${matches.length} institutional investors & investment vehicles aligned with sector, ticket size, and target growth stage.`
              ) : (
                `Found ${matches.length} investment opportunities on the Investraders Map matching this investor's stated mandate.`
              )}
            </DialogDescription>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span>Ranked by Compatibility Index</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{matches.length} Results</span>
          </div>

          <div className="space-y-4">
            {matches.map((item) => {
              const itemObj = item.entity;
              const isOrg = mode === 'project-to-investors';
              const id = itemObj.id;
              const isExpanded = expandedId === id;

              return (
                <div
                  key={id}
                  className="group border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 hover:shadow-lg transition-all bg-white dark:bg-slate-900"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Logo & Info */}
                    <div className="flex items-start gap-4">
                      {isOrg ? (
                        <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0 overflow-hidden">
                          {itemObj.logo ? (
                            <img src={itemObj.logo} alt={itemObj.display_name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Building2 className="w-7 h-7 text-slate-400" />
                          )}
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                          {itemObj.title?.charAt(0) || 'P'}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base">
                            {isOrg ? itemObj.display_name : itemObj.title}
                          </h4>
                          {isOrg && itemObj.verification_status === 'VERIFIED' && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 text-xs">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                            </Badge>
                          )}
                          {isOrg && (
                            <Badge variant="outline" className="text-xs text-slate-600 dark:text-slate-300">
                              {itemObj.organization_type?.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {isOrg ? itemObj.description : itemObj.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {isOrg ? `${itemObj.city || ''}, ${itemObj.country}` : `${itemObj.city}, Tunisia`}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            {isOrg ? (
                              itemObj.minimum_ticket ? `${itemObj.minimum_ticket}M - ${itemObj.maximum_ticket}M TND` : 'Custom Ticket'
                            ) : (
                              `${formatMTND(itemObj.investment_required)} Required`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Pill & Actions */}
                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.matchScore}%
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Match Score</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(id)}
                          className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          Why match?
                        </Button>

                        {isOrg ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => {
                              onClose();
                              navigate(`/investment-network/${itemObj.slug || itemObj.id}`);
                            }}
                          >
                            View Profile <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => {
                              onClose();
                              navigate(`/investment-map?project=${itemObj.id}`);
                            }}
                          >
                            View Project <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Match Reasoning */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Match Breakdown & Alignment Factors
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Matching Criteria:</p>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {item.factors.map((f, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {item.nonFactors.length > 0 && (
                          <div>
                            <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">Non-Critical Variances:</p>
                            <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                              {item.nonFactors.map((nf, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <span className="text-amber-500 font-bold">•</span> {nf}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
