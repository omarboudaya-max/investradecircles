// Language-model calls (Groq, OpenAI-compatible API).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Providers retire models regularly; each is tried in order until one is served.
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

export const CATEGORIES = ['OPPORTUNITY', 'INVESTMENT'];

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


const EDITOR = `Tu es l'éditeur des opportunités d'Investraders, une plateforme tunisienne qui met en relation innovateurs, startups, PME et investisseurs.
Ton public : fondateurs de startups, innovateurs, porteurs de projets, PME et investisseurs, en Tunisie et au Maghreb.`;

const OPPORTUNITY_RULES = `Une OPPORTUNITÉ est quelque chose à quoi ce public peut CANDIDATER, PARTICIPER ou S'INSCRIRE :
- appel à candidatures ou à projets, subvention, financement non dilutif ou fonds ouvert aux candidatures ;
- programme d'accélération, d'incubation ou d'accompagnement qui recrute une cohorte ;
- concours, challenge, prix, hackathon pour startups ou innovateurs ;
- événement de levée de fonds, pitch, demo day, forum ou salon d'investisseurs ouvert aux startups ;
- session de labellisation (ex. Startup Act) ou dispositif public d'aide aux entreprises.
Ce N'EST PAS une opportunité : actualité économique, levée de fonds déjà réalisée par une entreprise, prêt à une grande entreprise, rapport, nomination, politique, bourse d'études, stage, emploi, recherche académique sans lien avec l'innovation entrepreneuriale.
L'opportunité doit être OUVERTE aux candidats tunisiens : Tunisie, Maghreb, Afrique, MENA, Méditerranée, pays en développement ou monde entier. Si elle est réservée à un autre pays (ex. « Nigeria uniquement », « US only »), elle ne convient pas.`;

/**
 * Rank the candidates that are real opportunities for the audience (best first).
 * @returns {{ ranked: number[], reasons: string[] }}
 */
