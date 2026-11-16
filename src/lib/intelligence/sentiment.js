/**
 * Investraders sentiment engine.
 *
 * A deterministic, dependency-free analyser tuned for short business posts written
 * in English, French, Arabic and Tunisian derja (Arabic or Latin script). It runs
 * entirely in the browser, so every post, comment and circle answer can be scored
 * without sending text to a third party.
 *
 * The output is honest about its own certainty: `confidence` grows with the number
 * of sentiment-bearing words actually found, and a text with no cues is reported
 * as neutral with low confidence instead of an invented percentage.
 */

// ── Lexicon ─────────────────────────────────────────────────────────────────
// Weights run from -3 (strongly negative) to +3 (strongly positive). Latin
// entries are stored without accents because tokens are accent-folded first.

const POSITIVE = {
  // English
  good: 1.5, great: 2, excellent: 2.5, amazing: 2.5, awesome: 2.5, love: 2, loved: 2, best: 2,
  happy: 2, glad: 1.5, proud: 2, excited: 2, thrilled: 2.5, delighted: 2.5, grateful: 2, thanks: 1.5, thank: 1.5,
  success: 2, successful: 2, win: 2, won: 2, winning: 2, achieve: 1.5, achieved: 2, achievement: 2, milestone: 1.5,
  growth: 1.5, growing: 1.5, grow: 1, grew: 1.5, profit: 1.5, profitable: 2, gain: 1.5, gains: 1.5, boost: 1.5,
  opportunity: 1.5, opportunities: 1.5, promising: 2, strong: 1.5, solid: 1.5, robust: 1.5, healthy: 1.5,
  improve: 1.5, improved: 1.5, improvement: 1.5, improving: 1.5, progress: 1.5, breakthrough: 2.5, innovative: 1.5,
  innovation: 1.5, launch: 1, launched: 1.5, launching: 1, expand: 1, expanding: 1.5, expansion: 1, record: 1,
  partnership: 1, partner: 0.5, signed: 1.5, secured: 2, funded: 2, raised: 1.5, approved: 1.5, certified: 1.5,
  award: 2, awarded: 2, congratulations: 2.5, congrats: 2.5, welcome: 1, recommend: 1.5, recommended: 1.5,
  efficient: 1.5, reliable: 1.5, fast: 1, easy: 1, smooth: 1.5, perfect: 2.5, impressive: 2, outstanding: 2.5,
  optimistic: 2, confident: 1.5, positive: 1.5, benefit: 1.5, benefits: 1.5, support: 1, supported: 1,
  // French
  bon: 1.5, bonne: 1.5, bons: 1.5, bonnes: 1.5, bien: 1, excellente: 2.5, super: 2, superbe: 2.5,
  genial: 2.5, geniale: 2.5, magnifique: 2.5, formidable: 2.5, parfait: 2.5, parfaite: 2.5, bravo: 2.5,
  felicitations: 2.5, merci: 1.5, heureux: 2, heureuse: 2, fier: 2, fiere: 2, ravi: 2, ravie: 2, content: 1.5,
  contente: 1.5, adore: 2.5, aime: 1.5, reussite: 2, reussi: 2, succes: 2, croissance: 1.5, hausse: 1,
  progression: 1.5, progres: 1.5, benefice: 1.5, rentable: 2, opportunite: 1.5, opportunites: 1.5,
  prometteur: 2, prometteuse: 2, solide: 1.5, fort: 1, forte: 1, ameliore: 1.5, amelioration: 1.5,
  innovant: 1.5, innovante: 1.5, lancement: 1, lance: 1, partenariat: 1, signe: 1.5, signature: 1,
  leve: 1, obtenu: 1.5, valide: 1, certifie: 1.5, laureat: 2.5,
  laureate: 2.5, gagne: 2, bienvenue: 1, recommande: 1.5, efficace: 1.5, fiable: 1.5, rapide: 1, facile: 1,
  impressionnant: 2, optimiste: 2, confiant: 1.5, positif: 1.5, avantage: 1.5, soutien: 1,
  dynamique: 1.5, essor: 2, performant: 1.5, performante: 1.5, encourageant: 2, qualite: 1,
  // Tunisian derja (Latin script)
  behi: 1.5, bahi: 1.5, behya: 1.5, mrigel: 2, mezyen: 2, mezyena: 2, mezian: 2, mabrouk: 2.5, mabrook: 2.5,
  yaatik: 1, saha: 1, sahit: 1.5, aychek: 1.5, '3aychek': 1.5, barakallah: 2, hayel: 2.5, haylin: 2.5, tayara: 2.5,
  nhebek: 2, nheb: 1.5, top: 2, tbarkallah: 2, mcharaf: 2, mosharaf: 2,
  // Arabic (normalised)
  'جيد': 1.5, 'جيده': 1.5, 'ممتاز': 2.5, 'ممتازه': 2.5, 'رائع': 2.5, 'رائعه': 2.5, 'عظيم': 2.5, 'جميل': 2,
  'نجاح': 2, 'ناجح': 2, 'ناجحه': 2, 'نمو': 1.5, 'ارباح': 1.5, 'ربح': 1.5, 'فرصه': 1.5, 'فرص': 1.5, 'تطور': 1.5,
  'تقدم': 1.5, 'ابتكار': 1.5, 'شراكه': 1, 'شكرا': 1.5, 'مبروك': 2.5, 'تهانينا': 2.5, 'فخور': 2, 'سعيد': 2,
  'سعداء': 2, 'يسعدنا': 2, 'نفتخر': 2, 'افضل': 2, 'قوي': 1.5, 'قويه': 1.5, 'مشرف': 2, 'ايجابي': 1.5,
  'تحسن': 1.5, 'انجاز': 2, 'توقيع': 1, 'تمويل': 0.5, 'دعم': 1, 'ترحيب': 1, 'واعد': 2, 'واعده': 2,
  'باهي': 1.5, 'باهيه': 1.5, 'مزيان': 2, 'مزيانه': 2, 'برافو': 2.5, 'يعطيك': 1, 'الصحه': 1, 'هايل': 2.5,
  'تبارك': 2, 'ماشاء': 2, 'نحب': 1.5, 'طياره': 2.5,
};

