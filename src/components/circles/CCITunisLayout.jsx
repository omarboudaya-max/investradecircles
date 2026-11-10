import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  Landmark, Globe, Users, Briefcase, BookOpen, Map, Sparkles, TrendingUp, TrendingDown,
  FileText, ShieldCheck, Search, Download, GraduationCap, Calendar, MessageCircle, Send, Plus,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, FlaskConical, Building2, HelpCircle, RefreshCw,
  FileCheck, Scale, Flame, Compass, Layers, CheckSquare, Square, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import CircleVisual from '@/components/circles/CircleVisual';

// Simulated Market Ticker (Reused from ChamberOfCommerceLayout but stylized)
function formatPrice(symbol, price) {
  if (!price && price !== 0) return '—';
  const tunisian = ['SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];
  if (tunisian.includes(symbol)) return `${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
  return Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MarketTicker({ isDark }) {
  const { data: marketData = [] } = useQuery({
    queryKey: ['market-data-cci'],
    queryFn: () => supabase.from('MarketData').select('*').limit(10).then(res => res.data || []),
  });

  if (!marketData.length) return null;
  const doubled = [...marketData, ...marketData];

  return (
    <div
      className="w-full overflow-hidden py-1.5 border-b cursor-pointer transition-colors duration-300"
      style={{
        background: isDark ? 'linear-gradient(90deg,#0a192f,#020c1b)' : 'linear-gradient(90deg,#e6f0fa,#ffffff)',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      }}
    >
      <div className="ticker-track flex flex-nowrap w-max" style={{ animation: `ticker-scroll 30s linear infinite` }}>
        {doubled.map((t, i) => {
          const up = (t.change_pct || 0) >= 0;
          return (
            <div key={`${t.symbol}-${i}`} className="flex items-center gap-1.5 shrink-0 px-5">
              <span className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-[11px] font-semibold`}>{t.symbol}</span>
              <span className={`${isDark ? 'text-white' : 'text-slate-950'} text-[11px] font-bold`}>{formatPrice(t.symbol, t.price)}</span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {t.change_pct != null ? `${up ? '+' : ''}${Number(t.change_pct).toFixed(2)}%` : '—'}
              </span>
              <span className={`${isDark ? 'text-blue-300/20' : 'text-stone-300'} text-[10px] ml-3`}>|</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

// ── Product & Country Knowledge Base for CCI Tunis Export Engine ──
const EXPORT_PRODUCT_CATALOG = [
  { id: 'javel', label: 'Eau de Javel (Hypochlorite de Sodium)', hs: '2828.90.10', icon: '🧪', group: 'Chimie & Détergents' },
  { id: 'olive_oil', label: "Huile d'Olive (Conditionnée & Vrac)", hs: '1509.10.00', icon: '🫒', group: 'Agroalimentaire' },
  { id: 'dates', label: 'Dattes Deglet Nour & Fruits Frais', hs: '0804.10.00', icon: '🌴', group: 'Agroalimentaire' },
  { id: 'canned_food', label: 'Conserves (Harissa, Double Concentré Tomate, Thon)', hs: '2002.90 / 2103.90', icon: '🥫', group: 'Agroalimentaire' },
  { id: 'seafood', label: 'Produits de la Mer, Poissons & Crustacés', hs: '0302.10 / 0306.17', icon: '🐟', group: 'Agroalimentaire' },
  { id: 'detergents', label: 'Détergents, Savons & Produits Nettoyants', hs: '3402.20.90', icon: '🧼', group: 'Chimie & Détergents' },
  { id: 'cosmetics', label: 'Cosmétiques, Huiles Essentielles & Parfums', hs: '3304.99 / 3301.29', icon: '✨', group: 'Santé & Beauté' },
  { id: 'pharma', label: 'Médicaments & Dispositifs Médicaux', hs: '3004.90 / 9018.90', icon: '💊', group: 'Santé & Beauté' },
  { id: 'textile', label: 'Textiles, Vêtements, Cuir & Chaussures', hs: '6109.10 / 6203.42', icon: '👕', group: 'Industrie & Confection' },
  { id: 'electronics', label: 'Câblage Automobile, Composants Électriques & IT', hs: '8544.30 / 8536.90', icon: '⚡', group: 'Industrie & Confection' },
  { id: 'construction', label: 'Ciment, Céramique, Marbre & Matériaux BTP', hs: '2523.29 / 6907.21', icon: '🏗️', group: 'BTP & Matériaux' },
  { id: 'handicraft', label: "Artisanat, Poterie & Bois d'Olivier", hs: '4419.90 / 6912.00', icon: '🏺', group: 'Artisanat' },
];

const EXPORT_DESTINATION_CATALOG = [
  { id: 'libya', label: 'Libye (Tripoli, Misrata, Benghazi)', flag: '🇱🇾', zone: 'GAFTA / ZALE' },
  { id: 'france_eu', label: 'France / Union Européenne (Italie, Allemagne, Espagne)', flag: '🇪🇺', zone: 'Accord UE (EUR.1 / EUR-MED)' },
  { id: 'algeria', label: 'Algérie', flag: '🇩🇿', zone: 'Accord Bilatéral / GAFTA' },
  { id: 'morocco', label: 'Maroc', flag: '🇲🇦', zone: "Convention d'Agadir / GAFTA" },
  { id: 'egypt_mena', label: 'Égypte & Jordanie', flag: '🇪🇬', zone: 'GAFTA + Système ACID' },
  { id: 'gulf_gcc', label: 'Arabie Saoudite, Émirats (UAE) & Qatar', flag: '🇸🇦', zone: 'GAFTA / Conseil du Golfe' },
  { id: 'africa_zlecaf', label: "Afrique Subsaharienne (Sénégal, Côte d'Ivoire, Cameroun)", flag: '🌍', zone: 'ZLECAf (AfCFTA) / UEMOA' },
  { id: 'usa', label: 'États-Unis (USA)', flag: '🇺🇸', zone: 'GSP / Clause NPF (OMC)' },
  { id: 'uk', label: 'Royaume-Uni (UK)', flag: '🇬🇧', zone: 'Accord UK-Tunisie (EUR.1)' },
  { id: 'canada', label: 'Canada', flag: '🇨🇦', zone: 'Tarif NPF (OMC)' },
];

function evaluateExportCertificates(productRaw, destinationRaw) {
  const p = productRaw.toLowerCase().trim();
  const d = destinationRaw.toLowerCase().trim();

  // Detect Product Type
  const isJavel = p.includes('javel') || p.includes('hypochlorite') || p.includes('chlore');
  const isChemical = isJavel || p.includes('chimique') || p.includes('détergent') || p.includes('detergent') || p.includes('savon') || p.includes('nettoyant') || p.includes('acide') || p.includes('solvant');
  const isOliveOil = p.includes('huile') || p.includes('olive');
  const isDatesOrFruit = p.includes('datte') || p.includes('deglet') || p.includes('fruit') || p.includes('agrume') || p.includes('légume') || p.includes('legume');
  const isCanned = p.includes('conserve') || p.includes('harissa') || p.includes('tomate') || p.includes('thon') || p.includes('pâte') || p.includes('biscuit');
  const isSeafood = p.includes('poisson') || p.includes('mer') || p.includes('poulpe') || p.includes('crevette') || p.includes('crustacé');
  const isFood = isOliveOil || isDatesOrFruit || isCanned || isSeafood || p.includes('agro') || p.includes('alimentaire') || p.includes('jus');
  const isCosmetic = p.includes('cosmétique') || p.includes('cosmetique') || p.includes('parfum') || p.includes('huile essentielle') || p.includes('crème') || p.includes('beauté');
  const isPharma = p.includes('médicament') || p.includes('medicament') || p.includes('pharma') || p.includes('médical') || p.includes('medical') || p.includes('santé');
  const isTextile = p.includes('textile') || p.includes('vêtement') || p.includes('vetement') || p.includes('tissu') || p.includes('habillement') || p.includes('cuir') || p.includes('chaussure');
  const isElectronics = p.includes('câble') || p.includes('cable') || p.includes('électrique') || p.includes('electrique') || p.includes('électronique') || p.includes('composant') || p.includes('auto');
  const isConstruction = p.includes('ciment') || p.includes('céramique') || p.includes('ceramique') || p.includes('marbre') || p.includes('brique') || p.includes('acier') || p.includes('btp');
  const isHandicraft = p.includes('artisanat') || p.includes('poterie') || p.includes('bois') || p.includes('tapis') || p.includes('cuivre');

  // Detect Destination Market
  const isLibya = d.includes('liby') || d.includes('tripoli') || d.includes('benghazi') || d.includes('misrata');
  const isEU = d.includes('france') || d.includes('italie') || d.includes('allemagne') || d.includes('espagne') || d.includes('belgique') || d.includes('ue') || d.includes('europe') || d.includes('union européenne');
  const isAlgeria = d.includes('algéri') || d.includes('algerie') || d.includes('alger');
  const isMorocco = d.includes('maroc') || d.includes('casablanca') || d.includes('rabat');
  const isEgypt = d.includes('égypt') || d.includes('egypt') || d.includes('caire') || d.includes('jordanie');
  const isGulf = d.includes('arabie') || d.includes('saoudite') || d.includes('émirat') || d.includes('emirat') || d.includes('dubai') || d.includes('uae') || d.includes('qatar') || d.includes('koweït') || d.includes('golfe');
  const isAfrica = d.includes('afrique') || d.includes('sénégal') || d.includes('senegal') || d.includes('ivoire') || d.includes('cameroun') || d.includes('zlecaf') || d.includes('mali') || d.includes('gabon') || d.includes('rdc');
  const isUSA = d.includes('usa') || d.includes('états-unis') || d.includes('etats-unis') || d.includes('amérique');
  const isUK = d.includes('royaume-uni') || d.includes('uk') || d.includes('angleterre') || d.includes('londres');
  const isCanada = d.includes('canada') || d.includes('montréal') || d.includes('toronto');
  const isGAFTA = isLibya || isAlgeria || isMorocco || isEgypt || isGulf;

  // Determine HS Code & Category Label
  let hsCode = '3824.99.00 (Marchandises Générales)';
  let categoryLabel = 'Produits Industriels & Manufacturés';
  if (isJavel) {
    hsCode = '2828.90.10 (Hypochlorite de sodium en solution aqueuse - Eau de Javel)';
    categoryLabel = 'Produit Chimique / Désinfectant Corrosif (Classe ONU 1791 - Classe 8)';
  } else if (isChemical) {
    hsCode = '3402.20.90 (Préparations tensioactives, détergents & produits de nettoyage)';
    categoryLabel = 'Produits Chimiques, Détergents & Entretien';
  } else if (isOliveOil) {
    hsCode = '1509.20.00 (Huile d’olive vierge extra)';
    categoryLabel = 'Agroalimentaire Stratégique — Filière Oléicole (Réglementation ONH)';
  } else if (isDatesOrFruit) {
    hsCode = '0804.10.00 (Dattes fraîches ou sèches - Deglet Nour) / 0805 (Agrumes)';
    categoryLabel = 'Agroalimentaire & Produits Végétaux Frais (Réglementation GID)';
  } else if (isCanned) {
    hsCode = '2002.90 / 2103.90.90 (Harissa, Conserves de Tomates & Préparations)';
    categoryLabel = 'Industrie Agroalimentaire & Conserves (GICA)';
  } else if (isSeafood) {
    hsCode = '0302.10 / 0306.17 (Poissons frais, réfrigérés & Crustacés)';
    categoryLabel = 'Produits Halieutiques & de la Mer (GIPP)';
  } else if (isCosmetic) {
    hsCode = '3304.99.00 / 3301.29 (Produits de beauté, soins & Huiles essentielles)';
    categoryLabel = 'Cosmétiques, Parfumerie & Dermo-cosmétique';
  } else if (isPharma) {
    hsCode = '3004.90.00 / 9018.90 (Médicaments conditionnés & Dispositifs médicaux)';
    categoryLabel = 'Industrie Pharmaceutique & Dispositifs Médicaux (DPM)';
  } else if (isTextile) {
    hsCode = '6109.10.00 / 6203.42 (Articles d’habillement, confection textile & cuir)';
    categoryLabel = 'Textile, Habillement, Cuir & Chaussures (CETTEX)';
  } else if (isElectronics) {
    hsCode = '8544.30.00 / 8536.90 (Faisceaux de câbles, appareillage électrique & IT)';
    categoryLabel = 'Industries Mécaniques, Électriques & Électroniques (IME)';
  } else if (isConstruction) {
    hsCode = '2523.29.00 (Ciment Portland) / 6907.21 (Carreaux céramiques)';
    categoryLabel = 'Matériaux de Construction, Ciment & Céramique (CTMCCV)';
  } else if (isHandicraft) {
    hsCode = '4419.90 (Articles en bois d’olivier) / 6912.00 (Poterie & Céramique)';
    categoryLabel = 'Artisanat Traditionnel & Métiers d’Art (ONA)';
  }

  // Determine Trade Agreement
  let tradeAgreement = 'Régime Droit Commun OMC (Clause de la Nation la Plus Favorisée)';
  let customsDutyBenefit = 'Droits de douane standards selon le tarif du pays importateur';
  if (isLibya) {
    tradeAgreement = 'Accord de la Grande Zone Arabe de Libre-Échange (GAFTA / ZALE) + Accord Bilatéral Tuniso-Libyen';
    customsDutyBenefit = '0% de droits de douane (Exonération totale si valeur ajoutée tunisienne ≥ 40%)';
  } else if (isEU) {
    tradeAgreement = "Accord d'Association Tunisie - Union Européenne (Convention Pan-Euro-Med)";
    customsDutyBenefit = isOliveOil
      ? 'Exonération sous contingent tarifaire annuel UE (ou régime perfectionnement actif)'
      : '0% de droits de douane sur les produits industriels et préférences tarifaires agricoles';
  } else if (isAlgeria) {
    tradeAgreement = 'Accord Commercial Préférentiel Tuniso-Algérien & Zone Arabe (GAFTA)';
    customsDutyBenefit = 'Exonération ou abattement tarifaire (hors listes d’exclusion temporaires DAPS)';
  } else if (isMorocco) {
    tradeAgreement = "Accord d'Agadir (Tunisie-Maroc-Égypte-Jordanie) & GAFTA";
    customsDutyBenefit = '0% de droits de douane avec cumul diagonal d’origine Pan-Euro-Med';
  } else if (isEgypt || isGulf) {
    tradeAgreement = 'Grande Zone Arabe de Libre-Échange (GAFTA / ZALE)';
    customsDutyBenefit = '0% de droits de douane sur présentation du Certificat d’Origine GAFTA visé';
  } else if (isAfrica) {
    tradeAgreement = 'Zone de Libre-Échange Continentale Africaine (ZLECAf / AfCFTA)';
    customsDutyBenefit = 'Démantèlement tarifaire progressif jusqu’à 0% sur 90% des lignes tarifaires';
  } else if (isUSA) {
    tradeAgreement = 'Système Généralisé de Préférences américain (GSP) & Clause NPF';
    customsDutyBenefit = 'Franchise de droits sur plus de 3 500 produits éligibles au GSP (dont huile d’olive conditionnée & artisanat)';
  } else if (isUK) {
    tradeAgreement = "Accord d'Association et de Continuité Tunisie - Royaume-Uni";
    customsDutyBenefit = 'Maintien de la franchise douanière équivalente à l’accord UE (EUR.1)';
  }

  const certificates = [];

  // ── 1. CERTIFICATE OF ORIGIN (Universal requirement tailored by destination) ──
  if (isGAFTA) {
    certificates.push({
      id: 'co-gafta',
      title: "Certificat d'Origine Arabe (Formulaire GAFTA / ZALE)",
      authority: "CCI Tunis (Chambre de Commerce et d'Industrie de Tunis) + Visa Douane Tunisienne",
      platform: 'Portail e-Service CCI Tunis (ccitunis.org.tn) & Guichet Unique TTN',
      mandatory: true,
      isMostCritical: !isLibya && !isAlgeria && !isGulf && !isEgypt,
      priorityRank: 2,
      statusBadge: 'OBLIGATOIRE — EXONÉRATION DOUANIÈRE',
      color: 'blue',
      leadTime: '24h à 48h ouvrables',
      validityAndCost: 'Valable par expédition | Frais de visa CCI : ~30 à 50 TND',
      purpose: `Permettre à votre acheteur en ${destinationRaw} de bénéficier de l'exonération totale des droits de douane (0%) dans le cadre de la Grande Zone Arabe de Libre-Échange.`,
      howToGet: [
        "1. Créer ou activer votre compte entreprise sur la plateforme e-service de la CCI Tunis (Adhésion annuelle à jour).",
        "2. Remplir la structure de coût prouvant un taux d'intégration / valeur ajoutée locale tunisienne d'au moins 40%.",
        "3. Téléverser la Facture Commerciale définitive signée et cachetée ainsi que la Déclaration Douanière (DUM).",
        "4. Retirer le formulaire GAFTA original visé par la CCI Tunis puis le faire authentifier au bureau des Douanes de sortie."
      ],
      conditions: [
        'Taux de valeur ajoutée locale tunisienne ≥ 40% du prix départ usine (Ex-Works).',
        'Mention explicite "Origine Tunisie / صنع في تونس" gravée ou imprimée de façon indélébile sur la marchandise.',
        'Facture commerciale originale, liste de colisage (Packing List) et copie du RC / RNE.'
      ]
    });
  } else if (isEU || isUK) {
    certificates.push({
      id: 'co-eur1',
      title: "Certificat de Circulation des Marchandises EUR.1 / EUR-MED",
      authority: 'CCI Tunis & Direction Générale des Douanes Tunisiennes',
      platform: 'Plateforme e-Service CCI Tunis + Système SINDA / TTN',
      mandatory: true,
      isMostCritical: isTextile,
      priorityRank: isTextile ? 1 : 2,
      statusBadge: 'OBLIGATOIRE — FRANCHISE UE/UK',
      color: 'blue',
      leadTime: '24h à 48h (ou immédiat si statut Exportateur Agréé)',
      validityAndCost: 'Valable 4 mois à compter du visa | Formulaire CCI + Visa Douane',
      purpose: `Garantir l'accès en franchise de droits de douane (0%) sur le marché ${isUK ? 'britannique' : 'de l’Union Européenne'} selon les règles d'origine Pan-Euro-Méditerranéennes.`,
      howToGet: [
        "1. Se procurer le formulaire EUR.1 ou EUR-MED auprès de la CCI Tunis (ou remplir la demande via e-services).",
        "2. Préparer les justificatifs d'origine (factures d'achat des intrants locaux ou EUR.1 des matières premières importées d'Europe pour le cumul d'origine).",
        "3. Déposer le dossier lors de l'établissement de la DUM (Déclaration Unique des Marchandises) via votre transitaire.",
        "4. Faire viser la case 11 du certificat EUR.1 par le bureau des douanes d'exportation (Radès, Goulette, Tunis-Carthage)."
      ],
      conditions: [
        isTextile
          ? 'Règle de la "Double Ouvraison" (tissage + confection en Tunisie, ou confection à partir de tissu d’origine UE avec cumul EUR-MED).'
          : 'Respect des règles d’ouvraison ou transformation suffisante de la Convention Pan-Euro-Med.',
        'Possibilité de remplacer l’EUR.1 par une simple "Déclaration sur Facture" pour tout envoi < 6 000 € ou si vous détenez le statut d’Exportateur Agréé.'
      ]
    });
  } else if (isAfrica) {
    certificates.push({
      id: 'co-zlecaf',
      title: "Certificat d'Origine ZLECAf (AfCFTA) / CCI Tunis",
      authority: 'CCI Tunis & Ministère du Commerce (Point Focal ZLECAf) / Douanes',
      platform: 'Guichet CCI Tunis & Portail Tarifaire ZLECAf',
      mandatory: true,
      isMostCritical: false,
      priorityRank: 2,
      statusBadge: 'OBLIGATOIRE — TARIF PRÉFÉRENTIEL AFRICAIN',
      color: 'blue',
      leadTime: '48h ouvrables',
      validityAndCost: 'Valable 12 mois | Délivré par expédition',
      purpose: `Bénéficier des réductions tarifaires continentales vers ${destinationRaw} dans le cadre de la Zone de Libre-Échange Continentale Africaine.`,
      howToGet: [
        "1. Vérifier l'éligibilité de votre code SH sur la liste des concessions tarifaires du pays africain de destination.",
        "2. Déposer la demande de Certificat d'Origine ZLECAf auprès de la CCI Tunis avec la fiche technique de fabrication.",
        "3. Faire viser le certificat par les services douaniers tunisiens avant l'embarquement."
      ],
      conditions: [
        'Produit entièrement obtenu en Tunisie ou ayant subi une transformation substantielle conforme à l’Annexe 2 de la ZLECAf.',
        'Inscription au registre des exportateurs ZLECAf auprès du Ministère du Commerce.'
      ]
    });
  } else {
    certificates.push({
      id: 'co-non-pref',
      title: "Certificat d'Origine Droit Commun (et Formule A / GSP si applicable)",
      authority: "CCI Tunis (Chambre de Commerce et d'Industrie de Tunis)",
      platform: 'Portail en ligne ccitunis.org.tn (Service Légalisation & Origine)',
      mandatory: true,
      isMostCritical: false,
      priorityRank: 2,
      statusBadge: 'OBLIGATOIRE',
      color: 'blue',
      leadTime: '24h ouvrables',
      validityAndCost: 'Par expédition | ~30 TND',
      purpose: `Attester officiellement que "${productRaw}" est d'origine tunisienne pour le dédouanement en ${destinationRaw}.`,
      howToGet: [
        "1. Soumettre la demande de Certificat d'Origine en ligne sur le portail e-service de la CCI Tunis.",
        "2. Joindre la facture commerciale définitive, la liste de colisage et la déclaration d'origine du fabricant.",
        "3. Récupérer le certificat signé électroniquement ou physiquement au siège de la CCI Tunis (31 Rue Abderrazak Chraïbi, Tunis)."
      ],
      conditions: [
        'Adhésion active à la CCI Tunis pour l’année en cours.',
        'Concordance parfaite entre le poids brut/net de la facture et le connaissement (Bill of Lading / LTA).'
      ]
    });
  }

  // ── 2. DESTINATION-SPECIFIC BLOCKERS (What is needed MOST for each country) ──
  if (isLibya) {
    certificates.unshift({
      id: 'coc-libya',
      title: "Certificat de Conformité (CoC Libye — Inspection Avant Expédition)",
      authority: "Organisme d'Inspection International Agréé par la Libye (SGS, Intertek, Bureau Veritas, TÜV)",
      platform: 'Agences SGS Tunisie (Les Berges du Lac) / Intertek / TÜV Rheinland Tunis',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — BLOQUANT BANQUE & DOUANE',
      color: 'red',
      leadTime: '5 à 10 jours ouvrables (à lancer AVant le chargement)',
      validityAndCost: 'Obligatoire par lot | Coût selon valeur FOB (~0.45% à 0.50% min ~250 USD)',
      purpose: "C'est LE document le plus critique : exigé par la Banque Centrale de Libye (CBL) pour débloquer le paiement par Lettre de Crédit (L/C) et par les douanes libyennes (Tripoli, Misrata, Benghazi, Ras Jedir) pour autoriser l'entrée de la marchandise.",
      howToGet: [
        "1. AVANT d'expédier : Contacter le bureau de Tunis d'un organisme agréé (ex: SGS Tunisie ou Intertek) avec la Facture Proforma et la fiche technique.",
        "2. Fournir les rapports d'analyse laboratoire prouvant la conformité aux normes libyennes (LNCSM).",
        "3. Planifier l'inspection physique de la marchandise dans votre usine/entrepôt à Tunis : l'inspecteur vérifie le marquage en langue ARABE, les dates de validité et prélève des échantillons si nécessaire.",
        "4. Après scellage du conteneur ou camion et remise du connaissement / lettre de voiture finale, l'organisme émet le Certificat d'Inspection (CoC) original nécessaire à votre banque."
      ],
      conditions: [
        'Étiquetage obligatoire et indélébile en langue ARABE (nom du produit, pays d’origine "صنع في تونس", composition, date de production et d’expiration).',
        isJavel
          ? 'Analyse laboratoire certifiant le degré chlorométrique (12° à 15° Chlore actif) et emballage PEHD résistant à la corrosion.'
          : 'Rapport d’essais d’un laboratoire accrédité ISO 17025 selon la catégorie du produit.',
        'Interdiction absolue de charger et fermer le conteneur avant le passage de l’inspecteur mandaté.'
      ]
    });
  }

  if (isAlgeria) {
    certificates.unshift({
      id: 'alg-libre-vente',
      title: 'Attestation de Libre Commercialisation & Conformité (Modèle Algérie)',
      authority: 'Ministère du Commerce / Autorité Sectorielle Tunisienne + Visa CCI Tunis & Consulat',
      platform: 'Ministère du Commerce + Légalisation CCI Tunis',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — BLOQUANT DOMICILIATION BANCAIRE',
      color: 'red',
      leadTime: '3 à 7 jours ouvrables',
      validityAndCost: 'Requis avant la domiciliation bancaire de l’importateur algérien',
      purpose: "Indispensable pour que votre client algérien puisse obtenir la domiciliation bancaire préalable à l'importation et franchir le contrôle de conformité aux frontières (DCF).",
      howToGet: [
        "1. Obtenir l'attestation prouvant que le produit est librement commercialisé en Tunisie auprès du ministère de tutelle (Commerce, Santé ou Agriculture) et la faire viser par la CCI Tunis.",
        "2. Envoyer la facture proforma + l'attestation de libre commercialisation à votre acheteur algérien AVANT toute expédition pour qu'il ouvre sa domiciliation bancaire.",
        "3. Faire réaliser un Certificat de Contrôle de Qualité et de Conformité avant expédition par un organisme accrédité exigé par la banque algérienne."
      ],
      conditions: [
        'Vérifier au préalable que le code SH n’est pas soumis à une suspension temporaire ou au DAPS (Droit Additionnel Provisoire de Sauvegarde) en Algérie.',
        'Étiquetage obligatoire en langue arabe conformément au décret exécutif algérien.',
        'L’expédition ne doit jamais partir avant la date de domiciliation bancaire algérienne.'
      ]
    });
  }

  if (isMorocco) {
    certificates.unshift({
      id: 'morocco-coc',
      title: 'Certificat de Conformité (CoC Maroc — Programme VoC / IMANOR)',
      authority: 'Apave, Bureau Veritas, TUV Rheinland ou SGS (mandatés par le Ministère Marocain MICEVN)',
      platform: 'Portail PortNet Maroc + Bureau d’inspection à Tunis',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — OBLIGATOIRE PORTNET MAROC',
      color: 'red',
      leadTime: '4 à 7 jours ouvrables',
      validityAndCost: 'Par expédition (Route A) ou annuel si produits enregistrés (Route B)',
      purpose: "Obligatoire pour le dédouanement via le guichet unique marocain PortNet pour la majorité des produits industriels, chimiques, textiles et électriques (normes NM / IMANOR).",
      howToGet: [
        "1. Vérifier sur la liste du Ministère Marocain de l'Industrie si votre code SH relève du contrôle à l'origine (en Tunisie) ou à destination.",
        "2. Soumettre la demande d'inspection en ligne auprès de Bureau Veritas, Apave ou SGS Tunisie avec les rapports de test norme NM/ISO.",
        "3. Planifier l'inspection visuelle avant expédition pour obtenir le CoC à téléverser sur PortNet."
      ],
      conditions: [
        'Conformité aux Normes Marocaines (NM) obligatoires.',
        isTextile || isElectronics ? 'Marquage réglementaire CMim sur les produits électriques et étiquetage d’entretien textile.' : 'Fiche technique et rapport d’analyse valide.'
      ]
    });
  }

  if (isEgypt) {
    certificates.unshift({
      id: 'egypt-acid-goeic',
      title: 'Numéro ACID (Nafeza / CargoX) & Enregistrement GOEIC Égypte',
      authority: 'Autorité Douanière Égyptienne (Plateforme Nafeza / Blockchain CargoX) & GOEIC',
      platform: 'cargox.io & nafeza.gov.eg + Légalisation CCI Tunis',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — BLOQUANT EMBARQUEMENT',
      color: 'red',
      leadTime: 'ACID : 48h avant départ | GOEIC (usines produits finis) : 3 à 6 semaines',
      validityAndCost: 'Transmission blockchain CargoX : ~150 USD par envoi',
      purpose: "Aucune marchandise ne peut être chargée à destination d'un port égyptien sans numéro ACID (Advance Cargo Information) à 19 chiffres. De plus, les produits finis destinés à la vente au détail nécessitent l'enregistrement de l'usine au GOEIC.",
      howToGet: [
        "1. Créer et vérifier le compte de votre société exportatrice tunisienne sur la plateforme Blockchain CargoX.io.",
        "2. Envoyer la facture proforma à l'importateur égyptien pour qu'il génère le numéro ACID sur Nafeza.",
        "3. Mentionner obligatoirement le numéro ACID à 19 chiffres sur la Facture Commerciale, le Certificat d'Origine GAFTA, la Packing List et le Bill of Lading.",
        "4. Transmettre tous les documents visés par la CCI Tunis via CargoX au moins 48h avant l'arrivée du navire."
      ],
      conditions: [
        'Enregistrement préalable de la marque/usine auprès du GOEIC (General Organization for Export & Import Control) si le produit est conditionné pour la vente directe au consommateur.',
        'Légalisation des documents par la CCI Tunis.'
      ]
    });
  }

  if (isGulf) {
    certificates.unshift({
      id: 'gulf-saber-sfda',
      title: isFood || isCosmetic || isPharma
        ? 'Enregistrement SFDA / Montaji & Certificat Halal Accrédité'
        : 'Certificat de Conformité PCoC & SCoC (Plateforme SABER / G-Mark)',
      authority: isFood || isCosmetic
        ? 'SFDA (Arabie Saoudite) / Dubai Municipality + INNORPI (Halal Tunisie)'
        : 'SASO (Plateforme SABER) via organisme notifié (SGS, Intertek, TÜV)',
      platform: 'saber.sa / ghad.sfda.gov.sa + INNORPI Tunis',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — EXIGENCE CRITIQUE GOLFE',
      color: 'red',
      leadTime: '7 à 15 jours ouvrables',
      validityAndCost: 'PCoC valable 1 an (~500 SAR) + SCoC par expédition (~350 SAR)',
      purpose: "Tout envoi vers l'Arabie Saoudite et les pays du Golfe est bloqué en douane sans l'enregistrement électronique sur SABER (produits non-alimentaires) ou SFDA + Certificat Halal (produits alimentaires/cosmétiques).",
      howToGet: [
        isFood || isCosmetic
          ? "1. Obtenir le Certificat Halal auprès de l'INNORPI (organisme tunisien reconnu) et enregistrer l'établissement producteur sur le portail SFDA / Dubai Montaji."
          : "1. Demander à votre importateur d'initier le dossier sur la plateforme SABER.sa et sélectionner un organisme certificateur présent en Tunisie (SGS, Intertek).",
        "2. Fournir les rapports de tests conformes aux règlements techniques SASO/GSO et obtenir le Product Certificate of Conformity (PCoC).",
        "3. À chaque expédition, valider la facture commerciale visée par la CCI Tunis pour émettre le Shipment Certificate (SCoC)."
      ],
      conditions: [
        'Code-barres GS1 Tunisie valide sur chaque unité de vente.',
        'Étiquetage bilingue Arabe / Anglais conforme aux normes GSO.',
        isFood ? 'Certificat Halal couvrant l’intégralité des ingrédients et du procédé de fabrication.' : 'Conformité aux standards électriques/chimiques GSO.'
      ]
    });
  }

  if (isAfrica) {
    certificates.unshift({
      id: 'africa-bsc-ectn',
      title: 'Bordereau de Suivi de Cargaison (BSC / BESC / ECTN) & CoC Pré-embarquement',
      authority: 'Conseil des Chargeurs du pays de destination (via mandataire maritime) + SGS/Bureau Veritas',
      platform: 'Portail électronique BSC (Sénégal COSEC, Côte d’Ivoire OIC, Cameroun CNCC)',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — OBLIGATOIRE AVANT ARRIVÉE NAVIRE',
      color: 'red',
      leadTime: '48h à 96h dès émission du Draft B/L',
      validityAndCost: 'Par connaissement (Bill of Lading) | ~100 à 250 EUR selon le port',
      purpose: "En Afrique de l'Ouest et Centrale, l'absence de BSC/ECTN validé avant l'arrivée du navire entraîne le blocage immédiat du conteneur et des pénalités douanières pouvant atteindre 50% de la valeur CAF.",
      howToGet: [
        "1. Dès la réservation du fret maritime (Booking), demander à votre transitaire d'ouvrir le dossier BSC/BESC en ligne.",
        "2. Joindre la Facture Commerciale visée CCI Tunis, la Déclaration Douanière d'exportation (DUM), la facture de fret maritime et le Draft Bill of Lading.",
        "3. Faire inscrire le numéro BSC/ECTN sur le connaissement original (Bill of Lading) et valider le certificat de conformité (VoC) avant l'accostage."
      ],
      conditions: [
        'Le BSC doit impérativement être validé dans les 5 jours suivant le départ du navire de Radès/Sfax et avant son arrivée à destination.',
        'Facture mentionnant distinctement la valeur FOB, le coût du fret et l’assurance.'
      ]
    });
  }

  if (isUSA) {
    certificates.unshift({
      id: 'usa-fda',
      title: isFood || isCosmetic || isPharma
        ? 'Enregistrement FDA (Food Facility Registration) & Prior Notice'
        : 'Conformité Douanière CBP & Marquage "Product of Tunisia"',
      authority: 'U.S. Food and Drug Administration (FDA) & U.S. Customs and Border Protection (CBP)',
      platform: 'Portail FDA Unified Registration and Listing System (FURLS)',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — BLOQUANT DOUANE USA',
      color: 'red',
      leadTime: 'Numéro FDA : 3 à 5 jours | Prior Notice : avant embarquement',
      validityAndCost: 'Renouvellement biennal FDA (nécessite un U.S. Agent désigné)',
      purpose: isFood || isCosmetic || isPharma
        ? "Toute marchandise alimentaire, cosmétique ou médicale expédiée aux États-Unis sans numéro d'enregistrement FDA de l'usine tunisienne et sans 'Prior Notice' est systématiquement saisie ou refoulée au port américain."
        : "Respecter les normes fédérales américaines (CPSC/FCC/FTC) et la déclaration ISF (10+2) 24h avant le chargement maritime.",
      howToGet: [
        isFood || isCosmetic || isPharma
          ? "1. Obtenir gratuitement un numéro DUNS (Dun & Bradstreet) pour votre société tunisienne puis désigner un U.S. Agent pour enregistrer votre établissement sur le portail FDA."
          : "1. Fournir à l'importateur américain les éléments de la déclaration ISF (Importer Security Filing 10+2) au moins 48h avant le chargement au port de Radès.",
        "2. Adapter votre étiquetage aux normes américaines (tableau 'Nutrition Facts' FDA en anglais, unités en oz / fl oz et grammes).",
        "3. Soumettre la déclaration électronique 'Prior Notice' sur le système FDA pour chaque expédition et reporter le code de confirmation sur la facture commerciale."
      ],
      conditions: [
        'Plan de sécurité sanitaire FSVP / HACCP (HARPC) documenté à disposition de l’importateur américain.',
        'Palettes en bois obligatoirement traitées et estampillées NIMP 15 (ISPM 15).'
      ]
    });
  }

  // ── 3. PRODUCT-SPECIFIC CERTIFICATES (What is needed based on the product nature) ──
  if (isJavel || isChemical) {
    certificates.push({
      id: 'fds-chemical',
      title: 'Fiche de Données de Sécurité (FDS / MSDS SGH) & Certificat d’Analyse Chimique',
      authority: 'Laboratoire Central d’Analyses et d’Essais (LCAE) / ANCSEP / Ministère de la Santé',
      platform: 'LCAE Tunis (Montfleury) & ANCSEP',
      mandatory: true,
      isMostCritical: !isLibya && !isAlgeria && !isGulf && !isEgypt && !isAfrica && !isUSA,
      priorityRank: 2,
      statusBadge: 'OBLIGATOIRE — MATIÈRE CHIMIQUE / DANGEREUSE',
      color: 'amber',
      leadTime: '3 à 5 jours ouvrables (analyse laboratoire)',
      validityAndCost: 'Rapport d’analyse : ~150 à 350 TND | FDS en 16 rubriques SGH',
      purpose: 'Exigé par les compagnies maritimes (déclaration IMO Dangerous Goods), la douane et les autorités sanitaires du pays importateur pour autoriser le transport et le dédouanement.',
      howToGet: [
        "1. Déposer un échantillon représentatif du lot au Laboratoire Central d'Analyses et d'Essais (LCAE) ou laboratoire accrédité TUNAC (ISO 17025).",
        isJavel
          ? "2. Obtenir le bulletin d'analyse certifiant la teneur en hypochlorite de sodium (degré chlorométrique 12° ou 15°), le pH et l'absence de métaux lourds."
          : "2. Obtenir le certificat d'analyse physico-chimique et de biodégradabilité des tensioactifs.",
        "3. Rédiger la Fiche de Données de Sécurité (FDS) en 16 sections selon le règlement SGH/CLP (en Français/Anglais et en Arabe pour les marchés MENA).",
        "4. Pour le fret maritime, remplir la Déclaration de Marchandises Dangereuses (DGD - Classe 8 ONU 1791 pour l'Eau de Javel) avec certificat d'empotage conteneur."
      ],
      conditions: [
        'Emballage homologué ONU (UN-certified HDPE drums/bottles) avec bouchon dégazeur pour les solutions chlorées.',
        isEU ? 'Conformité au règlement européen REACH et notification des substances.' : 'Étiquetage comportant les pictogrammes de danger SGH (Corrosif / Danger pour l’environnement).'
      ]
    });

    certificates.push({
      id: 'auth-commerce-chem',
      title: "Cahier des Charges / Autorisation d'Exportation (Produits Chimiques & Sensibles)",
      authority: 'Ministère du Commerce et du Développement des Exportations (Tunisie)',
      platform: 'Guichet Unique Liasse Unique TTN (Tunisie TradeNet)',
      mandatory: true,
      isMostCritical: false,
      priorityRank: 3,
      statusBadge: 'SOUS CONDITION DE VOLUME / RÉGLEMENTATION',
      color: 'emerald',
      leadTime: '48h à 5 jours ouvrables via TTN',
      validityAndCost: 'Demande dématérialisée sur Tunisie TradeNet',
      purpose: "S'assurer que le produit ne figure pas sur la liste des produits subventionnés ou soumis à autorisation préalable de sortie du territoire tunisien.",
      howToGet: [
        "1. Se connecter au système Liasse Unique de Tunisie TradeNet (TTN) via votre transitaire ou clé électronique DigiGO.",
        "2. Soumettre la facture définitive, le contrat commercial et la fiche technique au Ministère du Commerce / Ministère de l'Industrie.",
        "3. Obtenir le visa électronique directement rattaché à votre déclaration douanière (DUM)."
      ],
      conditions: [
        'Respect des quotas d’approvisionnement du marché national tunisien en cas de tension conjoncturelle.',
        'Rapatriement des devises via une banque intermédiaire agréée (Titre de Commerce Extérieur).'
      ]
    });
  }

  if (isFood) {
    certificates.push({
      id: 'sanitary-phytosanitary',
      title: isSeafood
        ? 'Certificat Sanitaire Vétérinaire à l’Exportation (Produits de la Pêche)'
        : isOliveOil
        ? "Certificat d'Analyse Physico-Chimique & Organoleptique ONH + Certificat Sanitaire"
        : 'Certificat Phytosanitaire / Sanitaire Officiel à l’Exportation',
      authority: isOliveOil
        ? 'Office National de l’Huile (ONH) & Ministère de l’Agriculture'
        : isDatesOrFruit
        ? 'Ministère de l’Agriculture (DGSVCIA) & Groupement Interprofessionnel des Fruits (GIFruits / GID)'
        : 'Ministère de l’Agriculture (Direction Générale de la Protection et du Contrôle de la Qualité) / GICA',
      platform: 'Guichet Unique TTN + Services Régionaux du Ministère de l’Agriculture / ONH',
      mandatory: true,
      isMostCritical: isEU || isOliveOil || isDatesOrFruit || isSeafood,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — OBLIGATOIRE AGROALIMENTAIRE',
      color: 'red',
      leadTime: '48h à 5 jours (inspection + analyse du lot)',
      validityAndCost: 'Délivré par lot avant départ | Frais d’inspection & laboratoire',
      purpose: `Garantir que "${productRaw}" est propre à la consommation humaine, exempt d'organismes nuisibles, conforme aux limites maximales de résidus (LMR) et autorisé à entrer en ${destinationRaw}.`,
      howToGet: [
        isOliveOil
          ? "1. Être inscrit sur la liste des exportateurs d'huile d'olive agréés et soumettre un échantillon du lot au laboratoire de l'ONH (acidité, indice de peroxyde, K232/K270, panel test)."
          : isDatesOrFruit
          ? "1. Faire réaliser la fumigation / désinsectisation du lot dans une station de conditionnement agréée et demander le contrôle technique GID / GIFruits."
          : "1. Déposer une demande d'inspection sanitaire/phytosanitaire auprès du poste de contrôle agricole territorialement compétent (Tunis / Port de Radès / Aéroport).",
        "2. L'inspecteur officiel procède au contrôle visuel du lot conditionné et vérifie le bulletin d'analyse microbiologique et physico-chimique (LMR pesticides, mycotoxines, métaux lourds).",
        isEU
          ? "3. Émission du certificat sanitaire/phytosanitaire et notification électronique sur la plateforme européenne TRACES NT avant l'arrivée au poste de contrôle frontalier (PCF) de l'UE."
          : "3. Délivrance du Certificat Phytosanitaire / Sanitaire original papier qui doit voyager avec les documents d'expédition."
      ],
      conditions: [
        isOliveOil ? 'Respect strict des normes du Conseil Oléicole International (COI) pour l’appellation Vierge Extra (acidité ≤ 0,8%).' : 'Absence totale de parasites de quarantaine et conformité aux normes du Codex Alimentarius.',
        'Traçabilité complète du lot (numéro de lot, date de production, DLUO/DLC, agrément sanitaire de l’unité de conditionnement).',
        'Palettes en bois traitées thermiquement et marquées NIMP 15 (ISPM 15).'
      ]
    });
  }

  if (isCosmetic || isPharma) {
    certificates.push({
      id: 'clv-gmp-health',
      title: isPharma
        ? 'Certificat de Produit Pharmaceutique (CPP Format OMS) & AMM'
        : 'Certificat de Libre Vente (CLV) & Attestation BPF (ISO 22716)',
      authority: 'Ministère de la Santé Publique (DPM / ANCSEP) + Visa CCI Tunis',
      platform: 'Direction de la Pharmacie et du Médicament (DPM) / ANCSEP Bab Saadoun',
      mandatory: true,
      isMostCritical: true,
      priorityRank: 1,
      statusBadge: 'PRIORITÉ #1 — EXIGENCE SANITAIRE',
      color: 'red',
      leadTime: '5 à 15 jours ouvrables',
      validityAndCost: 'CLV valable 1 à 2 ans par produit enregistré',
      purpose: `Prouver aux autorités de santé de ${destinationRaw} que le produit est légalement fabriqué et commercialisé en Tunisie selon les Bonnes Pratiques de Fabrication (BPF / GMP).`,
      howToGet: [
        "1. Préparer le Dossier d'Information Produit (DIP / PIF) incluant la formule qualitative/quantitative, les tests de stabilité et les tests dermatologiques/microbiologiques.",
        "2. Déposer la demande de Certificat de Libre Vente (CLV) auprès du Ministère de la Santé (ANCSEP ou DPM) ou de la CCI Tunis.",
        isEU
          ? "3. Pour l'Union Européenne : désigner une 'Personne Responsable' basée dans l'UE et notifier le produit sur le portail européen CPNP (Cosmetic Products Notification Portal) avant toute expédition."
          : "3. Faire légaliser le CLV par la CCI Tunis et le Ministère des Affaires Étrangères si exigé par le pays importateur."
      ],
      conditions: [
        'Unité de fabrication disposant d’un certificat de Bonnes Pratiques de Fabrication (ISO 22716 pour la cosmétique / GMP pour la pharma).',
        'Étiquetage mentionnant la liste complète des ingrédients selon la nomenclature internationale INCI.'
      ]
    });
  }

  if (isElectronics || isConstruction) {
    certificates.push({
      id: 'ce-innorpi-tech',
      title: isEU || isUK
        ? 'Déclaration de Conformité Marquage CE / UKCA & Dossier Technique'
        : 'Certificat de Conformité aux Normes (NT / ISO) & Essais Laboratoire',
      authority: 'INNORPI / Centres Techniques (CETIME, CTMCCV) / Organismes Notifiés CE',
      platform: 'CETIME (Ksar Saïd) / CTMCCV / INNORPI Tunis',
      mandatory: true,
      isMostCritical: isEU || isUK,
      priorityRank: 1,
      statusBadge: 'OBLIGATOIRE — CONFORMITÉ TECHNIQUE',
      color: 'amber',
      leadTime: '5 à 15 jours selon les essais requis',
      validityAndCost: 'Valable par gamme de produits / référence',
      purpose: `Certifier que les ${isElectronics ? 'équipements électriques/électroniques respectent les directives Basse Tension, CEM et RoHS' : 'matériaux de construction respectent les normes de résistance et de sécurité'} exigées en ${destinationRaw}.`,
      howToGet: [
        `1. Réaliser les essais de conformité auprès du centre technique sectoriel tunisien (${isElectronics ? 'CETIME pour les industries électriques/mécaniques' : 'CTMCCV pour le ciment, la céramique et les matériaux'}) ou d'un laboratoire accrédité TUNAC.`,
        isEU
          ? "2. Constituer le Dossier Technique UE, rédiger et signer la 'Déclaration UE de Conformité' et apposer le marquage CE sur le produit et son emballage."
          : "2. Obtenir le certificat de conformité aux normes tunisiennes (NT) ou internationales (ISO/CEI) et le faire viser pour l'export.",
        isConstruction
          ? "3. Pour le ciment et clinker : valider le cahier des charges d'exportation auprès du Ministère du Commerce et du Ministère de l'Industrie via TTN."
          : "3. Joindre les certificats d'essais (Test Reports) au dossier douanier de l'acheteur."
      ],
      conditions: [
        'Respect des normes harmonisées EN / ISO applicables au code SH.',
        'Notice technique et marquage de sécurité dans la langue officielle du pays de destination.'
      ]
    });
  }

  if (isHandicraft) {
    certificates.push({
      id: 'ona-artisanat',
      title: "Attestation d'Exportation & d'Authenticité Artisanale (ONA) + Phytosanitaire Bois",
      authority: "Office National de l'Artisanat Tunisien (ONA) & Ministère de l'Agriculture",
      platform: 'Siège ONA (Den Den) / Bureaux régionaux ONA Tunis',
      mandatory: true,
      isMostCritical: false,
      priorityRank: 2,
      statusBadge: 'OBLIGATOIRE — ARTISANAT & BOIS D’OLIVIER',
      color: 'amber',
      leadTime: '24h à 48h ouvrables',
      validityAndCost: 'Par expédition | Franchise de droits sous plusieurs accords',
      purpose: "Attester le caractère artisanal authentique pour bénéficier des franchises douanières dédiées à l'artisanat et certifier l'absence de parasites dans les articles en bois d'olivier.",
      howToGet: [
        "1. Présenter la facture commerciale et les articles auprès des services de contrôle de l'Office National de l'Artisanat (ONA) pour obtenir l'attestation d'exportation.",
        "2. Si l'envoi contient du bois d'olivier ou des fibres végétales (halfa, palmier) : obtenir obligatoirement un Certificat Phytosanitaire auprès du Ministère de l'Agriculture."
      ],
      conditions: [
        'Carte professionnelle d’artisan ou inscription au répertoire des entreprises artisanales exportatrices (ONA).',
        'Traitement NIMP 15 des caisses et palettes en bois.'
      ]
    });
  }

  // ── 4. MANDATORY TUNISIAN CUSTOMS & EXCHANGE CONTROL FORMALITIES (Liasse Unique TTN) ──
  certificates.push({
    id: 'ttn-dum-change',
    title: 'Déclaration Unique des Marchandises (DUM) & Engagement de Change / Facture Définitive',
    authority: 'Douane Tunisienne (Système SINDA) & Banque Centrale de Tunisie (via Banque Intermédiaire Agréée)',
    platform: 'Guichet Unique Électronique Tunisie TradeNet (TTN - Liasse Unique)',
    mandatory: true,
    isMostCritical: false,
    priorityRank: 3,
    statusBadge: 'OBLIGATOIRE — DÉDOUANEMENT SORTIE TUNISIE',
    color: 'emerald',
    leadTime: '24h (circuit vert) à 48h (circuit rouge/visite)',
    validityAndCost: 'Traitement électronique via TTN / Commissionnaire en douane',
    purpose: 'Formalité douanière et bancaire obligatoire en Tunisie pour autoriser l’embarquement au port (Radès, Goulette, Sfax) ou à l’aéroport Tunis-Carthage et assurer le rapatriement des recettes d’exportation.',
    howToGet: [
      "1. Domicilier la Facture Commerciale Définitive (ou le Titre de Commerce Extérieur) auprès de votre banque tunisienne (Intermédiaire Agréé) via la plateforme TTN.",
      "2. Votre commissionnaire en douane (transitaire) saisit la DUM (type EX-1 pour exportation définitive) sur le système SINDA/TTN en joignant la Packing List, le Certificat d'Origine CCI Tunis et les certificats techniques.",
      "3. Obtenir le 'Bon à Enlever / Bon à Embarquer' (BAE) des services douaniers du port ou de l'aéroport."
    ],
    conditions: [
      'Code en Douane actif de la société exportatrice (Identifiant Unique RNE).',
      'Engagement de rapatriement des devises dans les délais réglementaires de la Banque Centrale de Tunisie (BCT).'
    ]
  });

  // ── 5. OPTIONAL / RECOMMENDED: CARNET ATA FOR SAMPLES & FAIRS ──
  if (isEU || isUK || isUSA || isCanada || isMorocco || isGulf) {
    certificates.push({
      id: 'ata-carnet',
      title: 'Carnet ATA — Passeport pour Exportation Temporaire & Échantillons',
      authority: "CCI Tunis (Seul organisme émetteur et garant en Tunisie affilié à l'ICC WCF)",
      platform: 'Direction des Formalités Internationales — Siège CCI Tunis',
      mandatory: false,
      isMostCritical: false,
      priorityRank: 4,
      statusBadge: 'RECOMMANDÉ — SALONS & ÉCHANTILLONS PROSPECTION',
      color: 'purple',
      leadTime: '24h à 48h ouvrables',
      validityAndCost: 'Valable 12 mois dans 80+ pays | Caution de garantie à la CCI Tunis',
      purpose: `Si vous envoyez des échantillons commerciaux, des prototypes ou du matériel d'exposition en ${destinationRaw} pour un salon ou une prospection, le Carnet ATA vous dispense de payer les droits de douane et la TVA à l'entrée.`,
      howToGet: [
        "1. Remplir le formulaire de demande de Carnet ATA auprès du service dédié de la CCI Tunis avec la liste valorisée et détaillée des échantillons/matériels.",
        "2. Déposer la garantie/caution réglementaire auprès de la CCI Tunis.",
        "3. Faire viser les volets de sortie par la douane tunisienne au départ et les volets d'entrée par la douane étrangère."
      ],
      conditions: [
        'Marchandises destinées à être réimportées en l’état en Tunisie (échantillons non consommables, stands, matériel professionnel).',
        'Présentation physique des articles à la douane lors du départ.'
      ]
    });
  }

  // Sort certificates so the most critical / priority #1 comes first
  certificates.sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99));

  const topCriticalCert = certificates.find(c => c.isMostCritical) || certificates[0];
  const mandatoryCount = certificates.filter(c => c.mandatory).length;

  return {
    hsCode,
    categoryLabel,
    tradeAgreement,
    customsDutyBenefit,
    certificates,
    topCriticalCert,
    mandatoryCount,
    isJavelLibya: isJavel && isLibya,
    summaryMessage: `L'exportation de "${productRaw}" vers "${destinationRaw}" requiert ${mandatoryCount} certificat(s) et formalités obligatoires. L'élément le plus critique à anticiper en priorité est : ${topCriticalCert?.title}.`
  };
}

