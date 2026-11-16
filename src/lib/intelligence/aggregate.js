/**
 * Platform intelligence aggregation.
 *
 * Turns the raw activity of the platform (posts, comments, circle answers,
 * profiles, projects, investors, expressions of interest, event registrations)
 * into the figures shown on the command centers. Everything here is computed from
 * records that exist — sample sizes travel with every metric so the UI can show
 * how much evidence is behind a number.
 */

import { CONCERN_TOPICS, analyzeSentiment, detectConcernTopics, normaliseText } from './sentiment.js';
import { CORRIDOR_BY_ID, INTENT_BY_ID, SECTORS, SECTOR_BY_ID, detectCorridors, detectSectors, extractPostSignal } from './signals.js';
import { isPublishedProject, rankInvestorsForProject } from './matching.js';

const DAY = 86400000;
const asArray = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const time = (v) => {
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

function sentimentBucket() {
  return { total: 0, positive: 0, neutral: 0, negative: 0, scored: 0, sum: 0 };
}

function addToBucket(bucket, sentiment) {
  bucket.total += 1;
  bucket[sentiment.label] += 1;
  if (sentiment.hits > 0) {
    bucket.scored += 1;
    bucket.sum += sentiment.score;
  }
}

function closeBucket(bucket) {
  const average = bucket.scored ? bucket.sum / bucket.scored : 0;
  return {
    total: bucket.total,
    positive: bucket.positive,
    neutral: bucket.neutral,
    negative: bucket.negative,
    scored: bucket.scored,
    average: Math.round(average * 100) / 100,
    // 0–100, 50 = neutral. Null when nothing could be scored, so the UI can say "not enough data".
    index: bucket.scored ? Math.round(50 + average * 50) : null,
    positiveShare: bucket.total ? Math.round((bucket.positive / bucket.total) * 100) : 0,
    negativeShare: bucket.total ? Math.round((bucket.negative / bucket.total) * 100) : 0,
  };
}

function weekStart(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.getTime();
}

const GOVERNORATE_ALIASES = {
  gov_tunis: ['tunis', 'grand tunis', 'la marsa', 'carthage'],
  gov_ariana: ['ariana', 'اريانه'],
  gov_ben_arous: ['ben arous', 'بن عروس'],
  gov_manouba: ['manouba', 'منوبه'],
  gov_nabeul: ['nabeul', 'hammamet', 'نابل'],
  gov_zaghouan: ['zaghouan', 'زغوان'],
  gov_bizerte: ['bizerte', 'بنزرت'],
  gov_beja: ['beja', 'باجه'],
  gov_jendouba: ['jendouba', 'جندوبه'],
  gov_kef: ['kef', 'le kef', 'الكاف'],
  gov_siliana: ['siliana', 'سليانه'],
  gov_sousse: ['sousse', 'سوسه'],
  gov_monastir: ['monastir', 'المنستير'],
  gov_mahdia: ['mahdia', 'المهديه'],
  gov_sfax: ['sfax', 'صفاقس'],
  gov_kairouan: ['kairouan', 'القيروان'],
  gov_kasserine: ['kasserine', 'القصرين'],
  gov_sidi_bouzid: ['sidi bouzid', 'سيدي بوزيد'],
  gov_gabes: ['gabes', 'قابس'],
  gov_medenine: ['medenine', 'djerba', 'jerba', 'zarzis', 'مدنين', 'جربه'],
  gov_tataouine: ['tataouine', 'تطاوين'],
  gov_gafsa: ['gafsa', 'قفصه'],
  gov_tozeur: ['tozeur', 'توزر'],
  gov_kebili: ['kebili', 'قبلي'],
};

/** Map a free-text location ("kairouan-tunisie", "Ben Arous ") to a governorate id, or null. */
export function resolveGovernorate(location) {
  const cleaned = normaliseText(location || '').replace(/[^a-zء-ي ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  const text = ` ${cleaned} `;
  // Longer aliases first so that "ben arous" wins over a shorter accidental match.
  const candidates = [];
  for (const [id, aliases] of Object.entries(GOVERNORATE_ALIASES)) {
    for (const alias of aliases) candidates.push([normaliseText(alias), id]);
  }
  candidates.sort((x, y) => y[0].length - x[0].length);
  for (const [needle, id] of candidates) if (text.includes(` ${needle} `)) return id;
  return null;
}

/**
 * Build the full intelligence picture.
 * Every input is optional; missing collections simply produce empty sections.
 */
export function buildIntelligence(input = {}) {
  const now = input.now || Date.now();
  const posts = asArray(input.posts).filter((p) => p && p.content);
  const comments = asArray(input.comments).filter((c) => c && c.content);
  const responses = asArray(input.responses).filter((r) => r && r.response_text);
  const profiles = asArray(input.profiles);
  const circles = asArray(input.circles);
  const projects = asArray(input.projects);
  const organizations = asArray(input.organizations).filter((o) => o.active !== false);
  const vehicles = asArray(input.vehicles);
  const interests = asArray(input.interests);
  const registrations = asArray(input.registrations);
  const governorates = asArray(input.governorates);
  const sectorRows = asArray(input.sectors);
  const profileById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const sectorLabel = (id) => sectorRows.find((s) => s.id === id)?.name || SECTOR_BY_ID[id]?.label || 'Other';
  const published = projects.filter(isPublishedProject);
  const pending = projects.filter((p) => p.project_status === 'SUBMITTED');

  // ── Voice: every text contribution, scored once ──
  const voice = [];
  for (const p of posts) {
    const signal = extractPostSignal(p.content, p.intent_category);
    voice.push({
      id: `post:${p.id}`, kind: 'post', sourceId: p.id, text: p.content, at: time(p.created_date),
      authorId: p.created_by_id, authorName: p.author_name, circleId: p.circle_id || null,
      sentiment: signal.sentiment, signal, href: `/post/${p.id}`,
      engagement: num(p.likes) + asArray(p.liked_by).length,
    });
  }
  for (const c of comments) {
    voice.push({
      id: `comment:${c.id}`, kind: 'comment', sourceId: c.id, text: c.content, at: time(c.created_date),
      authorId: c.created_by_id, authorName: c.author_name, circleId: c.circle_id || null,
      sentiment: analyzeSentiment(c.content), signal: null, href: c.post_id ? `/post/${c.post_id}` : null, engagement: 0,
    });
  }
  for (const r of responses) {
    voice.push({
      id: `response:${r.id}`, kind: 'response', sourceId: r.id, text: r.response_text, at: time(r.created_date),
      authorId: r.created_by_id, authorName: r.author_name, circleId: r.circle_id || null,
      sentiment: analyzeSentiment(r.response_text), signal: null, href: r.circle_id ? `/circle/${r.circle_id}` : null,
      engagement: asArray(r.upvoted_by).length,
    });
  }

  // ── Overall sentiment and weekly trend ──
  const overall = sentimentBucket();
  const weekly = new Map();
  const bySegment = new Map();
  const bySector = new Map();
  const concernCounts = new Map();
  for (const item of voice) {
    addToBucket(overall, item.sentiment);
    if (item.at) {
      const key = weekStart(item.at);
      if (!weekly.has(key)) weekly.set(key, sentimentBucket());
      addToBucket(weekly.get(key), item.sentiment);
    }
    const segment = profileById[item.authorId]?.user_type || 'unspecified';
    if (!bySegment.has(segment)) bySegment.set(segment, sentimentBucket());
    addToBucket(bySegment.get(segment), item.sentiment);

    const sectorIds = item.signal ? item.signal.sectors : detectSectors(item.text).map((s) => s.id);
    for (const id of sectorIds.slice(0, 2)) {
      if (!bySector.has(id)) bySector.set(id, sentimentBucket());
      addToBucket(bySector.get(id), item.sentiment);
    }
    if (item.sentiment.label === 'negative') {
      for (const topic of detectConcernTopics(item.text)) {
        if (!concernCounts.has(topic)) concernCounts.set(topic, { count: 0, examples: [] });
        const entry = concernCounts.get(topic);
        entry.count += 1;
        if (entry.examples.length < 3) entry.examples.push(item);
      }
    }
  }

  const trend = [...weekly.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-12)
    .map(([start, bucket]) => ({ weekStart: start, label: new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), ...closeBucket(bucket) }));

  // ── Activity windows ──
  const within = (items, days, field) => items.filter((i) => {
    const t = time(i[field]);
    return t && now - t <= days * DAY;
  }).length;
  const growth = (items, field) => {
    const current = within(items, 30, field);
    const previous = items.filter((i) => {
      const t = time(i[field]);
      return t && now - t > 30 * DAY && now - t <= 60 * DAY;
    }).length;
    return { current, previous, changePct: previous ? Math.round(((current - previous) / previous) * 100) : null };
  };

  // ── Signals by intent ──
  const postVoice = voice.filter((v) => v.kind === 'post');
  const signalPosts = postVoice.filter((v) => v.signal.hasSignal);
  const intentCounts = new Map();
  for (const v of signalPosts) {
    const id = v.signal.intentId;
    if (!intentCounts.has(id)) intentCounts.set(id, { count: 0, recent: 0, items: [] });
    const entry = intentCounts.get(id);
    entry.count += 1;
    if (v.at && now - v.at <= 30 * DAY) entry.recent += 1;
    entry.items.push(v);
  }
  const intents = [...intentCounts.entries()]
    .map(([id, e]) => ({ id, label: INTENT_BY_ID[id]?.label || id, labelFr: INTENT_BY_ID[id]?.labelFr || id, count: e.count, recent: e.recent,
      latest: e.items.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 4) }))
    .sort((a, b) => b.count - a.count);

  // ── Corridors: where members and projects are trying to go ──
  const corridorCounts = new Map();
  const bump = (id, key) => {
    if (!id || id === 'tunisia') return;
    if (!corridorCounts.has(id)) corridorCounts.set(id, { posts: 0, projects: 0, investors: 0 });
    corridorCounts.get(id)[key] += 1;
  };
  for (const v of postVoice) for (const id of v.signal.corridors) bump(id, 'posts');
  for (const p of published) {
    const ids = new Set(detectCorridors(asArray(p.target_markets).join(' ; ')).map((c) => c.id));
    for (const id of ids) bump(id, 'projects');
  }
  for (const o of organizations) {
    const ids = new Set(detectCorridors([o.country, ...asArray(o.geographic_focus)].join(' ; ')).map((c) => c.id));
    for (const id of ids) bump(id, 'investors');
  }
  const corridors = [...corridorCounts.entries()]
    .map(([id, c]) => ({ id, label: CORRIDOR_BY_ID[id]?.label || id, region: CORRIDOR_BY_ID[id]?.region, ...c, total: c.posts + c.projects + c.investors }))
    .sort((a, b) => b.total - a.total);

  // ── Capital: demand from projects vs. supply from investor mandates ──
  const capitalDemand = published.reduce((s, p) => s + num(p.investment_required), 0);
  const equityDemand = published.reduce((s, p) => s + num(p.equity_required), 0);
  const jobs = published.reduce((s, p) => s + num(p.jobs_created), 0);
  const realInvestors = organizations.filter((o) => !o.is_illustrative);
  const interestByProject = new Map();
  for (const i of interests) interestByProject.set(i.project_id, (interestByProject.get(i.project_id) || 0) + 1);

  const sectorStats = (sectorRows.length ? sectorRows.map((s) => s.id) : SECTORS.map((s) => s.id)).map((id) => {
    const sectorProjects = published.filter((p) => p.sector_id === id);
    const investorsCovering = organizations.filter((o) => asArray(o.investment_focus).includes(id));
    const bucket = closeBucket(bySector.get(id) || sentimentBucket());
    const demand = sectorProjects.reduce((s, p) => s + num(p.investment_required), 0);
    return {
      id, label: sectorLabel(id),
      projects: sectorProjects.length,
      capitalDemand: Math.round(demand * 100) / 100,
      jobs: sectorProjects.reduce((s, p) => s + num(p.jobs_created), 0),
      investors: investorsCovering.length,
      mentions: bucket.total,
      sentiment: bucket,
      // Projects per investor covering the sector: >1 means capital is scarce for this sector on the platform.
      pressure: investorsCovering.length ? Math.round((sectorProjects.length / investorsCovering.length) * 100) / 100 : sectorProjects.length ? null : 0,
    };
  }).sort((a, b) => b.projects + b.mentions - (a.projects + a.mentions));

  // ── Regions ──
  const regionMap = new Map();
  const region = (id) => {
    if (!regionMap.has(id)) {
      const gov = governorates.find((g) => g.id === id);
      regionMap.set(id, { id, name: gov?.name || id.replace('gov_', '').replace(/_/g, ' '), region: gov?.region || '', projects: 0, capitalDemand: 0, jobs: 0, members: 0, attendees: 0, sectors: new Map(), projectList: [] });
    }
    return regionMap.get(id);
  };
  for (const g of governorates) region(g.id);
  for (const p of published) {
    if (!p.governorate_id) continue;
    const r = region(p.governorate_id);
    r.projects += 1;
    r.capitalDemand += num(p.investment_required);
    r.jobs += num(p.jobs_created);
    r.projectList.push(p);
    if (p.sector_id) r.sectors.set(p.sector_id, (r.sectors.get(p.sector_id) || 0) + 1);
  }
  let locatedMembers = 0;
  for (const profile of profiles) {
    const id = resolveGovernorate(profile.location);
    if (id) {
      region(id).members += 1;
      locatedMembers += 1;
    }
  }
  const regions = [...regionMap.values()].map((r) => ({
    ...r,
    capitalDemand: Math.round(r.capitalDemand * 100) / 100,
    topSector: [...r.sectors.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => sectorLabel(id))[0] || null,
    sectors: undefined,
  })).sort((a, b) => b.projects - a.projects || b.members - a.members);

  // ── Opportunities: fundable projects with their best investor fit, plus live member signals ──
  const opportunities = published.map((p) => {
    const ranked = rankInvestorsForProject(p, organizations);
    const best = ranked[0] || null;
    return {
      id: p.id, kind: 'project', title: p.title, company: p.company_name, city: p.city,
      sectorId: p.sector_id, sector: sectorLabel(p.sector_id), amount: num(p.investment_required), roi: num(p.expected_roi),
      jobs: num(p.jobs_created), seeking: asArray(p.seeking), targetMarkets: asArray(p.target_markets),
      verified: Boolean(p.is_verified), interests: interestByProject.get(p.id) || 0,
      bestInvestor: best ? { id: best.entity.id, slug: best.entity.slug, name: best.entity.display_name, score: best.matchScore } : null,
      strongInvestors: ranked.filter((r) => r.matchScore >= 75).length,
      goodInvestors: ranked.filter((r) => r.matchScore >= 55).length,
      href: `/investment-project/${p.id}`, at: time(p.created_date),
    };
  }).sort((a, b) => (b.bestInvestor?.score || 0) - (a.bestInvestor?.score || 0));

  const memberSignals = signalPosts
    .filter((v) => ['INVESTMENT', 'PARTNERSHIP', 'EXPANSION', 'NEED', 'OPPORTUNITY'].includes(v.signal.intentId))
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, 12);

  // ── Concerns ──
  const concerns = [...concernCounts.entries()]
    .map(([id, e]) => {
      const meta = CONCERN_TOPICS.find((t) => t.id === id);
      return { id, label: meta?.label || id, labelFr: meta?.labelFr || id, count: e.count, examples: e.examples };
    })
    .sort((a, b) => b.count - a.count);

  // ── Segments ──
  const SEGMENT_LABELS = { innovator: 'Innovators', investor: 'Investors', other: 'Other members', unspecified: 'Role not set' };
  const segmentCounts = {};
  for (const profile of profiles) {
    const key = profile.user_type || 'unspecified';
    segmentCounts[key] = (segmentCounts[key] || 0) + 1;
  }
  const segments = Object.keys({ ...segmentCounts, ...Object.fromEntries(bySegment) }).map((key) => ({
    id: key, label: SEGMENT_LABELS[key] || key, members: segmentCounts[key] || 0,
    sentiment: closeBucket(bySegment.get(key) || sentimentBucket()),
  })).sort((a, b) => b.members - a.members);

  // ── Alerts: rule-based, each one traceable to the numbers that triggered it ──
  const alerts = [];
  if (pending.length) {
    alerts.push({ id: 'pending-review', level: 'action', title: `${pending.length} project submission${pending.length === 1 ? '' : 's'} awaiting review`,
      detail: 'Submitted opportunities are not visible to investors until an administrator approves them.',
      action: 'Review submissions', href: '/admin?tab=Projects' });
  }
  const closedWeeks = trend.filter((w) => w.scored >= 3);
  if (closedWeeks.length >= 2) {
    const last = closedWeeks[closedWeeks.length - 1];
    const prev = closedWeeks[closedWeeks.length - 2];
    const delta = last.index - prev.index;
    if (delta <= -10) {
      alerts.push({ id: 'sentiment-drop', level: 'risk', title: `Member sentiment fell ${Math.abs(delta)} points week over week`,
        detail: `Index moved from ${prev.index} to ${last.index} (based on ${last.scored} scored contributions in the week of ${last.label}).`,
        action: 'Read the negative contributions', tab: 'voice' });
    } else if (delta >= 10) {
      alerts.push({ id: 'sentiment-rise', level: 'positive', title: `Member sentiment rose ${delta} points week over week`,
        detail: `Index moved from ${prev.index} to ${last.index} (${last.scored} scored contributions).`, tab: 'sentiment' });
    }
  }
  if (concerns[0] && concerns[0].count >= 2) {
    alerts.push({ id: `concern-${concerns[0].id}`, level: 'risk', title: `"${concerns[0].label}" is the most reported difficulty`,
      detail: `${concerns[0].count} negative contribution${concerns[0].count === 1 ? '' : 's'} mention it.`, action: 'See what members say', tab: 'voice' });
  }
  const unanswered = opportunities.filter((o) => o.interests === 0);
  if (published.length && unanswered.length === published.length) {
    alerts.push({ id: 'no-interest', level: 'action', title: 'No investor has expressed interest in any published project yet',
      detail: `${published.length} opportunities totalling ${Math.round(capitalDemand * 10) / 10}M TND are live. ${opportunities.filter((o) => o.strongInvestors > 0).length} of them have at least one strongly matching investor on the platform — an introduction would unlock them.`,
      action: 'Open the matchmaker', href: '/matchmaker' });
  }
  const orphanSectors = sectorStats.filter((s) => s.projects > 0 && s.investors === 0);
  if (orphanSectors.length) {
    alerts.push({ id: 'orphan-sectors', level: 'risk', title: `No investor on the platform covers ${orphanSectors.map((s) => s.label).join(', ')}`,
      detail: `${orphanSectors.reduce((s, x) => s + x.projects, 0)} published project(s) in these sectors have no matching mandate. Onboarding a specialised fund would close the gap.`,
      action: 'View the investor directory', href: '/investment-network' });
  }
  const seekers = intentCounts.get('INVESTMENT');
  if (seekers && seekers.recent >= 2) {
    alerts.push({ id: 'capital-demand', level: 'positive', title: `${seekers.recent} members signalled a funding need in the last 30 days`,
      detail: 'These posts can be converted into structured opportunities so investors can find them.', action: 'See funding signals', tab: 'opportunities' });
  }
  const unlocated = profiles.length - locatedMembers;
  if (profiles.length >= 20 && unlocated / profiles.length > 0.6) {
    alerts.push({ id: 'data-quality', level: 'info', title: `${Math.round((unlocated / profiles.length) * 100)}% of members have no usable location on their profile`,
      detail: 'Regional analysis currently relies mostly on project locations. Asking members to complete their profile will sharpen the regional map.' });
  }

  const sentiment = closeBucket(overall);
  const kpis = {
    members: profiles.length,
    newMembers30d: within(profiles, 30, 'created_at'),
    innovators: segmentCounts.innovator || 0,
    investorsMembers: segmentCounts.investor || 0,
    circles: circles.length,
    institutionalCircles: circles.filter((c) => ['institution', 'chamber_of_commerce'].includes(c.category)).length,
    posts: posts.length,
    posts30d: within(posts, 30, 'created_date'),
    contributions: voice.length,
    projects: published.length,
    pendingProjects: pending.length,
    capitalDemand: Math.round(capitalDemand * 100) / 100,
    equityDemand: Math.round(equityDemand * 100) / 100,
    jobs,
    investorOrgs: organizations.length,
    verifiedInvestorOrgs: realInvestors.filter((o) => ['VERIFIED', 'OFFICIAL'].includes(o.verification_status)).length,
    illustrativeInvestorOrgs: organizations.length - realInvestors.length,
    funds: vehicles.length,
    interests: interests.length,
    eventRegistrations: registrations.length,
    signals: signalPosts.length,
    strongPairs: opportunities.reduce((s, o) => s + o.strongInvestors, 0),
    sentimentIndex: sentiment.index,
  };

  return {
    generatedAt: now,
    kpis,
    growth: { members: growth(profiles, 'created_at'), posts: growth(posts, 'created_date') },
    sentiment, trend, segments, sectors: sectorStats, regions, corridors, intents, concerns,
    opportunities, memberSignals, alerts,
    voice: voice.sort((a, b) => (b.at || 0) - (a.at || 0)),
  };
}

