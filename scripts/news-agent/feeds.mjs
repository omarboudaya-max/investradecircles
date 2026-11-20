// Reading sources: RSS/Atom feeds, news listing pages and article pages.
// No dependencies: Node 20's fetch and a few careful regular expressions.

const UA = 'Mozilla/5.0 (compatible; InvestradersNewsAgent/1.0; +https://www.investraders.net)';
const MAX_PAGE_BYTES = 600_000;

// ── Text helpers ────────────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', icirc: 'î', ucirc: 'û', euro: '€' };

export function decodeEntities(text = '') {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export function stripTags(html = '') {
  return decodeEntities(
    html
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<(script|style|noscript|svg|figure|iframe)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

export const normalize = (text = '') => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const cdata = (s = '') => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? cdata(m[1]).trim() : '';
};
const attr = (xml, tagName, attrName, extra = '') => {
  const m = xml.match(new RegExp(`<${tagName}\\b(?=[^>]*${extra})[^>]*\\b${attrName}=["']([^"']+)["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
};

// ── Dates ───────────────────────────────────────────────────────────────────

const TZ = { EET: '+0200', EEST: '+0300', CET: '+0100', CEST: '+0200', WET: '+0000', WEST: '+0100', BST: '+0100', EST: '-0500', EDT: '-0400', PST: '-0800', PDT: '-0700', JST: '+0900' };
const MONTHS = {
  jan: 0, janv: 0, janvier: 0, january: 0, feb: 1, fev: 1, fevr: 1, fevrier: 1, february: 1, mar: 2, mars: 2, march: 2,
  apr: 3, avr: 3, avril: 3, april: 3, may: 4, mai: 4, jun: 5, juin: 5, june: 5, jul: 6, juil: 6, juillet: 6, july: 6,
  aug: 7, aou: 7, aout: 7, august: 7, sep: 8, sept: 8, septembre: 8, september: 8, oct: 9, octobre: 9, october: 9,
  nov: 10, novembre: 10, november: 10, dec: 11, decembre: 11, december: 11,
};

/** A Date from the many formats feeds and pages use, or null. */
export function parseDate(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/\b(EET|EEST|CET|CEST|WET|WEST|BST|EST|EDT|PST|PDT|JST)\b/, (m) => TZ[m]);
  // Date.parse is only trusted for ISO dates and timestamps that carry a time
  // (RFC 822 feeds). For bare dates it guesses US order and local time.
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || /\d{1,2}:\d{2}/.test(s)) {
    const t = Date.parse(s);
    if (Number.isFinite(t)) return new Date(t);
  }
  let m = s.match(/\b(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/); // 2026.11.19
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  m = s.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/); // 19.11.2026 (day first, European)
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 12));
  m = normalize(s).match(/\b(\d{1,2})(?:er)?\s+([a-z]+)\.?\s+(\d{4})\b/); // 7 octobre 2025
  if (m && MONTHS[m[2]] !== undefined) return new Date(Date.UTC(+m[3], MONTHS[m[2]], +m[1], 12));
  m = normalize(s).match(/\b([a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})\b/); // November 19, 2026
  if (m && MONTHS[m[1]] !== undefined) return new Date(Date.UTC(+m[3], MONTHS[m[1]], +m[2], 12));
  return null;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

export async function fetchText(url, { timeout = 15000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'fr,en;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer()).slice(0, MAX_PAGE_BYTES);
  return { text: new TextDecoder('utf-8').decode(buf), finalUrl: res.url || url };
}

/** Absolute URL without tracking parameters (utm_*, fbclid…), so links are clean and dedupe reliably. */
const absolute = (href, base) => {
  try {
    const url = new URL(decodeEntities(href), base);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return '';
  }
};

// ── RSS / Atom ──────────────────────────────────────────────────────────────

export function parseFeed(xml, source) {
  const blocks = xml.split(/<item[\s>]|<entry[\s>]/i).slice(1);
  return blocks.map((block) => {
    const isAtom = !/<\/item>/i.test(block) && /<\/entry>/i.test(block);
    const title = stripTags(tag(block, 'title'));
    let link = isAtom ? (attr(block, 'link', 'href', 'rel=["\']alternate') || attr(block, 'link', 'href')) : stripTags(tag(block, 'link'));
    if (!link) link = stripTags(tag(block, 'guid'));
    const rawDate = tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date');
    const content = tag(block, 'content:encoded') || tag(block, 'content') || '';
    const description = stripTags(tag(block, 'description') || tag(block, 'summary') || content).slice(0, 1200);
    const image = attr(block, 'media:content', 'url') || attr(block, 'media:thumbnail', 'url')
      || attr(block, 'enclosure', 'url', 'type=["\']image') || attr(content || block, 'img', 'src');
    return {
      sourceId: source.id,
      sourceName: source.name,
      tunisian: Boolean(source.tunisian),
      title,
      url: absolute(link, source.url),
      publishedAt: parseDate(rawDate),
      description,
      image: image ? absolute(image, source.url) : '',
    };
  }).filter((item) => item.title && /^https?:\/\//.test(item.url));
}

// ── Article pages ───────────────────────────────────────────────────────────

const meta = (html, key) => {
  const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${key}["']`, 'i');
  return decodeEntities((html.match(re1) || html.match(re2) || [])[1] || '').trim();
};

/** Date, description, preview image and body text of an article page. */
export function readArticle(html, url) {
  const ld = [...html.matchAll(/"datePublished"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  const timeTag = (html.match(/<time[^>]+datetime=["']([^"']+)["']/i) || [])[1];
  const visibleDate = (stripTags(html.slice(0, 200_000)).match(/\b(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2}(?:er)?\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+\d{4})\b/i) || [])[1];
  const publishedAt = parseDate(meta(html, 'article:published_time')) || parseDate(ld[0]) || parseDate(timeTag)
    || parseDate(meta(html, 'og:updated_time')) || parseDate(visibleDate);
  const image = meta(html, 'og:image') || meta(html, 'og:image:url') || meta(html, 'twitter:image') || meta(html, 'twitter:image:src');
  const description = meta(html, 'og:description') || meta(html, 'description');
  const title = meta(html, 'og:title') || stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const main = (html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i) || [html])[0];
  const paragraphs = [...main.matchAll(/<(p|li|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => stripTags(m[2]))
    .filter((p) => p.length > 25 && !/cookie|newsletter|javascript|abonnez|subscribe|all rights reserved|tous droits|share on|partager sur/i.test(p));
  return {
    publishedAt,
    image: image ? absolute(image, url) : '',
    description: stripTags(description).slice(0, 1200),
    title,
    text: [...new Set(paragraphs)].join('\n').slice(0, 7000),
    links: outboundLinks(main, url),
  };
}

const SOCIAL = /(facebook|twitter|x\.com|linkedin|instagram|whatsapp|telegram|t\.me|youtube|youtu\.be|pinterest|tiktok|reddit|mailto:|wa\.me|addtoany|sharethis|google\.com\/(maps|search)|feedburner|wp-login|\/tag\/|\/category\/|\/author\/)/i;

/** Links inside the article that leave the page: candidates for the official application page. */
function outboundLinks(html, pageUrl) {
  let pageHost = '';
  try { pageHost = new URL(pageUrl).hostname.replace(/^www\./, ''); } catch { /* keep empty */ }
  const out = [];
  const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = absolute(m[1], pageUrl);
    if (!/^https?:\/\//.test(href) || SOCIAL.test(href) || seen.has(href)) continue;
    let host = '';
    try { host = new URL(href).hostname.replace(/^www\./, ''); } catch { continue; }
    const text = stripTags(m[2]).slice(0, 80);
    const sameSite = host === pageHost;
    // Same-site links are kept only when the text says they lead to the application.
    if (sameSite && !/apply|application|candidat|postul|register|inscri|official|site officiel|learn more|more info|details|guidelines/i.test(text)) continue;
    seen.add(href);
    out.push({ url: href, text });
    if (out.length >= 15) break;
  }
  return out;
}

// ── Listing pages ───────────────────────────────────────────────────────────

function parseListing(html, source, baseUrl) {
  const seen = new Set();
  const items = [];
  const re = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = decodeEntities(m[1]).trim();
    if (!source.linkPattern.test(href)) continue;
    const url = absolute(href, baseUrl);
    let title = stripTags(m[2]).replace(/^(More|Plus|Lire la suite)\s+/i, '').trim();
    if (title.length < 25 || seen.has(url)) continue;
    seen.add(url);
    const datePrefix = title.match(/^(\d{4}\.\d{2}\.\d{2})\s+/); // JICA: "2026.11.19 Title"
    if (datePrefix) title = title.slice(datePrefix[0].length);
    items.push({
      sourceId: source.id, sourceName: source.name, tunisian: Boolean(source.tunisian),
      title, url, publishedAt: datePrefix ? parseDate(datePrefix[1]) : null, description: '', image: '',
    });
  }
  return items;
}

// ── Collection ──────────────────────────────────────────────────────────────

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  }));
  return out;
}

