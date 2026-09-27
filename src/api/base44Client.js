import { supabase } from '@/lib/supabase';

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

// Local store memory fallback
let governoratesStore = [...INITIAL_GOVERNORATES];
let sectorsStore = [...INITIAL_SECTORS];
let projectsStore = [...INITIAL_PROJECTS];
let projectViewsStore = [];
let savedInvestmentsStore = [];
let investorInterestsStore = [];

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
        try {
          let query = supabase.from('InvestmentProject').select('*');
          Object.entries(criteria).forEach(([key, val]) => {
            query = query.eq(key, val);
          });
          const { data, error } = await query.limit(limit);
          if (!error && data && data.length > 0) return data;
        } catch (e) {}

        return projectsStore.filter((p) => {
          return Object.entries(criteria).every(([key, val]) => p[key] === val);
        });
      },

      list: async (order = '-created_date', limit = 500) => {
        try {
          const { data, error } = await supabase.from('InvestmentProject').select('*').limit(limit);
          if (!error && data && data.length > 0) return data;
        } catch (e) {}
        return projectsStore;
      },

      get: async (id) => {
        try {
          const { data, error } = await supabase.from('InvestmentProject').select('*').eq('id', id).single();
          if (!error && data) return data;
        } catch (e) {}
        const p = projectsStore.find((item) => item.id === id);
        if (!p) throw new Error('Project not found');
        return p;
      },

      create: async (payload) => {
        const id = payload.id || `proj_${Date.now()}`;
        const newProj = {
          id,
          project_code: payload.project_code || `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          created_date: new Date().toISOString(),
          project_status: payload.project_status || 'PUBLISHED',
          is_verified: payload.is_verified ?? true,
          featured: payload.featured ?? false,
          ...payload
        };

        try {
          await supabase.from('InvestmentProject').insert(newProj);
        } catch (e) {}

        projectsStore = [newProj, ...projectsStore];
        return newProj;
      },

      update: async (id, payload) => {
        try {
          await supabase.from('InvestmentProject').update(payload).eq('id', id);
        } catch (e) {}

        projectsStore = projectsStore.map((p) => (p.id === id ? { ...p, ...payload } : p));
        return projectsStore.find((p) => p.id === id);
      },

      delete: async (id) => {
        try {
          await supabase.from('InvestmentProject').delete().eq('id', id);
        } catch (e) {}

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

        return savedInvestmentsStore.filter((item) => {
          return Object.entries(criteria).every(([k, v]) => item[k] === v);
        });
      },

      create: async (payload) => {
        const saved = { id: `save_${Date.now()}`, ...payload };
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
        savedInvestmentsStore = savedInvestmentsStore.filter((s) => s.id !== id);
        return true;
      }
    },

    InvestorInterest: {
      create: async (payload) => {
        const interest = { id: `interest_${Date.now()}`, created_date: new Date().toISOString(), ...payload };
        try {
          await supabase.from('InvestorInterest').insert(interest);
        } catch (e) {}
        investorInterestsStore.push(interest);
        return interest;
      }
    }
  }
};