// ── Executive brief ─────────────────────────────────────────────────────────

const fmtAmount = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)}B TND` : `${Math.round(m * 10) / 10}M TND`);

/** A written briefing generated from the aggregates — no canned text, no invented figures. */
export function buildExecutiveBrief(intel, { locale = 'en' } = {}) {
  const k = intel.kpis;
  const s = intel.sentiment;
  const date = new Date(intel.generatedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const situation = [
    `${k.members} members (${k.innovators} innovators, ${k.investorsMembers} investors), ${k.newMembers30d} joined in the last 30 days.`,
    `${k.projects} published investment opportunities seeking ${fmtAmount(k.capitalDemand)} and representing ${k.jobs.toLocaleString('en-US')} planned jobs.`,
    `${k.investorOrgs} investor organisations and ${k.funds} funds listed${k.illustrativeInvestorOrgs ? ` (${k.illustrativeInvestorOrgs} marked illustrative)` : ''}; ${k.interests} expression${k.interests === 1 ? '' : 's'} of interest recorded.`,
    s.index === null
      ? `Sentiment cannot be measured yet: none of the ${s.total} contributions contained scorable language.`
      : `Sentiment index ${s.index}/100 across ${s.total} contributions (${s.positive} positive, ${s.neutral} neutral, ${s.negative} negative).`,
  ];

  const attention = intel.alerts.filter((a) => a.level === 'risk' || a.level === 'action').map((a) => `${a.title}. ${a.detail}`);
  if (!attention.length) attention.push('No risk rule is currently triggered.');

  const opportunities = [];
  const top = intel.opportunities.filter((o) => o.bestInvestor && o.bestInvestor.score >= 55).slice(0, 3);
  for (const o of top) {
    opportunities.push(`${o.title} (${o.sector}, ${fmtAmount(o.amount)}) — best mandate fit: ${o.bestInvestor.name} at ${o.bestInvestor.score}%.`);
  }
  const corridor = intel.corridors[0];
  if (corridor) opportunities.push(`Most targeted corridor: ${corridor.label} — ${corridor.projects} project(s), ${corridor.posts} post(s), ${corridor.investors} investor(s) with a matching footprint.`);
  const demandIntent = intel.intents.find((i) => i.id === 'INVESTMENT' || i.id === 'PARTNERSHIP');
  if (demandIntent) opportunities.push(`${demandIntent.count} member post(s) carry a "${demandIntent.label.toLowerCase()}" signal (${demandIntent.recent} in the last 30 days).`);
  if (!opportunities.length) opportunities.push('No opportunity currently reaches a 55% mandate fit.');

  const actions = [];
  if (k.pendingProjects) actions.push(`Approve or reject the ${k.pendingProjects} pending project submission(s).`);
  const introducible = intel.opportunities.filter((o) => o.strongInvestors > 0 && o.interests === 0).slice(0, 3);
  for (const o of introducible) actions.push(`Introduce ${o.company || o.title} to ${o.bestInvestor.name} (${o.bestInvestor.score}% fit, no contact yet).`);
  const gap = intel.sectors.find((x) => x.projects > 0 && x.investors === 0);
  if (gap) actions.push(`Recruit an investor covering ${gap.label}: ${gap.projects} project(s) there have no matching mandate.`);
  if (intel.concerns[0]) actions.push(`Open a member consultation on "${intel.concerns[0].label.toLowerCase()}" — the most frequently reported difficulty.`);
  if (!actions.length) actions.push('No action is required from the current data.');

  return { date, situation, attention, opportunities, actions, sampleSize: s.total };
}

export function briefToText(brief, title = 'Investraders executive briefing') {
  const block = (heading, lines) => `${heading}\n${lines.map((l) => `• ${l}`).join('\n')}`;
  return [
    `${title} — ${brief.date}`,
    block('SITUATION', brief.situation),
    block('NEEDS ATTENTION', brief.attention),
    block('OPPORTUNITIES', brief.opportunities),
    block('RECOMMENDED ACTIONS', brief.actions),
    `Computed from live platform data (${brief.sampleSize} text contributions analysed).`,
  ].join('\n\n');
}

// ── Question answering over the aggregates ──────────────────────────────────

const QUESTION_TOPICS = [
  { id: 'concerns', cues: ['concern', 'problem', 'issue', 'difficult', 'challenge', 'complain', 'worry', 'risk', 'pain', 'preoccupation', 'probleme', 'difficulte', 'inquietude', 'risque', 'مشاكل', 'صعوبات'] },
  { id: 'sentiment', cues: ['sentiment', 'mood', 'feel', 'morale', 'confidence', 'humeur', 'moral', 'confiance', 'climat', 'مزاج', 'ثقه'] },
  { id: 'sectors', cues: ['sector', 'secteur', 'industry', 'industrie', 'filiere', 'growth', 'croissance', 'potential', 'potentiel', 'قطاع'] },
  { id: 'regions', cues: ['region', 'governorate', 'gouvernorat', 'where', 'ou ', 'territory', 'territoire', 'map', 'carte', 'جهه', 'ولايه'] },
  { id: 'capital', cues: ['capital', 'funding', 'financement', 'invest', 'money', 'fund', 'fonds', 'ticket', 'raise', 'levee', 'تمويل', 'استثمار'] },
  { id: 'investors', cues: ['investor', 'investisseur', 'vc', 'mandate', 'mandat', 'مستثمر'] },
  { id: 'corridors', cues: ['export', 'market', 'marche', 'country', 'pays', 'corridor', 'international', 'europe', 'gulf', 'golfe', 'africa', 'afrique', 'تصدير', 'اسواق'] },
  { id: 'opportunities', cues: ['opportunit', 'deal', 'project', 'projet', 'match', 'pipeline', 'فرص', 'مشاريع'] },
  { id: 'priorities', cues: ['priorit', 'action', 'recommend', 'should', 'next', 'do now', 'que faire', 'recommand', 'اولويات'] },
  { id: 'members', cues: ['member', 'membre', 'user', 'utilisateur', 'communit', 'communaut', 'how many', 'combien', 'اعضاء'] },
];

/**
 * Answer a free-text question from the computed intelligence.
 * Returns { topic, title, lines, basis } — `basis` states what the answer rests on.
 */
export function answerQuestion(question, intel) {
  const q = ` ${normaliseText(question || '')} `;
  const scored = QUESTION_TOPICS.map((t) => ({ id: t.id, hits: t.cues.filter((c) => q.includes(normaliseText(c))).length }))
    .filter((t) => t.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  const topic = scored[0]?.id || 'overview';
  const k = intel.kpis;
  const s = intel.sentiment;
  const basis = `${s.total} contributions, ${k.projects} projects, ${k.investorOrgs} investor organisations, ${k.members} members`;
  const none = (what) => [`There is not enough ${what} on the platform yet to answer this reliably.`];

  switch (topic) {
    case 'concerns': {
      if (!intel.concerns.length) return { topic, title: 'Reported difficulties', lines: s.negative ? ['Negative contributions exist but none maps to a tracked concern area.'] : none('negative feedback'), basis };
      return { topic, title: 'Most reported difficulties', basis,
        lines: intel.concerns.slice(0, 5).map((c, i) => `${i + 1}. ${c.label} — ${c.count} negative contribution${c.count === 1 ? '' : 's'}${c.examples[0] ? `, e.g. “${trim(c.examples[0].text)}”` : ''}`) };
    }
    case 'sentiment': {
      if (s.index === null) return { topic, title: 'Member sentiment', lines: none('scorable text'), basis };
      const lines = [`Overall index: ${s.index}/100 (${s.positive} positive, ${s.neutral} neutral, ${s.negative} negative out of ${s.total}).`];
      const segs = intel.segments.filter((x) => x.sentiment.index !== null).slice(0, 4);
      for (const seg of segs) lines.push(`${seg.label}: ${seg.sentiment.index}/100 over ${seg.sentiment.total} contributions.`);
      const last = intel.trend[intel.trend.length - 1];
      if (last && last.index !== null) lines.push(`Latest week (${last.label}): ${last.index}/100 over ${last.total} contributions.`);
      return { topic, title: 'Member sentiment', lines, basis };
    }
    case 'sectors': {
      const rows = intel.sectors.filter((x) => x.projects || x.mentions).slice(0, 5);
      if (!rows.length) return { topic, title: 'Sector activity', lines: none('sector activity'), basis };
      return { topic, title: 'Sector activity', basis,
        lines: rows.map((x) => `${x.label}: ${x.projects} project(s) seeking ${fmtAmount(x.capitalDemand)}, ${x.investors} investor(s) covering it, ${x.mentions} mention(s)${x.sentiment.index !== null ? `, sentiment ${x.sentiment.index}/100` : ''}.`) };
    }
    case 'regions': {
      const rows = intel.regions.filter((x) => x.projects || x.members).slice(0, 6);
      if (!rows.length) return { topic, title: 'Regional picture', lines: none('located activity'), basis };
      return { topic, title: 'Regional picture', basis,
        lines: rows.map((x) => `${x.name}: ${x.projects} project(s), ${fmtAmount(x.capitalDemand)} sought, ${x.jobs} jobs, ${x.members} located member(s)${x.topSector ? ` — lead sector ${x.topSector}` : ''}.`) };
    }
    case 'capital': {
      const lines = [
        `${k.projects} published projects are seeking ${fmtAmount(k.capitalDemand)} in total (${fmtAmount(k.equityDemand)} of it equity).`,
        `${k.interests} expression(s) of interest have been recorded so far.`,
      ];
      const big = [...intel.opportunities].sort((a, b) => b.amount - a.amount).slice(0, 3);
      for (const o of big) lines.push(`${o.title}: ${fmtAmount(o.amount)} — ${o.goodInvestors} investor(s) at or above a 55% fit.`);
      return { topic, title: 'Capital demand', lines, basis };
    }
    case 'investors': {
      const lines = [`${k.investorOrgs} investor organisations and ${k.funds} funds are listed; ${k.verifiedInvestorOrgs} are verified${k.illustrativeInvestorOrgs ? ` and ${k.illustrativeInvestorOrgs} are illustrative entries` : ''}.`,
        `${k.investorsMembers} members are registered as investors.`];
      const gaps = intel.sectors.filter((x) => x.projects > 0 && x.investors === 0);
      if (gaps.length) lines.push(`No listed investor covers: ${gaps.map((g) => g.label).join(', ')}.`);
      const tight = intel.sectors.filter((x) => x.pressure && x.pressure > 1).slice(0, 2);
      for (const t of tight) lines.push(`${t.label}: ${t.projects} projects for ${t.investors} investor(s) — capital is scarce here.`);
      return { topic, title: 'Investor coverage', lines, basis };
    }
    case 'corridors': {
      if (!intel.corridors.length) return { topic, title: 'Target markets', lines: none('export or market data'), basis };
      return { topic, title: 'Target markets', basis,
        lines: intel.corridors.slice(0, 5).map((c) => `${c.label}: targeted by ${c.projects} project(s), mentioned in ${c.posts} post(s), ${c.investors} investor(s) with a footprint there.`) };
    }
    case 'opportunities': {
      const rows = intel.opportunities.slice(0, 5);
      if (!rows.length) return { topic, title: 'Opportunity pipeline', lines: none('published projects'), basis };
      return { topic, title: 'Opportunity pipeline', basis,
        lines: rows.map((o) => `${o.title} — ${fmtAmount(o.amount)}, ${o.sector}${o.bestInvestor ? `; best fit ${o.bestInvestor.name} (${o.bestInvestor.score}%)` : ''}${o.interests ? `; ${o.interests} interest(s)` : ''}.`) };
    }
    case 'priorities': {
      const brief = buildExecutiveBrief(intel);
      return { topic, title: 'Recommended actions', lines: brief.actions, basis };
    }
    case 'members': {
      const lines = [`${k.members} members: ${k.innovators} innovators, ${k.investorsMembers} investors; ${k.newMembers30d} joined in the last 30 days.`,
        `${k.circles} circles (${k.institutionalCircles} institutional), ${k.posts} posts (${k.posts30d} in the last 30 days), ${k.eventRegistrations} event registrations.`];
      return { topic, title: 'Community', lines, basis };
    }
    default: {
      const brief = buildExecutiveBrief(intel);
      return { topic: 'overview', title: 'Platform overview', lines: brief.situation, basis };
    }
  }
}

function trim(text, max = 90) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
