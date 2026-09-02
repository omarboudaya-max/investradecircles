import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  Landmark, Globe, Users, Briefcase, BookOpen, Map, Sparkles, TrendingUp, TrendingDown,
  FileText, ShieldCheck, Search, Download, GraduationCap, Calendar, MessageCircle, Send, Plus,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, FlaskConical, Building2, HelpCircle, RefreshCw, FileCheck, Scale
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

// ── Export Toolkit Engine with Multi-Step Analysis & Libya / Javel Rules ──
function evaluateExportCertificates(productRaw, destinationRaw) {
  const p = productRaw.toLowerCase().trim();
  const d = destinationRaw.toLowerCase().trim();

  const isJavel = p.includes('javel') || p.includes('hypochlorite') || p.includes('eau de javel');
  const isChemical = isJavel || p.includes('chimique') || p.includes('détergent') || p.includes('detergent') || p.includes('savon') || p.includes('nettoyant');
  const isFood = p.includes('huile') || p.includes('dattes') || p.includes('agro') || p.includes('poisson') || p.includes('fruit') || p.includes('alimentaire') || p.includes('jus');
  const isTextile = p.includes('textile') || p.includes('vêtement') || p.includes('vetement') || p.includes('tissu') || p.includes('habillement');

  const isLibya = d.includes('liby') || d.includes('libye') || d.includes('tripoli') || d.includes('benghazi');
  const isEU = d.includes('france') || d.includes('italie') || d.includes('allemagne') || d.includes('espagne') || d.includes('ue') || d.includes('europe');
  const isGAFTA = isLibya || d.includes('algéri') || d.includes('algerie') || d.includes('maroc') || d.includes('égypte') || d.includes('egypte') || d.includes('jordanie');

  let hsCode = '3824.90';
  let categoryLabel = 'Produits Généraux / Industriels';
  let tradeAgreement = 'Convention Douanière Standard (Carnet ATA / OMC)';

  if (isJavel) {
    hsCode = '2828.90.10 (Hypochlorite de sodium en solution aqueuse - Eau de Javel)';
    categoryLabel = 'Produit Chimique / Désinfectant Corrosif (Classe 8 Dangerous Goods)';
  } else if (isChemical) {
    hsCode = '3402.20 (Substances tensioactives & détergents)';
    categoryLabel = 'Produits Chimiques & Détergents';
  } else if (isFood) {
    hsCode = '1509.10 (Huiles d\'olive) / 0804.10 (Dattes)';
    categoryLabel = 'Produits Agroalimentaires & Périssables';
  } else if (isTextile) {
    hsCode = '6109.10 (Vêtements & Confection Textile)';
    categoryLabel = 'Textile, Habillement & Confection';
  }

  if (isLibya) {
    tradeAgreement = 'Accord de la Zone Arabe de Libre Échange (GAFTA / ZALE) - Exonération Tarifaire';
  } else if (isEU) {
    tradeAgreement = 'Accord d\'Association Tunisie - Union Européenne (EUR.1 / EUR-MED)';
  } else if (isGAFTA) {
    tradeAgreement = 'Accord GAFTA (Grande Zone Arabe de Libre Échange)';
  }

  const certificates = [];

  // Special Case: Eau de Javel to Libya
  if (isJavel && isLibya) {
    certificates.push({
      id: 'co-gafta',
      title: 'Certificat d\'Origine GAFTA / ZALE',
      authority: 'CCI Tunis (Chambre de Commerce et d\'Industrie de Tunis)',
      mandatory: true,
      statusBadge: 'OBLIGATOIRE',
      color: 'blue',
      purpose: 'Bénéficier de l\'exonération totale des droits de douane en Libye dans le cadre de la GAFTA.',
      conditions: [
        'Produit d\'origine tunisienne avec un taux de valeur ajoutée locale minimum de 40%.',
        'Dépôt de la facture commerciale définitive avec cachet et signature de l\'entreprise.',
        'Document visé en ligne via le portal e-services de la CCI Tunis (ccitunis.org.tn).'
      ]
    });

    certificates.push({
      id: 'coc-libya',
      title: 'Certificat de Conformité (CoC Libye / Inspection Avant Expédition)',
      authority: 'Organisme d\'inspection agréé par le Ministère de l\'Économie Libyen (ex: SGS, Intertek, TÜV)',
      mandatory: true,
      statusBadge: 'STRICTEMENT OBLIGATOIRE',
      color: 'red',
      purpose: 'Exigé obligatoirement par la Banque Centrale de Libye pour l\'ouverture de la Lettre de Crédit (L/C) et le dédouanement aux ports de Tripoli/Misrata/Benghazi.',
      conditions: [
        'Analyse obligatoire en laboratoire accrédité de la concentration en chlore actif (généralement 12° à 15° chlorométriques).',
        'Inspection physique de la cargaison et scellage des conteneurs avant le départ du Port de Radès ou Sfax.',
        'Étiquetage lisible et indélébile en langue ARABE comportant la mention "Eau de Javel / ماء جافيل", les précautions d\'emploi, la date de fabrication et de péremption.'
      ]
    });

    certificates.push({
      id: 'fds-health',
      title: 'Fiche de Données de Sécurité (FDS) & Certificat de Salubrité / Analyse Chimique',
      authority: 'Laboratoire National de Contrôle / ANCSEP / Ministère de la Santé Publique',
      mandatory: true,
      statusBadge: 'OBLIGATOIRE - RISQUE CHIMIQUE',
      color: 'amber',
      purpose: 'Garantir la sécurité du transport maritime/terrestre et la conformité sanitaire pour les produits désinfectants corrosifs.',
      conditions: [
        'FDS rédigée conformément à la norme internationale SGH (GHS) en langue Arabe et Française.',
        'Certificat d\'analyse attestant l\'absence de contaminants métalliques lourds et la stabilité du produit au transport transfrontalier.',
        'Emballage résistant homologué pour substances corrosives (Fûts / Bidons HDPE neutres et hermétiques).'
      ]
    });

    certificates.push({
      id: 'auth-export-chem',
      title: 'Déclaration & Autorisation d\'Exportation de Produits Chimiques de Base',
      authority: 'Ministère du Commerce et du Développement des Exportations (Tunisie)',
      mandatory: true,
      statusBadge: 'SOUS CONDITION DE VOLUME',
      color: 'emerald',
      purpose: 'Autoriser la sortie du territoire national pour les volumes industriels de substances désinfectantes.',
      conditions: [
        'Présentation du contrat commercial ou bon de commande du client libyen.',
        'Engagement d\'avoir une fiche d\'expédition douanière valide et de respecter les quotas d\'approvisionnement du marché local tunisien.'
      ]
    });
  } else {
    // General Rules based on destination and category
    certificates.push({
      id: 'co-general',
      title: isEU ? 'Certificat d\'Origine EUR.1 / EUR-MED' : (isGAFTA ? 'Certificat d\'Origine GAFTA' : 'Certificat d\'Origine Général'),
      authority: 'CCI Tunis / Direction Générale des Douanes',
      mandatory: true,
      statusBadge: 'OBLIGATOIRE',
      color: 'blue',
      purpose: `Justifier l'origine tunisienne des marchandises exportées vers ${destinationRaw}.`,
      conditions: [
        'Justificatif de transformation suffisante ou valeur ajoutée nationale de 40%+.',
        'Facture commerciale originale visée par la CCI Tunis.',
        'Déclaration Unique de Marchandises (DUM).'
      ]
    });

    if (isChemical) {
      certificates.push({
        id: 'fds-gen',
        title: 'Fiche de Données de Sécurité (FDS) & Certificat d\'Analyse',
        authority: 'Laboratoire Chimique Agréé / ANCSEP',
        mandatory: true,
        statusBadge: 'OBLIGATOIRE',
        color: 'amber',
        purpose: 'Attester de la composition chimique et de la sécurité des détergents/produits nettoyants.',
        conditions: [
          'FDS conforme SGH.',
          'Rapport de laboratoire certifié datant de moins de 6 mois.'
        ]
      });
    }

    if (isFood) {
      certificates.push({
        id: 'phytosanitary',
        title: 'Certificat Phytosanitaire / Sanitaire à l\'Export',
        authority: 'Ministère de l\'Agriculture (Direction de la Protection des Végétaux)',
        mandatory: true,
        statusBadge: 'OBLIGATOIRE',
        color: 'emerald',
        purpose: 'Certifier que les produits agricoles ou alimentaires sont exempts de parasites et conformes aux normes sanitaires.',
        conditions: [
          'Inspection physique sur le lieu de conditionnement par un inspecteur agricole.',
          'Analyses résiduelles d\'pesticides pour l\'accès aux marchés européens/arabes.'
        ]
      });
    }

    if (isEU) {
      certificates.push({
        id: 'ata-carnet',
        title: 'Carnet ATA (pour exportation temporaire)',
        authority: 'CCI Tunis (Délégation de la Chambre de Commerce)',
        mandatory: false,
        statusBadge: 'RECOMMANDÉ POUR ÉCHANTILLONS',
        color: 'purple',
        purpose: 'Faciliter l\'exportation temporaire de marchandises, échantillons commerciaux ou matériels d\'exposition sans payer de droits de douane.',
        conditions: [
          'Demande de Carnet ATA déposée au préalable auprès du guichet de la CCI Tunis.',
          'Paiement de la caution ou garantie bancaire.'
        ]
      });
    }
  }

  return {
    hsCode,
    categoryLabel,
    tradeAgreement,
    certificates,
    isJavelLibya: isJavel && isLibya,
    summaryMessage: isJavel && isLibya
      ? "L'exportation d'Eau de Javel de Tunis vers la Libye requiert impérativement 4 certificats et autorisations majeures (Origine GAFTA, Inspection CoC Libye, FDS Chimique et Salubrité). Une inspection physique préalable et un étiquetage en arabe sont requis."
      : `L'exportation de "${productRaw}" vers "${destinationRaw}" requiert ${certificates.filter(c => c.mandatory).length} certificat(s) obligatoire(s).`
  };
}

