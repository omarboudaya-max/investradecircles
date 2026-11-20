// Post images: the article's own preview image when it is a real photo,
// otherwise an Investraders-branded card (SVG) with the headline.

const UA = 'Mozilla/5.0 (compatible; InvestradersNewsAgent/1.0; +https://www.investraders.net)';
const GENERIC = /(logo|default|placeholder|og[-_]?image|ogp|share[-_]?image|fallback|favicon|sprite|avatar|icon)/i;

/** True when the URL serves a reasonably large photo that is not a site-wide logo. */
export async function usableImage(url) {
  if (!url || !/^https:\/\//i.test(url)) return false;
  let path = '';
  try { path = new URL(url).pathname; } catch { return false; }
  if (GENERIC.test(path) || /\.svg$/i.test(path)) return false;
  try {
    // No Referer is sent, matching how the feed loads it (referrerPolicy="no-referrer").
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!res.ok || !/^image\/(jpeg|jpg|png|webp|gif|avif)/i.test(res.headers.get('content-type') || '')) return false;
    const bytes = (await res.arrayBuffer()).byteLength;
    return bytes >= 15_000; // smaller files are almost always icons or logos
  } catch {
    return false;
  }
}

const CATEGORY_STYLE = {
  INVESTMENT: { label: 'Financement', from: '#047857', to: '#0ea5e9' },
  OPPORTUNITY: { label: 'Opportunité', from: '#0f766e', to: '#2563eb' },
  PARTNERSHIP: { label: 'Partenariat', from: '#6d28d9', to: '#2563eb' },
  EXPANSION: { label: 'International', from: '#0369a1', to: '#06b6d4' },
  INSIGHT: { label: 'Tendances', from: '#b45309', to: '#2563eb' },
  ANNOUNCEMENT: { label: 'Actualité', from: '#1e3a8a', to: '#0891b2' },
};

const escapeXml = (s = '') => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

function wrap(text, maxChars, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) { line = next; continue; }
    if (line) lines.push(line);
    line = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:!?…-]*\S{0,3}$/, '')}…`;
  }
  return lines;
}

/** A 1200×630 branded card as SVG text. */
export function brandedCard({ headline, category, sourceName, date }) {
  const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.ANNOUNCEMENT;
  const lines = wrap(headline, 30, 4);
  const fontSize = lines.length >= 4 ? 52 : 58;
  const lineHeight = Math.round(fontSize * 1.18);
  const top = 300 - ((lines.length - 1) * lineHeight) / 2;
  const dateText = date ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Tunis' }).format(date) : '';
  const titleSpans = lines.map((l, i) => `<tspan x="80" y="${Math.round(top + i * lineHeight)}">${escapeXml(l)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${style.from}"/>
      <stop offset="1" stop-color="${style.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="80" r="220" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="1150" cy="560" r="140" fill="#ffffff" fill-opacity="0.06"/>
  <rect x="80" y="70" rx="22" ry="22" width="${Math.max(170, style.label.length * 17 + 60)}" height="44" fill="#ffffff" fill-opacity="0.18"/>
  <text x="${80 + Math.max(170, style.label.length * 17 + 60) / 2}" y="100" text-anchor="middle" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="1">${escapeXml(style.label.toUpperCase())}</text>
  <text font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="#ffffff">${titleSpans}</text>
  <rect x="80" y="520" width="1040" height="2" fill="#ffffff" fill-opacity="0.35"/>
  <text x="80" y="568" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">Veille Investraders</text>
  <text x="1120" y="568" text-anchor="end" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="22" fill="#ffffff" fill-opacity="0.9">${escapeXml([sourceName, dateText].filter(Boolean).join(' · '))}</text>
</svg>`;
}
