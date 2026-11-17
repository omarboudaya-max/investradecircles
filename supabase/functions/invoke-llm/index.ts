// invoke-llm — the single server-side entry point for language-model calls.
//
// The web app calls it with:
//   { prompt: string, response_json_schema?: object, add_context_from_internet?: boolean }
// and receives the model's answer as JSON (the object described by response_json_schema,
// or { text } when no schema is given).
//
// Required secret:  GROQ_API_KEY   (same provider the project's scraping scripts use)
// Optional secret:  LLM_MODEL      (tried first; otherwise the defaults below, in order)
//
// Only signed-in members may call it: the caller's session token is checked against
// Supabase Auth, so the public key alone is not enough to spend model credits.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_PROMPT_CHARS = 6000;
const MAX_PAGE_BYTES = 300_000;
const MAX_CONTEXT_CHARS = 12_000;
// Providers retire models regularly. Each one is tried in order until one is still served.
const DEFAULT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** The signed-in user's id for a session token, or null. */
async function userIdFor(token: string): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const user = await res.json();
    return typeof user?.id === 'string' ? user.id : null;
  } catch {
    return null;
  }
}

/** Public web addresses only: never the local machine, a private network or an odd port. */
export function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try { url = new URL(raw); } catch { return false; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (url.username || url.password) return false;
  if (url.port && !['80', '443'].includes(url.port)) return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.')) return false; // "localhost", bare intranet names
  if (host.startsWith('[') || host.includes(':')) return false; // IPv6 literals
  if (/^\d+(\.\d+){3}$/.test(host) || /^(0x[0-9a-f]+|\d+)$/.test(host)) return false; // IPv4 literals
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|invalid|example)$/.test(host)) return false;
  return true;
}

function htmlToText(html: string): string {
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '').trim();
  const description = (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1] ?? '').trim();
  const body = html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return [title && `Title: ${title}`, description && `Description: ${description}`, body].filter(Boolean).join('\n').slice(0, MAX_CONTEXT_CHARS);
}

/** Text of the first public web page named in the prompt, or '' when it cannot be read. */
async function pageContext(prompt: string): Promise<string> {
  let target = prompt.match(/https?:\/\/[^\s"'<>)]+/i)?.[0]?.replace(/[.,;]+$/, '');
  for (let hop = 0; target && hop < 4; hop += 1) {
    if (!isPublicHttpUrl(target)) return '';
    try {
      const res = await fetch(target, {
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OrganisationProfileImporter/1.0)', Accept: 'text/html,application/xhtml+xml' },
      });
      if (res.status >= 300 && res.status < 400) {
        const next = res.headers.get('location');
        target = next ? new URL(next, target).toString() : undefined;
        continue;
      }
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return '';
      const bytes = new Uint8Array(await res.arrayBuffer()).slice(0, MAX_PAGE_BYTES);
      return htmlToText(new TextDecoder().decode(bytes));
    } catch {
      return '';
    }
  }
  return '';
}

function parseModelJson(content: string): unknown {
  try { return JSON.parse(content); } catch { /* fall through */ }
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(content.slice(start, end + 1)); } catch { /* fall through */ }
  }
  return null;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!(await userIdFor(token))) return json({ error: 'Sign in to use this feature.' }, 401);

  const apiKey = Deno.env.get('GROQ_API_KEY') ?? '';
  if (!apiKey) return json({ error: 'The language model is not configured (GROQ_API_KEY is missing).' }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'The request body must be JSON.' }, 400); }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return json({ error: 'A prompt is required.' }, 400);
  if (prompt.length > MAX_PROMPT_CHARS) return json({ error: `The prompt is too long (limit ${MAX_PROMPT_CHARS} characters).` }, 413);

  const schema = body.response_json_schema && typeof body.response_json_schema === 'object' ? body.response_json_schema : null;
  const context = body.add_context_from_internet === true ? await pageContext(prompt) : '';

  const system = [
    'You are a precise assistant for a business networking platform.',
    schema
      ? `Reply with one JSON object only, no prose and no code fences. It must follow this JSON schema:\n${JSON.stringify(schema)}`
      : 'Reply concisely in plain text.',
    context
      ? 'Use only the web page content supplied by the user as your source of facts. Leave a field empty rather than inventing a value.'
      : (body.add_context_from_internet === true
        ? 'The web page could not be read. Do not invent facts about the organisation: leave unknown fields empty.'
        : ''),
  ].filter(Boolean).join('\n\n');

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: context ? `${prompt}\n\n--- Web page content ---\n${context}` : prompt },
  ];

  const models = [...new Set([Deno.env.get('LLM_MODEL') || '', ...DEFAULT_MODELS].filter(Boolean))];
  let completion: Response | null = null;
  for (const model of models) {
    try {
      completion = await fetch(GROQ_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(45000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 4000,
          ...(schema ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
    } catch {
      return json({ error: 'The language model did not answer in time.' }, 504);
    }
    if (completion.ok) break;
    const detail = (await completion.text()).slice(0, 300);
    console.error('LLM provider error', model, completion.status, detail);
    const retired = completion.status === 404 || /model_not_found|decommissioned/i.test(detail);
    if (!retired) {
      return json({ error: completion.status === 429 ? 'The language model is busy. Try again in a minute.' : 'The language model request failed.' }, completion.status === 429 ? 429 : 502);
    }
  }
  if (!completion?.ok) return json({ error: 'No language model is available. Set the LLM_MODEL secret to a current model.' }, 502);

  const result = await completion.json();
  const content: string = result?.choices?.[0]?.message?.content ?? '';
  if (!schema) return json({ text: content });

  const parsed = parseModelJson(content);
  if (parsed === null || typeof parsed !== 'object') return json({ error: 'The language model returned an unreadable answer.' }, 502);
  return json(parsed);
}

Deno.serve(handler);