export async function rankOpportunities(apiKey, candidates, recentTitles, today) {
  const list = candidates.map((c, i) => ({
    index: i,
    source: c.sourceName,
    publie: c.publishedAt ? c.publishedAt.toISOString().slice(0, 10) : 'inconnue',
    titre: c.title,
    extrait: (c.description || c.text || '').slice(0, 320),
  }));
  const system = `${EDITOR}
${OPPORTUNITY_RULES}
Nous sommes le ${today}. Classe au maximum 4 articles qui sont de vraies opportunités, de la plus intéressante à la moins intéressante.
Priorités : 1) utile pour des startups/innovateurs/PME ou investisseurs, 2) ouverte à la Tunisie (une opportunité spécifiquement tunisienne passe en premier), 3) valeur concrète (montant, accompagnement, visibilité), 4) date limite encore lointaine.
N'inclus aucune opportunité déjà publiée récemment (même si elle vient d'une autre source). Si aucun article ne convient, renvoie une liste vide.
Réponds uniquement en JSON : {"classement": [{"index": <nombre>, "raison": "<une phrase>"}]}`;
  const user = `Déjà publié récemment (ne pas répéter) :\n${recentTitles.length ? recentTitles.map((t) => `- ${t}`).join('\n') : '(rien)'}\n\nArticles :\n${JSON.stringify(list)}`;
  const answer = await chatJson(apiKey, system, user, { maxTokens: 900 });
  const rows = Array.isArray(answer.classement) ? answer.classement : [];
  const ranked = [];
  const reasons = [];
  for (const row of rows) {
    const i = Number(row?.index);
    if (Number.isInteger(i) && i >= 0 && i < candidates.length && !ranked.includes(i)) {
      ranked.push(i);
      reasons.push(String(row.raison || row.reason || '').slice(0, 300));
    }
  }
  return { ranked: ranked.slice(0, 4), reasons };
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

const isoDate = (value) => {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return Number.isFinite(d.getTime()) ? d : null;
};

/**
 * Write the French post for one opportunity, from the article's own text only.
 * Returns { ok: false, why } when the article turns out not to be a usable opportunity.
 */
export async function writeOpportunityPost(apiKey, article, today) {
  const links = (article.links || []).slice(0, 15);
  const system = `${EDITOR}
${OPPORTUNITY_RULES}
Nous sommes le ${today}. À partir de l'article fourni, rédige une publication en FRANÇAIS qui donne envie de candidater et dit exactement comment faire.
Règles strictes :
- Utilise uniquement les informations présentes dans le texte. N'invente jamais un montant, une date, un critère, un organisateur ou un lien.
- Reformule avec tes propres mots ; ne recopie pas de phrases entières.
- Ton clair et engageant, sans exagération.
Champs :
- "est_opportunite" : true seulement si c'est bien une opportunité au sens ci-dessus.
- "ouvert_tunisie" : "oui" si la Tunisie, le Maghreb, l'Afrique, la région MENA, les pays en développement/émergents ou le monde entier sont éligibles ; "non" UNIQUEMENT si le texte exclut explicitement la Tunisie (liste fermée de pays sans la Tunisie, ou un seul autre pays nommé) ; "inconnu" si l'éligibilité géographique n'est pas précisée.
- "accroche" : titre court (max 95 caractères) qui nomme l'opportunité et sa valeur, ex. « Appel à candidatures : jusqu'à 75 000 $ pour les projets climat ».
- "presentation" : 1 ou 2 phrases (max 300 caractères) : qui organise, de quoi il s'agit.
- "pour_qui" : qui peut candidater (max 180 caractères).
- "a_la_cle" : ce que les lauréats obtiennent : montant, accompagnement, visibilité (max 180 caractères). Vide si inconnu.
- "criteres" : 0 à 4 critères ou conditions clés, très courts (max 100 caractères chacun).
- "date_limite" : date limite de candidature au format AAAA-MM-JJ, ou null si elle n'est pas indiquée.
- "lien_candidature" : l'URL de la page officielle pour candidater ou s'informer, choisie UNIQUEMENT dans la liste "liens" fournie ; null si aucune ne convient.
- "categorie" : "OPPORTUNITY" (appel, subvention, programme, concours) ou "INVESTMENT" (événement d'investisseurs, levée de fonds, pitch).
- "hashtags" : 2 à 4 hashtags en français, sans espaces (ex. #AppelÀCandidatures #Startups).
- "emoji" : un seul emoji adapté (🚀 💰 🏆 🎯 📢 🌍 🤝).
Réponds uniquement en JSON : {"est_opportunite": true, "ouvert_tunisie": "", "accroche": "", "presentation": "", "pour_qui": "", "a_la_cle": "", "criteres": [], "date_limite": null, "lien_candidature": null, "categorie": "", "hashtags": [], "emoji": ""}`;
  const user = JSON.stringify({
    source: article.sourceName,
    publie: article.publishedAt ? article.publishedAt.toISOString().slice(0, 10) : null,
    titre: article.title,
    texte: (article.text && article.text.length > 200 ? article.text : `${article.description}\n${article.text || ''}`).slice(0, 7000),
    liens: links,
  });
  const a = await chatJson(apiKey, system, user, { maxTokens: 1500 });

  if (a.est_opportunite !== true) return { ok: false, why: 'not an opportunity' };
  if (String(a.ouvert_tunisie).toLowerCase() === 'non') return { ok: false, why: 'not open to Tunisian applicants' };
  const deadline = isoDate(a.date_limite);
  const todayDate = isoDate(today);
  if (deadline && todayDate && deadline < todayDate) return { ok: false, why: `deadline passed (${a.date_limite})` };

  const allowed = new Set(links.map((l) => l.url));
  const applyUrl = typeof a.lien_candidature === 'string' && allowed.has(a.lien_candidature) ? a.lien_candidature : null;
  const post = {
    headline: clampText(a.accroche, 95),
    intro: clampText(a.presentation, 320),
    who: clampText(a.pour_qui, 190),
    reward: clampText(a.a_la_cle, 190),
    criteria: (Array.isArray(a.criteres) ? a.criteres : []).map((c) => clampText(c, 110)).filter((c) => c.length > 3).slice(0, 4),
    deadline,
    applyUrl,
    openToTunisia: String(a.ouvert_tunisie || 'inconnu').toLowerCase(),
    category: ['OPPORTUNITY', 'INVESTMENT'].includes(a.categorie) ? a.categorie : 'OPPORTUNITY',
    hashtags: (Array.isArray(a.hashtags) ? a.hashtags : [])
      .map((h) => `#${String(h).replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')}`)
      .filter((h) => h.length > 2)
      .slice(0, 4),
    emoji: [...String(a.emoji || '🚀').trim()].slice(0, 2).join('') || '🚀',
  };
  if (!post.headline || post.intro.length < 40) return { ok: false, why: 'incomplete post' };
  return { ok: true, post };
}
