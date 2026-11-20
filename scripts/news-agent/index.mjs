#!/usr/bin/env node
// Investraders news agent — publishes one curated news post per slot (morning,
// afternoon, night; Tunis time) as the "Investraders_agent" account.
//
// Environment:
//   SUPABASE_URL               project URL
//   SUPABASE_SERVICE_ROLE_KEY  service role key (never the public key; never logged)
//   GROQ_API_KEY               language model key
//   DRY_RUN=1                  choose and write the post but publish nothing
//   FORCE_SLOT                 morning | afternoon | night (optional override)
//   AGENT_EMAIL                login e-mail of the agent account (default agent@investraders.net)
//   OUT_DIR                    dry run only: where to write post.json and card.svg
//
// Safe to run repeatedly: a slot that already has a post is left alone, and the
// same article is never posted twice.

import fs from 'fs';
import path from 'path';
import { randomBytes, randomUUID } from 'crypto';
import { SOURCES, TOPIC_KEYWORDS, REGION_KEYWORDS } from './sources.mjs';
import { collect, enrich, normalize } from './feeds.mjs';
import { chooseArticle, writePost } from './llm.mjs';
import { usableImage, brandedCard } from './image.mjs';

const AGENT_NAME = 'Investraders_agent';
const AGENT_AVATAR = 'https://www.investraders.net/logo.png';
const AGENT_HEADLINE = 'Agent IA de veille — financement, startups et programmes d’accompagnement';
const AGENT_BIO = 'Chaque jour, le matin, l’après-midi et le soir, je partage une actualité sur le financement, les startups, les programmes d’accompagnement et l’investissement, en Tunisie et dans le monde. Résumés rédigés par IA à partir de sources officielles et spécialisées : vérifiez toujours les détails auprès de la source citée.';
const SLOT_LABEL = { morning: 'matin', afternoon: 'après-midi', night: 'soir' };

const log = (...args) => console.log(...args);
const truthy = (v) => /^(1|true|yes)$/i.test(String(v || ''));

// ── Configuration ───────────────────────────────────────────────────────────

function loadLocalEnv() {
  // Local runs only: pick up keys from .env.local without printing them.
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = line.slice(i + 1).trim();
  }
}

function tunisNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour) % 24;
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night';
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour, slot };
}

// ── Candidate selection ─────────────────────────────────────────────────────

const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

