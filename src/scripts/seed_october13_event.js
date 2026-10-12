import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://earhypzdxwbohdncdzvz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmh5cHpkeHdib2hkbmNkenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2OTksImV4cCI6MjA5NzExNDY5OX0.gMKrm7I88A5N-9YS_bi1HnMN1nrVfXMU7ilgrHGGgXw';
const supabase = createClient(supabaseUrl, supabaseKey);

const circleId = 'f38551e6-1951-4a27-af07-e1a34228c389';

const aiCachedData = {
  name: 'Colloque 13 Octobre — IA & Souveraineté Économique',
  is_product_brand: false,
  tagline: 'Wisdom Net × UTICA × Fondation Konrad Adenauer (KAS Tunisie)',
  mission: 'Fédérer les forces économiques nationales, investisseurs, ministères et leaders industriels autour du pilotage stratégique de l\'Intelligence Artificielle et de la compétitivité souveraine de la Tunisie.',
  vision: 'Établir la Tunisie comme hub euro-méditerranéen et africain d\'excellence en IA appliquée et en financements d\'impact.',
  goals: [
    'Déployer des solutions opérationnelles d\'IA pour les entreprises industrielles et de services',
    'Renforcer la souveraineté numérique et la valorisation des compétences tunisiennes',
    'Structurer des corridors de partenariat et de co-investissement avec l\'Europe et le Golfe',
    'Présentation officielle du Command Center UTICA et de la plateforme Investraders'
  ],
  services: [
    { title: '08h30 – 09h00 : Accueil & Émargement', description: 'Accueil des délégations officielles, présidents de fédérations et chefs d\'entreprises au Siège de l\'UTICA.' },
    { title: '09h00 – 10h00 : Allocutions Protocolaires', description: 'Allocutions d\'ouverture : Présidence de l\'UTICA, Représentation résidente KAS Tunisie, et Ministère des Technologies de la Communication.' },
    { title: '10h00 – 11h00 : Keynote d\'Ouverture', description: 'L\'Intelligence Artificielle et la Souveraineté Économique : Enjeux d\'indépendance technologique et valeur ajoutée nationale.' },
    { title: '11h15 – 12h45 : Panel 1 — Industrie 4.0 & Régulation', description: 'Impact de l\'AI Act européen, décarbonation et gains de productivité pour les exportateurs tunisiens.' },
    { title: '14h00 – 15h15 : Démonstration Exclusive Investraders & UTICA Command Center', description: 'Présentation en direct du centre d\'intelligence macroéconomique et du radar d\'opportunités B2B.' },
    { title: '15h30 – 17h00 : Matchmaking B2B & Networking Dirigeants', description: 'Rencontres bilatérales entre entreprises, banques, fonds d\'investissement et partenaires institutionnels.' }
  ],
  products: [],
  news: [
    { date: '12 Octobre 2026', title: 'Finalisation des préparatifs pour le Colloque National au siège de l\'UTICA.' },
    { date: '10 Octobre 2026', title: 'Confirmation de la présence des délégations institutionnelles et des directeurs généraux.' }
  ]
};