/** Fetch an article page and fold its date, description, image and text into the item. */
export async function enrich(item) {
  try {
    const { text: html, finalUrl } = await fetchText(item.url);
    const page = readArticle(html, finalUrl);
    return {
      ...item,
      publishedAt: item.publishedAt || page.publishedAt,
      description: item.description || page.description,
      pageImage: page.image,
      text: page.text,
      links: page.links,
      enriched: true,
    };
  } catch (error) {
    return { ...item, enriched: false, enrichError: error.message };
  }
}

/** All items from all sources. Failing sources are reported, never fatal. */
export async function collect(sources, log = console.log) {
  const perSource = await mapLimit(sources, 6, async (source) => {
    try {
      const { text, finalUrl } = await fetchText(source.url);
      if (source.kind === 'rss') return parseFeed(text, source).slice(0, 30);
      // Listing pages carry no dates: open the newest few articles to read them.
      const listed = parseListing(text, source, finalUrl).slice(0, 6);
      return mapLimit(listed, 3, enrich);
    } catch (error) {
      log(`  ! ${source.id}: ${error.message}`);
      return [];
    }
  });
  sources.forEach((s, i) => log(`  ${s.id.padEnd(12)} ${String(perSource[i].length).padStart(2)} items`));
  return perSource.flat();
}
