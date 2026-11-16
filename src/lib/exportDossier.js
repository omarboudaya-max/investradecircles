/**
 * Export dossiers: saving a certificate analysis with its checklist progress,
 * linking each formality to the body that issues it, and producing a PDF.
 */

const STORAGE_KEY = 'investraders_export_dossiers_v1';
const MAX_DOSSIERS = 20;

export const dossierId = (product, destination) => `${String(product).trim().toLowerCase()}→${String(destination).trim().toLowerCase()}`;

export function loadDossiers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDossier({ product, destination, checked, total }) {
  const id = dossierId(product, destination);
  const done = Object.values(checked || {}).filter(Boolean).length;
  const entry = { id, product, destination, checked: checked || {}, done, total, updatedAt: new Date().toISOString() };
  const next = [entry, ...loadDossiers().filter((d) => d.id !== id)].slice(0, MAX_DOSSIERS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}

export function removeDossier(id) {
  const next = loadDossiers().filter((d) => d.id !== id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}

// Where each formality is actually requested. Keyed by certificate id.
const CCI = { label: 'e-Service CCI Tunis', url: 'https://ccitunis.org.tn/adhesion-en-ligne-eservice/' };
const TTN = { label: 'Tunisie TradeNet (TTN)', url: 'https://www.tradenet.com.tn' };
const CERTIFICATE_LINKS = {
  'co-gafta': CCI,
  'co-eur1': CCI,
  'co-zlecaf': CCI,
  'co-non-pref': CCI,
  'ata-carnet': CCI,
  'alg-libre-vente': CCI,
  'ttn-dum-change': TTN,
  'auth-commerce-chem': TTN,
  'gulf-saber-sfda': { label: 'Plateforme SABER', url: 'https://saber.sa' },
  'egypt-acid-goeic': { label: 'CargoX (ACID)', url: 'https://cargox.io' },
  'usa-fda': { label: 'FDA — enregistrement', url: 'https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/registration-food-facilities-and-other-submissions' },
  'morocco-coc': { label: 'PortNet Maroc', url: 'https://www.portnet.ma' },
  'ce-innorpi-tech': { label: 'INNORPI', url: 'https://www.innorpi.tn' },
};

/** The official place to start a formality, or null when it is handled in person / by an agent. */
export function certificateLink(certificateId) {
  return CERTIFICATE_LINKS[certificateId] || null;
}

/** Plain-text summary, used when a member shares a dossier with the chamber's advisers. */
export function dossierToText({ product, destination, result, checked = {} }) {
  const lines = [
    `Dossier export : ${product} → ${destination}`,
    `Code SH : ${result.hsCode}`,
    `Accord : ${result.tradeAgreement}`,
    '',
    `Formalités (${result.certificates.length}) :`,
  ];
  result.certificates.forEach((cert, index) => {
    const total = cert.conditions?.length || 0;
    const done = (cert.conditions || []).filter((_, i) => checked[`${cert.id}-${i}`]).length;
    lines.push(`${index + 1}. ${cert.title} — ${cert.authority}${total ? ` [${done}/${total} prérequis prêts]` : ''}`);
  });
  return lines.join('\n');
}

/** Build and download the dossier as a PDF. jsPDF is loaded on demand. */
export async function downloadDossierPdf({ product, destination, result, checked = {} }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  // The built-in PDF fonts only cover Latin-1; replace the few symbols outside it.
  const clean = (text) => String(text ?? '')
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[➔→]/g, '->')
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '');

  const write = (text, { size = 10, style = 'normal', color = [30, 41, 59], gap = 4, indent = 0 } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(text), width - indent);
    for (const line of lines) {
      if (y + size > bottom) { doc.addPage(); y = margin; }
      doc.text(line, margin + indent, y);
      y += size * 1.35;
    }
    y += gap;
  };

  const totalConditions = result.certificates.reduce((sum, c) => sum + (c.conditions?.length || 0), 0);
  const doneConditions = Object.values(checked).filter(Boolean).length;

  write('Dossier de certification export', { size: 18, style: 'bold', gap: 2 });
  write(`${product}  ->  ${destination}`, { size: 12, style: 'bold', color: [37, 99, 235], gap: 2 });
  write(`Edité le ${new Date().toLocaleDateString('fr-FR')} - Préparation : ${doneConditions}/${totalConditions} prérequis prêts`, { size: 9, color: [100, 116, 139], gap: 12 });

  write(`Catégorie : ${result.categoryLabel}`, { size: 10 });
  write(`Code SH : ${result.hsCode}`, { size: 10 });
  write(`Accord commercial : ${result.tradeAgreement}`, { size: 10 });
  write(`Avantage douanier : ${result.customsDutyBenefit}`, { size: 10, gap: 12 });

  result.certificates.forEach((cert, index) => {
    if (y + 80 > bottom) { doc.addPage(); y = margin; }
    write(`${index + 1}. ${cert.title}`, { size: 12, style: 'bold', gap: 2 });
    write(`${cert.mandatory ? 'Obligatoire' : 'Recommandé'} - ${cert.authority}`, { size: 9, color: [71, 85, 105], gap: 2 });
    if (cert.leadTime) write(`Délai : ${cert.leadTime}`, { size: 9, color: [71, 85, 105], gap: 2 });
    if (cert.validityAndCost) write(cert.validityAndCost, { size: 9, color: [71, 85, 105], gap: 6 });
    write(cert.purpose, { size: 9.5, gap: 6 });
    if (cert.howToGet?.length) {
      write('Procédure', { size: 9.5, style: 'bold', gap: 2 });
      cert.howToGet.forEach((step) => write(step, { size: 9.5, gap: 2, indent: 10 }));
      y += 4;
    }
    if (cert.conditions?.length) {
      write('Pièces et prérequis', { size: 9.5, style: 'bold', gap: 2 });
      cert.conditions.forEach((condition, i) => write(`[${checked[`${cert.id}-${i}`] ? 'x' : ' '}] ${condition}`, { size: 9.5, gap: 2, indent: 10 }));
    }
    y += 10;
  });

  write("Document indicatif généré par Investraders. Les exigences évoluent : confirmez chaque formalité auprès de la CCI Tunis, de votre transitaire et de l'autorité compétente avant expédition.", { size: 8, color: [100, 116, 139] });

  const slug = `${product}-${destination}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  doc.save(`dossier-export-${slug || 'cci-tunis'}.pdf`);
}