async function run() {
  console.log('Seeding October 13 Circle...');
  
  // 1. Update Circle
  const { data: cData, error: cErr } = await supabase.from('Circle').update({
    name: 'Événement 13 Octobre — Forum IA & Souveraineté',
    description: 'Cercle Officiel du Colloque National du 13 Octobre 2026 au Siège de l\'UTICA : "L\'Intelligence Artificielle et la Souveraineté Économique", co-organisé par Wisdom Net, l\'UTICA et la Fondation Konrad Adenauer (KAS). Programme officiel, panels ministériels, B2B et restitution des travaux.',
    ai_cached_data: aiCachedData,
    website_url: 'https://www.investraders.net/event'
  }).eq('id', circleId).select();

  console.log('Circle updated:', cData?.length, 'Error:', cErr);

  // 2. Insert Event into CircleEvent
  const { data: eData, error: eErr } = await supabase.from('CircleEvent').insert([
    {
      circle_id: circleId,
      title: 'Colloque National : IA et Souveraineté Économique',
      description: 'Grand rendez-vous institutionnel et économique au Siège de l\'UTICA (09h00 - 17h00). Panels ministériels, démonstration en direct du Command Center UTICA et rencontres B2B bilatérales.',
      event_date: '2026-10-13T09:00:00+01:00',
      status: 'approved',
      session_active: false,
      author_name: 'UTICA & Wisdom Net Leadership',
      created_by_id: '10af05af-2778-47ca-afd7-1ac0d7baebef',
      event_type: 'meeting',
      meet_link: 'https://www.investraders.net/event'
    }
  ]).select();

  console.log('Event created:', eData?.length, 'Error:', eErr);

  // 3. Insert 4 rich posts into Post table
  const posts = [
    {
      circle_id: circleId,
      created_by_id: '10af05af-2778-47ca-afd7-1ac0d7baebef',
      author_name: 'Direction de l\'Événement — UTICA / KAS',
      visibility: 'public',
      post_type: 'text',
      content: '🏛️ Bienvenue sur le Cercle Officiel du Colloque National du 13 Octobre 2026 au Siège de l\'UTICA : "L\'Intelligence Artificielle et la Souveraineté Économique".\n\nCet espace réunit les dirigeants d\'entreprises, membres des fédérations sectorielles, partenaires de la Fondation Konrad Adenauer (KAS) et délégations gouvernementales pour suivre le déroulement des travaux, les annonces clés et les opportunités de partenariat.',
      likes: 12,
      liked_by: [],
      reactions: {},
      created_date: '2026-10-12T08:00:00+01:00',
      intent_category: 'ANNOUNCEMENT'
    },
    {
      circle_id: circleId,
      created_by_id: '10af05af-2778-47ca-afd7-1ac0d7baebef',
      author_name: 'Comité de Programme & Contenu',
      visibility: 'public',
      post_type: 'text',
      content: '📋 Programme Officiel de la Journée du 13 Octobre 2026 :\n\n• 08h30 : Accueil des invités & Émargement\n• 09h00 : Allocutions d\'ouverture (Présidence UTICA, KAS Tunisie, Ministère des TIC)\n• 10h00 : Keynote d\'Ouverture — IA & Souveraineté Économique\n• 11h15 : Panel 1 — Industrie 4.0, Données & Régulation européenne\n• 14h00 : Démonstration exclusive du Command Center UTICA en direct\n• 15h30 : Salon B2B & Matchmaking bilatéral entreprises-investisseurs\n• 17h00 : Recommandations stratégiques & Clôture',
      likes: 18,
      liked_by: [],
      reactions: {},
      created_date: '2026-10-12T09:30:00+01:00',
      intent_category: 'INSIGHT'
    },
    {
      circle_id: circleId,
      created_by_id: '10af05af-2778-47ca-afd7-1ac0d7baebef',
      author_name: 'Cellule IA & Innovation Investraders',
      visibility: 'public',
      post_type: 'text',
      content: '🚀 Session Phare de 14h00 : Démonstration du Command Center Économique UTICA.\n\nNous présenterons en direct sur écran de projection l\'infrastructure d\'écoute macroéconomique, la cartographie du sentiment des entreprises dans les 24 gouvernorats, le radar d\'affaires B2B et l\'assistant décisionnel IA développé au service de l\'industrie tunisienne.',
      likes: 24,
      liked_by: [],
      reactions: {},
      created_date: '2026-10-12T11:00:00+01:00',
      intent_category: 'OPPORTUNITY'
    },
    {
      circle_id: circleId,
      created_by_id: '10af05af-2778-47ca-afd7-1ac0d7baebef',
      author_name: 'Pôle B2B & Partenariats',
      visibility: 'public',
      post_type: 'text',
      content: '🤝 Espace Matchmaking & Partenariats d\'Affaires :\n\nLes entreprises participantes peuvent dès à présent se connecter au Matchmaker IA pour planifier leurs rendez-vous bilatéraux prévus à 15h30 lors du forum. Des représentants de fonds d\'investissement, de banques de développement et de partenaires européens et du Golfe seront présents.',
      likes: 15,
      liked_by: [],
      reactions: {},
      created_date: '2026-10-12T14:00:00+01:00',
      intent_category: 'PARTNERSHIP'
    }
  ];

  const { data: pData, error: pErr } = await supabase.from('Post').insert(posts).select();
  console.log('Posts inserted:', pData?.length, 'Error:', pErr);
}

run();
