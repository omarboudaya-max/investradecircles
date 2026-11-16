import { supabase } from '@/lib/supabase';
import { INITIAL_ORGANIZATIONS, INITIAL_VEHICLES } from '@/lib/investmentNetwork';

// Initial governorates dataset (24 Governorates of Tunisia)
const INITIAL_GOVERNORATES = [
  { id: 'gov_tunis', name: 'Tunis', region: 'Grand Tunis', code: 'TN-11' },
  { id: 'gov_ariana', name: 'Ariana', region: 'Grand Tunis', code: 'TN-12' },
  { id: 'gov_ben_arous', name: 'Ben Arous', region: 'Grand Tunis', code: 'TN-13' },
  { id: 'gov_manouba', name: 'Manouba', region: 'Grand Tunis', code: 'TN-14' },
  { id: 'gov_nabeul', name: 'Nabeul', region: 'North East', code: 'TN-21' },
  { id: 'gov_zaghouan', name: 'Zaghouan', region: 'North East', code: 'TN-22' },
  { id: 'gov_bizerte', name: 'Bizerte', region: 'North West', code: 'TN-23' },
  { id: 'gov_beja', name: 'Béja', region: 'North West', code: 'TN-31' },
  { id: 'gov_jendouba', name: 'Jendouba', region: 'North West', code: 'TN-32' },
  { id: 'gov_kef', name: 'Le Kef', region: 'North West', code: 'TN-33' },
  { id: 'gov_siliana', name: 'Siliana', region: 'North West', code: 'TN-34' },
  { id: 'gov_sousse', name: 'Sousse', region: 'Center East', code: 'TN-51' },
  { id: 'gov_monastir', name: 'Monastir', region: 'Center East', code: 'TN-52' },
  { id: 'gov_mahdia', name: 'Mahdia', region: 'Center East', code: 'TN-53' },
  { id: 'gov_sfax', name: 'Sfax', region: 'Center East', code: 'TN-61' },
  { id: 'gov_kairouan', name: 'Kairouan', region: 'Center West', code: 'TN-41' },
  { id: 'gov_kasserine', name: 'Kasserine', region: 'Center West', code: 'TN-42' },
  { id: 'gov_sidi_bouzid', name: 'Sidi Bouzid', region: 'Center West', code: 'TN-43' },
  { id: 'gov_gabes', name: 'Gabès', region: 'South East', code: 'TN-81' },
  { id: 'gov_medenine', name: 'Medenine', region: 'South East', code: 'TN-82' },
  { id: 'gov_tataouine', name: 'Tataouine', region: 'South East', code: 'TN-83' },
  { id: 'gov_gafsa', name: 'Gafsa', region: 'South West', code: 'TN-71' },
  { id: 'gov_tozeur', name: 'Tozeur', region: 'South West', code: 'TN-72' },
  { id: 'gov_kebili', name: 'Kebili', region: 'South West', code: 'TN-73' }
];

// Initial sectors dataset
const INITIAL_SECTORS = [
  { id: 'sec_tech', name: 'Technology & AI', icon: 'Cpu', color: '#3b82f6' },
  { id: 'sec_agri', name: 'Agri-Food & Smart Farming', icon: 'Sprout', color: '#10b981' },
  { id: 'sec_energy', name: 'Renewable Solar & Green Energy', icon: 'Sun', color: '#f59e0b' },
  { id: 'sec_industry', name: 'Advanced Manufacturing & Automotive', icon: 'Factory', color: '#6366f1' },
  { id: 'sec_pharma', name: 'Pharma & Biotech', icon: 'HeartPulse', color: '#ec4899' },
  { id: 'sec_logistics', name: 'Logistics & Trade', icon: 'Globe', color: '#0ea5e9' },
  { id: 'sec_tourism', name: 'Eco-Tourism & Real Estate', icon: 'Plane', color: '#8b5cf6' }
];