const NEGATIVE = {
  // English
  bad: -1.5, worse: -2, worst: -2.5, terrible: -2.5, awful: -2.5, horrible: -2.5, poor: -1.5, hate: -2.5,
  dislike: -1.5, angry: -2, upset: -1.5, disappointed: -2, disappointing: -2, frustrated: -2, frustrating: -2,
  fail: -2, failed: -2, failure: -2, failing: -2, loss: -1.5, losses: -1.5, lose: -1.5, lost: -1.5, decline: -1.5,
  declining: -1.5, drop: -1, dropped: -1.5, fall: -1, fell: -1.5, crisis: -2.5, recession: -2.5, bankrupt: -3,
  bankruptcy: -3, debt: -1, debts: -1, deficit: -1.5, shortage: -2, shortages: -2, scarcity: -2, delay: -1.5,
  delays: -1.5, delayed: -1.5, slow: -1, stuck: -1.5, blocked: -2, block: -1, barrier: -1.5,
  barriers: -1.5, obstacle: -1.5, obstacles: -1.5, problem: -1.5, problems: -1.5, issue: -1, issues: -1,
  risk: -1, risks: -1, risky: -1.5, threat: -1.5, concern: -1, concerns: -1, worried: -1.5, worry: -1.5,
  difficult: -1.5, difficulty: -1.5, difficulties: -1.5, expensive: -1.5, costly: -1.5, inflation: -1.5,
  corruption: -2.5, fraud: -3, scam: -3, fake: -2, unfair: -2, complaint: -1.5, complaints: -1.5, rejected: -2,
  refused: -2, denied: -2, cancelled: -1.5, canceled: -1.5, closed: -1, closure: -1.5, layoff: -2.5, layoffs: -2.5,
  unemployment: -2, bureaucracy: -2, unreliable: -2, broken: -2, waste: -2, useless: -2.5, weak: -1.5,
  unstable: -1.5, uncertainty: -1.5, uncertain: -1.5, pressure: -1, struggling: -2, struggle: -1.5, pessimistic: -2,
  negative: -1.5, penalty: -1.5, penalties: -1.5, lack: -1.5, lacking: -1.5, insufficient: -1.5, impossible: -2,
  // French
  mauvais: -1.5, mauvaise: -1.5, pire: -2.5, nul: -2.5, nulle: -2.5, catastrophe: -3,
  catastrophique: -3, decu: -2, decue: -2, decevant: -2, deception: -2, colere: -2, frustre: -2, deteste: -2.5,
  echec: -2, echoue: -2, perte: -1.5, pertes: -1.5, baisse: -1, chute: -1.5, recul: -1.5, crise: -2.5,
  faillite: -3, dette: -1, dettes: -1, penurie: -2, manque: -1.5, retard: -1.5, retards: -1.5, lent: -1,
  lente: -1, lenteur: -1.5, bloque: -2, blocage: -2, blocages: -2, probleme: -1.5,
  problemes: -1.5, risque: -1, risques: -1, menace: -1.5, inquietude: -1.5, inquiet: -1.5, inquiete: -1.5,
  difficile: -1.5, difficulte: -1.5, difficultes: -1.5, couteux: -1.5,
  fraude: -3, arnaque: -3, injuste: -2, plainte: -1.5, refuse: -2, rejete: -2, annule: -1.5,
  fermeture: -1.5, licenciement: -2.5, licenciements: -2.5, chomage: -2, bureaucratie: -2, casse: -2,
  gaspillage: -2, inutile: -2.5, faible: -1.5, instable: -1.5, incertitude: -1.5, pression: -1, galere: -2,
  pessimiste: -2, negatif: -1.5, penalite: -1.5, penalites: -1.5, insuffisant: -1.5, insuffisante: -1.5,
  surcout: -1.5, surcouts: -1.5, greve: -2, greves: -2,
  // Tunisian derja (Latin script)
  khayeb: -2, khayba: -2, mochkla: -1.5, mochkel: -1.5, mchekel: -1.5, machakel: -1.5, ghali: -1.5,
  ghalia: -1.5, 't3ab': -1.5, taab: -1.5, karitha: -3, fased: -2.5, fasad: -2.5, 'm3atel': -2, maatel: -2, 's3ib': -1.5,
  // Arabic (normalised)
  'سيء': -1.5, 'سيئ': -1.5, 'سيئه': -1.5, 'اسوا': -2.5, 'فشل': -2, 'فاشل': -2, 'خساره': -1.5, 'خسائر': -1.5,
  'انخفاض': -1.5, 'تراجع': -1.5, 'ازمه': -2.5, 'افلاس': -3, 'ديون': -1, 'نقص': -1.5, 'تاخير': -1.5,
  'تاخر': -1.5, 'بطء': -1, 'مشكله': -1.5, 'مشكل': -1.5, 'مشاكل': -1.5, 'خطر': -1, 'مخاطر': -1, 'تهديد': -1.5,
  'قلق': -1.5, 'صعب': -1.5, 'صعبه': -1.5, 'صعوبات': -1.5, 'غالي': -1.5, 'غلاء': -2, 'تضخم': -1.5, 'فساد': -2.5,
  'احتيال': -3, 'ظلم': -2, 'شكوى': -1.5, 'رفض': -2, 'الغاء': -1.5, 'اغلاق': -1.5, 'بطاله': -2,
  'بيروقراطيه': -2, 'ضعيف': -1.5, 'ضعف': -1.5, 'عراقيل': -2, 'تعطيل': -2, 'معطل': -2, 'خايب': -2, 'خايبه': -2,
  'كارثه': -3, 'ضغط': -1, 'عجز': -1.5, 'صعوبه': -1.5, 'للاسف': -1.5, 'مؤسف': -1.5,
};



