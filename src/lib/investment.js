import {
  Building2, Cpu, Sprout, Sun, Plane, Briefcase, HeartPulse, HardHat,
  Coins, Layers, Globe, Factory, MapPin, ShieldCheck, Sparkles, TrendingUp
} from 'lucide-react';

export const STAGE_LABELS = {
  GREENFIELD: 'Greenfield',
  EXPANSION: 'Expansion',
  EARLY_STAGE: 'Early Stage',
  GROWTH: 'Growth',
  TURNAROUND: 'Turnaround',
  R_AND_D: 'R&D / Innovation',
  SEED: 'Seed Stage',
  READY_FOR_INVESTMENT: 'Ready for Investment',
  FUNDING_OPEN: 'Funding Open'
};

export const TYPE_LABELS = {
  INDUSTRIAL: 'Industrial & Manufacturing',
  TECH: 'Technology & Digital',
  AGRI_FOOD: 'Agri-Food & Smart Farming',
  RENEWABLE_ENERGY: 'Renewable Energy & Green Tech',
  TOURISM: 'Tourism & Real Estate',
  SERVICES: 'Business Services & Logistics',
  HEALTHCARE: 'Healthcare & Pharma',
  INFRASTRUCTURE: 'Infrastructure & Logistics',
  GREENFIELD: 'Greenfield Project'
};

export const SEEKING_LABELS = {
  EQUITY: 'Equity Capital',
  DEBT: 'Debt / Bank Financing',
  PARTNERSHIP: 'Strategic Partnership',
  TECHNICAL: 'Technical Expertise',
  EXPORT: 'Export & International Distribution',
  LAND: 'Industrial Land / Site',
  EQUITY_INVESTOR: 'Equity Investor',
  STRATEGIC_PARTNER: 'Strategic Partner',
  DEBT_FINANCING: 'Debt Financing',
  JOINT_VENTURE: 'Joint Venture'
};

export const INTEREST_LABELS = {
  EQUITY: 'Equity Investment',
  DEBT: 'Debt / Loan Financing',
  PARTNERSHIP: 'Strategic Partnership',
  JOINT_VENTURE: 'Joint Venture',
  TECHNICAL: 'Technical / Management Support',
  INFORMATION_REQUEST: 'Document & Information Request'
};

export const SIZE_BANDS = [
  { id: 'all', label: 'Any Investment Size' },
  { id: 'under_1m', label: '< 1M TND' },
  { id: '1m_5m', label: '1M – 5M TND' },
  { id: '5m_20m', label: '5M – 20M TND' },
  { id: 'over_20m', label: '> 20M TND' }
];

export const DOCUMENT_TYPES = [
  'Executive Summary',
  'Investor Pitch Deck',
  '3-Year Financial Model',
  'Market & Feasibility Study',
  'Technical Specifications & Certifications',
  'Environmental & Social Impact Study'
];

export const DEMO_NOTICE = 'Verified Tunisian Investment Opportunities';

export function formatMTND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '—';
  const num = Number(amount);
  if (num >= 1) {
    return `${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}M TND`;
  }
  return `${Math.round(num * 1000).toLocaleString('en-US')}K TND`;
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

export function inBand(val, sizeBand) {
  if (!sizeBand || sizeBand === 'all') return true;
  const num = Number(val) || 0;
  switch (sizeBand) {
    case 'under_1m': return num < 1;
    case '1m_5m': return num >= 1 && num <= 5;
    case '5m_20m': return num > 5 && num <= 20;
    case 'over_20m': return num > 20;
    default: return true;
  }
}

export function sectorIcon(iconName) {
  switch (iconName) {
    case 'Cpu': return Cpu;
    case 'Sprout': return Sprout;
    case 'Sun': return Sun;
    case 'Factory': return Factory;
    case 'HeartPulse': return HeartPulse;
    case 'Globe': return Globe;
    case 'Plane': return Plane;
    case 'HardHat': return HardHat;
    case 'Coins': return Coins;
    case 'Layers': return Layers;
    case 'Briefcase': return Briefcase;
    default: return Building2;
  }
}