// Initial investment projects dataset
const INITIAL_PROJECTS = [
  {
    id: 'proj_bizerte_agro',
    project_code: 'INV-2026-001',
    title: 'Bizerte Smart Agri-Food Park & Cold Chain Export',
    company_name: 'AgriTech Mediterranean Corp',
    promoter_name: 'Sami Ben Salem',
    city: 'Bizerte',
    governorate_id: 'gov_bizerte',
    sector_id: 'sec_agri',
    investment_required: 4.5, // 4.5M TND
    equity_required: 1.8,
    debt_required: 2.7,
    minimum_ticket: 0.25,
    maximum_ticket: 1.0,
    expected_roi: 24,
    project_duration: 18,
    jobs_created: 120,
    investment_stage: 'EXPANSION',
    project_type: 'AGRI_FOOD',
    seeking: ['EQUITY', 'PARTNERSHIP', 'EXPORT'],
    target_markets: ['European Union', 'Gulf Cooperation Council', 'North Africa'],
    export_potential: 'HIGH',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'Direct access to Bizerte commercial port for rapid cold-chain export to southern Europe with zero-tariff trade agreement.',
    description: 'Modernization of a 15-hectare smart agricultural processing facility equipped with solar-powered cold storage, Automated Sorting Lines, and organic certification for European distribution.',
    is_verified: true,
    featured: true,
    project_status: 'PUBLISHED',
    email: 'contact@agritech-med.tn',
    phone: '+216 72 432 100',
    website: 'https://agritech-med.tn'
  },
  {
    id: 'proj_tunis_ai',
    project_code: 'INV-2026-002',
    title: 'Tunis FinTech & AI SaaS Development Hub',
    company_name: 'NeuraCode Labs Tunisia',
    promoter_name: 'Yasmine Triki',
    city: 'Tunis',
    governorate_id: 'gov_tunis',
    sector_id: 'sec_tech',
    investment_required: 1.2,
    equity_required: 1.2,
    debt_required: 0,
    minimum_ticket: 0.1,
    maximum_ticket: 0.5,
    expected_roi: 35,
    project_duration: 12,
    jobs_created: 45,
    investment_stage: 'EARLY_STAGE',
    project_type: 'TECH',
    seeking: ['EQUITY', 'TECHNICAL'],
    target_markets: ['MENA Region', 'France', 'Sub-Saharan Africa'],
    export_potential: 'HIGH',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'Located in El Gazala Technopark with tax exemption for offshore tech exports and access to top engineering talent.',
    description: 'Scaling an AI-driven credit scoring and risk assessment platform tailored for North African microfinance institutions and regional commercial banks.',
    is_verified: true,
    featured: true,
    project_status: 'PUBLISHED',
    email: 'yasmine@neuracode.tn',
    phone: '+216 71 890 432',
    website: 'https://neuracode.tn'
  },
  {
    id: 'proj_sfax_solar',
    project_code: 'INV-2026-003',
    title: 'Sfax Industrial Green Solar Power Station 20MW',
    company_name: 'Sfax Green Energy SA',
    promoter_name: 'Mohamed Cherif',
    city: 'Sfax',
    governorate_id: 'gov_sfax',
    sector_id: 'sec_energy',
    investment_required: 18.5,
    equity_required: 5.5,
    debt_required: 13.0,
    minimum_ticket: 0.5,
    maximum_ticket: 3.0,
    expected_roi: 18,
    project_duration: 24,
    jobs_created: 85,
    investment_stage: 'GREENFIELD',
    project_type: 'RENEWABLE_ENERGY',
    seeking: ['EQUITY', 'DEBT', 'LAND'],
    target_markets: ['Industrial Zone Sfax', 'STEG Power Grid'],
    export_potential: 'MEDIUM',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'Guaranteed 20-year Power Purchase Agreement (PPA) with industrial manufacturing plants in Sfax South Zone.',
    description: 'Construction of a 20MW photovoltaic solar farm utilizing bifacial panels and tracking tech on a 30-hectare industrial parcel with grid interconnect approval.',
    is_verified: true,
    featured: true,
    project_status: 'PUBLISHED',
    email: 'invest@sfaxgreenenergy.com',
    phone: '+216 74 221 980',
    website: 'https://sfaxgreenenergy.com'
  },
  {
    id: 'proj_sousse_auto',
    project_code: 'INV-2026-004',
    title: 'Sousse EV Cable & Electronic Harness Assembly Plant',
    company_name: 'Tunisia Wire Solutions',
    promoter_name: 'Karem Haddad',
    city: 'Sousse',
    governorate_id: 'gov_sousse',
    sector_id: 'sec_industry',
    investment_required: 8.0,
    equity_required: 3.0,
    debt_required: 5.0,
    minimum_ticket: 0.5,
    maximum_ticket: 2.0,
    expected_roi: 22,
    project_duration: 15,
    jobs_created: 250,
    investment_stage: 'EXPANSION',
    project_type: 'INDUSTRIAL',
    seeking: ['EQUITY', 'PARTNERSHIP'],
    target_markets: ['Germany', 'Italy', 'France EV Manufacturers'],
    export_potential: 'HIGH',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'ISO/IATF 16949 pre-certified facility with existing tier-1 supplier agreements for European EV manufacturers.',
    description: 'Expansion of manufacturing lines for high-voltage electric vehicle wiring harnesses and smart sensory cables in Enfidha Industrial Hub.',
    is_verified: true,
    featured: false,
    project_status: 'PUBLISHED',
    email: 'info@tunisiawire.tn',
    phone: '+216 73 345 678'
  },
  {
    id: 'proj_monastir_pharma',
    project_code: 'INV-2026-005',
    title: 'Monastir Medical Diagnostics & Sterile Injectables Unit',
    company_name: 'Biomedical Sahel SA',
    promoter_name: 'Dr. Leila Mansour',
    city: 'Monastir',
    governorate_id: 'gov_monastir',
    sector_id: 'sec_pharma',
    investment_required: 6.2,
    equity_required: 2.5,
    debt_required: 3.7,
    minimum_ticket: 0.3,
    maximum_ticket: 1.5,
    expected_roi: 26,
    project_duration: 20,
    jobs_created: 75,
    investment_stage: 'GREENFIELD',
    project_type: 'HEALTHCARE',
    seeking: ['EQUITY', 'TECHNICAL', 'DEBT'],
    target_markets: ['North Africa', 'Sub-Saharan Africa', 'Middle East'],
    export_potential: 'HIGH',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'GMP-compliant cleanroom facility close to Monastir Pharmacy University & Monastir International Airport.',
    description: 'Establishing a state-of-the-art sterile injectables production plant focusing on essential oncology drugs and rapid diagnostic kits.',
    is_verified: true,
    featured: false,
    project_status: 'PUBLISHED',
    email: 'contact@biomedicalsahel.tn',
    phone: '+216 73 500 120'
  },
  {
    id: 'proj_nabeul_eco',
    project_code: 'INV-2026-006',
    title: 'Nabeul Organic Citrus & Essential Oils Bio-Refinery',
    company_name: 'Cap Bon BioEssence',
    promoter_name: 'Amine Ben Ammar',
    city: 'Nabeul',
    governorate_id: 'gov_nabeul',
    sector_id: 'sec_agri',
    investment_required: 2.8,
    equity_required: 1.0,
    debt_required: 1.8,
    minimum_ticket: 0.15,
    maximum_ticket: 0.8,
    expected_roi: 21,
    project_duration: 14,
    jobs_created: 60,
    investment_stage: 'GROWTH',
    project_type: 'AGRI_FOOD',
    seeking: ['EQUITY', 'EXPORT'],
    target_markets: ['France', 'Switzerland', 'USA Cosmetic Sector'],
    export_potential: 'HIGH',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'Direct access to 400+ organic citrus farms in Cap Bon with high-margin essential oil extraction technology.',
    description: 'Installation of supercritical CO2 extraction units to process organic neroli oil, orange blossom water, and botanical extracts for international luxury perfume & cosmetic brands.',
    is_verified: true,
    featured: false,
    project_status: 'PUBLISHED',
    email: 'info@capbonbio.tn',
    phone: '+216 72 280 910'
  },
  {
    id: 'proj_tataouine_solar',
    project_code: 'INV-2026-007',
    title: 'Tataouine Sahara Clean Hydrogen & PV Project',
    company_name: 'Sahara Green Energy Tech',
    promoter_name: 'Nizar Belhadj',
    city: 'Tataouine',
    governorate_id: 'gov_tataouine',
    sector_id: 'sec_energy',
    investment_required: 35.0,
    equity_required: 10.0,
    debt_required: 25.0,
    minimum_ticket: 1.0,
    maximum_ticket: 5.0,
    expected_roi: 19,
    project_duration: 36,
    jobs_created: 310,
    investment_stage: 'R_AND_D',
    project_type: 'RENEWABLE_ENERGY',
    seeking: ['EQUITY', 'DEBT', 'PARTNERSHIP'],
    target_markets: ['European Union Green Energy Pipeline'],
    export_potential: 'HIGH',
    infrastructure_available: false,
    land_available: true,
    strategic_value: 'Unmatched solar irradiation levels (>3,000 kWh/m2/yr) with 500 hectares reserved by government concession.',
    description: 'Utility-scale 100MW solar farm coupled with a green hydrogen electrolyzer pilot to supply industrial clean fuel.',
    is_verified: true,
    featured: true,
    project_status: 'PUBLISHED',
    email: 'hydrogen@saharagreen.tn',
    phone: '+216 75 860 300'
  },
  {
    id: 'proj_tozeur_resort',
    project_code: 'INV-2026-008',
    title: 'Tozeur Oasis Luxury Sustainable Eco-Lodge & Spa',
    company_name: 'Sahara Heritage Hospitality',
    promoter_name: 'Olfa Zarrouk',
    city: 'Tozeur',
    governorate_id: 'gov_tozeur',
    sector_id: 'sec_tourism',
    investment_required: 3.9,
    equity_required: 1.5,
    debt_required: 2.4,
    minimum_ticket: 0.2,
    maximum_ticket: 1.0,
    expected_roi: 20,
    project_duration: 16,
    jobs_created: 50,
    investment_stage: 'GREENFIELD',
    project_type: 'TOURISM',
    seeking: ['EQUITY', 'PARTNERSHIP'],
    target_markets: ['European Eco-Tourists', 'GCC Luxury Travelers'],
    export_potential: 'MEDIUM',
    infrastructure_available: true,
    land_available: true,
    strategic_value: 'Located in the historic palm groves of Tozeur, minutes from Tozeur-Nefta International Airport.',
    description: 'A 40-suite bioclimatic eco-resort combining traditional desert architecture, solar thermal heating, organic date palm dining, and wellness retreat facilities.',
    is_verified: true,
    featured: false,
    project_status: 'PUBLISHED',
    email: 'olfa@saharaheritage.tn',
    phone: '+216 76 450 890'
  }
];

