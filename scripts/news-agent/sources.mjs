// Sources the Investraders agent reads. The agent publishes OPPORTUNITIES that
// innovators, startups, SMEs and investors can act on: calls for applications,
// grants, accelerator and support programmes, competitions and prizes, pitch and
// investment events. Each source was checked to publish a working feed or news
// page on 2026-11-20.
//
//   kind: 'rss'  — RSS or Atom feed
//   kind: 'html' — news listing page; article links are matched with linkPattern and
//                  each article page is opened to read its date, summary and image.
//   maxAgeDays   — how old the announcement may be (the call's own deadline is checked separately).
//   weight       — preference when choosing: opportunity specialists rank first.
//   tunisian     — Tunisian source.

const year = new Date().getUTCFullYear();

export const SOURCES = [
  // Opportunity specialists (calls, grants, competitions, programmes)
  { id: 'ofa-calls', name: 'Opportunities for Africans', kind: 'rss', url: 'https://www.opportunitiesforafricans.com/category/call-for-applications/feed/', maxAgeDays: 14, weight: 3 },
  { id: 'ofa-contests', name: 'Opportunities for Africans', kind: 'rss', url: 'https://www.opportunitiesforafricans.com/category/contests/feed/', maxAgeDays: 14, weight: 3 },
  { id: 'ofa', name: 'Opportunities for Africans', kind: 'rss', url: 'https://www.opportunitiesforafricans.com/feed/', maxAgeDays: 10, weight: 2 },
  { id: 'od-grants', name: 'Opportunity Desk', kind: 'rss', url: 'https://opportunitydesk.org/category/awards-and-grants/feed/', maxAgeDays: 14, weight: 2 },
  { id: 'od-contests', name: 'Opportunity Desk', kind: 'rss', url: 'https://opportunitydesk.org/category/contests/feed/', maxAgeDays: 14, weight: 2 },
  { id: 'vc4a', name: 'VC4A', kind: 'rss', url: 'https://vc4a.com/programs/feed/', maxAgeDays: 45, weight: 3 },
  { id: 'afrilabs', name: 'AfriLabs', kind: 'rss', url: 'https://www.afrilabs.com/feed/', maxAgeDays: 30, weight: 2 },
  { id: 'flat6labs', name: 'Flat6Labs', kind: 'rss', url: 'https://flat6labs.com/feed/', maxAgeDays: 60, weight: 2 },

  // European Union (Tunisia is associated to Horizon Europe, so EIC calls are open to Tunisian entities)
  { id: 'eic', name: 'European Innovation Council', kind: 'rss', url: 'https://eic.ec.europa.eu/node/2/rss_en', maxAgeDays: 21, weight: 2 },
  { id: 'eu-medbridge', name: 'EU Med Bridge (Union européenne)', kind: 'rss', url: 'https://www.eumedbridge.eu/feed/', maxAgeDays: 30, weight: 2 },

  // Development agencies (programmes for entrepreneurs, e.g. GIZ develoPPP)
  { id: 'giz', name: 'GIZ', kind: 'html', url: 'https://www.giz.de/en/newsroom/news', linkPattern: /^\/en\/newsroom\/news\/[a-z0-9-]+$/, maxAgeDays: 21, weight: 1 },
  { id: 'afd', name: 'AFD — Agence française de développement', kind: 'rss', url: 'https://www.afd.fr/fr/rss.xml', maxAgeDays: 21, weight: 1 },
  { id: 'jica', name: 'JICA', kind: 'html', url: `https://www.jica.go.jp/english/information/press/${year}/index.html`, linkPattern: /^\/english\/information\/press\/\d{4}\/\d{8}_\d+\.html$/, maxAgeDays: 21, weight: 1 },

  // Tunisian official (labelling sessions, investment forums and events)
  { id: 'startup-act', name: 'Startup Act Tunisie', kind: 'html', url: 'https://startup.gov.tn/fr/news', linkPattern: /^https:\/\/startup\.gov\.tn\/fr\/news\/[a-z0-9-]+$/, maxAgeDays: 45, weight: 3, tunisian: true },
  { id: 'fipa', name: 'FIPA — Invest in Tunisia', kind: 'rss', url: 'https://investintunisia.tn/feed/', maxAgeDays: 21, weight: 2, tunisian: true },

  // MENA startup media (sometimes announces open calls)
  { id: 'wamda', name: 'Wamda', kind: 'rss', url: 'https://www.wamda.com/feed', maxAgeDays: 7, weight: 1 },
];

// Signs that an item is something people can APPLY to, ENTER or ATTEND (accents stripped).
export const OPPORTUNITY_KEYWORDS = [
  'call for application', 'call for proposal', 'applications open', 'apply', 'application', 'deadline', 'nomination',
  'appel a candidature', 'appel a projet', 'appel a proposition', 'candidature', 'postuler', 'inscription', 'date limite',
  'grant', 'subvention', 'funding opportunit', 'financement', 'fund', 'prize', 'prix', 'award', 'competition', 'concours',
  'challenge', 'hackathon', 'accelerator', 'acceleration', 'accelerateur', 'incubat', 'bootcamp', 'cohort', 'cohorte',
  'programme', 'program', 'fellowship', 'pitch', 'demo day', 'showcase', 'investment forum', 'investor', 'summit', 'forum',
  'label', 'labellisation', 'startup', 'start-up', 'entrepreneur', 'innovat', 'sme', 'pme', 'venture',
];

// Items aimed at students, job seekers or academics, not founders or investors.
export const EXCLUDE_KEYWORDS = [
  'scholarship', 'bourse d\'etude', 'internship', 'stage ', 'masters', 'master\'s', 'phd', 'doctoral', 'postdoc', 'post-doc',
  'undergraduate', 'thesis', 'job ', 'jobs', 'vacancy', 'vacancies', 'recrutement', 'recruitment', 'hiring', 'consultancy',
  'consultant', 'focal person', 'study in', 'tuition',
];

// Eligibility that includes Tunisian applicants.
export const REGION_KEYWORDS = ['tunisi', 'tunis', 'maghreb', 'north africa', 'afrique du nord', 'mena', 'middle east', 'mediterran', 'arab', 'africa', 'afrique', 'african', 'worldwide', 'global', 'international', 'all countries', 'developing countries', 'emerging markets'];
