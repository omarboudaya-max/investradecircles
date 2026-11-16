/**
 * Investraders matching engine.
 *
 * Scores how well an investor mandate fits an investment opportunity and ranks
 * real records from the platform (investor organisations, funds, projects, posts
 * and member profiles) against what a user says they are looking for.
 *
 * Scores are transparent: every result carries a per-criterion breakdown, there is
 * no artificial floor, and a poor fit is reported as a poor fit.
 */

import { SECTOR_BY_ID, detectCorridors, detectSectors, extractPostSignal, inferSectorsFromProfile } from './signals.js';
import { normaliseText } from './sentiment.js';

export const MATCH_WEIGHTS = { sector: 30, ticket: 25, stage: 15, geography: 10, type: 10, quality: 10 };

export const MATCH_TIERS = [
  { id: 'strong', min: 75, label: 'Strong match' },
  { id: 'good', min: 55, label: 'Good match' },
  { id: 'partial', min: 35, label: 'Partial match' },
  { id: 'weak', min: 0, label: 'Weak match' },
];

export function tierFor(score) {
  return MATCH_TIERS.find((t) => score >= t.min) || MATCH_TIERS[MATCH_TIERS.length - 1];
}

// Stages that an investor targeting one will usually also consider.
const STAGE_NEIGHBOURS = {
  SEED: ['EARLY_STAGE', 'R_AND_D'],
  R_AND_D: ['SEED', 'EARLY_STAGE', 'GREENFIELD'],
  EARLY_STAGE: ['SEED', 'GROWTH', 'SERIES_A'],
  SERIES_A: ['EARLY_STAGE', 'GROWTH'],
  GROWTH: ['EARLY_STAGE', 'EXPANSION', 'SERIES_A', 'READY_FOR_INVESTMENT'],
  EXPANSION: ['GROWTH', 'READY_FOR_INVESTMENT', 'FUNDING_OPEN'],
  GREENFIELD: ['R_AND_D', 'EXPANSION'],
  TURNAROUND: ['EXPANSION'],
  READY_FOR_INVESTMENT: ['GROWTH', 'EXPANSION', 'FUNDING_OPEN'],
  FUNDING_OPEN: ['GROWTH', 'EXPANSION', 'READY_FOR_INVESTMENT'],
};

// Geographic mandates that cover a project located in Tunisia.
const COVERS_TUNISIA = ['tunisia', 'tunisie', 'north africa', 'afrique du nord', 'maghreb', 'africa', 'afrique', 'mena', 'mediterranean', 'mediterranee', 'global', 'worldwide', 'international', 'emerging markets'];

const REGION_ALIASES = {
  Tunisia: ['tunisia', 'tunisie'],
  Europe: ['europe', 'european union', 'eu', 'france', 'germany', 'italy', 'spain', 'united kingdom', 'uk', 'switzerland', 'netherlands', 'belgium', 'mediterranean'],
  GCC: ['gcc', 'gulf', 'saudi arabia', 'uae', 'united arab emirates', 'qatar', 'kuwait', 'middle east', 'mena'],
  Africa: ['africa', 'sub-saharan africa', 'north africa', 'maghreb', 'morocco', 'algeria', 'kenya', 'senegal', 'nigeria', 'south africa'],
  Americas: ['united states', 'usa', 'canada', 'north america', 'americas'],
  Asia: ['asia', 'china', 'india', 'japan', 'turkey'],
};

const asArray = (value) => (Array.isArray(value) ? value.filter((v) => v !== null && v !== undefined && v !== '') : []);
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const lower = (value) => normaliseText(String(value || '')).trim();

function listCoversTunisia(list) {
  return asArray(list).some((g) => COVERS_TUNISIA.includes(lower(g)));
}

export function matchesRegion(values, region) {
  if (!region || region === 'Global') return true;
  const aliases = REGION_ALIASES[region] || [lower(region)];
  return asArray(values).some((v) => {
    const value = lower(v);
    return value === 'global' || aliases.some((a) => value.includes(a));
  });
}