// Multi-word expressions are matched on the normalised text before tokenising.
const PHRASES = [
  ['thank you', 1.5], ['well done', 2], ['good news', 2], ['great news', 2.5], ['looking forward', 1.5],
  ['sold out', 1.5], ['game changer', 2], ['not good', -2], ['no longer', -1], ['out of stock', -1.5],
  ['bonne nouvelle', 2], ['tres bien', 2], ['en hausse', 1], ['en croissance', 1.5], ['tour de table boucle', 2],
  ['en baisse', -1.5], ['en retard', -1.5], ['en difficulte', -2], ['pas assez', -1.5], ['trop cher', -2],
  ['trop lent', -2], ['hausse des prix', -2], ['manque de', -1.5], ['fin de droits', -1],
  ['ma3andich', -1], ['mouch behi', -2], ['mch behi', -2], ['barcha mchekel', -2.5],
  ['الحمد لله', 2], ['ما شاء الله', 2], ['بارك الله', 2], ['غير مقبول', -2], ['مش باهي', -2], ['موش باهي', -2],
];

const NEGATORS = new Set([
  'not', 'no', 'never', 'without', 'cannot', 'cant', 'dont', 'doesnt', 'didnt', 'isnt', 'arent', 'wasnt', 'wont', 'nothing',
  'pas', 'ne', 'ni', 'jamais', 'sans', 'aucun', 'aucune',
  'mouch', 'mch', 'mich',
  'لا', 'ليس', 'ليست', 'لم', 'لن', 'ما', 'مش', 'موش', 'بدون', 'غير',
]);