function scoreCandidates(items, { usedUrls, recentSources, now, ageFactor }) {
  const seenTitles = new Set();
  const out = [];
  for (const item of items) {
    if (!item.publishedAt || usedUrls.has(item.url)) continue;
    const source = SOURCE_BY_ID[item.sourceId];
    const ageDays = (now - item.publishedAt) / 86_400_000;
    if (ageDays < -1 || ageDays > source.maxAgeDays * ageFactor) continue;
    const titleKey = normalize(item.title).replace(/[^a-z0-9]+/g, ' ').trim();
    if (seenTitles.has(titleKey)) continue;
    const haystack = normalize(`${item.title} ${item.description} ${(item.text || '').slice(0, 1500)}`);
    const topicHits = TOPIC_KEYWORDS.filter((k) => haystack.includes(k)).length;
    if (topicHits === 0) continue;
    seenTitles.add(titleKey);
    const regional = REGION_KEYWORDS.some((k) => haystack.includes(k));
    let score = Math.min(topicHits, 6) + (regional ? 4 : 0) + (item.tunisian ? 3 : 0)
      + 2 * Math.max(0, 1 - ageDays / (source.maxAgeDays * ageFactor));
    if (recentSources.includes(item.sourceId)) score -= 3;
    out.push({ ...item, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 25);
}

// ── Database ────────────────────────────────────────────────────────────────

async function connect() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureAgent(db) {
  const email = process.env.AGENT_EMAIL || 'agent@investraders.net';
  const { data: existing, error: lookupError } = await db.from('profiles').select('id').eq('email', email).maybeSingle();
  if (lookupError) throw new Error(`Profile lookup failed: ${lookupError.message}`);
  let id = existing?.id;
  if (!id) {
    log(`  creating the ${AGENT_NAME} account (${email})`);
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      // Random and never stored: nobody signs in as the agent.
      password: `${randomBytes(24).toString('base64url')}Aa1!`,
      user_metadata: { full_name: AGENT_NAME },
    });
    if (error && !/already|exists|registered/i.test(error.message)) throw new Error(`Agent account creation failed: ${error.message}`);
    id = data?.user?.id;
    if (!id) {
      const { data: list, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw new Error(`Agent account lookup failed: ${listError.message}`);
      id = list.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())?.id;
    }
    if (!id) throw new Error('Agent account could not be found or created');
  }
  const profile = { id, email, full_name: AGENT_NAME, avatar_url: AGENT_AVATAR, headline: AGENT_HEADLINE, bio: AGENT_BIO, user_type: 'other', is_onboarded: true };
  const { error: upsertError } = await db.from('profiles').upsert(profile, { onConflict: 'id' });
  if (upsertError) throw new Error(`Agent profile update failed: ${upsertError.message}`);
  return id;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  loadLocalEnv();
  const dryRun = truthy(process.env.DRY_RUN) || process.argv.includes('--dry-run');
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('GROQ_API_KEY is not set');
  if (!dryRun && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or run with DRY_RUN=1)');
  }

  const now = new Date();
  const tunis = tunisNow(now);
  const slot = ['morning', 'afternoon', 'night'].includes(process.env.FORCE_SLOT) ? process.env.FORCE_SLOT : tunis.slot;
  log(`Investraders news agent — ${tunis.date} ${SLOT_LABEL[slot]}${dryRun ? ' (dry run)' : ''}`);

  const db = dryRun ? null : await connect();
  let usedUrls = new Set();
  let recentTitles = [];
  let recentSources = [];
  if (db) {
    const { data: taken, error: slotError } = await db.from('AgentNewsItem').select('id,status').eq('slot_date', tunis.date).eq('slot', slot).maybeSingle();
    if (slotError) throw new Error(`Could not read the agent log (is the migration applied?): ${slotError.message}`);
    if (taken) { log(`Slot already ${taken.status} — nothing to do.`); return; }
    const since = new Date(now - 90 * 86_400_000).toISOString();
    const { data: history, error: historyError } = await db.from('AgentNewsItem').select('url,title,source,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(500);
    if (historyError) throw new Error(`Could not read the agent history: ${historyError.message}`);
    usedUrls = new Set(history.map((h) => h.url));
    recentTitles = history.slice(0, 12).map((h) => h.title).filter(Boolean);
    recentSources = history.slice(0, 2).map((h) => h.source);
  }

  log('Reading sources…');
  const items = await collect(SOURCES, log);
  let candidates = scoreCandidates(items, { usedUrls, recentSources, now, ageFactor: 1 });
  if (candidates.length === 0) candidates = scoreCandidates(items, { usedUrls, recentSources, now, ageFactor: 2 });
  log(`${items.length} items read, ${candidates.length} relevant candidates.`);
  if (candidates.length === 0) { log('No fresh relevant news — skipping this slot.'); return; }

  const choice = await chooseArticle(groqKey, candidates, recentTitles, SLOT_LABEL[slot]);
  if (choice.index === null) { log(`Nothing suitable: ${choice.reason}`); return; }
  let article = candidates[choice.index];
  log(`Chosen: [${article.sourceId}] ${article.title}\n  ${article.url}\n  why: ${choice.reason}`);
  if (!article.enriched) article = await enrich(article);

  const post = await writePost(groqKey, article);

  let imageUrl = '';
  let usedArticleImage = false;
  for (const candidate of [article.pageImage, article.image]) {
    if (await usableImage(candidate)) { imageUrl = candidate; usedArticleImage = true; break; }
  }
  const card = usedArticleImage ? null : brandedCard({ headline: post.headline, category: post.category, sourceName: article.sourceName, date: article.publishedAt });

  const content = [
    `${post.emoji} ${post.headline}`,
    post.summary,
    `👉 ${post.why}`,
    `🔗 ${usedArticleImage ? 'Source et image' : 'Source'} : ${article.sourceName} — ${article.url}`,
    post.hashtags.join(' '),
  ].filter(Boolean).join('\n\n');

  if (dryRun) {
    const outDir = process.env.OUT_DIR;
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'post.json'), JSON.stringify({ slot, content, category: post.category, image: imageUrl || '(branded card)', article: { source: article.sourceName, url: article.url, date: article.publishedAt } }, null, 2));
      if (card) fs.writeFileSync(path.join(outDir, 'card.svg'), card);
    }
    log(`\n----- post (${post.category}) -----\n${content}\n----- image: ${imageUrl || 'branded card'} -----`);
    return;
  }

  const agentId = await ensureAgent(db);

  // Claim the slot first: a duplicate run hits the unique index and stops here.
  const { data: claim, error: claimError } = await db.from('AgentNewsItem').insert({
    url: article.url, source: article.sourceId, title: post.headline,
    published_at: article.publishedAt?.toISOString() ?? null, slot_date: tunis.date, slot, status: 'posting',
  }).select('id').single();
  if (claimError) {
    if (claimError.code === '23505') { log('Another run took this slot or article — nothing to do.'); return; }
    throw new Error(`Could not claim the slot: ${claimError.message}`);
  }

  try {
    if (card) {
      const file = `agent-news/${tunis.date}-${slot}-${randomUUID().slice(0, 8)}.svg`;
      const { error: uploadError } = await db.storage.from('media').upload(file, Buffer.from(card, 'utf8'), { contentType: 'image/svg+xml', cacheControl: '31536000', upsert: false });
      if (uploadError) throw new Error(`Card upload failed: ${uploadError.message}`);
      imageUrl = db.storage.from('media').getPublicUrl(file).data.publicUrl;
    }
    const { data: created, error: postError } = await db.from('Post').insert({
      content,
      author_name: AGENT_NAME,
      author_avatar: AGENT_AVATAR,
      created_by_id: agentId,
      visibility: 'public',
      post_type: 'agent_news',
      image_url: imageUrl,
      intent_category: post.category,
    }).select('id').single();
    if (postError) throw new Error(`Post creation failed: ${postError.message}`);
    const { error: logError } = await db.from('AgentNewsItem').update({ status: 'posted', post_id: created.id }).eq('id', claim.id);
    if (logError) log(`  ! post created but log not updated: ${logError.message}`);
    log(`Published post ${created.id} (${post.category}, ${usedArticleImage ? 'article image' : 'branded card'}).`);
  } catch (error) {
    await db.from('AgentNewsItem').delete().eq('id', claim.id); // release the slot for a retry
    throw error;
  }
}

main().catch((error) => {
  console.error(`News agent failed: ${error.message}`);
  process.exit(1);
});
