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

// Local storage persistence keys
const STORAGE_KEYS = {
  PROJECTS: 'investraders_custom_projects',
  ORGS: 'investraders_custom_organizations',
  VEHICLES: 'investraders_custom_vehicles',
  INTERESTS: 'investraders_custom_interests',
  SAVED: 'investraders_saved_investments',
  VIEWS: 'investraders_project_views',
  DELETED_PROJECTS: 'investraders_deleted_projects',
  DELETED_ORGS: 'investraders_deleted_orgs'
};

function readStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeStorage(key, items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {}
}

function deduplicateById(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

// Local store memory fallback
let governoratesStore = [...INITIAL_GOVERNORATES];
let sectorsStore = [...INITIAL_SECTORS];
const initialDeletedProjects = readStorage(STORAGE_KEYS.DELETED_PROJECTS);
const initialDeletedOrgs = readStorage(STORAGE_KEYS.DELETED_ORGS);
let projectsStore = deduplicateById([...readStorage(STORAGE_KEYS.PROJECTS), ...INITIAL_PROJECTS]).filter((p) => !initialDeletedProjects.includes(p.id));
let organizationsStore = deduplicateById([...readStorage(STORAGE_KEYS.ORGS), ...INITIAL_ORGANIZATIONS]).filter((o) => !initialDeletedOrgs.includes(o.id));
let vehiclesStore = deduplicateById([...readStorage(STORAGE_KEYS.VEHICLES), ...INITIAL_VEHICLES]);
let projectViewsStore = [...readStorage(STORAGE_KEYS.VIEWS)];
let savedInvestmentsStore = [...readStorage(STORAGE_KEYS.SAVED)];
let investorInterestsStore = [...readStorage(STORAGE_KEYS.INTERESTS)];

export const base44 = {
  entities: {
    Governorate: {
      list: async (order = '-created_date', limit = 50) => {
        try {
          const { data, error } = await supabase.from('Governorate').select('*').limit(limit);
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
        return governoratesStore;
      },
      get: async (id) => {
        try {
          const { data, error } = await supabase.from('Governorate').select('*').eq('id', id).single();
          if (!error && data) return data;
        } catch (e) {}
        return governoratesStore.find((g) => g.id === id) || null;
      }
    },

    Sector: {
      list: async (order = '-created_date', limit = 50) => {
        try {
          const { data, error } = await supabase.from('Sector').select('*').limit(limit);
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
        return sectorsStore;
      },
      get: async (id) => {
        try {
          const { data, error } = await supabase.from('Sector').select('*').eq('id', id).single();
          if (!error && data) return data;
        } catch (e) {}
        return sectorsStore.find((s) => s.id === id) || null;
      }
    },

    InvestmentProject: {
      filter: async (criteria = {}, order = '-created_date', limit = 500) => {
        const all = await base44.entities.InvestmentProject.list(order, limit);
        return all.filter((p) => {
          return Object.entries(criteria).every(([key, val]) => {
            // Include newly submitted or published opportunities on the platform
            if (key === 'project_status' && val === 'PUBLISHED') {
              return p.project_status === 'PUBLISHED' || p.project_status === 'SUBMITTED' || !p.project_status;
            }
            return p[key] === val;
          });
        });
      },

      list: async (order = '-created_date', limit = 500) => {
        const custom = readStorage(STORAGE_KEYS.PROJECTS);
        const deleted = readStorage(STORAGE_KEYS.DELETED_PROJECTS);
        try {
          const { data, error } = await supabase.from('InvestmentProject').select('*').limit(limit);
          if (!error && data && data.length > 0) {
            const combined = deduplicateById([...custom, ...data]).filter((p) => !deleted.includes(p.id));
            projectsStore = combined;
            return combined;
          }
        } catch (e) {}

        const combined = deduplicateById([...custom, ...INITIAL_PROJECTS]).filter((p) => !deleted.includes(p.id));
        projectsStore = combined;
        return combined;
      },

      get: async (id) => {
        const custom = readStorage(STORAGE_KEYS.PROJECTS);
        const localItem = custom.find((p) => p.id === id);
        try {
          const { data, error } = await supabase.from('InvestmentProject').select('*').eq('id', id).single();
          if (!error && data) {
            const imageVal = data.image_url || localItem?.image_url || localItem?.photo_url || localItem?.image || localItem?.logo || null;
            return {
              ...data,
              ...(localItem || {}),
              image_url: imageVal,
              photo_url: imageVal,
              image: imageVal,
              logo: imageVal
            };
          }
        } catch (e) {}
        const all = await base44.entities.InvestmentProject.list();
        const p = all.find((item) => item.id === id);
        if (!p) throw new Error('Project not found');
        return p;
      },

      create: async (payload) => {
        const id = payload.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const imageVal = payload.image_url || payload.photo_url || payload.image || payload.logo || null;
        const newProj = {
          id,
          project_code: payload.project_code || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          created_date: new Date().toISOString(),
          project_status: payload.project_status || 'PUBLISHED',
          is_verified: payload.is_verified ?? false,
          featured: payload.featured ?? false,
          seeking: payload.seeking || [],
          target_markets: payload.target_markets || [],
          export_potential: payload.export_potential || 'MEDIUM',
          infrastructure_available: payload.infrastructure_available ?? true,
          land_available: payload.land_available ?? true,
          ...payload,
          image_url: imageVal,
          photo_url: imageVal,
          image: imageVal,
          logo: imageVal
        };

        // 1. Persist to localStorage immediately
        const custom = readStorage(STORAGE_KEYS.PROJECTS);
        writeStorage(STORAGE_KEYS.PROJECTS, [newProj, ...custom]);

        // 2. Try Supabase insert with sanitized columns
        const { photo_url, image, logo, ...cleanForSupabase } = newProj;
        try {
          await supabase.from('InvestmentProject').insert(cleanForSupabase);
        } catch (e) {
          console.warn('Supabase project insert queued locally:', e);
        }

        projectsStore = deduplicateById([newProj, ...projectsStore]);
        return newProj;
      },

      update: async (id, payload) => {
        const imageVal = payload.image_url || payload.photo_url || payload.image || payload.logo;
        const currentItem = projectsStore.find((p) => p.id === id) || INITIAL_PROJECTS.find((p) => p.id === id) || {};
        const updatedItem = {
          ...currentItem,
          ...payload,
          id,
          ...(imageVal !== undefined ? { image_url: imageVal, photo_url: imageVal, image: imageVal, logo: imageVal } : {})
        };

        const { photo_url, image, logo, ...cleanForSupabase } = payload;
        const supabaseUpdate = {
          ...cleanForSupabase,
          ...(imageVal !== undefined ? { image_url: imageVal } : {})
        };
        try {
          await supabase.from('InvestmentProject').update(supabaseUpdate).eq('id', id);
        } catch (e) {
          console.warn('Supabase project update warning:', e);
        }

        const custom = readStorage(STORAGE_KEYS.PROJECTS);
        const exists = custom.some((p) => p.id === id);
        const newCustom = exists
          ? custom.map((p) => (p.id === id ? updatedItem : p))
          : [updatedItem, ...custom];
        writeStorage(STORAGE_KEYS.PROJECTS, newCustom);

        projectsStore = projectsStore.map((p) => (p.id === id ? updatedItem : p));
        if (!projectsStore.some((p) => p.id === id)) {
          projectsStore = [updatedItem, ...projectsStore];
        }
        return updatedItem;
      },

      delete: async (id) => {
        try {
          await supabase.from('InvestmentProject').delete().eq('id', id);
        } catch (e) {}

        const custom = readStorage(STORAGE_KEYS.PROJECTS).filter((p) => p.id !== id);
        writeStorage(STORAGE_KEYS.PROJECTS, custom);

        const deleted = readStorage(STORAGE_KEYS.DELETED_PROJECTS);
        if (!deleted.includes(id)) {
          writeStorage(STORAGE_KEYS.DELETED_PROJECTS, [...deleted, id]);
        }

        projectsStore = projectsStore.filter((p) => p.id !== id);
        return true;
      }
    },

    ProjectView: {
      create: async (payload) => {
        const view = { id: `view_${Date.now()}`, timestamp: new Date().toISOString(), ...payload };
        try {
          await supabase.from('ProjectView').insert(view);
        } catch (e) {}
        projectViewsStore.push(view);
        writeStorage(STORAGE_KEYS.VIEWS, projectViewsStore);
        return view;
      }
    },

    SavedInvestment: {
      filter: async (criteria = {}) => {
        try {
          let query = supabase.from('SavedInvestment').select('*');
          Object.entries(criteria).forEach(([k, v]) => {
            query = query.eq(k, v);
          });
          const { data, error } = await query;
          if (!error && data) return data;
        } catch (e) {}

        const custom = readStorage(STORAGE_KEYS.SAVED);
        return custom.filter((item) => {
          return Object.entries(criteria).every(([k, v]) => item[k] === v);
        });
      },

      create: async (payload) => {
        const saved = { id: `save_${Date.now()}`, created_date: new Date().toISOString(), ...payload };
        const custom = readStorage(STORAGE_KEYS.SAVED);
        writeStorage(STORAGE_KEYS.SAVED, [saved, ...custom]);
        try {
          await supabase.from('SavedInvestment').insert(saved);
        } catch (e) {}
        savedInvestmentsStore.push(saved);
        return saved;
      },

      delete: async (id) => {
        try {
          await supabase.from('SavedInvestment').delete().eq('id', id);
        } catch (e) {}
        const custom = readStorage(STORAGE_KEYS.SAVED).filter((s) => s.id !== id && s.project_id !== id);
        writeStorage(STORAGE_KEYS.SAVED, custom);
        savedInvestmentsStore = savedInvestmentsStore.filter((s) => s.id !== id);
        return true;
      }
    },

    InvestorInterest: {
      create: async (payload) => {
        const interest = { id: `interest_${Date.now()}`, created_date: new Date().toISOString(), status: 'NEW', ...payload };
        const custom = readStorage(STORAGE_KEYS.INTERESTS);
        writeStorage(STORAGE_KEYS.INTERESTS, [interest, ...custom]);
        try {
          await supabase.from('InvestorInterest').insert(interest);
        } catch (e) {}
        investorInterestsStore.push(interest);
        return interest;
      },
      list: async () => {
        try {
          const { data, error } = await supabase.from('InvestorInterest').select('*');
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
        return readStorage(STORAGE_KEYS.INTERESTS);
      }
    },

    InvestmentOrganization: {
      filter: async (criteria = {}, order = '-created_at', limit = 500) => {
        const all = await base44.entities.InvestmentOrganization.list(order, limit);
        return all.filter((org) => {
          return Object.entries(criteria).every(([key, val]) => org[key] === val);
        });
      },

      list: async (order = '-created_at', limit = 500) => {
        const custom = readStorage(STORAGE_KEYS.ORGS);
        const deleted = readStorage(STORAGE_KEYS.DELETED_ORGS);
        try {
          const { data, error } = await supabase.from('InvestmentOrganization').select('*').limit(limit);
          if (!error && data && data.length > 0) {
            const combined = deduplicateById([...custom, ...data]).filter((o) => !deleted.includes(o.id));
            organizationsStore = combined;
            return combined;
          }
        } catch (e) {}

        const combined = deduplicateById([...custom, ...INITIAL_ORGANIZATIONS]).filter((o) => !deleted.includes(o.id));
        organizationsStore = combined;
        return combined;
      },

      get: async (idOrSlug) => {
        const custom = readStorage(STORAGE_KEYS.ORGS);
        const localItem = custom.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
        try {
          const { data, error } = await supabase.from('InvestmentOrganization').select('*').or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).single();
          if (!error && data) {
            const logoVal = data.logo_url || data.logo || localItem?.logo_url || localItem?.logo || localItem?.image_url || localItem?.photo_url || null;
            return {
              ...data,
              ...(localItem || {}),
              logo: logoVal,
              logo_url: logoVal,
              image_url: logoVal,
              photo_url: logoVal
            };
          }
        } catch (e) {}
        const all = await base44.entities.InvestmentOrganization.list();
        const org = all.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
        if (!org) return null;
        return org;
      },

      create: async (payload) => {
        const id = payload.id || `org_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const baseSlug = payload.display_name ? payload.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `org-${Date.now()}`;
        const logoVal = payload.logo || payload.logo_url || payload.image_url || null;
        const newOrg = {
          id,
          slug: payload.slug || `${baseSlug}-${Date.now().toString().slice(-4)}`,
          created_at: new Date().toISOString(),
          verification_status: payload.verification_status || 'PENDING',
          active: payload.active ?? true,
          official: payload.official ?? false,
          featured: payload.featured ?? false,
          partner: payload.partner ?? false,
          investment_focus: payload.investment_focus || [],
          investment_stages: payload.investment_stages || [],
          geographic_focus: payload.geographic_focus || ['Tunisia'],
          preferred_currencies: payload.preferred_currencies || ['TND'],
          ...payload,
          logo: logoVal,
          logo_url: logoVal,
          image_url: logoVal,
          photo_url: logoVal
        };

        // 1. Persist to localStorage immediately
        const custom = readStorage(STORAGE_KEYS.ORGS);
        writeStorage(STORAGE_KEYS.ORGS, [newOrg, ...custom]);

        // 2. Try Supabase insert with clean fields
        const { photo_url, image, ...cleanForSupabase } = newOrg;
        try {
          await supabase.from('InvestmentOrganization').insert(cleanForSupabase);
        } catch (e) {
          console.warn('Supabase org insert queued locally:', e);
        }

        organizationsStore = deduplicateById([newOrg, ...organizationsStore]);
        return newOrg;
      },

      update: async (id, payload) => {
        const logoVal = payload.logo || payload.logo_url || payload.image_url;
        const currentItem = organizationsStore.find((o) => o.id === id || o.slug === id) || INITIAL_ORGANIZATIONS.find((o) => o.id === id || o.slug === id) || {};
        const targetId = currentItem.id || id;
        const updatedItem = {
          ...currentItem,
          ...payload,
          id: targetId,
          ...(logoVal !== undefined ? { logo: logoVal, logo_url: logoVal, image_url: logoVal, photo_url: logoVal } : {})
        };

        const { photo_url, image, ...cleanForSupabase } = payload;
        const supabaseUpdate = {
          ...cleanForSupabase,
          ...(logoVal !== undefined ? { logo: logoVal, logo_url: logoVal } : {})
        };
        try {
          await supabase.from('InvestmentOrganization').update(supabaseUpdate).eq('id', targetId);
        } catch (e) {
          console.warn('Supabase org update warning:', e);
        }

        const custom = readStorage(STORAGE_KEYS.ORGS);
        const exists = custom.some((o) => o.id === targetId);
        const newCustom = exists
          ? custom.map((o) => (o.id === targetId ? updatedItem : o))
          : [updatedItem, ...custom];
        writeStorage(STORAGE_KEYS.ORGS, newCustom);

        organizationsStore = organizationsStore.map((o) => (o.id === targetId ? updatedItem : o));
        if (!organizationsStore.some((o) => o.id === targetId)) {
          organizationsStore = [updatedItem, ...organizationsStore];
        }
        return updatedItem;
      },

      delete: async (id) => {
        try {
          await supabase.from('InvestmentOrganization').delete().eq('id', id);
        } catch (e) {}

        const custom = readStorage(STORAGE_KEYS.ORGS).filter((o) => o.id !== id);
        writeStorage(STORAGE_KEYS.ORGS, custom);

        const deleted = readStorage(STORAGE_KEYS.DELETED_ORGS);
        if (!deleted.includes(id)) {
          writeStorage(STORAGE_KEYS.DELETED_ORGS, [...deleted, id]);
        }

        organizationsStore = organizationsStore.filter((o) => o.id !== id);
        return true;
      }
    },

    InvestmentVehicle: {
      filter: async (criteria = {}, order = '-created_at', limit = 500) => {
        const all = await base44.entities.InvestmentVehicle.list(order, limit);
        return all.filter((v) => {
          return Object.entries(criteria).every(([key, val]) => v[key] === val);
        });
      },

      list: async (order = '-created_at', limit = 500) => {
        const custom = readStorage(STORAGE_KEYS.VEHICLES);
        try {
          const { data, error } = await supabase.from('InvestmentVehicle').select('*').limit(limit);
          if (!error && data && data.length > 0) {
            const combined = deduplicateById([...custom, ...data]);
            vehiclesStore = combined;
            return combined;
          }
        } catch (e) {}

        const combined = deduplicateById([...custom, ...INITIAL_VEHICLES]);
        vehiclesStore = combined;
        return combined;
      },

      get: async (idOrSlug) => {
        if (!idOrSlug) return null;
        const normalized = String(idOrSlug).toLowerCase().trim();
        try {
          const { data, error } = await supabase
            .from('InvestmentVehicle')
            .select('*')
            .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
            .single();
          if (!error && data) return data;
        } catch (e) {}
        const all = await base44.entities.InvestmentVehicle.list();
        const v = all.find((item) => {
          if (!item) return false;
          if (item.id === idOrSlug || String(item.id).toLowerCase() === normalized) return true;
          if (item.slug && item.slug.toLowerCase() === normalized) return true;
          if (item.name) {
            const nameSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            if (nameSlug === normalized || item.name.toLowerCase() === normalized) return true;
          }
          return false;
        });
        return v || null;
      },

      create: async (payload) => {
        const id = payload.id || `fund_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newVehicle = {
          id,
          created_at: new Date().toISOString(),
          active: payload.active ?? true,
          investment_stages: payload.investment_stages || [],
          sector_focus: payload.sector_focus || [],
          geographic_focus: payload.geographic_focus || [],
          ...payload
        };

        const custom = readStorage(STORAGE_KEYS.VEHICLES);
        writeStorage(STORAGE_KEYS.VEHICLES, [newVehicle, ...custom]);

        try {
          await supabase.from('InvestmentVehicle').insert(newVehicle);
        } catch (e) {}

        vehiclesStore = deduplicateById([newVehicle, ...vehiclesStore]);
        return newVehicle;
      }
    }
  }
};
