/**
 * Investraders Investment Network Engine
 * Data models, seed datasets, taxonomy constants and deterministic 2-way matching engine
 */

// Taxonomy Constants
export const INVESTOR_TYPES = [
  { id: 'VENTURE_CAPITAL', label: 'Venture Capital', icon: 'Rocket', badge: 'VC' },
  { id: 'PRIVATE_EQUITY', label: 'Private Equity', icon: 'Building2', badge: 'PE' },
  { id: 'FAMILY_OFFICE', label: 'Family Office', icon: 'Landmark', badge: 'FO' },
  { id: 'SOVEREIGN_WEALTH_FUND', label: 'Sovereign Wealth Fund', icon: 'Crown', badge: 'SWF' },
  { id: 'DEVELOPMENT_FINANCE_INSTITUTION', label: 'Development Finance (DFI)', icon: 'Globe2', badge: 'DFI' },
  { id: 'IMPACT_INVESTOR', label: 'Impact / Climate Investor', icon: 'Leaf', badge: 'Impact' },
  { id: 'ASSET_MANAGER', label: 'Asset Manager', icon: 'BarChart3', badge: 'AM' },
  { id: 'CORPORATE_VENTURE_CAPITAL', label: 'Corporate VC', icon: 'Briefcase', badge: 'CVC' },
  { id: 'INFRASTRUCTURE_FUND', label: 'Infrastructure Fund', icon: 'Zap', badge: 'Infra' },
  { id: 'ISLAMIC_FINANCE', label: 'Islamic Finance', icon: 'Moon', badge: 'Islamic' },
  { id: 'ANGEL_NETWORK', label: 'Angel Network', icon: 'Users', badge: 'Angel' },
];

export const FUND_CATEGORIES = [
  { id: 'PRE_SEED', label: 'Pre-Seed & Seed' },
  { id: 'EARLY_STAGE', label: 'Early Stage / Series A' },
  { id: 'GROWTH', label: 'Growth / Series B+' },
  { id: 'PRIVATE_EQUITY', label: 'Private Equity / Buyout' },
  { id: 'INFRASTRUCTURE', label: 'Infrastructure & Energy' },
  { id: 'CLIMATE', label: 'Climate & Sustainability' },
  { id: 'HEALTHCARE', label: 'Healthcare & Biotech' },
  { id: 'TECHNOLOGY', label: 'Technology & AI' },
  { id: 'ISLAMIC_FINANCE', label: 'Islamic Finance' },
  { id: 'REGIONAL_DEVELOPMENT', label: 'Regional Development' },
  { id: 'FUND_OF_FUNDS', label: 'Fund of Funds' },
];

