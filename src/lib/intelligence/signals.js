/**
 * Economic signal extraction.
 *
 * Reads a post (or any short business text) and works out what the author is
 * actually asking the market for: the intent, the sector, the trade corridor and
 * any amounts mentioned. Confidence is computed from the evidence found — a post
 * with no cues produces `hasSignal: false` rather than a made-up percentage.
 */

import { analyzeSentiment, normaliseText } from './sentiment.js';

export const SECTORS = [
  { id: 'sec_tech', label: 'Technology & AI', projectType: 'TECH',
    cues: ['software', 'logiciel', 'saas', 'fintech', 'ai', 'ia', 'tech', 'startup', 'start-up', 'digital', 'numerique', 'cloud', 'cyber', 'data', 'app', 'application', 'plateforme', 'platform', 'e-commerce', 'ecommerce', 'blockchain', 'iot', 'robot', 'developpeur', 'developer', 'تكنولوجيا', 'رقمي', 'برمجيات', 'ذكاء'] },
  { id: 'sec_agri', label: 'Agri-Food & Smart Farming', projectType: 'AGRI_FOOD',
    cues: ['agri', 'agricole', 'agriculture', 'agriculteur', 'farm', 'farming', 'ferme', 'food', 'agroalimentaire', 'agro', 'olive', 'huile', 'dattes', 'dates', 'harissa', 'terroir', 'bio', 'organic', 'peche', 'fishery', 'conserve', 'fruits', 'legumes', 'فلاحه', 'زراعه', 'زيت', 'تمور', 'غذائي'] },
  { id: 'sec_energy', label: 'Renewable Solar & Green Energy', projectType: 'RENEWABLE_ENERGY',
    cues: ['solar', 'solaire', 'energy', 'energie', 'renewable', 'renouvelable', 'photovoltaique', 'pv', 'wind', 'eolien', 'hydrogen', 'hydrogene', 'cleantech', 'green', 'climat', 'climate', 'carbon', 'carbone', 'طاقه', 'شمسي', 'متجدده'] },
  { id: 'sec_industry', label: 'Advanced Manufacturing & Automotive', projectType: 'INDUSTRIAL',
    cues: ['factory', 'usine', 'industrie', 'industry', 'industrial', 'industriel', 'manufacturing', 'manufacture', 'textile', 'confection', 'automobile', 'automotive', 'mecanique', 'cablage', 'plasturgie', 'emballage', 'packaging', 'ceramique', 'ciment', 'صناعه', 'مصنع', 'نسيج'] },
  { id: 'sec_pharma', label: 'Pharma & Biotech', projectType: 'HEALTHCARE',
    cues: ['health', 'sante', 'medical', 'medtech', 'pharma', 'pharmaceutique', 'biotech', 'hopital', 'hospital', 'clinic', 'clinique', 'medicament', 'diagnostic', 'cosmetique', 'cosmetic', 'صحه', 'طبي', 'دواء', 'ادويه'] },
  { id: 'sec_logistics', label: 'Logistics & Trade', projectType: 'SERVICES',
    cues: ['logistics', 'logistique', 'transport', 'shipping', 'freight', 'fret', 'supply chain', 'warehouse', 'entrepot', 'import', 'export', 'trading', 'negoce', 'distribution', 'distributeur', 'distributor', 'douane', 'customs', 'تصدير', 'توريد', 'نقل', 'لوجستيك', 'تجاره'] },
  { id: 'sec_tourism', label: 'Eco-Tourism & Real Estate', projectType: 'TOURISM',
    cues: ['tourism', 'tourisme', 'hotel', 'hotellerie', 'resort', 'travel', 'voyage', 'real estate', 'immobilier', 'property', 'lodge', 'restaurant', 'hospitality', 'promotion immobiliere', 'سياحه', 'فندق', 'عقار', 'عقارات'] },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

export const INTENTS = [
  { id: 'INVESTMENT', label: 'Capital seeking', labelFr: 'Recherche de financement',
    cues: ['tour de table', 'levee de fonds', 'lever des fonds', 'fundraising', 'raising', 'raise', 'seed round', 'series a', 'investor', 'investors', 'investisseur', 'investisseurs', 'investment', 'investissement', 'financement', 'funding', 'capital', 'equity', 'business angel', 'vc', 'تمويل', 'مستثمر', 'مستثمرين', 'استثمار', 'راس مال'] },
  { id: 'PARTNERSHIP', label: 'Partnership seeking', labelFr: 'Recherche de partenariat',
    cues: ['partenariat', 'partnership', 'partner', 'partenaire', 'partenaires', 'cooperation', 'collaboration', 'collaborer', 'joint venture', 'jv', 'co-founder', 'cofondateur', 'associe', 'alliance', 'شراكه', 'شريك', 'تعاون'] },
  { id: 'EXPANSION', label: 'International expansion', labelFr: 'Expansion internationale',
    cues: ['export', 'exporter', 'exportation', 'expand', 'expansion', 'international', 'internationalisation', 'new market', 'nouveau marche', 'nouveaux marches', 'distributor', 'distributeur', 'importer', 'importateur', 'franchise', 'تصدير', 'توسع', 'اسواق'] },
  { id: 'NEED', label: 'Sourcing / request', labelFr: 'Besoin / demande',
    cues: ['looking for', 'seeking', 'need', 'needs', 'recherche', 'cherche', 'cherchons', 'recherchons', 'besoin', 'appel d offres', 'tender', 'rfq', 'rfp', 'supplier', 'fournisseur', 'fournisseurs', 'prestataire', 'نبحث', 'مطلوب', 'نحتاج', 'مزود'] },
  { id: 'OPPORTUNITY', label: 'Business opportunity', labelFr: 'Opportunité d’affaires',
    cues: ['opportunity', 'opportunite', 'opportunites', 'offer', 'offre', 'a vendre', 'for sale', 'cession', 'deal', 'available', 'disponible', 'call for', 'appel a candidatures', 'appel a projets', 'فرصه', 'فرص', 'عرض'] },
  { id: 'PRODUCT', label: 'Product launch', labelFr: 'Lancement produit',
    cues: ['launch', 'lancement', 'new product', 'nouveau produit', 'nouvelle gamme', 'release', 'now available', 'introducing', 'decouvrez', 'منتج جديد', 'اطلاق'] },
  { id: 'INSIGHT', label: 'Market intelligence', labelFr: 'Veille & analyse',
    cues: ['analysis', 'analyse', 'report', 'rapport', 'study', 'etude', 'trend', 'tendance', 'tendances', 'forecast', 'prevision', 'statistics', 'statistiques', 'insight', 'perspective', 'outlook', 'تحليل', 'تقرير', 'دراسه'] },
  { id: 'CHALLENGE', label: 'Market challenge', labelFr: 'Difficulté signalée',
    cues: ['challenge', 'probleme', 'problem', 'difficulty', 'difficulte', 'obstacle', 'blocage', 'crise', 'crisis', 'shortage', 'penurie', 'delay', 'retard', 'مشكله', 'صعوبات', 'ازمه'] },
];

export const INTENT_BY_ID = Object.fromEntries(INTENTS.map((i) => [i.id, i]));

export const CORRIDORS = [
  { id: 'eu', label: 'European Union', region: 'Europe',
    cues: ['europe', 'european', 'europeen', 'europeenne', 'union europeenne', 'eu', 'ue', 'france', 'french', 'germany', 'german', 'allemagne', 'italy', 'italie', 'spain', 'espagne', 'belgium', 'belgique', 'netherlands', 'pays-bas', 'dach', 'paris', 'berlin', 'اوروبا', 'فرنسا', 'المانيا', 'ايطاليا'] },
  { id: 'uk', label: 'United Kingdom', region: 'Europe',
    cues: ['uk', 'united kingdom', 'royaume-uni', 'britain', 'london', 'londres', 'بريطانيا'] },
  { id: 'gcc', label: 'Gulf (GCC)', region: 'GCC',
    cues: ['gcc', 'gulf', 'golfe', 'saudi', 'saoudite', 'ksa', 'riyadh', 'uae', 'emirates', 'emirats', 'dubai', 'abu dhabi', 'qatar', 'doha', 'kuwait', 'koweit', 'oman', 'bahrain', 'السعوديه', 'الامارات', 'قطر', 'الخليج', 'دبي'] },
  { id: 'maghreb', label: 'Maghreb & North Africa', region: 'North Africa',
    cues: ['maghreb', 'north africa', 'afrique du nord', 'algeria', 'algerie', 'morocco', 'maroc', 'libya', 'libye', 'egypt', 'egypte', 'الجزائر', 'المغرب', 'ليبيا', 'مصر'] },
  { id: 'ssa', label: 'Sub-Saharan Africa', region: 'Africa',
    cues: ['africa', 'afrique', 'sub-saharan', 'subsaharienne', 'senegal', 'cote d ivoire', 'ivory coast', 'nigeria', 'kenya', 'cameroun', 'cameroon', 'ghana', 'zlecaf', 'afcfta', 'comesa', 'uemoa', 'افريقيا'] },
  { id: 'americas', label: 'North America', region: 'Americas',
    cues: ['usa', 'united states', 'etats-unis', 'america', 'amerique', 'canada', 'new york', 'امريكا', 'كندا'] },
  { id: 'asia', label: 'Asia', region: 'Asia',
    cues: ['asia', 'asie', 'china', 'chine', 'india', 'inde', 'japan', 'japon', 'turkey', 'turquie', 'korea', 'coree', 'الصين', 'تركيا', 'اسيا'] },
  { id: 'tunisia', label: 'Tunisia (domestic)', region: 'Tunisia',
    cues: ['tunisia', 'tunisie', 'tunis', 'sfax', 'sousse', 'bizerte', 'nabeul', 'monastir', 'gabes', 'kairouan', 'local market', 'marche local', 'national', 'تونس', 'صفاقس', 'سوسه'] },
];

export const CORRIDOR_BY_ID = Object.fromEntries(CORRIDORS.map((c) => [c.id, c]));

const ARABIC_RE = /[؀-ۿ]/;

function countCues(padded, cues) {
  let count = 0;
  const matched = [];
  for (const cue of cues) {
    const needle = normaliseText(cue);
    const hit = ARABIC_RE.test(needle)
      ? padded.includes(needle)
      : new RegExp(`[^a-z0-9]${needle.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}[^a-z0-9]`).test(padded);
    if (hit) {
      count += 1;
      matched.push(cue);
    }
  }
  return { count, matched };
}

function pad(text) {
  return ` ${normaliseText(text).replace(/['’]/g, ' ')} `;
}

function rank(text, catalogue) {
  const padded = pad(text);
  return catalogue
    .map((entry) => ({ ...countCues(padded, entry.cues), entry }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function detectSectors(text = '') {
  return rank(text, SECTORS).map((r) => ({ id: r.entry.id, label: r.entry.label, hits: r.count }));
}

export function detectIntents(text = '') {
  return rank(text, INTENTS).map((r) => ({ id: r.entry.id, label: r.entry.label, hits: r.count }));
}

export function detectCorridors(text = '') {
  return rank(text, CORRIDORS).map((r) => ({ id: r.entry.id, label: r.entry.label, region: r.entry.region, hits: r.count }));
}

const UNIT_MULTIPLIER = {
  k: 1e3, mille: 1e3, thousand: 1e3,
  m: 1e6, mn: 1e6, million: 1e6, millions: 1e6, md: 1e6, mdt: 1e6, mtnd: 1e6,
  b: 1e9, bn: 1e9, billion: 1e9, milliard: 1e9, milliards: 1e9,
};

const CURRENCY_ALIASES = {
  tnd: 'TND', dt: 'TND', dinar: 'TND', dinars: 'TND', mdt: 'TND', mtnd: 'TND',
  eur: 'EUR', euro: 'EUR', euros: 'EUR', '€': 'EUR',
  usd: 'USD', dollar: 'USD', dollars: 'USD', '$': 'USD',
};

/** Pull money amounts such as "2.5M TND", "500k €" or "$1.2 million" out of a text. */
export function extractAmounts(text = '') {
  const source = String(text || '').toLowerCase();
  const amounts = [];
  const pattern = /([$€])?\s?(\d+(?:[.,]\d+)?)\s?(k|mille|thousand|mn|mdt|mtnd|md|millions?|m|bn|billion|milliards?|b)?\s?(tnd|dt|dinars?|eur|euros?|usd|dollars?|€|\$)?/g;
  let match = pattern.exec(source);
  while (match) {
    const [raw, prefix, number, unit, currencyWord] = match;
    const currency = CURRENCY_ALIASES[currencyWord] || CURRENCY_ALIASES[prefix] || (unit === 'mdt' || unit === 'mtnd' ? 'TND' : null);
    // A bare number with neither a currency nor a magnitude is not a money amount.
    if (currency && (unit || Number(number.replace(',', '.')) >= 1000)) {
      const value = Number(number.replace(',', '.')) * (UNIT_MULTIPLIER[unit] || 1);
      if (Number.isFinite(value) && value > 0) amounts.push({ value, currency, raw: raw.trim() });
    }
    match = pattern.exec(source);
  }
  return amounts;
}

/**
 * Extract the economic signal carried by a post.
 * @param {string} content
 * @param {string} category  The intent the author picked when posting (may be 'ANNOUNCEMENT').
 */
export function extractPostSignal(content = '', category = 'ANNOUNCEMENT') {
  const text = String(content || '');
  const sectors = detectSectors(text);
  const intents = detectIntents(text);
  const corridors = detectCorridors(text);
  const amounts = extractAmounts(text);
  const sentiment = analyzeSentiment(text);

  const declared = category && category !== 'ANNOUNCEMENT' && INTENT_BY_ID[category] ? category : null;
  const detected = intents[0] || null;
  const intentId = declared || detected?.id || null;
  const intentMeta = intentId ? INTENT_BY_ID[intentId] : null;

  // Evidence-based confidence: an explicit choice by the author is the strongest cue.
  let confidence = 0;
  if (declared) confidence += 45;
  if (detected) confidence += Math.min(25, 12 + detected.hits * 6);
  if (declared && detected && declared === detected.id) confidence += 8;
  if (sectors[0]) confidence += Math.min(15, 8 + sectors[0].hits * 3);
  if (corridors[0]) confidence += 7;
  if (amounts.length) confidence += 8;
  confidence = Math.min(97, confidence);

  // An untagged post only counts as a signal when the text shows an intent AND a subject.
  const hasSignal = Boolean(declared) || Boolean(detected && (sectors.length || corridors.length || amounts.length));

  const sector = sectors[0] || null;
  const corridor = corridors.find((c) => c.id !== 'tunisia') || corridors[0] || null;

  return {
    hasSignal,
    intentId,
    intent: intentMeta?.label || 'General update',
    intentDeclared: Boolean(declared),
    sectorId: sector?.id || null,
    sector: sector?.label || null,
    sectors: sectors.map((s) => s.id),
    corridorId: corridor?.id || null,
    targetCountry: corridor?.label || null,
    corridors: corridors.map((c) => c.id),
    amounts,
    sentiment,
    confidenceScore: hasSignal ? confidence : 0,
    confidenceLabel: hasSignal ? `${confidence}% confidence` : '',
    confidence: hasSignal ? `${confidence}% confidence` : '',
  };
}

/** Infer sector ids from free profile text (headline, bio, business type). */
export function inferSectorsFromProfile(profile = {}) {
  const text = [profile.headline, profile.bio, profile.business_type, profile.company, profile.sector].filter(Boolean).join(' ');
  return detectSectors(text).map((s) => s.id);
}