const INTENSIFIERS = {
  very: 1.5, really: 1.4, extremely: 1.8, highly: 1.5, so: 1.3, totally: 1.5, absolutely: 1.7, incredibly: 1.8,
  tres: 1.5, trop: 1.5, vraiment: 1.4, extremement: 1.8, tellement: 1.5, hyper: 1.6, fortement: 1.5,
  barcha: 1.5, yesser: 1.5,
  'جدا': 1.5, 'كثيرا': 1.4, 'برشا': 1.5, 'ياسر': 1.5, 'للغايه': 1.7,
  slightly: 0.6, somewhat: 0.7, bit: 0.7, peu: 0.6, legerement: 0.6, 'قليلا': 0.6, 'شويه': 0.6,
};

const EMOJI = {
  '👍': 1.5, '👏': 2, '🎉': 2, '🚀': 1.5, '❤️': 2, '❤': 2, '😍': 2.5, '😀': 1.5, '😃': 1.5, '😊': 1.5, '🙂': 1,
  '💪': 1.5, '🔥': 1.5, '✅': 1, '🏆': 2, '🙏': 1, '⭐': 1.5, '🌟': 1.5, '💯': 2, '🤝': 1.5, '📈': 1.5,
  '👎': -1.5, '😡': -2.5, '😠': -2, '😢': -1.5, '😭': -2, '😞': -1.5, '😕': -1, '💔': -2, '⚠️': -1, '⚠': -1,
  '❌': -1.5, '🚫': -1.5, '📉': -1.5, '😤': -1.5, '🤦': -1.5,
};

// Concern areas used by the command centers to explain *what* a negative post is about.
export const CONCERN_TOPICS = [
  { id: 'financing', label: 'Access to financing', labelFr: 'Accès au financement',
    cues: ['credit', 'loan', 'bank', 'banque', 'financement', 'financing', 'funding', 'liquidity', 'liquidite', 'tresorerie', 'cash', 'interest rate', 'taux', 'garantie', 'collateral', 'تمويل', 'قرض', 'بنك', 'سيوله'] },
  { id: 'costs', label: 'Costs & inflation', labelFr: 'Coûts & inflation',
    cues: ['inflation', 'cost', 'costs', 'cout', 'couts', 'price', 'prices', 'prix', 'expensive', 'cher', 'tarif', 'tarifs', 'energy', 'energie', 'electricite', 'gas', 'gaz', 'loyer', 'rent', 'غلاء', 'تضخم', 'اسعار', 'ghali'] },
  { id: 'logistics', label: 'Logistics & customs', labelFr: 'Logistique & douane',
    cues: ['port', 'customs', 'douane', 'logistics', 'logistique', 'shipping', 'freight', 'fret', 'container', 'conteneur', 'transport', 'delivery', 'livraison', 'rades', 'dwell', 'ديوانه', 'جمارك', 'ميناء', 'شحن'] },
  { id: 'regulation', label: 'Regulation & administration', labelFr: 'Réglementation & administration',
    cues: ['regulation', 'reglementation', 'law', 'loi', 'tax', 'taxe', 'taxes', 'impot', 'fiscal', 'fiscalite', 'permit', 'autorisation', 'licence', 'administration', 'bureaucracy', 'bureaucratie', 'procedure', 'procedures', 'paperasse', 'قانون', 'ضرائب', 'اداره', 'ترخيص'] },
  { id: 'talent', label: 'Talent & workforce', labelFr: 'Talents & emploi',
    cues: ['talent', 'talents', 'hiring', 'recruit', 'recrutement', 'recruter', 'skills', 'competences', 'brain drain', 'fuite des cerveaux', 'salary', 'salaire', 'salaires', 'workforce', 'main d oeuvre', 'employes', 'كفاءات', 'توظيف', 'اجور'] },
  { id: 'demand', label: 'Market demand', labelFr: 'Demande & marché',
    cues: ['demand', 'demande', 'sales', 'ventes', 'purchasing power', 'pouvoir d achat', 'competition', 'concurrence', 'informal', 'informel', 'طلب', 'مبيعات', 'سوق', 'منافسه'] },
  { id: 'currency', label: 'Currency & payments', labelFr: 'Devises & paiements',
    cues: ['currency', 'devise', 'devises', 'dinar', 'exchange', 'fx', 'payment', 'paiement', 'paiements', 'unpaid', 'impaye', 'impayes', 'transfer', 'transfert', 'عمله', 'دينار', 'دفع'] },
  { id: 'infrastructure', label: 'Infrastructure & utilities', labelFr: 'Infrastructures',
    cues: ['water', 'eau', 'internet', 'network', 'reseau', 'road', 'route', 'routes', 'infrastructure', 'infrastructures', 'power cut', 'coupure', 'steg', 'sonede', 'ماء', 'كهرباء', 'طرقات'] },
];