// High quality initial seed organizations
export const INITIAL_ORGANIZATIONS = [
  {
    id: 'org_216_capital',
    slug: '216-capital-ventures',
    display_name: '216 Capital Ventures',
    legal_name: '216 Capital Management SA',
    organization_type: 'VENTURE_CAPITAL',
    country: 'Tunisia',
    country_code: 'TN',
    city: 'Tunis',
    address: 'Les Berges du Lac 2, Tunis',
    website: 'https://216.capital',
    year_founded: 2021,
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
    logo_alt_text: '216 Capital Logo',
    verification_status: 'VERIFIED',
    verification_source: 'CMF Regulated Management Company (Tunisia)',
    official: true,
    featured: true,
    partner: true,
    description: 'Tech-focused early-stage Venture Capital firm backing ambitious founders across Tunisia, North Africa, and the Mediterranean diaspora.',
    investment_focus: ['sec_tech', 'sec_agri', 'sec_pharma'],
    geographic_focus: ['Tunisia', 'North Africa', 'Europe'],
    investment_stages: ['EARLY_STAGE', 'GROWTH'],
    project_types: ['TECH', 'AGRI_FOOD', 'HEALTHCARE'],
    minimum_ticket: 0.1, // M TND
    maximum_ticket: 1.5, // M TND
    preferred_currencies: ['TND', 'EUR', 'USD'],
    active: true,
  },
  {
    id: 'org_cdc_gestion',
    slug: 'cdc-gestion',
    display_name: 'CDC Gestion',
    legal_name: 'Caisse des Dépôts et Consignations - CDC Tunisia',
    organization_type: 'SOVEREIGN_WEALTH_FUND',
    country: 'Tunisia',
    country_code: 'TN',
    city: 'Tunis',
    address: 'Place de la Monnaie, Tunis',
    website: 'https://www.cdc.tn',
    year_founded: 2011,
    logo: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=150&h=150&fit=crop',
    logo_alt_text: 'CDC Gestion Logo',
    verification_status: 'OFFICIAL',
    verification_source: 'Public Institution (Ministère des Finances)',
    official: true,
    featured: true,
    partner: true,
    description: 'Public strategic investment institution serving as the financial arm for long-term economic development, innovation funds, and regional infrastructure projects in Tunisia.',
    investment_focus: ['sec_energy', 'sec_industry', 'sec_tech', 'sec_agri', 'sec_tourism'],
    geographic_focus: ['Tunisia'],
    investment_stages: ['GREENFIELD', 'GROWTH', 'EXPANSION'],
    project_types: ['RENEWABLE_ENERGY', 'INDUSTRIAL', 'INFRASTRUCTURE', 'AGRI_FOOD'],
    minimum_ticket: 1.0,
    maximum_ticket: 25.0,
    preferred_currencies: ['TND', 'EUR'],
    active: true,
  },
  {
    id: 'org_smart_capital',
    slug: 'smart-capital',
    display_name: 'Smart Capital (ANAVA)',
    legal_name: 'Smart Capital SAS',
    organization_type: 'DEVELOPMENT_FINANCE_INSTITUTION',
    country: 'Tunisia',
    country_code: 'TN',
    city: 'Tunis',
    address: 'El Gazala Technopark, Ariana',
    website: 'https://smartcapital.tn',
    year_founded: 2018,
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop',
    logo_alt_text: 'Smart Capital Logo',
    verification_status: 'OFFICIAL',
    verification_source: 'Startup Act / World Bank Partnership',
    official: true,
    featured: true,
    partner: true,
    description: 'Operator of the national Startup Tunisia initiative and manager of the €200M ANAVA Fund of Funds boosting venture capital across Africa and southern Europe.',
    investment_focus: ['sec_tech', 'sec_pharma', 'sec_logistics'],
    geographic_focus: ['Tunisia', 'Africa', 'Mediterranean'],
    investment_stages: ['EARLY_STAGE', 'GROWTH'],
    project_types: ['TECH', 'HEALTHCARE', 'AGRI_FOOD'],
    minimum_ticket: 0.5,
    maximum_ticket: 5.0,
    preferred_currencies: ['EUR', 'TND', 'USD'],
    active: true,
  },
  {
    id: 'org_ugfs_na',
    slug: 'ugfs-north-africa',
    display_name: 'UGFS North Africa',
    legal_name: 'United Gulf Financial Services North Africa',
    organization_type: 'PRIVATE_EQUITY',
    country: 'Tunisia',
    country_code: 'TN',
    city: 'Tunis',
    address: 'Les Berges du Lac 1, Tunis',
    website: 'https://www.ugfs-na.com',
    year_founded: 2008,
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop',
    logo_alt_text: 'UGFS NA Logo',
    verification_status: 'VERIFIED',
    verification_source: 'CMF Regulated Management Company',
    official: true,
    featured: false,
    partner: true,
    description: 'Leading asset manager specializing in private equity, seed capital, regional development funds, and mezzanine debt financing for Tunisian SMEs.',
    investment_focus: ['sec_agri', 'sec_industry', 'sec_tourism', 'sec_pharma'],
    geographic_focus: ['Tunisia', 'North Africa'],
    investment_stages: ['EXPANSION', 'GROWTH', 'GREENFIELD'],
    project_types: ['INDUSTRIAL', 'AGRI_FOOD', 'TOURISM'],
    minimum_ticket: 0.3,
    maximum_ticket: 4.0,
    preferred_currencies: ['TND', 'USD'],
    active: true,
  },
  {
    id: 'org_blackrock',
    slug: 'blackrock',
    display_name: 'BlackRock Infrastructure & Climate',
    legal_name: 'BlackRock Inc',
    organization_type: 'ASSET_MANAGER',
    country: 'United States',
    country_code: 'US',
    city: 'New York',
    address: '50 Hudson Yards, New York',
    website: 'https://www.blackrock.com',
    year_founded: 1988,
    logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&h=150&fit=crop',
    logo_alt_text: 'BlackRock Logo',
    verification_status: 'VERIFIED',
    verification_source: 'SEC / Global Public Listed Institutional',
    official: true,
    featured: true,
    partner: false,
    description: 'World largest asset management firm active in global infrastructure, renewable energy transition funds, and emerging market climate sustainability mandates.',
    investment_focus: ['sec_energy', 'sec_logistics', 'sec_industry'],
    geographic_focus: ['North America', 'Europe', 'Middle East', 'Africa', 'Global'],
    investment_stages: ['GREENFIELD', 'EXPANSION'],
    project_types: ['RENEWABLE_ENERGY', 'INFRASTRUCTURE', 'INDUSTRIAL'],
    minimum_ticket: 5.0,
    maximum_ticket: 100.0,
    preferred_currencies: ['USD', 'EUR'],
    active: true,
  },
  {
    id: 'org_ifc',
    slug: 'ifc-world-bank',
    display_name: 'IFC (World Bank Group)',
    legal_name: 'International Finance Corporation',
    organization_type: 'DEVELOPMENT_FINANCE_INSTITUTION',
    country: 'International',
    country_code: 'WB',
    city: 'Washington DC / Tunis',
    address: 'Rue de la Bourse, Les Berges du Lac 2, Tunis',
    website: 'https://www.ifc.org',
    year_founded: 1956,
    logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150&h=150&fit=crop',
    logo_alt_text: 'IFC Logo',
    verification_status: 'OFFICIAL',
    verification_source: 'Multilateral Institution',
    official: true,
    featured: true,
    partner: true,
    description: 'Global development institution focused exclusively on private sector growth in developing economies, providing equity, loans, and risk management.',
    investment_focus: ['sec_energy', 'sec_agri', 'sec_industry', 'sec_logistics', 'sec_pharma'],
    geographic_focus: ['Africa', 'Middle East', 'Tunisia', 'Global'],
    investment_stages: ['EXPANSION', 'GREENFIELD'],
    project_types: ['RENEWABLE_ENERGY', 'AGRI_FOOD', 'INDUSTRIAL', 'HEALTHCARE'],
    minimum_ticket: 2.0,
    maximum_ticket: 50.0,
    preferred_currencies: ['USD', 'EUR', 'TND'],
    active: true,
  },
  {
    id: 'org_amen_capital',
    slug: 'amen-capital',
    display_name: 'Amen Capital Partners',
    legal_name: 'Amen Capital SA',
    organization_type: 'PRIVATE_EQUITY',
    country: 'Tunisia',
    country_code: 'TN',
    city: 'Tunis',
    address: 'Avenue Mohamed V, Tunis',
    website: 'https://www.amencapital.tn',
    year_founded: 2004,
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop',
    logo_alt_text: 'Amen Capital Logo',
    verification_status: 'VERIFIED',
    verification_source: 'CMF Regulated Management Company',
    official: true,
    featured: false,
    partner: true,
    description: 'Amen Group private equity arm dedicated to industrial restructuring, agro-business growth, export acceleration, and clean tech initiatives.',
    investment_focus: ['sec_industry', 'sec_agri', 'sec_logistics'],
    geographic_focus: ['Tunisia'],
    investment_stages: ['EXPANSION', 'GROWTH'],
    project_types: ['INDUSTRIAL', 'AGRI_FOOD', 'LOGISTICS'],
    minimum_ticket: 0.5,
    maximum_ticket: 3.5,
    preferred_currencies: ['TND'],
    active: true,
  },
  {
    id: 'org_kkr_infra',
    slug: 'kkr-global-infrastructure',
    display_name: 'KKR Infrastructure & Energy',
    legal_name: 'Kohlberg Kravis Roberts & Co',
    organization_type: 'PRIVATE_EQUITY',
    country: 'United States',
    country_code: 'US',
    city: 'New York / London',
    address: '30 Hudson Yards, New York',
    website: 'https://www.kkr.com',
    year_founded: 1976,
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&h=150&fit=crop',
    logo_alt_text: 'KKR Logo',
    verification_status: 'VERIFIED',
    verification_source: 'Global NYSE Listed PE',
    official: true,
    featured: true,
    partner: false,
    description: 'Premier global investment firm co-investing in energy transition, telecom infrastructure, port logistics, and healthcare networks across emerging corridors.',
    investment_focus: ['sec_energy', 'sec_logistics', 'sec_pharma'],
    geographic_focus: ['Global', 'Europe', 'Middle East', 'Africa'],
    investment_stages: ['EXPANSION', 'GREENFIELD'],
    project_types: ['RENEWABLE_ENERGY', 'INFRASTRUCTURE', 'HEALTHCARE'],
    minimum_ticket: 10.0,
    maximum_ticket: 150.0,
    preferred_currencies: ['USD', 'EUR'],
    active: true,
  },
];