function ExportToolkitTab({ isDark }) {
  const [product, setProduct] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: input, 1: step-by-step diagnostic, 2: result
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const stepsList = [
    { title: "1. Nomenclature Douanière SH & Risque Produit", detail: "Détection du HS Code et classification réglementaire (chimique, agroalimentaire, industriel, santé...)" },
    { title: "2. Accords Commerciaux & Préférences Tarifaires", detail: "Vérification des traités (GAFTA/ZALE, EUR.1/EUR-MED, Accord d'Agadir, ZLECAf, GSP USA...)" },
    { title: "3. Exigences Critiques du Pays de Destination", detail: "Analyse des blocages bancaires (L/C, ACID, domiciliation) et des inspections pré-embarquement (CoC, FDA, SABER, TRACES)..." },
    { title: "4. Feuille de Route & Procédures d'Obtention CCI Tunis", detail: "Génération de la liste classée par priorité avec les étapes concrètes, délais et organismes émetteurs..." }
  ];

  const handleStartAnalysis = (prodVal, destVal) => {
    const finalProd = (prodVal ?? product).trim();
    const finalDest = (destVal ?? destination).trim();
    if (!finalProd || !finalDest) return;

    if (prodVal) setProduct(prodVal);
    if (destVal) setDestination(destVal);
    setCheckedItems({});

    setCurrentStep(1);
    setLoading(true);
    setAnalyzingStep(0);

    setTimeout(() => setAnalyzingStep(1), 500);
    setTimeout(() => setAnalyzingStep(2), 1000);
    setTimeout(() => setAnalyzingStep(3), 1500);

    setTimeout(() => {
      const evaluation = evaluateExportCertificates(finalProd, finalDest);
      setResult(evaluation);
      setLoading(false);
      setCurrentStep(2);
    }, 2000);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResult(null);
    setAnalyzingStep(0);
    setCheckedItems({});
  };

  const toggleConditionCheck = (key) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute interactive readiness percentage
  const totalCheckableConditions = result
    ? result.certificates.reduce((acc, c) => acc + (c.conditions?.length || 0), 0)
    : 0;
  const completedChecks = Object.values(checkedItems).filter(Boolean).length;
  const readinessPct = totalCheckableConditions > 0
    ? Math.round((completedChecks / totalCheckableConditions) * 100)
    : 0;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Map className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Simulateur & Diagnostic des Certificats d'Exportation — CCI Tunis
            </h3>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-800'}`}>
              Analyse Produit × Pays
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
            Sélectionnez ou saisissez votre produit et votre pays de destination pour obtenir <strong>tous les certificats requis</strong>, <strong>ce qui est le plus critique en priorité</strong>, et <strong>comment les obtenir étape par étape</strong>.
          </p>
        </div>

        {currentStep === 2 && (
          <Button onClick={handleReset} variant="outline" size="sm" className="text-xs shrink-0 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Nouvelle Analyse
          </Button>
        )}
      </div>

      {/* Step 0: Selection & Input */}
      {currentStep === 0 && (
        <div className="space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Scénarios d'Exportation Fréquents (Test en 1 clic) :
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStartAnalysis("Eau de Javel (Hypochlorite de Sodium)", "Libye")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>🧪 <strong>Eau de Javel</strong> ➔ <strong>Libye</strong></span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">CoC + FDS</span>
              </button>

              <button
                onClick={() => handleStartAnalysis("Huile d'Olive Conditionnée", "France (Union Européenne)")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark ? 'bg-blue-900/30 border-blue-500/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <span>🫒 Huile d'Olive ➔ France (UE)</span>
              </button>

              <button
                onClick={() => handleStartAnalysis("Dattes Deglet Nour", "Maroc")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🌴 Dattes Deglet Nour ➔ Maroc</span>
              </button>

              <button
                onClick={() => handleStartAnalysis("Conserves Harissa & Tomates", "Arabie Saoudite & Golfe")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark ? 'bg-teal-900/30 border-teal-500/30 text-teal-300 hover:bg-teal-900/50' : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                }`}
              >
                <span>🥫 Harissa & Conserves ➔ Arabie Saoudite</span>
              </button>

              <button
                onClick={() => handleStartAnalysis("Ciment & Céramique", "Sénégal (Afrique ZLECAf)")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark ? 'bg-purple-900/30 border-purple-500/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <span>🏗️ Ciment & Céramique ➔ Afrique (ZLECAf)</span>
              </button>

              <button
                onClick={() => handleStartAnalysis("Cosmétiques & Huiles Essentielles", "États-Unis (USA)")}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isDark ? 'bg-pink-900/30 border-pink-500/30 text-pink-300 hover:bg-pink-900/50' : 'bg-pink-50 border-pink-200 text-pink-800 hover:bg-pink-100'
                }`}
              >
                <span>✨ Cosmétiques ➔ USA (FDA)</span>
              </button>
            </div>
          </div>

          {/* Interactive Selector + Free Input Card */}
          <div className={`p-5 rounded-2xl border space-y-5 ${isDark ? 'bg-blue-950/20 border-blue-500/20' : 'bg-white border-blue-100 shadow-md'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Product Selection Column */}
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                  1. Choisir ou saisir le Produit à exporter *
                </label>
                <Input
                  placeholder="Saisissez un produit (ex: Eau de Javel, Huile d'olive, Câbles...)"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  className={isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {EXPORT_PRODUCT_CATALOG.map((item) => {
                    const selected = product.toLowerCase() === item.label.toLowerCase();
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setProduct(item.label)}
                        className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                          selected
                            ? (isDark ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-blue-600 text-white border-blue-600 font-bold')
                            : (isDark ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50/60')
                        }`}
                      >
                        <span className="text-base shrink-0">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[11px]">{item.label}</p>
                          <p className={`text-[9px] font-mono truncate ${selected ? 'text-blue-100' : 'opacity-60'}`}>SH {item.hs}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Destination Selection Column */}
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  2. Choisir ou saisir le Pays de destination *
                </label>
                <Input
                  placeholder="Saisissez un pays (ex: Libye, France, Algérie, Sénégal, USA...)"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className={isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-slate-50 border-slate-300'}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {EXPORT_DESTINATION_CATALOG.map((dest) => {
                    const selected = destination.toLowerCase() === dest.label.toLowerCase();
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setDestination(dest.label)}
                        className={`text-left px-2.5 py-2 rounded-xl border text-xs transition-all flex items-center gap-2 ${
                          selected
                            ? (isDark ? 'bg-amber-500/30 border-amber-400 text-white font-bold' : 'bg-amber-600 text-white border-amber-600 font-bold')
                            : (isDark ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50/60')
                        }`}
                      >
                        <span className="text-base shrink-0">{dest.flag}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[11px]">{dest.label}</p>
                          <p className={`text-[9px] truncate ${selected ? 'text-amber-100' : 'opacity-60'}`}>{dest.zone}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {product && destination ? (
                  <span>
                    Prêt à analyser : <strong className="text-blue-500">{product}</strong> ➔ <strong className="text-amber-500">{destination}</strong>
                  </span>
                ) : (
                  <span>Sélectionnez un produit et un pays ci-dessus pour générer le dossier réglementaire complet.</span>
                )}
              </div>
              <Button
                onClick={() => handleStartAnalysis(product, destination)}
                disabled={!product || !destination}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold shadow-lg shadow-blue-500/20"
              >
                Analyser les Certificats & Comment les Obtenir <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Multi-Step Diagnostic Animation */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border text-center space-y-6 ${isDark ? 'bg-slate-900/60 border-blue-500/30' : 'bg-blue-50/70 border-blue-200'}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Analyse Réglementaire & Douanière en cours...
              </h4>
              <p className={`text-xs ${isDark ? 'text-blue-300/70' : 'text-slate-600'}`}>
                Croisement des exigences pour : <strong className="text-blue-500">{product}</strong> ➔ <strong className="text-amber-500">{destination}</strong>
              </p>
            </div>
          </div>

          <div className="max-w-lg mx-auto space-y-3">
            {stepsList.map((st, index) => {
              const active = index === analyzingStep;
              const done = index < analyzingStep;
              return (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${done ? (isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900') : active ? (isDark ? 'bg-blue-900/40 border-blue-500/50 text-white scale-[1.02]' : 'bg-white border-blue-400 text-slate-900 shadow-md scale-[1.02]') : (isDark ? 'bg-slate-950/30 border-white/5 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400')}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-300 text-slate-700'}`}>
                    {done ? '✓' : index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{st.title}</p>
                    <p className="text-[11px] opacity-80">{st.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Step 2: Comprehensive Results */}
      {currentStep === 2 && result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* 1. Executive Summary Card */}
          <div className={`p-5 rounded-2xl border shadow-lg ${isDark ? 'bg-slate-900 border-blue-500/30' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-border/30">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider bg-blue-500/20 text-blue-500 border border-blue-500/30">
                    Rapport Officiel de Diagnostic Export
                  </span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Origine : Tunis (Tunisie) ➔ Destination : {destination}
                  </span>
                </div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Dossier de Certification : <span className="text-blue-500">{product}</span> vers <span className="text-amber-500">{destination}</span>
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/15 text-red-500 border border-red-500/30">
                  <ShieldCheck className="w-4 h-4" /> {result.mandatoryCount} Certificat(s) Obligatoire(s)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Préparation : {readinessPct}% ({completedChecks}/{totalCheckableConditions})
                </span>
              </div>
            </div>

            {/* Meta Grid: Category, HS Code, Trade Agreement, Duty Benefit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Catégorie & Filière :</span>
                <strong className={isDark ? 'text-white' : 'text-slate-800'}>{result.categoryLabel}</strong>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Code Douanier SH (HS Code) :</span>
                <strong className="font-mono text-blue-400">{result.hsCode}</strong>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accord Commercial Applicable :</span>
                <strong className={isDark ? 'text-amber-300' : 'text-amber-800'}>{result.tradeAgreement}</strong>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avantage Douanier :</span>
                <strong className="text-emerald-500">{result.customsDutyBenefit}</strong>
              </div>
            </div>

            {/* 2. "WHAT IS NEEDED MOST" — Priority #1 Critical Blocker Spotlight */}
            {result.topCriticalCert && (
              <div className={`mt-4 p-4 rounded-xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDark ? 'bg-gradient-to-r from-red-950/50 via-amber-950/30 to-slate-900 border-red-500/50' : 'bg-gradient-to-r from-red-50 via-amber-50/60 to-white border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500 text-white tracking-wider">
                        CE QUI EST LE PLUS REQUIS (PRIORITÉ #1 — ÉLÉMENT BLOQUANT)
                      </span>
                      <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                        <Clock className="w-3.5 h-3.5" /> À lancer en premier ({result.topCriticalCert.leadTime})
                      </span>
                    </div>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {result.topCriticalCert.title} — <span className="text-red-500 font-semibold">{result.topCriticalCert.authority}</span>
                    </p>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {result.topCriticalCert.purpose}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Section Title for All Certificates */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FileCheck className="w-4 h-4 text-blue-500" /> Liste Complète des Certificats Requis & Comment les Obtenir ({result.certificates.length})
            </h4>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cochez les prérequis ci-dessous pour suivre l'avancement de votre dossier export
            </span>
          </div>

          {/* 4. Detailed Certificate Cards */}
          <div className="space-y-4">
            {result.certificates.map((cert, idx) => (
              <div
                key={cert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  cert.color === 'red'
                    ? (isDark ? 'bg-red-950/15 border-red-500/40' : 'bg-red-50/40 border-red-200')
                    : cert.color === 'amber'
                    ? (isDark ? 'bg-amber-950/15 border-amber-500/40' : 'bg-amber-50/40 border-amber-200')
                    : (isDark ? 'bg-slate-900 border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm')
                }`}
              >
                {/* Certificate Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      cert.color === 'red' ? 'bg-red-500 text-white' :
                      cert.color === 'amber' ? 'bg-amber-500 text-white' :
                      cert.color === 'emerald' ? 'bg-emerald-600 text-white' :
                      cert.color === 'purple' ? 'bg-purple-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h5 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cert.title}
                        </h5>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          cert.color === 'red' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                          cert.color === 'amber' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                          cert.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                          cert.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {cert.statusBadge}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
                        <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          <Building2 className="w-3.5 h-3.5 shrink-0" /> Organisme : {cert.authority}
                        </span>
                        {cert.leadTime && (
                          <span className={`flex items-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                            <Clock className="w-3.5 h-3.5 shrink-0" /> Délai : <strong>{cert.leadTime}</strong>
                          </span>
                        )}
                      </div>
                      {cert.platform && (
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <strong>Guichet / Plateforme :</strong> {cert.platform} {cert.validityAndCost ? `• ${cert.validityAndCost}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <a
                    href="https://ccitunis.org.tn/adhesion-en-ligne-eservice/"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Demander via e-Service <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </a>
                </div>

                {/* Purpose */}
                <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <strong>Pourquoi ce certificat est requis :</strong> {cert.purpose}
                </p>

                {/* Two-Column Breakdown: 1) How to Get It (Step by Step) & 2) Prerequisites Checklist */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* How to get it */}
                  {cert.howToGet && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50/60 border-blue-200'}`}>
                      <span className={`font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                        <Compass className="w-3.5 h-3.5 text-blue-500" /> Comment l'obtenir (Procédure Étape par Étape) :
                      </span>
                      <ul className="space-y-1.5">
                        {cert.howToGet.map((stepText, sIdx) => (
                          <li key={sIdx} className={`${isDark ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>
                            {stepText}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conditions & Interactive Checklist */}
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                      <Scale className="w-3.5 h-3.5 text-amber-500" /> Pièces & Prérequis Exigés (Cliquez pour cocher) :
                    </span>
                    <ul className="space-y-1.5">
                      {cert.conditions.map((cond, cIdx) => {
                        const checkKey = `${cert.id}-${cIdx}`;
                        const isChecked = !!checkedItems[checkKey];
                        return (
                          <li
                            key={cIdx}
                            onClick={() => toggleConditionCheck(checkKey)}
                            className={`flex items-start gap-2 cursor-pointer select-none p-1.5 rounded-lg transition-colors ${
                              isChecked
                                ? (isDark ? 'bg-emerald-950/40 text-emerald-300 line-through opacity-80' : 'bg-emerald-50 text-emerald-800 line-through')
                                : (isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100')
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-relaxed">{cond}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 5. CCI Tunis Support Footer */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-blue-500 shrink-0" />
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Accompagnement Formalités Internationales — CCI Tunis
                </p>
                <p className={`text-[11px] ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
                  Guichet Certificats d'Origine, Légalisation de documents commerciaux & Carnet ATA — 31 Rue Abderrazak Chraïbi, Tunis.
                </p>
              </div>
            </div>
            <a href="https://ccitunis.org.tn/adhesion-en-ligne-eservice/" target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className={`text-xs shrink-0 ${isDark ? 'border-blue-500/30 text-blue-300 hover:bg-blue-900/40' : 'border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                Portail e-Service CCI Tunis <Globe className="w-3 h-3 ml-1" />
              </Button>
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 2. Smart B2B Matchmaking (Tunisia Trading)
function B2BMatchmakingTab({ isDark }) {
  const opportunities = [
    { type: 'Tender', title: 'Fourniture d\'équipements IT pour la région MENA', org: 'European Union (Interreg NEXT MED)', val: '1.2M TND', match: 94 },
    { type: 'Partner', title: 'Recherche de distributeurs de produits agroalimentaires', org: 'ASCAME Network', val: 'Partenariat', match: 88 },
    { type: 'Tender', title: 'Projet SPEEDUP: Accompagnement de startups', org: 'CCI Tunis / SMAC', val: '250K TND', match: 82 }
  ];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Briefcase className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`} />
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Tunisia Trading B2B Matchmaking</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
          AI POWERED
        </span>
      </div>
      <p className={`text-sm ${isDark ? 'text-purple-200/70' : 'text-slate-600'}`}>
        Opportunités générées automatiquement en fonction du profil de votre entreprise.
      </p>

      <div className="space-y-3">
        {opportunities.map((opp, i) => (
          <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-md'} transition-all cursor-pointer`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{opp.type}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold`}>{opp.match}% Match</span>
              </div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{opp.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{opp.org}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{opp.val}</span>
              <Button size="sm" variant="ghost" className={`mt-2 h-7 text-[11px] ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:bg-purple-50'}`}>View Details</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. EPC Academy
function EPCAcademyTab({ isDark }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', company: '' });

  const courses = [
    { title: 'Executive Master en Commerce Électronique', type: 'Formation Longue', status: 'Inscriptions Ouvertes' },
    { title: 'Maîtrisez l’Intelligence Artificielle (IA)', type: 'Formation Courte', status: 'Nouveau' },
    { title: 'Transport et Logistique Internationale (TLI)', type: 'Cycle de formation', status: 'Bientôt' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedCourse(null);
      setFormData({ fullName: '', email: '', phone: '', company: '' });
    }, 2500);
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>École Pratique de Commerce (EPC)</h3>
      </div>
      <p className={`text-sm ${isDark ? 'text-amber-200/70' : 'text-slate-600'}`}>
        Développez vos compétences avec nos programmes Executive Education certifiants.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'}`}>
            <div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
              <p className={`text-sm font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-amber-200/60' : 'text-slate-500'}`}>{c.type}</p>
            </div>
            <Button 
              onClick={() => setSelectedCourse(c)}
              size="sm" 
              className="w-full mt-4 h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm"
            >
              S'inscrire à la formation
            </Button>
          </div>
        ))}
      </div>

      {/* Course Registration Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedCourse(null)}>
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h4 className="text-lg font-bold">Demande d'inscription envoyée !</h4>
                <p className="text-xs text-muted-foreground">Notre équipe EPC Tunis vous contactera dans les plus brefs délais pour valider votre dossier.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-border">
                  <div>
                    <h4 className="font-bold text-sm">Inscription Formation</h4>
                    <p className="text-xs text-amber-500 font-medium">{selectedCourse.title}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCourse(null)} className="text-muted-foreground hover:text-foreground text-sm p-1">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold">Nom & Prénom *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Ex: Mohamed Ben Ali"
                      value={formData.fullName} 
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Adresse Email *</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="votre@email.com"
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Téléphone *</label>
                    <input 
                      required 
                      type="tel" 
                      placeholder="+216 27 777 751"
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Entreprise / Organisme (Optionnel)</label>
                    <input 
                      type="text" 
                      placeholder="Nom de votre société"
                      value={formData.company} 
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedCourse(null)} className="w-1/2 text-xs">Annuler</Button>
                  <Button type="submit" className="w-1/2 text-xs bg-amber-600 hover:bg-amber-700 text-white">Confirmer l'inscription</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Info Tab
function CCIInfoTab({ isDark }) {
  return (
    <div className="p-5 space-y-4">
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
          <BookOpen className="w-4 h-4" /> Présentation
        </h4>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-100/80' : 'text-slate-700'}`}>
          La Chambre de Commerce et d'Industrie de Tunis (CCI Tunis) est un établissement public d'intérêt économique.
          Elle a pour mission de représenter, d'appuyer et de développer les entreprises de la région (Tunis, Ariana, Ben Arous, Manouba, Zaghouan, Bizerte).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              <Sparkles className="w-3.5 h-3.5" /> Notre Vision
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Être le partenaire incontournable et le moteur d'innovation pour le développement économique et la compétitivité des entreprises à l'échelle nationale et internationale.
            </p>
          </div>
          
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Nos Valeurs
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Engagement, Proximité, Excellence, et Innovation au service des commerçants, industriels et prestataires de services de notre région.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href="https://ccitunis.org.tn/adhesion-en-ligne-eservice/" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all bg-blue-600 text-white hover:bg-blue-700 border-transparent`}>
            Adhésion en ligne (e-service)
          </a>
          <a href="https://ccitunis.org.tn/" target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-800 border-slate-200'}`}>
            <Globe className="w-3.5 h-3.5" /> Visiter ccitunis.org.tn
          </a>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'info', label: 'Info & Adhésion', Icon: Landmark },
  { id: 'export', label: 'Export Toolkit', Icon: Map },
  { id: 'b2b', label: 'B2B Matchmaking', Icon: Briefcase },
  { id: 'epc', label: 'EPC Academy', Icon: GraduationCap },
  { id: 'discussion', label: 'Discussions', Icon: MessageCircle },
];

export default function CCITunisLayout({
  circle, user, circleId,
  memberNames, memberProfiles, activeQuestion, selectedResponseData, setSelectedResponseData,
  responses, isMember, isAdmin, isModerator,
  newResponse, setNewResponse, submitResponse,
  newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
  allMemberIds,
}) {
  const [activeTab, setActiveTab] = useState('info');
  const { isDark } = useTheme();

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300" style={{ background: isDark ? 'linear-gradient(160deg,#040e25 0%,#010510 100%)' : 'linear-gradient(160deg,#f4f7fc 0%,#ffffff 100%)' }}>
      
      {/* ── CCI Tunis Header ── */}
      <div className="relative p-[2px] transition-all duration-300" style={{ background: isDark ? 'linear-gradient(135deg,rgba(37,99,235,0.6),rgba(245,158,11,0.4))' : 'linear-gradient(135deg,rgba(37,99,235,0.5),rgba(245,158,11,0.5))' }}>
        <div className="rounded-t-2xl px-6 py-6 transition-colors duration-300" style={{ background: isDark ? 'linear-gradient(135deg,#0a192f,#020c1b)' : 'linear-gradient(135deg,#ffffff,#f0f4fa)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-1 shadow-md border border-blue-100">
                <img src="https://ccitunis.org.tn/wp-content/uploads/2025/11/ccit.png" alt="CCI Tunis" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Official Chamber</span>
                  <VerifiedBadge label="Institution" size="sm" dark={isDark} />
                </div>
                <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Chambre de Commerce et d'Industrie de Tunis</h1>
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 mt-4 text-[11px] transition-colors duration-300 ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {allMemberIds.length} Members</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {circle?.privacy || 'Public'}</span>
          </div>
        </div>
      </div>

      <MarketTicker isDark={isDark} />

      {/* ── Tabs ── */}
      <div className="flex border-b overflow-x-auto scrollbar-none whitespace-nowrap transition-colors duration-300" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? isDark ? 'border-blue-400 text-blue-300 bg-blue-900/20' : 'border-blue-600 text-blue-700 bg-blue-50/50'
                : isDark ? 'text-slate-400 hover:text-white border-transparent hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-black/5'
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
          {activeTab === 'info' && <CCIInfoTab isDark={isDark} />}
          {activeTab === 'export' && <ExportToolkitTab isDark={isDark} />}
          {activeTab === 'b2b' && <B2BMatchmakingTab isDark={isDark} />}
          {activeTab === 'epc' && <EPCAcademyTab isDark={isDark} />}
          
          {activeTab === 'discussion' && (
            <div style={{ color: isDark ? 'white' : '#1c1917' }}>
              <CircleVisual
                members={memberNames}
                question={activeQuestion?.question_text}
                selectedResponse={selectedResponseData}
                questionNumber={activeQuestion?.question_number}
                closesAt={activeQuestion?.closes_at}
                totalResponses={responses.length}
                totalMembers={allMemberIds.length}
                circleName="CCI Tunis"
                memberProfiles={memberProfiles}
                isDark={isDark}
                allResponses={responses}
              />
              {Array.isArray(responses) && responses.length > 0 && (
                <div className="px-6 pb-4 mt-4">
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-blue-200' : 'text-slate-800'}`}>
                    <MessageCircle className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} /> Réponses
                  </h3>
                  <div className="space-y-2">
                    {responses.map((r) => {
                      const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                      const avatar = rProfile?.avatar_url || r.author_avatar;
                      return (
                        <div key={r.id} className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                              {avatar ? <img src={avatar} alt={r.author_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">{r.author_name?.[0]?.toUpperCase()}</div>}
                            </div>
                            <span className={`text-[11px] font-semibold ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>{r.author_name}</span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-white/90' : 'text-slate-900'}`}>{r.response_text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
