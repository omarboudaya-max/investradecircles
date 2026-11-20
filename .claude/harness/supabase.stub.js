// LOCAL TEST HARNESS ONLY — never imported by the real app.
// Wraps the real Supabase client so that signed-in screens can be exercised safely:
//   • every write (insert / update / delete / upsert / rpc / storage / functions) is refused,
//   • private tables (direct messages, notifications) always read as empty,
//   • one circle is presented as if the harness user created it, to reach manager screens.
import { createClient } from '@supabase/supabase-js';

export const HARNESS_USER_ID = '00000000-0000-4000-8000-00000000beef';
const MANAGED_CIRCLE = (new URLSearchParams(window.location.search).get('manage') || sessionStorage.getItem('harness_manage') || 'CCI Tunis');
sessionStorage.setItem('harness_manage', MANAGED_CIRCLE);

const real = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const PRIVATE_TABLES = new Set(['DirectMessage', 'Notification']);
const refusal = { data: null, error: { message: 'Read-only test harness: write refused', code: 'HARNESS' }, count: null };
export const harnessLog = [];

function refused(label) {
  harnessLog.push(label);
  console.info('[harness] refused write:', label);
  const chain = new Proxy(function noop() {}, {
    get(_t, prop) {
      if (prop === 'then') return (resolve) => resolve(refusal);
      return () => chain;
    },
    apply: () => chain,
  });
  return chain;
}

// With row-level security on, the public key the harness uses can no longer read private
// tables, so screens that need such rows get a few fictional ones.
const FIXTURES = {
  Connection: () => Array.from({ length: 5 }, (_, i) => ({
    id: `00000000-0000-4000-8000-0000000000c${i}`,
    requester_id: `00000000-0000-4000-8000-0000000000d${i}`,
    recipient_id: HARNESS_USER_ID,
    status: 'pending',
    created_date: new Date(Date.now() - i * 3600000).toISOString(),
  })),
  Post: () => {
    const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
    const base = { circle_id: null, visibility: 'public', post_type: 'text', liked_by: [], saved_by: [], reactions: {}, intent_category: 'ANNOUNCEMENT', author_avatar: null };
    return [
      { ...base, id: '00000000-0000-4000-8000-0000000000e1', created_by_id: '00000000-0000-4000-8000-0000000000d0', author_name: 'Amira Ben Salah', content: 'Nous recherchons un distributeur en Allemagne pour notre huile d’olive bio.', likes: 0, created_date: hoursAgo(2), intent_category: 'NEED' },
      { ...base, id: '00000000-0000-4000-8000-0000000000e2', created_by_id: '00000000-0000-4000-8000-0000000000d1', author_name: 'Karim Trabelsi', content: 'Notre fonds ouvre un nouveau ticket seed pour les fintechs tunisiennes.', likes: 7, reactions: { '🔥': ['a', 'b', 'c'] }, created_date: hoursAgo(40), intent_category: 'INVESTMENT' },
      { ...base, id: '00000000-0000-4000-8000-0000000000e3', created_by_id: '00000000-0000-4000-8000-0000000000d2', author_name: 'Leila Gharbi', content: 'Retour sur le salon textile de Sousse.', likes: 25, created_date: hoursAgo(24 * 25) },
      { ...base, id: '00000000-0000-4000-8000-0000000000e4', created_by_id: '00000000-0000-4000-8000-00000000a6e7', author_name: 'Investraders_agent', author_avatar: 'https://www.investraders.net/logo.png', post_type: 'agent_news', intent_category: 'INVESTMENT', likes: 1, created_date: hoursAgo(5), image_url: 'https://investintunisia.tn/wp-content/uploads/2026/11/Marquardt_Tun.webp', content: '🚀 Marquardt obtient jusqu’à 52 M€ de l’IFC pour développer ses sites en Tunisie\n\nLe groupe allemand agrandit trois unités de production dans le Grand Tunis, avec plus de 400 emplois qualifiés prévus.\n\n👉 Un signal fort de l’attractivité industrielle de la Tunisie.\n\n🔗 Source et image : FIPA — Invest in Tunisia — https://investintunisia.tn/\n\n#Investissement #Tunisie' },
      ...Array.from({ length: 16 }, (_, i) => ({ ...base, id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`, created_by_id: '00000000-0000-4000-8000-0000000000d3', author_name: 'Youssef Mejri', content: `Publication de test n°${i + 1}`, likes: i % 3, created_date: hoursAgo(30 + i * 20) })),
    ];
  },
  profiles: () => Array.from({ length: 5 }, (_, i) => ({
    id: `00000000-0000-4000-8000-0000000000d${i}`,
    full_name: ['Amira Ben Salah', 'Karim Trabelsi', 'Leila Gharbi', 'Youssef Mejri', 'Sonia Haddad'][i],
    avatar_url: null,
    headline: ['Agri-food exporter', 'Seed investor, fintech', 'Textile SME founder', 'Family office analyst', 'Logistics consultant'][i],
  })),
};

function transform(table, result) {
  if (!result || result.error) return result;
  if (FIXTURES[table] && Array.isArray(result.data) && result.data.length === 0) return { ...result, data: FIXTURES[table]() };
  if (PRIVATE_TABLES.has(table)) return { ...result, data: Array.isArray(result.data) ? [] : null, count: 0 };
  if (table === 'Circle') {
    const patch = (row) => (row && row.name && row.name.trim() === MANAGED_CIRCLE ? { ...row, created_by_id: HARNESS_USER_ID, member_ids: [...(row.member_ids || []), HARNESS_USER_ID] } : row);
    return { ...result, data: Array.isArray(result.data) ? result.data.map(patch) : patch(result.data) };
  }
  return result;
}

function wrap(builder, table) {
  return new Proxy(builder, {
    get(target, prop) {
      if (['insert', 'update', 'delete', 'upsert'].includes(prop)) return (...args) => refused(`${table}.${String(prop)} ${JSON.stringify(args[0] ?? '').slice(0, 160)}`);
      if (prop === 'then') return (resolve, reject) => target.then((r) => resolve(transform(table, r)), reject);
      const value = target[prop];
      if (typeof value !== 'function') return value;
      return (...args) => {
        const out = value.apply(target, args);
        return out && typeof out.then === 'function' ? wrap(out, table) : out;
      };
    },
  });
}

export const supabase = {
  from: (table) => wrap(real.from(table), table),
  rpc: (name, args) => refused(`rpc ${name} ${JSON.stringify(args ?? {}).slice(0, 160)}`),
  channel: () => { const ch = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} }; return ch; },
  removeChannel: () => {},
  functions: { invoke: (name) => refused(`function ${name}`) },
  storage: { from: () => ({ upload: () => refused('storage upload'), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    updateUser: () => refused('auth.updateUser'),
    signOut: async () => ({ error: null }),
  },
};