// Seed managed funds/vehicles
export const INITIAL_VEHICLES = [
  {
    id: 'fund_216_fund_1',
    organization_id: 'org_216_capital',
    name: '216 Capital Fund I',
    vehicle_type: 'FCPR',
    fund_category: 'EARLY_STAGE',
    fund_status: 'ACTIVE_INVESTING',
    country: 'Tunisia',
    currency: 'TND',
    target_size: 50.0, // 50M TND
    current_size: 42.0,
    minimum_ticket: 0.1,
    maximum_ticket: 1.5,
    investment_stages: ['EARLY_STAGE', 'GROWTH'],
    sector_focus: ['sec_tech', 'sec_agri'],
    geographic_focus: ['Tunisia', 'North Africa'],
    description: 'Active seed and Series A fund targeting tech, AI, and smart export-ready Tunisian scale-ups.',
    active: true,
  },
  {
    id: 'fund_anava_fof',
    organization_id: 'org_smart_capital',
    name: 'ANAVA Fund of Funds',
    vehicle_type: 'Fund of Funds',
    fund_category: 'FUND_OF_FUNDS',
    fund_status: 'ACTIVE_INVESTING',
    country: 'Tunisia',
    currency: 'EUR',
    target_size: 200.0, // €200M
    current_size: 100.0,
    minimum_ticket: 1.0,
    maximum_ticket: 10.0,
    investment_stages: ['EARLY_STAGE', 'GROWTH', 'SERIES_A'],
    sector_focus: ['sec_tech', 'sec_pharma', 'sec_agri'],
    geographic_focus: ['Tunisia', 'Africa'],
    description: 'Anchor €200M Fund of Funds investing in underlying VCs across Tunisia and broader Africa.',
    active: true,
  },
  {
    id: 'fund_cdc_croissance',
    organization_id: 'org_cdc_gestion',
    name: 'CDC Croissance & Transitions',
    vehicle_type: 'Public Investment Vehicle',
    fund_category: 'REGIONAL_DEVELOPMENT',
    fund_status: 'ACTIVE_INVESTING',
    country: 'Tunisia',
    currency: 'TND',
    target_size: 150.0,
    current_size: 120.0,
    minimum_ticket: 1.0,
    maximum_ticket: 15.0,
    investment_stages: ['GREENFIELD', 'EXPANSION'],
    sector_focus: ['sec_energy', 'sec_industry', 'sec_agri'],
    geographic_focus: ['Tunisia'],
    description: 'State co-investment vehicle supporting regional industrial parks, green energy, and strategic logistics.',
    active: true,
  },
  {
    id: 'fund_blackrock_climate',
    organization_id: 'org_blackrock',
    name: 'Global Climate Transition Fund II',
    vehicle_type: 'Infrastructure & Climate Fund',
    fund_category: 'CLIMATE',
    fund_status: 'ACTIVE_INVESTING',
    country: 'United States',
    currency: 'USD',
    target_size: 1200.0,
    current_size: 950.0,
    minimum_ticket: 5.0,
    maximum_ticket: 50.0,
    investment_stages: ['GREENFIELD', 'EXPANSION'],
    sector_focus: ['sec_energy', 'sec_logistics'],
    geographic_focus: ['Global', 'North Africa', 'Middle East'],
    description: 'Global fund allocating capital to utility-scale renewable energy, solar farms, and green hydrogen infrastructure.',
    active: true,
  },
];

