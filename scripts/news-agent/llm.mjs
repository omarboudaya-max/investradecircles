// Language-model calls (Groq, OpenAI-compatible API).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Providers retire models regularly; each is tried in order until one is served.
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

export const CATEGORIES = ['INVESTMENT', 'OPPORTUNITY', 'PARTNERSHIP', 'EXPANSION', 'INSIGHT', 'ANNOUNCEMENT'];

async function chatJson(apiKey, system, user, { maxTokens = 1800 } = {}) {
  const models = [...new Set([process.env.LLM_MODEL || '', ...MODELS].filter(Boolean))];
  let lastError = 'no model available';
  // Each model is tried with strict JSON mode, then once without it (some models
  // occasionally fail the provider's JSON validation), before moving to the next.
  const attempts = models.flatMap((model) => [{ model, strict: true }, { model, strict: false }]);
  for (const { model, strict } of attempts) {
    let res;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: maxTokens,
          ...(strict ? { response_format: { type: 'json_object' } } : {}),
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
    } catch (error) {
      lastError = `${model}: ${error.name}`;
      continue;
    }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      lastError = `${model}: HTTP ${res.status} ${detail}`;
      if (res.status === 401 || res.status === 403) throw new Error(`Language model refused the key (${lastError})`);
      continue; // retired model, JSON validation failure, rate limit, provider error: try the next attempt
    }
    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content ?? '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    try {
      return JSON.parse(start >= 0 && end > start ? content.slice(start, end + 1) : content);
    } catch {
      lastError = `${model}: unreadable answer`;
    }
  }
  throw new Error(`Language model unavailable (${lastError})`);
}

const EDITOR = `Tu es l'éditeur de veille d'Investraders, une plateforme tunisienne qui met en relation innovateurs, startups, PME et investisseurs.
Ton public : entrepreneurs, startups, PME, investisseurs et structures d'accompagnement en Tunisie et au Maghreb.`;

/**
 * Pick the single most useful article for the audience.
 * @returns {{ index: number|null, reason: string }}
 */
export async function chooseArticle(apiKey, candidates, recentTitles, slotLabel) {
  const list = candidates.map((c, i) => ({
    index: i,
    source: c.sourceName,
    date: c.publishedAt ? c.publishedAt.toISOString().slice(0, 10) : 'inconnue',
    titre: c.title,
    extrait: (c.description || c.text || '').slice(0, 280),
  }));
  const system = `${EDITOR}
Tu choisis UN article à publier pour la publication du ${slotLabel}.
Critères, par ordre d'importance :
1. Utile concrètement : financement, levée de fonds, appel à candidatures, programme d'accompagnement ou d'incubation, prêt/subvention/garantie, fonds d'investissement, partenariat économique, événement pour entrepreneurs ou investisseurs.
2. Proximité : Tunisie d'abord, puis Maghreb/Afrique/Méditerranée, puis international.
3. Fraîcheur.
Exclus : politique, conflits, catastrophes, faits divers, sujets sans lien avec l'investissement ou l'entrepreneuriat, et tout sujet déjà couvert dans les publications récentes (même s'il vient d'une autre source).
Si aucun article ne convient vraiment, réponds index null.
Réponds uniquement en JSON : {"index": <nombre ou null>, "raison": "<une phrase>"}`;
  const user = `Publications récentes à ne pas répéter :\n${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join('\n') : '(aucune)'}\n\nArticles candidats :\n${JSON.stringify(list)}`;
  const answer = await chatJson(apiKey, system, user, { maxTokens: 600 });
  const index = Number.isInteger(answer.index) && answer.index >= 0 && answer.index < candidates.length ? answer.index : null;
  return { index, reason: String(answer.raison || answer.reason || '').slice(0, 300) };
}

const clampText = (value, max) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  // Prefer ending on a full sentence; otherwise cut on a word boundary.
  const cut = text.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.endsWith('.') ? cut.length - 1 : -1);
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1);
  return `${cut.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

/** Write the French post for one article. Only facts from the provided text are allowed. */
export async function writePost(apiKey, article) {
  const system = `${EDITOR}
Rédige une publication en FRANÇAIS à partir de l'article fourni.
Règles strictes :
- Utilise uniquement les faits présents dans le texte fourni. N'invente aucun chiffre, date, nom ou condition.
- Reformule avec tes propres mots : ne recopie pas de phrases de l'article.
- Ton professionnel et clair, sans exagération ni sensationnalisme.
- "accroche" : un titre court et informatif (max 90 caractères), sans guillemets.
- "resume" : 2 ou 3 phrases (max 380 caractères au total) : qui, quoi, combien, pour qui, échéance si connue.
- "importance" : une phrase (max 200 caractères) expliquant ce que cela signifie pour les entrepreneurs ou investisseurs tunisiens. Si le lien avec la Tunisie n'est pas établi, parle de l'écosystème en général sans inventer de lien.
- "categorie" : une valeur parmi ${CATEGORIES.join(', ')} (INVESTMENT = levée/fonds/investissement ; OPPORTUNITY = appel à candidatures, programme, concours, subvention ; PARTNERSHIP = accord ou partenariat ; EXPANSION = expansion internationale ; INSIGHT = étude, rapport, tendance ; ANNOUNCEMENT = autre actualité).
- "hashtags" : 2 à 4 hashtags en français, sans espaces.
- "emoji" : un seul emoji adapté (ex. 💰 🚀 🤝 🌍 📊 📢 🎯).
Réponds uniquement en JSON : {"accroche": "", "resume": "", "importance": "", "categorie": "", "hashtags": [], "emoji": ""}`;
  const user = JSON.stringify({
    source: article.sourceName,
    date: article.publishedAt ? article.publishedAt.toISOString().slice(0, 10) : null,
    titre: article.title,
    texte: (article.text && article.text.length > 200 ? article.text : `${article.description}\n${article.text || ''}`).slice(0, 6000),
  });
  const a = await chatJson(apiKey, system, user, { maxTokens: 1200 });
  const post = {
    headline: clampText(a.accroche, 90),
    summary: clampText(a.resume, 480),
    why: clampText(a.importance, 220),
    category: CATEGORIES.includes(a.categorie) ? a.categorie : 'ANNOUNCEMENT',
    hashtags: (Array.isArray(a.hashtags) ? a.hashtags : [])
      .map((h) => `#${String(h).replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')}`)
      .filter((h) => h.length > 2)
      .slice(0, 4),
    emoji: [...String(a.emoji || '📢').trim()].slice(0, 2).join('') || '📢',
  };
  if (!post.headline || post.summary.length < 60) throw new Error('The model returned an incomplete post');
  return post;
}