// ── Persistence ─────────────────────────────────────────────────────────────
// Supabase is the source of truth. The bundled seed data is only shown when the
// database cannot be reached at all, so the investment pages never render empty
// on a bad connection.
//
// Earlier versions wrote every new record to localStorage and ignored database
// errors, which left "published" records that existed on one device only. Those
// leftovers are still read (flagged `_localOnly`) and are pushed to the database
// the next time their owner is signed in.

const STORAGE_KEYS = {
  PROJECTS: 'investraders_custom_projects',
  ORGS: 'investraders_custom_organizations',
  VEHICLES: 'investraders_custom_vehicles',
};

function readStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : [];
  } catch {
    return [];
  }
}

function writeStorage(key, items) {
  if (typeof window === 'undefined') return;
  try {
    if (items.length) localStorage.setItem(key, JSON.stringify(items));
    else localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}

const slugify = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function fail(error, action) {
  const message = error?.code === '42501' || /row-level security/i.test(error?.message || '')
    ? `You do not have permission to ${action}. Please sign in with the account that owns it.`
    : error?.message || `Could not ${action}.`;
  const wrapped = new Error(message);
  wrapped.code = error?.code;
  return wrapped;
}

// The UI reads an image under several historical names; the database stores one.
const withProjectImage = (row) => {
  const image = row.image_url || null;
  return { ...row, image_url: image, photo_url: image, image, logo: image };
};
const withOrgLogo = (row) => {
  const logo = row.logo_url || row.logo || null;
  return { ...row, logo, logo_url: logo, image_url: logo, photo_url: logo };
};

function projectRow(payload) {
  const { photo_url, image, logo, _localOnly, ...rest } = payload;
  const picture = payload.image_url ?? photo_url ?? image ?? logo;
  return picture !== undefined ? { ...rest, image_url: picture || null } : rest;
}

function orgRow(payload) {
  const { photo_url, image, image_url, _localOnly, ...rest } = payload;
  const picture = payload.logo_url ?? payload.logo ?? image_url ?? photo_url ?? image;
  return picture !== undefined ? { ...rest, logo: picture || null, logo_url: picture || null } : rest;
}

const vehicleRow = ({ _localOnly, ...rest }) => rest;

/**
 * Read a table. Returns { rows, reachable } — `reachable` is false only when the
 * request itself failed, which is when seed data may stand in.
 */
async function readTable(table, limit = 500) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(limit);
    if (error) return { rows: [], reachable: false };
    return { rows: data || [], reachable: true };
  } catch {
    return { rows: [], reachable: false };
  }
}

