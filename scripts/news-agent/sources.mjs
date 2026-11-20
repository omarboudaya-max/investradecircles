// Sources the Investraders news agent reads. Each one was checked to publish a
// working feed or news page on 2026-11-20.
//
//   kind: 'rss'  — RSS or Atom feed
//   kind: 'html' — news listing page; article links are matched with linkPattern and
//                  each article page is opened to read its date, summary and image.
//   maxAgeDays   — how old an article may be. Institutional sources publish less often.
//   tunisian     — Tunisian source: preferred when choosing what to post.

const year = new Date().getUTCFullYear();

export const SOURCES = [
  // European Union
  { id: 'eu-intpa', name: 'Commission européenne — Partenariats internationaux', kind: 'rss', url: 'https://international-partnerships.ec.europa.eu/node/2/rss_en', maxAgeDays: 5 },
  { id: 'eu-medbridge', name: 'EU Med Bridge (Union européenne)', kind: 'rss', url: 'https://www.eumedbridge.eu/feed/', maxAgeDays: 21 },

  // United Nations and development agencies
  { id: 'un-news', name: 'ONU Info', kind: 'rss', url: 'https://news.un.org/feed/subscribe/fr/news/topic/economic-development/feed/rss.xml', maxAgeDays: 4 },
  { id: 'afd', name: 'AFD — Agence française de développement', kind: 'rss', url: 'https://www.afd.fr/fr/rss.xml', maxAgeDays: 10 },
  { id: 'giz', name: 'GIZ', kind: 'html', url: 'https://www.giz.de/en/newsroom/news', linkPattern: /^\/en\/newsroom\/news\/[a-z0-9-]+$/, maxAgeDays: 14 },
  { id: 'jica', name: 'JICA', kind: 'html', url: `https://www.jica.go.jp/english/information/press/${year}/index.html`, linkPattern: /^\/english\/information\/press\/\d{4}\/\d{8}_\d+\.html$/, maxAgeDays: 10 },

  // Tunisian official
  { id: 'fipa', name: 'FIPA — Invest in Tunisia', kind: 'rss', url: 'https://investintunisia.tn/feed/', maxAgeDays: 14, tunisian: true },
  { id: 'tia', name: 'Tunisia Investment Authority', kind: 'rss', url: 'https://tia.gov.tn/fr/feed/', maxAgeDays: 21, tunisian: true },
  { id: 'startup-act', name: 'Startup Act Tunisie', kind: 'html', url: 'https://startup.gov.tn/fr/news', linkPattern: /^https:\/\/startup\.gov\.tn\/fr\/news\/[a-z0-9-]+$/, maxAgeDays: 21, tunisian: true },

  // Africa and MENA startups
  { id: 'techcabal', name: 'TechCabal', kind: 'rss', url: 'https://techcabal.com/feed/', maxAgeDays: 3 },
  { id: 'wamda', name: 'Wamda', kind: 'rss', url: 'https://www.wamda.com/feed', maxAgeDays: 3 },
  { id: 'weetracker', name: 'WeeTracker', kind: 'rss', url: 'https://weetracker.com/feed/', maxAgeDays: 3 },

  // Global funding news
  { id: 'techcrunch', name: 'TechCrunch', kind: 'rss', url: 'https://techcrunch.com/category/venture/feed/', maxAgeDays: 2 },
  { id: 'crunchbase', name: 'Crunchbase News', kind: 'rss', url: 'https://news.crunchbase.com/feed/', maxAgeDays: 3 },
];

// Topics the platform cares about (accents are stripped before matching).
export const TOPIC_KEYWORDS = [
  'financement', 'finance', 'fonds', 'fund', 'investissement', 'investi', 'invest', 'capital', 'venture',
  'startup', 'start-up', 'jeune pousse', 'entrepreneur', 'pme', 'sme', 'tpe', 'secteur prive', 'private sector',
  'accelerat', 'incubat', 'accompagnement', 'programme', 'program', 'appel a', 'appel d', 'call for', 'candidature', 'application',
  'subvention', 'grant', 'pret', 'loan', 'credit', 'garantie', 'guarantee', 'microfinance', 'levee', 'raise', 'raised', 'funding',
  'seed', 'series a', 'series b', 'serie a', 'pre-seed', 'bourse', 'prize', 'prix', 'concours', 'competition', 'challenge',
  'innovation', 'fintech', 'impact', 'export', 'partenariat', 'partnership', 'accord de', 'agreement', 'signature', 'mou',
  'emploi des jeunes', 'youth employment', 'global gateway', 'oda loan',
];

export const REGION_KEYWORDS = ['tunisi', 'tunis', 'sfax', 'sousse', 'maghreb', 'afrique du nord', 'north africa', 'mena', 'mediterran'];
