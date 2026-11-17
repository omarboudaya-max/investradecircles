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