const synced = new Set();

/** Push records an older version kept only on this device, once per session and table. */
async function syncLocalOnly(table, storageKey, toRow, existingIds) {
  const local = readStorage(storageKey);
  const pending = local.filter((item) => !existingIds.has(item.id));
  if (pending.length !== local.length) writeStorage(storageKey, pending);
  if (!pending.length || synced.has(table)) return pending;
  synced.add(table);

  const { data: { session } = {} } = await supabase.auth.getSession().catch(() => ({ data: {} }));
  if (!session?.user) return pending;

  const stillLocal = [];
  for (const item of pending) {
    // Only the owner may publish it; anything else stays where it is.
    if (item.user_id && item.user_id !== session.user.id) { stillLocal.push(item); continue; }
    const { error } = await supabase.from(table).insert(toRow({ ...item, user_id: item.user_id || session.user.id }));
    if (error && error.code !== '23505') stillLocal.push(item);
  }
  writeStorage(storageKey, stillLocal);
  return stillLocal;
}

async function listWithFallback({ table, storageKey, toRow, decorate, seed, limit }) {
  const { rows, reachable } = await readTable(table, limit);
  if (!reachable) return seed.map(decorate);
  const leftovers = storageKey ? await syncLocalOnly(table, storageKey, toRow, new Set(rows.map((r) => r.id))) : [];
  return [...leftovers.map((item) => ({ ...decorate(item), _localOnly: true })), ...rows.map(decorate)];
}