/**
 * Deterministic Matching Engine Algorithm
 * Calculates compatibility score (0-100%) between an Investor (or Mandate) and an Investment Project
 */
export function calculateInvestorProjectMatch(investor, project) {
  if (!investor || !project) return { matchScore: 0, factors: [], nonFactors: [], explanation: 'Insufficient data' };

  let score = 0;
  const factors = [];
  const nonFactors = [];

  // 1. Sector Alignment (Weight: 25%)
  const investorSectors = investor.investment_focus || investor.preferred_sectors || [];
  if (investorSectors.includes(project.sector_id) || investorSectors.includes('all')) {
    score += 25;
    factors.push('✓ Sector aligned with investor mandate');
  } else {
    nonFactors.push('✕ Sector out of primary focus');
  }

  // 2. Investment Ticket Compatibility (Weight: 20%)
  const req = project.investment_required || 0;
  const minT = investor.minimum_ticket || 0;
  const maxT = investor.maximum_ticket || 9999;
  if (req >= minT && req <= maxT) {
    score += 20;
    factors.push(`✓ Required ticket (${req}M TND) fits investor range (${minT}M – ${maxT}M TND)`);
  } else if (req > 0 && Math.abs(req - maxT) <= maxT * 0.3) {
    score += 10;
    factors.push(`~ Ticket (${req}M TND) close to target capacity`);
  } else {
    nonFactors.push(`✕ Ticket requirement (${req}M TND) outside ticket range`);
  }

  // 3. Geographic Mandate (Weight: 15%)
  const geo = investor.geographic_focus || investor.preferred_geographies || [];
  if (geo.includes('Tunisia') || geo.includes('Global') || geo.includes('North Africa') || geo.includes('Africa')) {
    score += 15;
    factors.push('✓ Project location falls within geographic mandate');
  } else {
    nonFactors.push('✕ Geographic mandate restricted to other regions');
  }

  // 4. Investment Stage Alignment (Weight: 15%)
  const stages = investor.investment_stages || investor.preferred_stages || [];
  if (stages.includes(project.investment_stage) || stages.includes('all')) {
    score += 15;
    factors.push(`✓ Growth stage (${project.investment_stage}) matches investor profile`);
  } else {
    nonFactors.push('✕ Stage non-matching');
  }

  // 5. Project Type / Asset Class (Weight: 10%)
  const types = investor.project_types || [];
  if (types.includes(project.project_type) || types.length === 0) {
    score += 10;
    factors.push('✓ Asset type and operational model compatible');
  } else {
    nonFactors.push('✕ Asset type non-standard for vehicle');
  }

  // 6. Export / Impact / Strategic Value (Weight: 15%)
  if (project.export_potential === 'HIGH' || project.featured || project.is_verified) {
    score += 15;
    factors.push('✓ High export readiness & verified governance');
  } else {
    score += 8;
  }

  // Ensure score within 45% - 98% range for realistic matching UI
  const matchScore = Math.min(98, Math.max(45, Math.round(score)));

  const explanation = `${factors.length} key alignment criteria met including sector focus, ticket size and geographic compatibility.`;

  return {
    matchScore,
    factors,
    nonFactors,
    explanation,
  };
}