const fmtM = (n) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}M TND`;

/**
 * Score one investor mandate against one project.
 * Works for organisations, funds (normalised with `vehicleToMandate`) and ad-hoc mandates.
 */
export function scoreInvestorProject(investor, project, options = {}) {
  const weights = { ...MATCH_WEIGHTS, ...(options.weights || {}) };
  const breakdown = [];
  const add = (key, label, ratio, detail) => {
    const weight = weights[key] || 0;
    if (!weight) return;
    const earned = Math.round(weight * Math.max(0, Math.min(1, ratio)) * 10) / 10;
    breakdown.push({ key, label, weight, earned, status: ratio >= 0.95 ? 'match' : ratio > 0 ? 'partial' : 'miss', detail });
  };

  if (!investor || !project) {
    return { matchScore: 0, score: 0, tier: tierFor(0), breakdown, factors: [], nonFactors: [], explanation: 'Insufficient data' };
  }

  // 1. Sector
  const focus = asArray(investor.investment_focus || investor.sector_focus || investor.preferred_sectors);
  const sectorLabel = SECTOR_BY_ID[project.sector_id]?.label || 'this sector';
  if (!project.sector_id) add('sector', 'Sector', 0.4, 'Project sector not specified');
  else if (focus.includes(project.sector_id) || focus.includes('all')) add('sector', 'Sector', 1, `${sectorLabel} is inside the investment mandate`);
  else if (focus.length === 0) add('sector', 'Sector', 0.6, 'Generalist mandate — no sector restriction stated');
  else add('sector', 'Sector', 0, `${sectorLabel} is outside the stated sector focus`);

  // 2. Ticket size — compare the investor's cheque range with what the project accepts.
  const invMin = num(investor.minimum_ticket);
  const invMax = num(investor.maximum_ticket) || Infinity;
  const required = num(project.investment_required);
  const projMin = num(project.minimum_ticket) || 0;
  const projMax = num(project.maximum_ticket) || required || Infinity;
  if (!required && !num(project.maximum_ticket)) {
    add('ticket', 'Ticket size', 0.5, 'Funding need not specified');
  } else if (!num(investor.minimum_ticket) && !num(investor.maximum_ticket)) {
    add('ticket', 'Ticket size', 0.6, 'Investor ticket range not specified');
  } else if (invMin <= projMax && invMax >= projMin) {
    add('ticket', 'Ticket size', 1, `Cheque range ${fmtM(invMin)}–${Number.isFinite(invMax) ? fmtM(invMax) : '∞'} overlaps tickets of ${fmtM(projMin)}–${Number.isFinite(projMax) ? fmtM(projMax) : '∞'}`);
  } else {
    // How far apart are the two ranges, relative to the nearer bound?
    const gap = invMin > projMax ? invMin - projMax : projMin - invMax;
    const reference = invMin > projMax ? invMin : projMin;
    const distance = reference > 0 ? gap / reference : 1;
    const ratio = distance <= 0.25 ? 0.6 : distance <= 0.5 ? 0.3 : 0;
    add('ticket', 'Ticket size', ratio, invMin > projMax
      ? `Project tickets (up to ${fmtM(projMax)}) are below the investor minimum of ${fmtM(invMin)}`
      : `Project minimum ticket (${fmtM(projMin)}) exceeds the investor maximum of ${fmtM(invMax)}`);
  }

  // 3. Stage
  const stages = asArray(investor.investment_stages || investor.preferred_stages);
  const stage = project.investment_stage;
  const stageName = stage ? String(stage).replace(/_/g, ' ').toLowerCase() : '';
  if (!stage) add('stage', 'Stage', 0.5, 'Project stage not specified');
  else if (stages.includes(stage) || stages.includes('all')) add('stage', 'Stage', 1, `Invests at the ${stageName} stage`);
  else if (stages.length === 0) add('stage', 'Stage', 0.6, 'No stage restriction stated');
  else if (stages.some((s) => (STAGE_NEIGHBOURS[stage] || []).includes(s))) add('stage', 'Stage', 0.5, `Adjacent stage — mandate is close to ${stageName}`);
  else add('stage', 'Stage', 0, `Does not invest at the ${stageName} stage`);

  // 4. Geography — projects on the platform are located in Tunisia.
  const geo = asArray(investor.geographic_focus || investor.preferred_geographies);
  if (geo.length === 0) add('geography', 'Geography', 0.5, 'No geographic mandate stated');
  else if (listCoversTunisia(geo)) add('geography', 'Geography', 1, 'Tunisia is inside the geographic mandate');
  else add('geography', 'Geography', 0, `Mandate limited to ${geo.slice(0, 3).join(', ')}`);

  // 5. Asset / project type
  const types = asArray(investor.project_types);
  if (!project.project_type) add('type', 'Project type', 0.5, 'Project type not specified');
  else if (types.includes(project.project_type)) add('type', 'Project type', 1, 'Asset type matches the vehicle');
  else if (types.length === 0) add('type', 'Project type', 0.6, 'No asset-type restriction stated');
  else add('type', 'Project type', 0, 'Asset type is not one this investor usually backs');

  // 6. Readiness of the opportunity itself
  if (weights.quality) {
    let quality = 0;
    const notes = [];
    if (project.is_verified) { quality += 0.4; notes.push('verified'); }
    if (project.export_potential === 'HIGH') { quality += 0.3; notes.push('high export potential'); }
    else if (project.export_potential === 'MEDIUM') quality += 0.15;
    if (String(project.description || '').length > 120) { quality += 0.2; notes.push('documented'); }
    if (project.featured) quality += 0.1;
    add('quality', 'Readiness', quality, notes.length ? `Opportunity is ${notes.join(', ')}` : 'Limited supporting information so far');
  }

  const totalWeight = breakdown.reduce((sum, b) => sum + b.weight, 0) || 1;
  const earned = breakdown.reduce((sum, b) => sum + b.earned, 0);
  let matchScore = Math.round((earned / totalWeight) * 100);
  if (investor.active === false) matchScore = 0;

  const factors = breakdown.filter((b) => b.status === 'match').map((b) => `✓ ${b.detail}`);
  const partials = breakdown.filter((b) => b.status === 'partial').map((b) => `~ ${b.detail}`);
  const nonFactors = breakdown.filter((b) => b.status === 'miss').map((b) => `✕ ${b.detail}`);
  const tier = tierFor(matchScore);

  return {
    matchScore,
    score: matchScore,
    tier,
    breakdown,
    factors: [...factors, ...partials],
    nonFactors,
    explanation: `${tier.label}: ${factors.length} of ${breakdown.length} criteria fully met.`,
  };
}

/** Back-compatible alias used across the investment pages. */
export const calculateInvestorProjectMatch = scoreInvestorProject;

/** Present a fund / vehicle in the same shape as an investor organisation. */
export function vehicleToMandate(vehicle, organization) {
  return {
    ...vehicle,
    display_name: vehicle.name,
    investment_focus: asArray(vehicle.sector_focus),
    geographic_focus: asArray(vehicle.geographic_focus).length ? vehicle.geographic_focus : organization?.geographic_focus,
    investment_stages: asArray(vehicle.investment_stages),
    project_types: asArray(organization?.project_types),
    minimum_ticket: vehicle.minimum_ticket ?? organization?.minimum_ticket,
    maximum_ticket: vehicle.maximum_ticket ?? organization?.maximum_ticket,
    active: vehicle.active !== false && vehicle.fund_status !== 'CLOSED',
  };
}

export function isPublishedProject(project) {
  return !project?.project_status || project.project_status === 'PUBLISHED';
}

export function rankInvestorsForProject(project, organizations = []) {
  return organizations
    .filter((org) => org && org.active !== false)
    .map((org) => ({ entity: org, ...scoreInvestorProject(org, project) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function rankProjectsForInvestor(investor, projects = []) {
  return projects
    .filter(isPublishedProject)
    .map((project) => ({ entity: project, ...scoreInvestorProject(investor, project) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ── Interactive matchmaker ──────────────────────────────────────────────────

export const TICKET_BANDS = [
  { id: 'any', label: 'Any size', min: 0, max: 0 },
  { id: '0-0.1', label: 'Under 100K TND', min: 0, max: 0.1 },
  { id: '0.1-0.5', label: '100K – 500K TND', min: 0.1, max: 0.5 },
  { id: '0.5-2', label: '500K – 2M TND', min: 0.5, max: 2 },
  { id: '2-10', label: '2M – 10M TND', min: 2, max: 10 },
  { id: '10+', label: 'Over 10M TND', min: 10, max: 0 },
];

export const REGION_OPTIONS = [
  { id: 'Global', label: 'Anywhere' },
  { id: 'Tunisia', label: 'Tunisia' },
  { id: 'Europe', label: 'Europe' },
  { id: 'GCC', label: 'Gulf (GCC)' },
  { id: 'Africa', label: 'Africa' },
  { id: 'Americas', label: 'North America' },
];

export const OBJECTIVES = [
  { id: 'INVESTMENT', label: 'Raise capital', description: 'Find investors and funds whose mandate fits my project', seeks: 'investors' },
  { id: 'CAPITAL_ALLOCATION', label: 'Deploy capital', description: 'Find investment-ready projects that fit my mandate', seeks: 'projects' },
  { id: 'PARTNER', label: 'Find a strategic partner', description: 'Co-founders, technical or commercial partners', seeks: 'partners' },
  { id: 'DISTRIBUTOR', label: 'Find distributors / buyers', description: 'Importers and channels in target markets', seeks: 'partners' },
  { id: 'JOINT_VENTURE', label: 'Joint venture', description: 'Industrial or commercial JV opportunities', seeks: 'partners' },
  { id: 'EXPORT_MARKET', label: 'Open export markets', description: 'People and projects active on my target corridor', seeks: 'partners' },
];

const PARTNER_SEEKING = {
  PARTNER: ['PARTNERSHIP', 'STRATEGIC_PARTNER', 'TECHNICAL'],
  DISTRIBUTOR: ['EXPORT', 'PARTNERSHIP', 'STRATEGIC_PARTNER'],
  JOINT_VENTURE: ['JOINT_VENTURE', 'PARTNERSHIP', 'STRATEGIC_PARTNER'],
  EXPORT_MARKET: ['EXPORT', 'PARTNERSHIP'],
};

const PARTNER_POST_INTENTS = {
  PARTNER: ['PARTNERSHIP', 'NEED', 'OPPORTUNITY'],
  DISTRIBUTOR: ['EXPANSION', 'NEED', 'PARTNERSHIP', 'OPPORTUNITY'],
  JOINT_VENTURE: ['PARTNERSHIP', 'OPPORTUNITY', 'INVESTMENT'],
  EXPORT_MARKET: ['EXPANSION', 'OPPORTUNITY', 'NEED'],
};

function ticketRange(criteria) {
  const band = TICKET_BANDS.find((b) => b.id === criteria.ticket) || TICKET_BANDS[0];
  return { min: num(criteria.ticketMin) || band.min, max: num(criteria.ticketMax) || band.max };
}

function daysSince(dateValue, now = Date.now()) {
  const t = new Date(dateValue).getTime();
  return Number.isFinite(t) ? Math.max(0, (now - t) / 86400000) : Infinity;
}

function memberMandate(profile) {
  const stored = profile?.match_profile && typeof profile.match_profile === 'object' ? profile.match_profile : null;
  const sectors = asArray(stored?.sectors).length ? stored.sectors : inferSectorsFromProfile(profile);
  return { stored: Boolean(stored), sectors, objective: stored?.objective || null, region: stored?.region || null, ticket: stored?.ticket || null };
}

/**
 * Rank real platform records against what the user is looking for.
 *
 * @param {object} criteria { role, objective, sectors: string[], region, ticket, ticketMin, ticketMax, stage }
 * @param {object} data     { organizations, vehicles, projects, posts, profiles, currentUserId }
 * @returns {Array} ranked matches, each with kind, title, score, tier, breakdown and the source entity
 */
export function findMatches(criteria = {}, data = {}) {
  const sectors = asArray(criteria.sectors).length ? criteria.sectors : criteria.sector ? [criteria.sector] : [];
  const objective = OBJECTIVES.find((o) => o.id === criteria.objective) || OBJECTIVES[0];
  const region = criteria.region || 'Global';
  const range = ticketRange(criteria);
  const organizations = asArray(data.organizations).filter((o) => o.active !== false);
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const vehicles = asArray(data.vehicles).filter((v) => v.active !== false);
  const projects = asArray(data.projects).filter(isPublishedProject);
  const posts = asArray(data.posts);
  const profiles = asArray(data.profiles);
  const me = data.currentUserId || null;
  const now = data.now || Date.now();
  const results = [];

  if (objective.seeks === 'investors') {
    // The user describes a funding need; treat it as a project and score every mandate against it.
    const weights = { ...MATCH_WEIGHTS, quality: 0 };
    const need = (sectorId) => ({
      sector_id: sectorId || null,
      project_type: SECTOR_BY_ID[sectorId]?.projectType || null,
      investment_stage: criteria.stage || null,
      minimum_ticket: range.min,
      maximum_ticket: range.max || null,
      investment_required: range.max || range.min || 0,
    });
    const bestAcrossSectors = (mandate) => {
      const candidates = (sectors.length ? sectors : [null]).map((s) => scoreInvestorProject(mandate, need(s), { weights }));
      return candidates.sort((a, b) => b.matchScore - a.matchScore)[0];
    };
    const regionAdjust = (entity, score) => {
      if (region === 'Global') return score;
      const located = matchesRegion([entity.country, ...(asArray(entity.geographic_focus))], region);
      return located ? score : Math.round(score * 0.85);
    };

    for (const org of organizations) {
      const scored = bestAcrossSectors(org);
      results.push({
        id: `org:${org.id}`, kind: 'investor_org', entity: org,
        title: org.display_name, subtitle: [String(org.organization_type || '').replace(/_/g, ' '), org.city, org.country].filter(Boolean).join(' · '),
        description: org.description, image: org.logo_url || org.logo || null,
        href: `/investment-network/${org.slug || org.id}`,
        ownerUserId: org.user_id || null, contactEmail: org.contact_email || null,
        verified: ['VERIFIED', 'OFFICIAL'].includes(org.verification_status), illustrative: Boolean(org.is_illustrative),
        ticketLabel: org.minimum_ticket || org.maximum_ticket ? `${fmtM(num(org.minimum_ticket))} – ${fmtM(num(org.maximum_ticket))}` : null,
        ...scored, matchScore: regionAdjust(org, scored.matchScore),
      });
    }
    for (const vehicle of vehicles) {
      const org = orgById[vehicle.organization_id];
      const scored = bestAcrossSectors(vehicleToMandate(vehicle, org));
      results.push({
        id: `fund:${vehicle.id}`, kind: 'fund', entity: vehicle,
        title: vehicle.name, subtitle: [vehicle.vehicle_type, org?.display_name, vehicle.country].filter(Boolean).join(' · '),
        description: vehicle.description, image: org?.logo_url || org?.logo || null,
        href: `/fund/${vehicle.slug || vehicle.id}`,
        ownerUserId: org?.user_id || null, contactEmail: org?.contact_email || null,
        verified: ['VERIFIED', 'OFFICIAL'].includes(org?.verification_status), illustrative: Boolean(org?.is_illustrative),
        ticketLabel: vehicle.minimum_ticket || vehicle.maximum_ticket ? `${fmtM(num(vehicle.minimum_ticket))} – ${fmtM(num(vehicle.maximum_ticket))}` : null,
        ...scored, matchScore: regionAdjust({ ...vehicle, geographic_focus: vehicle.geographic_focus }, scored.matchScore),
      });
    }
    results.push(...rankMembers({ profiles, me, wantType: 'investor', sectors, region }));
  } else if (objective.seeks === 'projects') {
    const mandate = {
      investment_focus: sectors,
      minimum_ticket: range.min,
      maximum_ticket: range.max || 0,
      investment_stages: criteria.stage ? [criteria.stage] : [],
      geographic_focus: ['Tunisia'],
      project_types: [],
    };
    for (const project of projects) {
      const scored = scoreInvestorProject(mandate, project);
      results.push({
        id: `project:${project.id}`, kind: 'project', entity: project,
        title: project.title, subtitle: [project.company_name, project.city].filter(Boolean).join(' · '),
        description: project.short_description || project.description, image: project.image_url || null,
        href: `/investment-project/${project.id}`,
        ownerUserId: project.user_id || null, contactEmail: project.email || null,
        verified: Boolean(project.is_verified),
        ticketLabel: required(project),
        ...scored,
      });
    }
    results.push(...rankMembers({ profiles, me, wantType: 'innovator', sectors, region }));
  } else {
    // Partnership-type objectives: projects explicitly seeking partners, live posts, and members.
    const wantedSeeking = PARTNER_SEEKING[objective.id] || PARTNER_SEEKING.PARTNER;
    const wantedIntents = PARTNER_POST_INTENTS[objective.id] || PARTNER_POST_INTENTS.PARTNER;

    for (const project of projects) {
      const breakdown = [];
      const seeking = asArray(project.seeking);
      const seekingHit = seeking.filter((s) => wantedSeeking.includes(s));
      breakdown.push(part('need', 'What they seek', 40, seekingHit.length ? 1 : 0,
        seekingHit.length ? `Looking for ${seekingHit.map((s) => s.replace(/_/g, ' ').toLowerCase()).join(', ')}` : 'Not currently seeking this kind of partner'));
      breakdown.push(part('sector', 'Sector', 35, !sectors.length ? 0.5 : sectors.includes(project.sector_id) ? 1 : 0,
        !sectors.length ? 'No sector selected' : sectors.includes(project.sector_id) ? `${SECTOR_BY_ID[project.sector_id]?.label || 'Sector'} matches yours` : 'Different sector'));
      const marketHit = region === 'Global' ? 0.6 : matchesRegion(project.target_markets, region) ? 1 : region === 'Tunisia' ? 1 : 0;
      breakdown.push(part('geography', 'Target market', 25, marketHit,
        region === 'Global' ? 'No target market selected' : marketHit ? `Targets ${region}` : `Does not target ${region}`));
      const matchScore = total(breakdown);
      results.push({
        id: `project:${project.id}`, kind: 'project', entity: project,
        title: project.title, subtitle: [project.company_name, project.city].filter(Boolean).join(' · '),
        description: project.short_description || project.description, image: project.image_url || null,
        href: `/investment-project/${project.id}`, ownerUserId: project.user_id || null, contactEmail: project.email || null,
        verified: Boolean(project.is_verified), ticketLabel: required(project),
        ...finish(breakdown, matchScore),
      });
    }

    for (const post of posts) {
      if (!post?.content || post.created_by_id === me) continue;
      if (post.visibility && post.visibility !== 'public') continue;
      const signal = extractPostSignal(post.content, post.intent_category);
      if (!signal.hasSignal || !wantedIntents.includes(signal.intentId)) continue;
      const age = daysSince(post.created_date, now);
      const breakdown = [];
      breakdown.push(part('need', 'Intent', 35, 1, `${signal.intent}${signal.intentDeclared ? ' (stated by the author)' : ' (detected in the text)'}`));
      const sectorHit = sectors.length ? signal.sectors.some((s) => sectors.includes(s)) : false;
      breakdown.push(part('sector', 'Sector', 30, !sectors.length ? 0.5 : sectorHit ? 1 : 0,
        !sectors.length ? 'No sector selected' : sectorHit ? `Mentions ${signal.sector}` : signal.sector ? `About ${signal.sector}` : 'Sector not identifiable from the post'));
      const regionHit = region === 'Global' ? 0.6 : postTargetsRegion(post.content, region) ? 1 : 0;
      breakdown.push(part('geography', 'Target market', 20, regionHit,
        region === 'Global' ? 'No target market selected' : regionHit ? `Mentions ${region}` : `No mention of ${region}`));
      const freshness = age <= 14 ? 1 : age <= 45 ? 0.7 : age <= 120 ? 0.4 : 0.15;
      breakdown.push(part('freshness', 'Recency', 15, freshness, age === Infinity ? 'Date unknown' : `Posted ${Math.round(age)} day${Math.round(age) === 1 ? '' : 's'} ago`));
      const matchScore = total(breakdown);
      results.push({
        id: `post:${post.id}`, kind: 'post', entity: post,
        title: firstLine(post.content), subtitle: `Post by ${post.author_name || 'a member'}`,
        description: post.content, image: post.author_avatar || null,
        href: `/post/${post.id}`, ownerUserId: post.created_by_id || null,
        ...finish(breakdown, matchScore),
      });
    }
    results.push(...rankMembers({ profiles, me, wantType: null, sectors, region }));
  }

  return results
    .filter((r) => r.matchScore >= (criteria.minScore ?? 20))
    .sort((a, b) => b.matchScore - a.matchScore || Number(b.verified) - Number(a.verified));
}

function required(project) {
  const n = num(project.investment_required);
  return n ? `${fmtM(n)} required` : null;
}

function firstLine(text) {
  const line = String(text || '').split(/\n/).find((l) => l.trim()) || '';
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

function part(key, label, weight, ratio, detail) {
  const r = Math.max(0, Math.min(1, ratio));
  return { key, label, weight, earned: Math.round(weight * r * 10) / 10, status: r >= 0.95 ? 'match' : r > 0 ? 'partial' : 'miss', detail };
}

function total(breakdown) {
  const weight = breakdown.reduce((s, b) => s + b.weight, 0) || 1;
  return Math.round((breakdown.reduce((s, b) => s + b.earned, 0) / weight) * 100);
}

function finish(breakdown, matchScore) {
  const tier = tierFor(matchScore);
  return {
    matchScore, score: matchScore, tier, breakdown,
    factors: breakdown.filter((b) => b.status !== 'miss').map((b) => `${b.status === 'match' ? '✓' : '~'} ${b.detail}`),
    nonFactors: breakdown.filter((b) => b.status === 'miss').map((b) => `✕ ${b.detail}`),
    explanation: `${tier.label}: ${breakdown.filter((b) => b.status === 'match').length} of ${breakdown.length} criteria fully met.`,
  };
}

function postTargetsRegion(content, region) {
  return detectCorridors(content).some((c) => c.region === region || (region === 'Africa' && c.region === 'North Africa'));
}

/** Rank member profiles (innovators ↔ investors) on declared preferences or, failing that, profile text. */
function rankMembers({ profiles, me, wantType, sectors, region }) {
  const out = [];
  for (const profile of profiles) {
    if (!profile?.id || profile.id === me) continue;
    if (profile.is_onboarded === false) continue;
    if (wantType && profile.user_type !== wantType) continue;
    const mandate = memberMandate(profile);
    const text = [profile.headline, profile.bio, profile.location].filter(Boolean).join(' ');
    // Members who have said nothing about themselves cannot be matched meaningfully.
    if (!mandate.stored && !text.trim()) continue;

    const breakdown = [];
    if (wantType) breakdown.push(part('role', 'Role', 25, 1, `Registered as ${wantType === 'investor' ? 'an investor' : 'an innovator'}`));
    const overlap = sectors.filter((s) => mandate.sectors.includes(s));
    breakdown.push(part('sector', 'Sector', 45, !sectors.length ? 0.2 : overlap.length ? 1 : mandate.sectors.length ? 0 : 0.2,
      !sectors.length ? 'No sector selected'
        : overlap.length ? `${mandate.stored ? 'Declared interest in' : 'Profile mentions'} ${overlap.map((s) => SECTOR_BY_ID[s]?.label).join(', ')}`
          : mandate.sectors.length ? 'Focused on other sectors' : 'Sector not stated on their profile'));
    const regionHit = region === 'Global' ? 0.5
      : mandate.region === region || postTargetsRegion(text, region) ? 1 : 0;
    breakdown.push(part('geography', 'Geography', 15, regionHit,
      region === 'Global' ? 'No target market selected' : regionHit ? `Active in ${region}` : `No stated link to ${region}`));
    breakdown.push(part('profile', 'Profile depth', 15, mandate.stored ? 1 : text.length > 80 ? 0.6 : 0.3,
      mandate.stored ? 'Has completed matching preferences' : 'Matched on public profile text only'));

    const matchScore = total(breakdown);
    out.push({
      id: `member:${profile.id}`, kind: 'member', entity: profile,
      title: profile.full_name || 'Member', subtitle: [profile.headline, profile.location].filter(Boolean).join(' · ') || (profile.user_type || 'Member'),
      description: profile.bio || '', image: profile.avatar_url || null,
      href: `/profile/${profile.id}`, ownerUserId: profile.id,
      ...finish(breakdown, matchScore),
    });
  }
  return out;
}

/** Sector ids a user most plausibly cares about, from stored preferences or their profile text. */
export function suggestCriteriaForUser(user) {
  if (!user) return {};
  const stored = user.match_profile && typeof user.match_profile === 'object' ? user.match_profile : null;
  if (stored) return stored;
  const sectors = detectSectors([user.headline, user.bio, user.business_type].filter(Boolean).join(' ')).map((s) => s.id);
  return {
    role: user.user_type === 'investor' ? 'INVESTOR' : user.user_type === 'innovator' ? 'STARTUP' : undefined,
    objective: user.user_type === 'investor' ? 'CAPITAL_ALLOCATION' : user.user_type === 'innovator' ? 'INVESTMENT' : undefined,
    sectors: sectors.slice(0, 2),
  };
}