// ── Normalisation ───────────────────────────────────────────────────────────

const ARABIC_RE = /[؀-ۿ]/;
const ARABIC_DIACRITICS_RE = /[ً-ٰٟـ]/g;

/** Lower-case, strip Latin accents and Arabic diacritics, unify Arabic letter variants. */
export function normaliseText(input = '') {
  return String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(ARABIC_DIACRITICS_RE, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[’`´]/g, "'");
}

export function tokenise(normalised = '') {
  return normalised
    .replace(/'/g, ' ')
    .split(/[^a-z0-9ء-ي٠-٩]+/)
    .filter(Boolean);
}

export function detectScript(text = '') {
  if (ARABIC_RE.test(text)) return 'ar';
  const n = normaliseText(text);
  if (/\b(le|la|les|des|une|est|pour|avec|nous|notre|dans|sur|pas|tres)\b/.test(n)) return 'fr';
  return 'en';
}

// The lexicon is keyed by normalised form so that composed and decomposed Unicode
// spellings (and Arabic hamza variants) all resolve to the same entry.
const LEXICON = {};
for (const [term, weight] of Object.entries({ ...POSITIVE, ...NEGATIVE })) LEXICON[normaliseText(term)] = weight;

const ARABIC_PREFIXES = ['وبال', 'وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ل', 'ف'];
const LATIN_SUFFIXES = ['es', 's', 'x', 'e'];

/** Look a token up, falling back to a light stem (Arabic article/conjunction, Latin plural/feminine). */
function lexiconWeight(token) {
  if (LEXICON[token] !== undefined) return LEXICON[token];
  if (ARABIC_RE.test(token)) {
    for (const prefix of ARABIC_PREFIXES) {
      if (token.length - prefix.length >= 3 && token.startsWith(prefix)) {
        const stem = token.slice(prefix.length);
        if (LEXICON[stem] !== undefined) return LEXICON[stem];
      }
    }
    return undefined;
  }
  for (const suffix of LATIN_SUFFIXES) {
    if (token.length - suffix.length >= 4 && token.endsWith(suffix)) {
      const stem = token.slice(0, -suffix.length);
      if (LEXICON[stem] !== undefined) return LEXICON[stem];
    }
  }
  return undefined;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

const POSITIVE_THRESHOLD = 0.15;
const NEGATIVE_THRESHOLD = -0.15;

/**
 * Analyse the sentiment of a piece of text.
 * @param {string} text
 * @returns {{ label: 'positive'|'neutral'|'negative', score: number, confidence: number,
 *            hits: number, positives: string[], negatives: string[], language: string }}
 */
export function analyzeSentiment(text = '') {
  const raw = String(text || '');
  const normalised = normaliseText(raw);
  const empty = { label: 'neutral', score: 0, confidence: 0, hits: 0, positives: [], negatives: [], language: detectScript(raw) };
  if (!normalised.trim()) return empty;

  let total = 0;
  let hits = 0;
  const positives = [];
  const negatives = [];
  const record = (term, value) => {
    total += value;
    hits += 1;
    (value > 0 ? positives : negatives).push(term);
  };

  // 1. Multi-word expressions (removed from the working text so they are not double counted).
  let working = ` ${normalised} `;
  for (const [phrase, weight] of PHRASES) {
    const needle = normaliseText(phrase);
    let idx = working.indexOf(needle);
    while (idx !== -1) {
      record(phrase, weight);
      working = `${working.slice(0, idx)} ${' '.repeat(needle.length)} ${working.slice(idx + needle.length)}`;
      idx = working.indexOf(needle, idx + needle.length);
    }
  }

  // 2. Single words with negation and intensity handling.
  const tokens = tokenise(working);
  let negationWindow = 0;
  let pendingIntensity = 1;
  for (const token of tokens) {
    if (NEGATORS.has(token)) {
      negationWindow = 3;
      continue;
    }
    if (INTENSIFIERS[token]) {
      pendingIntensity = INTENSIFIERS[token];
      continue;
    }
    const weight = lexiconWeight(token);
    if (weight !== undefined) {
      let value = weight * pendingIntensity;
      // A negated word flips and loses some force: "not good" is milder than "bad".
      if (negationWindow > 0) value = -value * 0.75;
      record(negationWindow > 0 ? `not ${token}` : token, value);
      pendingIntensity = 1;
      negationWindow = 0;
    } else if (negationWindow > 0) {
      negationWindow -= 1;
    }
  }

  // 3. Emoji.
  for (const [emoji, weight] of Object.entries(EMOJI)) {
    const count = raw.split(emoji).length - 1;
    for (let i = 0; i < Math.min(count, 3); i += 1) record(emoji, weight);
  }

  // 4. Emphasis: repeated exclamation marks amplify whatever direction was found.
  const exclamations = Math.min((raw.match(/!/g) || []).length, 3);
  if (exclamations && total !== 0) total += Math.sign(total) * exclamations * 0.3;

  if (hits === 0) return empty;

  // VADER-style squashing keeps the score inside [-1, 1].
  const score = total / Math.sqrt(total * total + 15);
  const label = score >= POSITIVE_THRESHOLD ? 'positive' : score <= NEGATIVE_THRESHOLD ? 'negative' : 'neutral';

  // Confidence rises with evidence (number of cues) and with how decisive the score is.
  const evidence = 1 - Math.exp(-hits / 2.5);
  const decisiveness = Math.min(1, Math.abs(score) / 0.6);
  const mixed = positives.length && negatives.length ? 0.8 : 1;
  const confidence = Math.round(Math.min(0.97, (0.35 + 0.65 * decisiveness) * evidence * mixed) * 100) / 100;

  return {
    label,
    score: Math.round(score * 100) / 100,
    confidence,
    hits,
    positives: [...new Set(positives)].slice(0, 6),
    negatives: [...new Set(negatives)].slice(0, 6),
    language: detectScript(raw),
  };
}

/** Which concern areas a text touches. Returns topic ids ordered by number of cues found. */
export function detectConcernTopics(text = '') {
  const normalised = ` ${normaliseText(text).replace(/'/g, ' ')} `;
  const found = [];
  for (const topic of CONCERN_TOPICS) {
    let count = 0;
    for (const cue of topic.cues) {
      const needle = normaliseText(cue);
      // Latin cues must match on word boundaries; Arabic cues may carry prefixes (ال, و, ب).
      const matched = ARABIC_RE.test(needle)
        ? normalised.includes(needle)
        : new RegExp(`[^a-z0-9]${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(normalised);
      if (matched) count += 1;
    }
    if (count) found.push({ id: topic.id, count });
  }
  return found.sort((a, b) => b.count - a.count).map((t) => t.id);
}

/**
 * Summarise the sentiment of many texts.
 * @param {Array<string|{text: string}>} items
 */
export function summariseSentiment(items = []) {
  const summary = { total: 0, positive: 0, neutral: 0, negative: 0, scored: 0, average: 0, index: 50 };
  let sum = 0;
  for (const item of items) {
    const text = typeof item === 'string' ? item : item?.text;
    if (!text || !String(text).trim()) continue;
    const result = typeof item === 'object' && item.sentiment ? item.sentiment : analyzeSentiment(text);
    summary.total += 1;
    summary[result.label] += 1;
    if (result.hits > 0) {
      summary.scored += 1;
      sum += result.score;
    }
  }
  if (summary.scored > 0) {
    summary.average = Math.round((sum / summary.scored) * 100) / 100;
    // 0–100 index where 50 is neutral; easier to read on a dashboard than a signed float.
    summary.index = Math.round(50 + summary.average * 50);
  }
  return summary;
}

export const SENTIMENT_META = {
  positive: { label: 'Positive', labelFr: 'Positif', tone: 'emerald' },
  neutral: { label: 'Neutral', labelFr: 'Neutre', tone: 'slate' },
  negative: { label: 'Negative', labelFr: 'Négatif', tone: 'rose' },
};