const matches = (item, criteria) => Object.entries(criteria).every(([key, value]) => item[key] === value);

export const base44 = {
  entities: {
    Governorate: {
      list: async (_order, limit = 50) => {
        const { rows } = await readTable('Governorate', limit);
        return rows.length ? rows : INITIAL_GOVERNORATES;
      },
      get: async (id) => (await base44.entities.Governorate.list()).find((g) => g.id === id) || null,
    },

    Sector: {
      list: async (_order, limit = 50) => {
        const { rows } = await readTable('Sector', limit);
        return rows.length ? rows : INITIAL_SECTORS;
      },
      get: async (id) => (await base44.entities.Sector.list()).find((s) => s.id === id) || null,
    },

    InvestmentProject: {
      list: (_order, limit = 500) => listWithFallback({
        table: 'InvestmentProject', storageKey: STORAGE_KEYS.PROJECTS, toRow: projectRow, decorate: withProjectImage, seed: INITIAL_PROJECTS, limit,
      }),

      filter: async (criteria = {}, order, limit = 500) => {
        const all = await base44.entities.InvestmentProject.list(order, limit);
        return all.filter((project) => Object.entries(criteria).every(([key, value]) => {
          // A newly submitted opportunity is listed while it awaits verification.
          if (key === 'project_status' && value === 'PUBLISHED') {
            return !project.project_status || project.project_status === 'PUBLISHED' || project.project_status === 'SUBMITTED';
          }
          return project[key] === value;
        }));
      },

      get: async (id) => {
        const { data, error } = await supabase.from('InvestmentProject').select('*').eq('id', id).maybeSingle();
        if (!error && data) return withProjectImage(data);
        const fallback = (await base44.entities.InvestmentProject.list()).find((item) => item.id === id);
        if (!fallback) throw new Error('Project not found');
        return fallback;
      },

      create: async (payload) => {
        const row = projectRow({
          id: payload.id || uid('proj'),
          project_code: payload.project_code || `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          project_status: 'PUBLISHED',
          seeking: [],
          target_markets: [],
          export_potential: 'MEDIUM',
          infrastructure_available: true,
          land_available: true,
          ...payload,
        });
        const { data, error } = await supabase.from('InvestmentProject').insert(row).select().single();
        if (error) throw fail(error, 'publish this opportunity');
        return withProjectImage(data);
      },

      update: async (id, payload) => {
        const { data, error } = await supabase.from('InvestmentProject').update(projectRow(payload)).eq('id', id).select();
        if (error) throw fail(error, 'update this opportunity');
        if (!data?.length) throw fail({ code: '42501' }, 'update this opportunity');
        return withProjectImage(data[0]);
      },

      delete: async (id) => {
        const { data, error } = await supabase.from('InvestmentProject').delete().eq('id', id).select('id');
        if (error) throw fail(error, 'delete this opportunity');
        const local = readStorage(STORAGE_KEYS.PROJECTS);
        const remaining = local.filter((p) => p.id !== id);
        if (remaining.length !== local.length) writeStorage(STORAGE_KEYS.PROJECTS, remaining);
        else if (!data?.length) throw fail({ code: '42501' }, 'delete this opportunity');
        return true;
      },
    },

    ProjectView: {
      // Analytics only: a failure here must never get in the way of the page.
      create: async (payload) => {
        const { error } = await supabase.from('ProjectView').insert(payload);
        return error ? null : payload;
      },
    },

    SavedInvestment: {
      filter: async (criteria = {}) => {
        const { data, error } = await supabase.from('SavedInvestment').select('*').match(criteria);
        return error ? [] : data || [];
      },
      create: async (payload) => {
        const { data, error } = await supabase.from('SavedInvestment').insert(payload).select().single();
        if (error) throw fail(error, 'save this opportunity');
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('SavedInvestment').delete().eq('id', id);
        if (error) throw fail(error, 'remove this saved opportunity');
        return true;
      },
    },

    InvestorInterest: {
      create: async (payload) => {
        const { data, error } = await supabase.from('InvestorInterest').insert({ status: 'NEW', ...payload }).select().single();
        if (error) throw fail(error, 'send your interest');
        return data;
      },
      // Row-level security returns only what the caller may see: their own requests,
      // interest in their own projects, or everything for an administrator.
      list: async () => {
        const { data, error } = await supabase.from('InvestorInterest').select('*').order('created_date', { ascending: false });
        return error ? [] : data || [];
      },
      update: async (id, payload) => {
        const { error } = await supabase.from('InvestorInterest').update(payload).eq('id', id);
        if (error) throw fail(error, 'update this request');
        return true;
      },
    },

    InvestmentOrganization: {
      list: (_order, limit = 500) => listWithFallback({
        table: 'InvestmentOrganization', storageKey: STORAGE_KEYS.ORGS, toRow: orgRow, decorate: withOrgLogo, seed: INITIAL_ORGANIZATIONS, limit,
      }),

      filter: async (criteria = {}, order, limit = 500) => (await base44.entities.InvestmentOrganization.list(order, limit)).filter((org) => matches(org, criteria)),

      get: async (idOrSlug) => {
        if (!idOrSlug) return null;
        const all = await base44.entities.InvestmentOrganization.list();
        return all.find((org) => org.id === idOrSlug || org.slug === idOrSlug) || null;
      },

      create: async (payload) => {
        const row = orgRow({
          id: payload.id || uid('org'),
          slug: payload.slug || `${slugify(payload.display_name) || 'investor'}-${Date.now().toString(36).slice(-4)}`,
          active: true,
          investment_focus: [],
          investment_stages: [],
          geographic_focus: ['Tunisia'],
          preferred_currencies: ['TND'],
          ...payload,
        });
        const { data, error } = await supabase.from('InvestmentOrganization').insert(row).select().single();
        if (error) throw fail(error, 'register this investor');
        return withOrgLogo(data);
      },

      update: async (idOrSlug, payload) => {
        const current = await base44.entities.InvestmentOrganization.get(idOrSlug);
        const id = current?.id || idOrSlug;
        const { data, error } = await supabase.from('InvestmentOrganization').update(orgRow(payload)).eq('id', id).select();
        if (error) throw fail(error, 'update this investor profile');
        if (!data?.length) throw fail({ code: '42501' }, 'update this investor profile');
        return withOrgLogo(data[0]);
      },

      delete: async (id) => {
        const { data, error } = await supabase.from('InvestmentOrganization').delete().eq('id', id).select('id');
        if (error) throw fail(error, 'remove this investor');
        const local = readStorage(STORAGE_KEYS.ORGS);
        const remaining = local.filter((o) => o.id !== id);
        if (remaining.length !== local.length) writeStorage(STORAGE_KEYS.ORGS, remaining);
        else if (!data?.length) throw fail({ code: '42501' }, 'remove this investor');
        return true;
      },
    },

    InvestmentVehicle: {
      list: (_order, limit = 500) => listWithFallback({
        table: 'InvestmentVehicle', storageKey: STORAGE_KEYS.VEHICLES, toRow: vehicleRow, decorate: (v) => v, seed: INITIAL_VEHICLES, limit,
      }),

      filter: async (criteria = {}, order, limit = 500) => (await base44.entities.InvestmentVehicle.list(order, limit)).filter((v) => matches(v, criteria)),

      get: async (idOrSlug) => {
        if (!idOrSlug) return null;
        const wanted = String(idOrSlug).toLowerCase().trim();
        const all = await base44.entities.InvestmentVehicle.list();
        return all.find((v) => String(v.id).toLowerCase() === wanted || slugify(v.name) === wanted || String(v.name || '').toLowerCase() === wanted) || null;
      },

      create: async (payload) => {
        const row = vehicleRow({ id: payload.id || uid('fund'), active: true, investment_stages: [], sector_focus: [], geographic_focus: [], ...payload });
        const { data, error } = await supabase.from('InvestmentVehicle').insert(row).select().single();
        if (error) throw fail(error, 'add this fund');
        return data;
      },
    },
  },
};