function ExportToolkitTab({ isDark }) {
  const [product, setProduct] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: input, 1: step-by-step diagnostic, 2: result
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [result, setResult] = useState(null);

  const stepsList = [
    { title: "Nomenclature SH & Risque Produit", detail: "Détection du HS Code et classification des risques (chimiques, corrosifs, sanitaires...)" },
    { title: "Accords Commerciaux & Zone Douanière", detail: "Vérification des traités préférentiels (GAFTA/ZALE, EUR.1, OMC, UMA...)" },
    { title: "Normes de Destination & Exigences Bancaires", detail: "Contrôle des réglementations de la Banque Centrale et des douanes du pays importateur..." },
    { title: "Matrice de Certification & Conditions", detail: "Génération de la feuille de route douanière et des prérequis de la CCI Tunis..." }
  ];

  const handleStartAnalysis = (prodVal, destVal) => {
    const finalProd = prodVal || product;
    const finalDest = destVal || destination;
    if (!finalProd || !finalDest) return;

    if (prodVal) setProduct(prodVal);
    if (destVal) setDestination(destVal);

    setCurrentStep(1);
    setLoading(true);
    setAnalyzingStep(0);

    // Simulate multi-step analysis
    setTimeout(() => setAnalyzingStep(1), 600);
    setTimeout(() => setAnalyzingStep(2), 1200);
    setTimeout(() => setAnalyzingStep(3), 1800);

    setTimeout(() => {
      const evaluation = evaluateExportCertificates(finalProd, finalDest);
      setResult(evaluation);
      setLoading(false);
      setCurrentStep(2);
    }, 2400);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setResult(null);
    setAnalyzingStep(0);
  };

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Export Readiness Toolkit — CCI Tunis
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
              Moteur d'Analyse Réglementaire
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
            Analyse préalable multicritères pour déterminer si votre produit nécessite un certificat d'origine, un certificat de conformité (CoC) ou une autorisation spéciale à l'exportation depuis Tunis.
          </p>
        </div>

        {currentStep === 2 && (
          <Button onClick={handleReset} variant="outline" size="sm" className="text-xs shrink-0 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Nouvelle Analyse
          </Button>
        )}
      </div>

      {/* Preset Quick Actions */}
      {currentStep === 0 && (
        <div className="space-y-2">
          <label className={`text-xs font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Analyses Fréquentes & Cas Particuliers :
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStartAnalysis("Eau de Javel", "Libye")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
              <span>🧪 <strong>Eau de Javel</strong> vers <strong>Libye</strong></span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold">Cas Régl. Stricte</span>
            </button>

            <button
              onClick={() => handleStartAnalysis("Huile d'olive", "France")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark ? 'bg-blue-900/30 border-blue-500/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span>🫒 Huile d'Olive ➔ France (UE)</span>
            </button>

            <button
              onClick={() => handleStartAnalysis("Dattes Deglet Nour", "Algérie")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span>🌴 Dattes Deglet Nour ➔ Algérie</span>
            </button>

            <button
              onClick={() => handleStartAnalysis("Textiles & Vêtements", "Italie")}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark ? 'bg-purple-900/30 border-purple-500/30 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <span>👕 Textiles & Habillement ➔ Italie</span>
            </button>
          </div>
        </div>
      )}

      {/* Form Input (Step 0) */}
      {currentStep === 0 && (
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-blue-950/20 border-blue-500/20' : 'bg-white border-blue-100 shadow-md'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Produit à exporter depuis Tunis *
              </label>
              <Input
                placeholder="ex: Eau de Javel, Huile d'olive, Détergent..."
                value={product}
                onChange={e => setProduct(e.target.value)}
                className={isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50'}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Pays ou Région de destination *
              </label>
              <Input
                placeholder="ex: Libye, France, Algérie, Égypte..."
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className={isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50'}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => handleStartAnalysis(product, destination)}
              disabled={!product || !destination}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold shadow-lg shadow-blue-500/20"
            >
              Lancer l'Analyse Préalable & Matrice des Certificats <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Diagnostic Animation (Step 1) */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border text-center space-y-6 ${isDark ? 'bg-slate-900/60 border-blue-500/30' : 'bg-blue-50/70 border-blue-200'}`}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Analyse Préalable en cours...
              </h4>
              <p className={`text-xs ${isDark ? 'text-blue-300/70' : 'text-slate-600'}`}>
                Evaluation multicritères pour : <strong className="text-blue-500">{product}</strong> ➔ <strong className="text-blue-500">{destination}</strong>
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="max-w-md mx-auto space-y-3">
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

      {/* Comprehensive Analysis Result (Step 2) */}
      {currentStep === 2 && result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Summary Box */}
          <div className={`p-5 rounded-2xl border shadow-lg ${result.isJavelLibya ? (isDark ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-red-950/40 border-amber-500/40' : 'bg-gradient-to-r from-amber-50 via-white to-red-50 border-amber-300') : (isDark ? 'bg-slate-900 border-blue-500/30' : 'bg-white border-slate-200')}`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-border/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${result.isJavelLibya ? 'bg-red-500/20 text-red-500 font-bold border border-red-500/30' : 'bg-blue-500/20 text-blue-400'}`}>
                    Rapport de Diagnostic Export
                  </span>
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tunis ➔ {destination}
                  </span>
                </div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Résultat de l'analyse pour : <span className="text-blue-500">{product}</span>
                </h4>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${result.isJavelLibya ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                  <ShieldCheck className="w-4 h-4" /> {result.isJavelLibya ? 'Réglementation Stricte (4 Certificats)' : `${result.certificates.length} Document(s) à préparer`}
                </span>
              </div>
            </div>

            {/* Product Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Catégorie de Produit :</span>
                <strong className={isDark ? 'text-white' : 'text-slate-800'}>{result.categoryLabel}</strong>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Code Douanier Estimé (SH) :</span>
                <strong className="font-mono text-blue-400">{result.hsCode}</strong>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`block font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accord Commercial Applicable :</span>
                <strong className={isDark ? 'text-amber-300' : 'text-amber-800'}>{result.tradeAgreement}</strong>
              </div>
            </div>

            {/* Libya Special Alert Banner */}
            {result.isJavelLibya && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm">Focus Spécial : Exigences d'exportation d'Eau de Javel de Tunis vers la Libye</p>
                  <p className="leading-relaxed">
                    En raison de la nature corrosive du produit (Hypochlorite de sodium) et de la réglementation de la <strong>Banque Centrale de Libye</strong>, l'accès au marché libyen nécessite la délivrance d'un <strong>Certificat de Conformité (CoC) d'inspection avant embarquement</strong> ainsi qu'une <strong>Fiche de Données de Sécurité (FDS)</strong> visée, sous peine de blocage en douane au port d'arrivée (Tripoli / Misrata).
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Certificates Matrix Header */}
          <div className="flex items-center justify-between pt-2">
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FileCheck className="w-4 h-4 text-blue-500" /> Matrice des Certificats Possibles & Exigences Associées
            </h4>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Délivrance certifiée CCI Tunis & Organismes Réglementaires
            </span>
          </div>

          {/* Certificates List Cards */}
          <div className="space-y-4">
            {result.certificates.map((cert, idx) => (
              <div
                key={cert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  cert.color === 'red'
                    ? (isDark ? 'bg-red-950/20 border-red-500/40' : 'bg-red-50/50 border-red-200')
                    : cert.color === 'amber'
                    ? (isDark ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50/50 border-amber-200')
                    : (isDark ? 'bg-slate-900 border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md')
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      cert.color === 'red' ? 'bg-red-500 text-white' : cert.color === 'amber' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h5 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {cert.title}
                        </h5>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          cert.color === 'red' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                          cert.color === 'amber' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {cert.statusBadge}
                        </span>
                      </div>
                      <p className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        <Building2 className="w-3.5 h-3.5 shrink-0" /> Organisme Émetteur : {cert.authority}
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://ccitunis.org.tn/adhesion-en-ligne-eservice/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Demander / Entamer démarche
                    </Button>
                  </a>
                </div>

                <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <strong>Objectif :</strong> {cert.purpose}
                </p>

                {/* Conditions Block */}
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`font-bold block uppercase text-[10px] tracking-wider flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                    <Scale className="w-3.5 h-3.5 text-amber-500" /> Conditions & Prérequis Exigés :
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside">
                    {cert.conditions.map((cond, cIdx) => (
                      <li key={cIdx} className={`${isDark ? 'text-slate-200' : 'text-slate-700'} leading-relaxed`}>
                        {cond}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* CCI Tunis Support Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-blue-950/30 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-3">
              <Landmark className="w-6 h-6 text-blue-500 shrink-0" />
              <div>
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Besoin d'accompagnement sur la certification CCI Tunis ?
                </p>
                <p className={`text-[11px] ${isDark ? 'text-blue-200/70' : 'text-slate-600'}`}>
                  Le service de facilitation de la Chambre de Commerce et d'Industrie de Tunis vous assiste pour l'obtention des certificats d'origine e-service.
                </p>
              </div>
            </div>
            <a href="https://ccitunis.org.tn/" target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className={`text-xs shrink-0 ${isDark ? 'border-blue-500/30 text-blue-300 hover:bg-blue-900/40' : 'border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                Plateforme e-service CCI <Globe className="w-3 h-3 ml-1" />
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
