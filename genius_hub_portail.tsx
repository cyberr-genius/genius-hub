import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Compass,
  GraduationCap,
  Briefcase,
  Clock,
  Play,
  RefreshCw,
  Bell,
  BellOff,
  Bookmark,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Filter,
  User,
  History,
  Server,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Award,
  Zap,
  AlertCircle,
  Globe,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plane,
  Settings,
  Trash2,
  Building2
} from 'lucide-react';

// Constante pour l'intervalle de 10 heures en millisecondes
const TEN_HOURS_MS = 10 * 60 * 60 * 1000; // 36 000 000 ms

// Clés de stockage local persistant
const STORAGE_KEYS = {
  PROFILE: 'geniushub_user_profile_v1',
  OPPORTUNITIES: 'geniushub_opportunities_v1',
  SCAN_LOGS: 'geniushub_scan_logs_v1',
  SCHEDULER: 'geniushub_scheduler_v1'
};

// Liste rapide des nationalités (francophones, africaines et internationales)
const POPULAR_NATIONALITIES = [
  'Burkina Faso',
  "Côte d'Ivoire",
  'Sénégal',
  'Mali',
  'Niger',
  'Bénin',
  'Togo',
  'Cameroun',
  'Maroc',
  'Tunisie',
  'Algérie',
  'RD Congo',
  'Guinée',
  'Madagascar',
  'France',
  'Canada',
  'Belgique',
  'Suisse'
];

// Niveaux d'études
const EDUCATION_LEVELS = [
  'Licence 2 / Bac+2',
  'Licence 3 / Bachelor',
  'Master 1',
  'Master 2 / Cycle Ingénieur',
  'Doctorat / PhD',
  'Jeune Diplômé(e)'
];

// Les 4 grands axes de recherche demandés
const INTEREST_CATEGORIES = [
  {
    id: 'stages_finances',
    label: 'Stages financés',
    shortLabel: 'Stages financés',
    description: 'Stages rémunérés / indemnisés en laboratoire, entreprise tech ou organisation internationale.',
    icon: Briefcase,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  {
    id: 'bourses_inscription_existante',
    label: 'Bourses sur inscription existante (Frais de scolarité)',
    shortLabel: 'Bourses frais de scolarité',
    description: "Financement pour l'école/université où vous êtes déjà inscrit(e), sans imposer d'établissement partenaire.",
    icon: GraduationCap,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    id: 'summits_fellowships',
    label: 'Youth Summits & Programmes Ambassadeurs / Fellowships',
    shortLabel: 'Summits & Fellowships',
    description: 'Mozilla Fellowship, Microsoft Learn Student Ambassadors, GDSC, One Young World, Youth Summits.',
    icon: Award,
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200'
  },
  {
    id: 'conferences_financees',
    label: 'Conférences financées (Travel Grants)',
    shortLabel: 'Conférences financées',
    description: "Conférences tech et académiques avec prise en charge du billet d'avion, hôtel et pass d'accès.",
    icon: Plane,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  }
];

const QUICK_SKILLS = [
  'Informatique',
  'Intelligence Artificielle',
  'Développement Web / Mobile',
  'Cybersécurité',
  'Réseaux & Cloud',
  'Data Science',
  'Open Source',
  'Leadership & Communauté',
  'Génie & Énergie',
  'Finance & Gestion',
  'Recherche Académique',
  'Entrepreneuriat Social'
];

const TARGET_REGIONS = [
  'Monde entier (International)',
  'Afrique',
  'Europe',
  'Amérique du Nord (Canada / USA)',
  'Asie',
  'En ligne / Hybride'
];

const LANGUAGES_LIST = ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Allemand', 'Portugais'];

// Helper pour formater le compte à rebours HHh MMm SSs
function formatDuration(ms) {
  if (ms <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// Helper pour formater une date en français
function formatDateTime(isoString) {
  if (!isoString) return 'Jamais';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Normalise l'URL du portail d'application pour garantir un lien valide
function resolveApplicationPortalUrl(portalUrl, portalHint, title, organization) {
  const raw = (portalUrl || '').trim();
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  const domainMatch = (portalHint || raw).match(
    /(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s,)]*)?)/
  );
  if (domainMatch && domainMatch[1]) {
    const cleanDomain = domainMatch[1].replace(/[.,;]+$/, '');
    return `https://${cleanDomain}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${title} ${organization} official application portal`
  )}`;
}

// Évaluation dynamique d'éligibilité selon les nationalités du profil
function evaluateNationalityEligibility(opp, nationalities = []) {
  const userNats = nationalities.length > 0 ? nationalities : ['Candidat international'];
  const natsLabel = userNats.join(' / ');

  if (opp.eligibilityStatus === 'ELIGIBLE_ALL') {
    return {
      status: 'ELIGIBLE_ALL',
      badgeText: 'Éligible — Toutes nationalités acceptées',
      verdict: `Toutes les nationalités sont acceptées sans restriction de passeport. Votre nationalité (${natsLabel}) est pleinement éligible.`
    };
  }

  if (opp.eligibilityStatus === 'ELIGIBLE_INCLUDED') {
    return {
      status: 'ELIGIBLE_INCLUDED',
      badgeText: `Éligible — ${natsLabel} inclus`,
      verdict:
        opp.nationalityVerdict ||
        `Ce programme couvre explicitement les ressortissants de : ${natsLabel}.`
    };
  }

  if (opp.eligibilityStatus === 'CONDITIONAL') {
    return {
      status: 'CONDITIONAL',
      badgeText: 'À vérifier / Conditionnel',
      verdict:
        opp.nationalityVerdict ||
        `Vérifiez les conditions spécifiques de résidence ou d'inscription pour ${natsLabel}.`
    };
  }

  return {
    status: 'NOT_ELIGIBLE',
    badgeText: 'Non éligible (Restriction géographique)',
    verdict:
      opp.nationalityVerdict ||
      `Restriction géographique ne couvrant pas directement ${natsLabel}.`
  };
}

// Génération du jeu initial d'opportunités réalistes adaptées au profil et à la nationalité
function buildInitialOpportunities(profile) {
  const natsLabel = profile.nationalities.join(' / ');
  const nowIso = new Date().toISOString();

  const catalog = [
    {
      id: 'init_mlsa_2026',
      title: 'Microsoft Learn Student Ambassadors (MLSA)',
      organization: 'Microsoft',
      location: 'En ligne & Événements régionaux / mondiaux',
      categoryId: 'summits_fellowships',
      categoryLabel: 'Summits & Fellowships',
      matchScore: 97,
      matchReason: `Parfaitement aligné avec votre profil (${profile.fieldOfStudy}) et votre statut d'étudiant(e) en ${profile.educationLevel}.`,
      funding: 'Certification gratuite, crédits Azure 150$/mois, mentorat & sommets pris en charge',
      deadline: 'Candidatures continues (Cohortes trimestrielles)',
      duration: '1 an renouvelable',
      eligibilityStatus: 'ELIGIBLE_ALL',
      nationalityCondition: 'Ouvert aux étudiants inscrits dans un établissement supérieur dans le monde entier (toutes nationalités).',
      nationalityVerdict: `Toutes les nationalités sont acceptées. En tant que ressortissant(e) (${natsLabel}) inscrit(e) dans l'enseignement supérieur, vous êtes 100% éligible.`,
      eligibilityCriteria: [
        'Être âgé(e) d’au moins 16 ans et inscrit(e) à temps plein dans un établissement d’enseignement supérieur accrédité',
        'Toutes les nationalités sont acceptées sans restriction de pays',
        'Intérêt marqué pour la technologie, le partage de connaissances et l’animation de communauté'
      ],
      requiredSkills: ['Leadership & Communauté', 'Informatique', 'Cloud', 'Anglais / Français'],
      description:
        "Programme mondial de leadership étudiant permettant d'organiser des ateliers tech sur son campus, d'accéder aux ingénieurs Microsoft et d'obtenir des financements pour participer aux sommets étudiants.",
      applicationChecklist: [
        'Vérifier son certificat de scolarité universitaire actif',
        'Enregistrer une courte vidéo de présentation (2 min)',
        'Rédiger les 3 réponses sur votre impact communautaire',
        'Soumettre le dossier sur le portail Student Ambassadors'
      ],
      motivationTips:
        'Mettez en avant une initiative concrète où vous avez aidé d’autres étudiants à apprendre une technologie ou résolu un problème local.',
      officialPortalHint: 'mvp.microsoft.com/studentambassadors',
      applicationPortalUrl: 'https://mvp.microsoft.com/studentambassadors'
    },
    {
      id: 'init_tuition_grant_2026',
      title: "Bourse d'Excellence & Couverture des Frais de Scolarité (Université libre)",
      organization: 'MPOWER Financing / AUF / Fondations Indépendantes de Mérite',
      location: "Dans votre université actuelle (Sans changement d'établissement)",
      categoryId: 'bourses_inscription_existante',
      categoryLabel: 'Bourses frais de scolarité',
      matchScore: 95,
      matchReason: `Répond directement à votre besoin de financer votre scolarité actuelle (${profile.educationLevel}) sans vous imposer une université partenaire spécifique.`,
      funding: '2 000 € à 10 000 € versés directement pour les frais de scolarité et inscription',
      deadline: 'Sessions semestrielles (Prochaine clôture dans 45 jours)',
      duration: '1 année académique (renouvelable)',
      eligibilityStatus: 'ELIGIBLE_ALL',
      nationalityCondition: 'Ouvert à toutes les nationalités sur présentation d’une attestation d’inscription dans une école ou université accréditée.',
      nationalityVerdict: `Éligible pour ${natsLabel} : aucune restriction de passeport, l'attribution repose sur l'inscription active et le dossier académique.`,
      eligibilityCriteria: [
        'Être déjà admis(e) ou inscrit(e) dans un cursus supérieur (Licence, Master, Ingénieur ou Doctorat)',
        'Aucune université imposée : valable pour votre établissement actuel sous réserve d’accréditation',
        'Ouvert à toutes les nationalités avec relevés de notes récents'
      ],
      requiredSkills: [profile.fieldOfStudy, 'Dossier académique', 'Projet professionnel'],
      description:
        "Aide financière directe destinée aux étudiants déjà inscrits dans un cursus supérieur afin de régler leurs frais de scolarité ou de laboratoire sans obligation de mobilité vers une université imposée.",
      applicationChecklist: [
        'Télécharger le certificat de scolarité ou lettre d’admission de votre école actuelle',
        'Préparer les relevés de notes des 2 derniers semestres',
        'Obtenir une lettre de recommandation d’un professeur',
        'Joindre le relevé des frais de scolarité de l’établissement'
      ],
      motivationTips:
        'Expliquez clairement comment la prise en charge de vos frais de scolarité vous permettra de vous consacrer à 100% à vos projets en ' +
        profile.fieldOfStudy +
        '.',
      officialPortalHint: 'mpowerfinancing.com/scholarships',
      applicationPortalUrl: 'https://www.mpowerfinancing.com/scholarships'
    },
    {
      id: 'init_cern_internship_2026',
      title: 'Stage Technique & Recherche Financée (CERN / Laboratoires Internationaux)',
      organization: 'CERN — Organisation Européenne pour la Recherche Nucléaire',
      location: 'Genève, Suisse (Prise en charge complète)',
      categoryId: 'stages_finances',
      categoryLabel: 'Stages financés',
      matchScore: 93,
      matchReason: `Idéal pour une expérience pratique en ${profile.fieldOfStudy} avec une allocation mensuelle couvrant intégralement le séjour.`,
      funding: '3 452 CHF / mois (~3 600 €) + billet d’avion aller-retour + assurance santé',
      deadline: 'Prochaine sélection ouverte',
      duration: '4 à 12 mois',
      eligibilityStatus: 'ELIGIBLE_ALL',
      nationalityCondition: 'Le programme Openlab / International Students accepte toutes les nationalités (États membres et non-membres).',
      nationalityVerdict: `Éligible pour ${natsLabel} via le quota international ouvert à toutes les nationalités sans restriction.`,
      eligibilityCriteria: [
        'Être inscrit(e) en Licence avancée, Master, cycle Ingénieur ou Doctorat dans un domaine technique/scientifique',
        'Toutes les nationalités sont acceptées via les programmes ouverts aux étudiants internationaux',
        'Maîtrise opérationnelle de l’anglais ou du français'
      ],
      requiredSkills: ['Informatique', 'Python / C++', 'Data Science', 'Réseaux & Cloud'],
      description:
        "Stage rémunéré au sein des équipes d'ingénierie informatique et de recherche scientifique pour travailler sur des infrastructures distribuées, l'IA et la cybersécurité à grande échelle.",
      applicationChecklist: [
        'Préparer un CV technique orienté projets (1 à 2 pages)',
        'Joindre le dernier relevé de notes officiel',
        'Fournir 1 à 2 lettres de référence académique',
        'Compléter le formulaire sur SmartRecruiters CERN'
      ],
      motivationTips:
        'Détaillez vos projets techniques concrets (dépôts GitHub, architectures déployées) plutôt que de simples listes de cours.',
      officialPortalHint: 'careers.cern/students',
      applicationPortalUrl: 'https://careers.cern/students'
    },
    {
      id: 'init_mozilla_fellowship_2026',
      title: 'Mozilla Fellowships & Programmes Tech Responsable / Open Source',
      organization: 'Mozilla Foundation',
      location: 'Télétravail international & Sommets mondiaux',
      categoryId: 'summits_fellowships',
      categoryLabel: 'Summits & Fellowships',
      matchScore: 91,
      matchReason: `Correspond à votre intérêt pour les fellowships internationaux et vos compétences en ${profile.skills.slice(0, 2).join(', ')}.`,
      funding: 'Allocation jusqu’à 60 000 $ USD + budget déplacements & conférences',
      deadline: 'Appel à candidatures annuel',
      duration: '10 à 12 mois',
      eligibilityStatus: 'ELIGIBLE_ALL',
      nationalityCondition: 'Programme mondial ouvert aux candidats de tous les pays, avec un fort accent sur la diversité géographique (Afrique, Europe, Amériques, Asie).',
      nationalityVerdict: `Toutes nationalités acceptées : ${natsLabel} est pleinement éligible pour postuler depuis son pays de résidence.`,
      eligibilityCriteria: [
        'Ouvert à toutes les nationalités sans condition de diplôme obligatoire',
        'Expérience ou engagement démontré dans l’open source, la vie privée, l’IA éthique ou la santé numérique',
        'Capacité à travailler en autonomie dans un environnement international'
      ],
      requiredSkills: ['Open Source', 'Intelligence Artificielle', 'Cybersécurité', 'Impact Social'],
      description:
        "Programme de fellowship soutenant les technologues, chercheurs et activistes qui construisent un internet plus ouvert, éthique et accessible à travers des projets open source.",
      applicationChecklist: [
        'Définir une proposition de projet open source ou de recherche appliquée',
        'Présenter vos réalisations passées ou contributions communautaires',
        'Préparer un budget prévisionnel d’impact',
        'Soumettre la candidature en ligne sur Mozilla Foundation'
      ],
      motivationTips:
        'Insistez sur l’impact concret de votre projet pour les communautés locales et l’écosystème numérique ouvert.',
      officialPortalHint: 'foundation.mozilla.org/fellowships',
      applicationPortalUrl: 'https://foundation.mozilla.org/en/what-we-fund/fellowships/'
    },
    {
      id: 'init_conf_grant_2026',
      title: 'Bourse de Voyage & Participation (Travel Grant — Conférences Tech & IA)',
      organization: 'Deep Learning Indaba / NeurIPS / AfricArXiv Travel Grants',
      location: 'Afrique & International (Billet + Hébergement inclus)',
      categoryId: 'conferences_financees',
      categoryLabel: 'Conférences financées',
      matchScore: 94,
      matchReason: `Offre une prise en charge intégrale pour assister à une grande conférence internationale en lien avec ${profile.fieldOfStudy}.`,
      funding: '100% financé : Billet d’avion A/R, hôtel, frais de visa et pass conférence',
      deadline: 'Clôture 6 semaines avant l’événement',
      duration: '5 à 7 jours',
      eligibilityStatus: 'ELIGIBLE_INCLUDED',
      nationalityCondition: 'Priorité accordée aux étudiants et chercheurs ressortissants des pays africains et des pays en développement, ainsi qu’aux candidats internationaux.',
      nationalityVerdict: `Éligible — Votre nationalité (${natsLabel}) fait partie des profils prioritaires pour les bourses de voyage complètes.`,
      eligibilityCriteria: [
        `Ressortissant(e) d’un pays éligible (incluant ${natsLabel}) ou candidat(e) disposant d’un passeport valide`,
        'Statut d’étudiant(e), jeune chercheur/chercheuse ou praticien(ne) actif/active dans le domaine',
        'Soumission d’un dossier de motivation ou d’un résumé de projet/recherche avant la date limite'
      ],
      requiredSkills: ['Intelligence Artificielle', 'Data Science', 'Recherche Académique'],
      description:
        "Programme de bourses de mobilité permettant aux étudiants et jeunes chercheurs de participer aux grandes conférences technologiques et scientifiques sans aucun frais à avancer.",
      applicationChecklist: [
        'Rédiger un court résumé (abstract) de vos travaux ou intérêts de recherche',
        'Demander une attestation de statut étudiant à votre établissement',
        'Remplir le formulaire de demande de Travel Grant avant la date limite',
        'Préparer les documents pour la lettre d’invitation visa'
      ],
      motivationTips:
        'Expliquez comment vous partagerez les connaissances acquises lors de la conférence avec votre club étudiant ou votre université au retour.',
      officialPortalHint: 'deeplearningindaba.com / neurips.cc',
      applicationPortalUrl: 'https://deeplearningindaba.com/'
    },
    {
      id: 'init_oyw_summit_2026',
      title: 'One Young World Summit — Bourse Délégué(e) Jeune Leader',
      organization: 'One Young World',
      location: 'Sommet Mondial Annuel (Tous frais payés)',
      categoryId: 'summits_fellowships',
      categoryLabel: 'Summits & Fellowships',
      matchScore: 89,
      matchReason: `Opportunité majeure de sommet international jeunesse couvrant intégralement le voyage et l'accès au réseau mondial.`,
      funding: 'Vol aller-retour, hôtel 4*, restauration et accès complet au sommet financés',
      deadline: 'Vagues de sélection mensuelles',
      duration: '4 jours + réseau d’ambassadeurs à vie',
      eligibilityStatus: 'ELIGIBLE_ALL',
      nationalityCondition: 'Ouvert aux jeunes de 18 à 30 ans de toutes les nationalités (plus de 190 pays représentés chaque année).',
      nationalityVerdict: `Toutes nationalités acceptées : ${natsLabel} est éligible à toutes les bourses partenaires (Leading Africa, Audi, etc.).`,
      eligibilityCriteria: [
        'Être âgé(e) de 18 à 30 ans au moment du sommet',
        'Toutes les nationalités sont acceptées (plus de 190 pays éligibles)',
        'Démontrer un leadership actif et un impact positif mesurable dans sa communauté ou son secteur'
      ],
      requiredSkills: ['Leadership & Communauté', 'Entrepreneuriat Social', 'Communication'],
      description:
        "Le plus grand sommet mondial rassemblant de jeunes leaders issus de plus de 190 pays pour accélérer des projets à impact social, technologique et environnemental.",
      applicationChecklist: [
        'Identifier les bourses partenaires ouvertes à votre région',
        'Rédiger votre parcours d’engagement et vision d’impact',
        'Fournir les coordonnées d’un référent',
        'Finaliser le dossier sur le portail One Young World'
      ],
      motivationTips:
        'Soyez précis sur les résultats chiffrés de vos actions associatives, étudiantes ou entrepreneuriales.',
      officialPortalHint: 'oneyoungworld.com/scholarships',
      applicationPortalUrl: 'https://www.oneyoungworld.com/scholarships'
    }
  ];

  // Trier pour mettre en avant les catégories choisies par l'utilisateur
  const selectedCats = profile.interests || [];
  const prioritized = [...catalog].sort((a, b) => {
    const aSelected = selectedCats.includes(a.categoryId) ? 1 : 0;
    const bSelected = selectedCats.includes(b.categoryId) ? 1 : 0;
    if (bSelected !== aSelected) return bSelected - aSelected;
    return b.matchScore - a.matchScore;
  });

  return prioritized.map((item) => ({
    ...item,
    discoveredAt: nowIso,
    discoveredVia: 'INITIAL_CATALOG',
    isNew: true,
    saved: false,
    applied: false,
    completedChecklist: []
  }));
}

// Appel à l'API Gemini avec backoff exponentiel et vérification d'éligibilité par nationalité
async function fetchOpportunitiesFromGemini(profile, existingTitles = [], isScheduledCycle = false) {
  const apiKey = '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const interestLabels = INTEREST_CATEGORIES.filter((c) =>
    (profile.interests || []).includes(c.id)
  ).map((c) => `${c.label} (${c.description})`);

  const systemPrompt = `Tu es Genius Hub, un assistant expert dans la détection de bourses, stages financés, fellowships et conférences internationales.
RÈGLE CRUCIALE D'ÉLIGIBILITÉ :
Tu dois impérativement vérifier l'éligibilité par rapport à la NATIONALITÉ du candidat (${profile.nationalities.join(' / ')}).
- Si l'opportunité est ouverte mondialement sans restriction de passeport, mets eligibilityStatus = "ELIGIBLE_ALL".
- Si l'opportunité cible une zone/groupe incluant explicitement la nationalité du candidat (ex: Afrique francophone, pays en développement, Commonwealth, etc.), mets eligibilityStatus = "ELIGIBLE_INCLUDED".
- S'il y a une condition particulière (visa, résidence), mets eligibilityStatus = "CONDITIONAL".
- Fournis toujours une liste claire des conditions d'éligibilité (eligibilityCriteria) et l'URL officielle du portail de candidature (applicationPortalUrl).

Tu dois répondre EXCLUSIVEMENT en français, avec un JSON valide respectant strictement le schéma demandé, et générer 4 nouvelles opportunités distinctes de la liste déjà existante.`;

  const userQuery = `Profil complet du candidat :
- Nom : ${profile.fullName}
- Nationalité(s) : ${profile.nationalities.join(' / ')}
- Niveau d'études : ${profile.educationLevel}
- Domaine / Spécialité : ${profile.fieldOfStudy}
- Statut d'inscription : ${profile.enrollmentStatus || 'Déjà inscrit dans un établissement supérieur'}
- Compétences clés : ${profile.skills.join(', ')}
- Langues parlées : ${profile.languages.join(', ')}
- Zones géographiques souhaitées : ${profile.regions.join(', ')}
- Centres d'intérêt sélectionnés (axes prioritaires) :
${interestLabels.map((l) => `  * ${l}`).join('\n')}
- Type de déclenchement : ${isScheduledCycle ? 'Cycle de veille automatique toutes les 10 heures' : 'Recherche manuelle lancée par le candidat'}

Titres déjà présents (à ne pas répéter) :
${existingTitles.length > 0 ? existingTitles.slice(0, 15).join(' | ') : 'Aucun'}

Génère 4 opportunités concrètes, réelles et actuelles alignées avec ces centres d'intérêt (ex: stages financés dans de grands labos/entreprises, bourses couvrant les frais de scolarité de l'école déjà fréquentée sans imposer d'université, Youth Summits, Mozilla Fellowship, Microsoft Ambassador, Google/Linux Foundation mentorships, conférences financées avec travel grants).`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            organization: { type: 'STRING' },
            location: { type: 'STRING' },
            categoryId: {
              type: 'STRING',
              enum: [
                'stages_finances',
                'bourses_inscription_existante',
                'summits_fellowships',
                'conferences_financees'
              ]
            },
            matchScore: { type: 'INTEGER' },
            matchReason: { type: 'STRING' },
            funding: { type: 'STRING' },
            deadline: { type: 'STRING' },
            duration: { type: 'STRING' },
            eligibilityStatus: {
              type: 'STRING',
              enum: ['ELIGIBLE_ALL', 'ELIGIBLE_INCLUDED', 'CONDITIONAL', 'NOT_ELIGIBLE']
            },
            nationalityCondition: { type: 'STRING' },
            nationalityVerdict: { type: 'STRING' },
            eligibilityCriteria: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            requiredSkills: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            description: { type: 'STRING' },
            applicationChecklist: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            },
            motivationTips: { type: 'STRING' },
            officialPortalHint: { type: 'STRING' },
            applicationPortalUrl: { type: 'STRING' }
          },
          required: [
            'title',
            'organization',
            'location',
            'categoryId',
            'matchScore',
            'matchReason',
            'funding',
            'deadline',
            'duration',
            'eligibilityStatus',
            'nationalityCondition',
            'nationalityVerdict',
            'eligibilityCriteria',
            'requiredSkills',
            'description',
            'applicationChecklist',
            'motivationTips',
            'officialPortalHint',
            'applicationPortalUrl'
          ]
        }
      }
    }
  };

  let attempt = 0;
  const maxRetries = 4;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Réponse vide du modèle');
      }

      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        throw new Error('Format JSON invalide');
      }

      return parsed;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxRetries) {
        throw err;
      }
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return [];
}

// ============================================================================
// COMPOSANT PRINCIPAL : App (Genius Hub — Thème Jaune Sobre Apaisant)
// ============================================================================
export default function App() {
  // Profil utilisateur sauvegardé
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Opportunités détectées
  const [opportunities, setOpportunities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Historique des scans (10h et manuels)
  const [scanLogs, setScanLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCAN_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Configuration du planificateur 10h
  const [scheduler, setScheduler] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignorer
    }
    const now = Date.now();
    return {
      enabled: true,
      intervalMs: TEN_HOURS_MS,
      lastScanTimestamp: null,
      nextScanTimestamp: now + TEN_HOURS_MS,
      browserNotifications: false
    };
  });

  // Navigation & UI
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities' | 'scheduler' | 'settings'
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(TEN_HOURS_MS);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Filtres du flux
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [onlyEligibleNationality, setOnlyEligibleNationality] = useState(true);
  const [onlySavedFilter, setOnlySavedFilter] = useState(false);

  // Références pour le cycle temps réel
  const isScanningRef = useRef(false);
  const opportunitiesRef = useRef(opportunities);
  opportunitiesRef.current = opportunities;

  // Système de notifications Toast
  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }, []);

  // Persistance dans localStorage
  useEffect(() => {
    try {
      if (profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      } else {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
    } catch (e) {
      console.error('Erreur sauvegarde profil:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
    } catch (e) {
      console.error('Erreur sauvegarde opportunités:', e);
    }
  }, [opportunities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(scanLogs));
    } catch (e) {
      console.error('Erreur sauvegarde logs:', e);
    }
  }, [scanLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULER, JSON.stringify(scheduler));
    } catch (e) {
      console.error('Erreur sauvegarde planificateur:', e);
    }
  }, [scheduler]);

  // Notification bureau si activée
  const triggerBrowserNotification = useCallback((count, topTitle) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`Genius Hub : ${count} nouvelles opportunités vérifiées !`, {
          body: topTitle
            ? `Top match éligible : ${topTitle}`
            : 'De nouvelles bourses, stages ou fellowships correspondent à votre profil.'
        });
      } catch {
        // Ignorer en environnement sandbox restreint
      }
    }
  }, []);

  // Fonction d'exécution d'un scan IA (Manuel ou Cycle 10h)
  const runOpportunityScan = useCallback(
    async (targetProfile, triggerType = 'MANUAL') => {
      if (!targetProfile || isScanningRef.current) return;

      isScanningRef.current = true;
      setIsScanning(true);
      setScanError(null);

      const scanStart = Date.now();
      const isAuto = triggerType === 'AUTO_10H' || triggerType === 'SIMULATED_10H';

      try {
        const existingTitles = opportunitiesRef.current.map((o) => o.title);
        const rawResults = await fetchOpportunitiesFromGemini(
          targetProfile,
          existingTitles,
          isAuto
        );

        const nowIso = new Date().toISOString();
        const formattedNewItems = rawResults.map((item, idx) => {
          const catObj = INTEREST_CATEGORIES.find((c) => c.id === item.categoryId);
          return {
            ...item,
            id: `gh_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            categoryLabel: catObj ? catObj.shortLabel : 'Opportunité',
            discoveredAt: nowIso,
            discoveredVia: triggerType,
            isNew: true,
            saved: false,
            applied: false,
            completedChecklist: []
          };
        });

        setOpportunities((prev) => [
          ...formattedNewItems,
          ...prev.map((old) => ({ ...old, isNew: false }))
        ]);

        const completedAt = Date.now();
        setScheduler((prev) => ({
          ...prev,
          lastScanTimestamp: completedAt,
          nextScanTimestamp: completedAt + prev.intervalMs
        }));

        const logEntry = {
          id: `log_${completedAt}`,
          timestamp: new Date(completedAt).toISOString(),
          triggerType,
          newMatchesCount: formattedNewItems.length,
          durationSec: Math.max(1, Math.round((completedAt - scanStart) / 1000)),
          status: 'SUCCESS',
          nationalityChecked: targetProfile.nationalities.join(' / ')
        };
        setScanLogs((prev) => [logEntry, ...prev].slice(0, 50));

        addToast(
          isAuto ? 'Veille automatique 10h terminée' : 'Recherche IA Genius Hub terminée',
          `${formattedNewItems.length} nouvelles opportunités vérifiées pour votre nationalité (${targetProfile.nationalities.join(' / ')}).`,
          'success'
        );

        if (scheduler.browserNotifications && formattedNewItems.length > 0) {
          triggerBrowserNotification(formattedNewItems.length, formattedNewItems[0].title);
        }
      } catch (err) {
        console.error('Erreur lors du scan IA:', err);
        setScanError(
          "La connexion au moteur IA a rencontré une erreur temporaire. Vos opportunités enregistrées restent accessibles et le prochain cycle de 10h reste actif."
        );

        const failedAt = Date.now();
        setScanLogs((prev) => [
          {
            id: `log_${failedAt}`,
            timestamp: new Date(failedAt).toISOString(),
            triggerType,
            newMatchesCount: 0,
            durationSec: Math.max(1, Math.round((failedAt - scanStart) / 1000)),
            status: 'ERROR',
            nationalityChecked: targetProfile.nationalities.join(' / ')
          },
          ...prev
        ]);

        addToast(
          'Erreur de recherche',
          'Impossible de récupérer de nouveaux résultats pour le moment.',
          'error'
        );
      } finally {
        isScanningRef.current = false;
        setIsScanning(false);
      }
    },
    [addToast, scheduler.browserNotifications, triggerBrowserNotification]
  );

  // Minuteur temps réel de surveillance du cycle de 10 heures
  useEffect(() => {
    if (!profile) return;

    const tick = () => {
      if (!scheduler.enabled) {
        setTimeRemainingMs(scheduler.intervalMs);
        return;
      }

      const now = Date.now();
      const remaining = scheduler.nextScanTimestamp - now;

      if (remaining <= 0) {
        setTimeRemainingMs(0);
        if (!isScanningRef.current) {
          runOpportunityScan(profile, 'AUTO_10H');
        }
      } else {
        setTimeRemainingMs(remaining);
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [profile, scheduler.enabled, scheduler.nextScanTimestamp, scheduler.intervalMs, runOpportunityScan]);

  // Validation de l'onboarding initial
  const handleCompleteOnboarding = async (newProfile) => {
    setProfile(newProfile);
    setActiveTab('opportunities');

    const initialOpps = buildInitialOpportunities(newProfile);
    setOpportunities(initialOpps);

    const now = Date.now();
    setScheduler((prev) => ({
      ...prev,
      enabled: true,
      lastScanTimestamp: now,
      nextScanTimestamp: now + prev.intervalMs
    }));

    setScanLogs([
      {
        id: `log_init_${now}`,
        timestamp: new Date(now).toISOString(),
        triggerType: 'INITIAL_ONBOARDING',
        newMatchesCount: initialOpps.length,
        durationSec: 1,
        status: 'SUCCESS',
        nationalityChecked: newProfile.nationalities.join(' / ')
      }
    ]);

    addToast(
      `Bienvenue sur Genius Hub, ${newProfile.fullName} !`,
      `Éligibilité vérifiée pour ${newProfile.nationalities.join(' / ')} et veille automatique de 10h activée.`,
      'success'
    );
  };

  // Mise à jour du profil et des centres d'intérêt depuis l'onglet Paramètres
  const handleUpdateSettings = async (updatedProfile, shouldRescanNow = false) => {
    setProfile(updatedProfile);
    addToast(
      'Paramètres enregistrés',
      "Votre nationalité et vos centres d'intérêt ont été mis à jour.",
      'success'
    );

    if (shouldRescanNow) {
      setActiveTab('opportunities');
      await runOpportunityScan(updatedProfile, 'PROFILE_UPDATE');
    }
  };

  // Actions sur les opportunités
  const toggleSaveOpportunity = (id) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, saved: !opp.saved } : opp))
    );
    if (selectedOpportunity?.id === id) {
      setSelectedOpportunity((prev) => (prev ? { ...prev, saved: !prev.saved } : null));
    }
  };

  const toggleAppliedOpportunity = (id) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        const nextApplied = !opp.applied;
        return { ...opp, applied: nextApplied, saved: nextApplied ? true : opp.saved };
      })
    );
    if (selectedOpportunity?.id === id) {
      setSelectedOpportunity((prev) =>
        prev
          ? { ...prev, applied: !prev.applied, saved: !prev.applied ? true : prev.saved }
          : null
      );
    }
  };

  const toggleChecklistItem = (oppId, itemIdx) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== oppId) return opp;
        const current = opp.completedChecklist || [];
        const updated = current.includes(itemIdx)
          ? current.filter((i) => i !== itemIdx)
          : [...current, itemIdx];
        return { ...opp, completedChecklist: updated };
      })
    );
    if (selectedOpportunity?.id === oppId) {
      setSelectedOpportunity((prev) => {
        if (!prev) return null;
        const current = prev.completedChecklist || [];
        const updated = current.includes(itemIdx)
          ? current.filter((i) => i !== itemIdx)
          : [...current, itemIdx];
        return { ...prev, completedChecklist: updated };
      });
    }
  };

  const toggleSchedulerEnabled = () => {
    setScheduler((prev) => {
      const nextEnabled = !prev.enabled;
      const now = Date.now();
      addToast(
        nextEnabled ? 'Veille automatique 10h activée' : 'Veille automatique en pause',
        nextEnabled
          ? 'Genius Hub lancera une recherche ciblée toutes les 10 heures.'
          : 'Le minuteur de 10 heures est temporairement suspendu.',
        'info'
      );
      return {
        ...prev,
        enabled: nextEnabled,
        nextScanTimestamp: nextEnabled ? now + prev.intervalMs : prev.nextScanTimestamp
      };
    });
  };

  const toggleBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      addToast('Non supporté', 'Votre navigateur ne supporte pas les notifications.', 'error');
      return;
    }
    if (scheduler.browserNotifications) {
      setScheduler((prev) => ({ ...prev, browserNotifications: false }));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setScheduler((prev) => ({ ...prev, browserNotifications: true }));
      addToast(
        'Alertes activées',
        'Vous recevrez une notification dès qu’un cycle de 10h trouve des opportunités éligibles.',
        'success'
      );
    } else {
      addToast(
        'Permission refusée',
        'Veuillez autoriser les notifications dans les réglages de votre navigateur.',
        'error'
      );
    }
  };

  const handleResetAll = () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.OPPORTUNITIES);
    localStorage.removeItem(STORAGE_KEYS.SCAN_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULER);
    setProfile(null);
    setOpportunities([]);
    setScanLogs([]);
    setActiveTab('opportunities');
  };

  // Affichage de l'accueil Onboarding au premier contact
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#faf7ef] text-stone-900 flex flex-col">
        <OnboardingWizard onComplete={handleCompleteOnboarding} />
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  // Filtrage des opportunités
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || opp.categoryId === selectedCategoryFilter;

    const elig = evaluateNationalityEligibility(opp, profile.nationalities);
    const matchesNationality =
      !onlyEligibleNationality ||
      elig.status === 'ELIGIBLE_ALL' ||
      elig.status === 'ELIGIBLE_INCLUDED';

    const matchesSaved = !onlySavedFilter || opp.saved || opp.applied;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      opp.title.toLowerCase().includes(q) ||
      opp.organization.toLowerCase().includes(q) ||
      opp.location.toLowerCase().includes(q) ||
      (opp.requiredSkills || []).some((s) => s.toLowerCase().includes(q));

    return matchesCategory && matchesNationality && matchesSaved && matchesQuery;
  });

  const eligibleCount = opportunities.filter((opp) => {
    const s = evaluateNationalityEligibility(opp, profile.nationalities).status;
    return s === 'ELIGIBLE_ALL' || s === 'ELIGIBLE_INCLUDED';
  }).length;

  const savedCount = opportunities.filter((o) => o.saved || o.applied).length;

  return (
    <div className="min-h-screen bg-[#faf7ef] text-stone-900 flex flex-col font-sans selection:bg-amber-200/80 selection:text-stone-900">
      {/* EN-TÊTE PRINCIPAL (Jaune sable doux & pierre claire) */}
      <header className="sticky top-0 z-30 bg-[#f6f1e3]/95 backdrop-blur-xl border-b border-amber-900/10 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Identité Genius Hub */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-xs text-stone-950">
                <Compass className="w-5 h-5 text-stone-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-stone-900">
                    Genius Hub
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-700/15">
                    <Globe className="w-3 h-3 text-amber-700" />
                    {profile.nationalities.join(' / ')}
                  </span>
                </div>
                <p className="text-xs text-stone-600 hidden sm:block">
                  Bonjour {profile.fullName} • {profile.educationLevel} ({profile.fieldOfStudy})
                </p>
              </div>
            </div>

            {/* Navigation 3 onglets principaux (Desktop) */}
            <nav className="hidden md:flex items-center bg-amber-950/[0.05] p-1 rounded-xl border border-amber-900/10">
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'opportunities'
                    ? 'bg-white text-stone-900 shadow-2xs border border-amber-900/10'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Opportunités & Éligibilité</span>
                <span className="px-2 py-0.2 text-xs rounded-full bg-amber-100 text-amber-900 border border-amber-700/15">
                  {eligibleCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scheduler')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'scheduler'
                    ? 'bg-white text-stone-900 shadow-2xs border border-amber-900/10'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <History className="w-4 h-4 text-amber-600" />
                <span>Veille 10h & Hébergement</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-stone-900 shadow-2xs border border-amber-900/10'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-600" />
                <span>Profil & Paramètres</span>
              </button>
            </nav>

            {/* Boutons d'action rapides */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleBrowserNotifications}
                title={
                  scheduler.browserNotifications
                    ? 'Notifications bureau activées'
                    : 'Activer les alertes bureau'
                }
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  scheduler.browserNotifications
                    ? 'bg-amber-100 border-amber-700/20 text-amber-900'
                    : 'bg-white border-amber-900/15 text-stone-600 hover:text-stone-900'
                }`}
              >
                {scheduler.browserNotifications ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={() => runOpportunityScan(profile, 'MANUAL')}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 text-sm font-bold border border-amber-700/20 shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isScanning ? 'Vérification IA...' : 'Lancer une recherche'}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Mobile */}
          <div className="flex md:hidden items-center justify-between gap-1 py-2 border-t border-amber-900/10 overflow-x-auto">
            {[
              { id: 'opportunities', label: 'Opportunités', icon: Sparkles, count: eligibleCount },
              { id: 'scheduler', label: 'Veille 10h', icon: History },
              { id: 'settings', label: 'Paramètres', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-600 hover:bg-amber-100/70'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/70 text-stone-900">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* BANDEAU DE VEILLE AUTOMATIQUE TOUTES LES 10 HEURES */}
      <div className="bg-[#f3ecd8] border-b border-amber-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleSchedulerEnabled}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                scheduler.enabled
                  ? 'bg-emerald-50 border-emerald-700/20 text-emerald-900'
                  : 'bg-white border-amber-900/15 text-stone-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  scheduler.enabled ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span>
                {scheduler.enabled ? 'Veille auto 10h : ACTIVE' : 'Veille auto 10h : EN PAUSE'}
              </span>
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700 bg-white px-3 py-1 rounded-lg border border-amber-900/10 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-700" />
              {scheduler.enabled ? (
                <span>
                  Prochaine recherche auto dans{' '}
                  <strong className="font-mono text-amber-900">
                    {formatDuration(timeRemainingMs)}
                  </strong>
                </span>
              ) : (
                <span className="text-stone-500">Minuteur 10h suspendu</span>
              )}
            </div>

            <span className="text-xs text-stone-600 hidden xl:inline">
              Filtre passeport actif : <strong className="text-stone-800">{profile.nationalities.join(' / ')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runOpportunityScan(profile, 'SIMULATED_10H')}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-900/15 text-xs font-semibold text-amber-950 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
              <span>Simuler le cycle 10h</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {scanError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Notification du moteur de veille</p>
              <p className="text-rose-700 mt-0.5">{scanError}</p>
            </div>
            <button
              onClick={() => setScanError(null)}
              className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ONGLET 1 : OPPORTUNITÉS & VÉRIFICATION D'ÉLIGIBILITÉ */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            {/* Cartes de synthèse */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Éligibles pour votre passeport"
                value={`${eligibleCount} / ${opportunities.length}`}
                sublabel={`Nationalité : ${profile.nationalities.join(' / ')}`}
                icon={ShieldCheck}
                accent="emerald"
              />
              <StatCard
                label="Axes d'intérêt actifs"
                value={(profile.interests || []).length}
                sublabel="Modifiables dans Paramètres"
                icon={Sparkles}
                accent="amber"
              />
              <StatCard
                label="Statut académique"
                value={profile.educationLevel.split('/')[0].trim()}
                sublabel={profile.enrollmentStatus || 'Inscrit(e) en établissement'}
                icon={Building2}
                accent="stone"
              />
              <StatCard
                label="Dossiers sauvegardés"
                value={savedCount}
                sublabel={`${opportunities.filter((o) => o.applied).length} candidature(s) envoyée(s)`}
                icon={Bookmark}
                accent="amber"
              />
            </div>

            {/* Pilules de filtrage rapide par les 4 centres d'intérêt */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-stone-900 text-[#faf7ef] border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-700 border-amber-900/15 hover:bg-amber-50/60'
                }`}
              >
                Toutes les catégories ({opportunities.length})
              </button>

              {INTEREST_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = opportunities.filter((o) => o.categoryId === cat.id).length;
                const isSelected = selectedCategoryFilter === cat.id;
                const isUserInterest = (profile.interests || []).includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-700/25 font-bold shadow-2xs'
                        : 'bg-white text-stone-700 border-amber-900/15 hover:bg-amber-50/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.shortLabel}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                        isSelected ? 'bg-white/75 text-stone-950' : 'bg-amber-50 text-stone-700'
                      }`}
                    >
                      {count}
                    </span>
                    {isUserInterest && !isSelected && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-600"
                        title="Centre d'intérêt actif"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Barre de recherche & Interrupteur d'éligibilité par nationalité */}
            <div className="bg-white border border-amber-900/10 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher Mozilla, Microsoft, CERN, bourse scolarité, conférence..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf7ef] border border-amber-900/15 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Toggle crucial : Uniquement éligibles pour ma nationalité */}
                <button
                  onClick={() => setOnlyEligibleNationality(!onlyEligibleNationality)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    onlyEligibleNationality
                      ? 'bg-emerald-50 border-emerald-700/20 text-emerald-900'
                      : 'bg-[#faf7ef] border-amber-900/15 text-stone-600'
                  }`}
                >
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      onlyEligibleNationality ? 'text-emerald-700' : 'text-stone-400'
                    }`}
                  />
                  <span>
                    Uniquement éligibles pour {profile.nationalities.join(' / ')}
                  </span>
                </button>

                {/* Filtre Favoris */}
                <button
                  onClick={() => setOnlySavedFilter(!onlySavedFilter)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    onlySavedFilter
                      ? 'bg-amber-100 border-amber-700/25 text-amber-950'
                      : 'bg-[#faf7ef] border-amber-900/15 text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${onlySavedFilter ? 'fill-current' : ''}`} />
                  <span>Favoris ({savedCount})</span>
                </button>
              </div>
            </div>

            {/* État de scan IA en cours */}
            {isScanning && (
              <div className="bg-amber-100/70 border border-amber-700/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-stone-900">
                    Scan IA & Vérification d’éligibilité ({profile.nationalities.join(' / ')}) en cours...
                  </h3>
                  <p className="text-sm text-stone-700 mt-0.5">
                    Genius Hub analyse les conditions d’éligibilité et les portails officiels pour
                    les stages financés, bourses de scolarité, fellowships et conférences.
                  </p>
                </div>
              </div>
            )}

            {/* Grille des cartes d'opportunités */}
            {filteredOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userNationalities={profile.nationalities}
                    onToggleSave={() => toggleSaveOpportunity(opp.id)}
                    onToggleApplied={() => toggleAppliedOpportunity(opp.id)}
                    onOpenDetails={() => setSelectedOpportunity(opp)}
                  />
                ))}
              </div>
            ) : (
              !isScanning && (
                <div className="bg-white border border-amber-900/10 rounded-2xl p-12 text-center">
                  <Filter className="w-10 h-10 text-stone-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-stone-900">
                    Aucune opportunité ne correspond à ces filtres
                  </h3>
                  <p className="text-sm text-stone-600 max-w-md mx-auto mt-1">
                    Essayez de réinitialiser les filtres ou lancez une nouvelle recherche IA ciblée
                    sur vos centres d’intérêt.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategoryFilter('ALL');
                        setOnlySavedFilter(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#faf7ef] hover:bg-amber-100/70 border border-amber-900/15 text-stone-800 text-sm font-semibold cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                    <button
                      onClick={() => runOpportunityScan(profile, 'MANUAL')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Rechercher avec l’IA</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ONGLET 2 : VEILLE 10H & HÉBERGEMENT */}
        {activeTab === 'scheduler' && (
          <SchedulerAndHostingView
            scheduler={scheduler}
            timeRemainingMs={timeRemainingMs}
            scanLogs={scanLogs}
            profile={profile}
            isScanning={isScanning}
            onToggleScheduler={toggleSchedulerEnabled}
            onSimulate10h={() => runOpportunityScan(profile, 'SIMULATED_10H')}
            onRunNow={() => runOpportunityScan(profile, 'MANUAL')}
          />
        )}

        {/* ONGLET 3 : PROFIL, NATIONALITÉ & CENTRES D'INTÉRÊT (PARAMÈTRES) */}
        {activeTab === 'settings' && (
          <SettingsAndProfileView
            profile={profile}
            onSave={handleUpdateSettings}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* MODALE DÉTAILLÉE D'UNE OPPORTUNITÉ */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          userNationalities={profile.nationalities}
          onClose={() => setSelectedOpportunity(null)}
          onToggleSave={() => toggleSaveOpportunity(selectedOpportunity.id)}
          onToggleApplied={() => toggleAppliedOpportunity(selectedOpportunity.id)}
          onToggleChecklist={(idx) => toggleChecklistItem(selectedOpportunity.id, idx)}
        />
      )}

      {/* NOTIFICATIONS TOAST */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ============================================================================
// COMPOSANT : ONBOARDING WIZARD EN 3 ÉTAPES (GENIUS HUB — JAUNE SOBRE)
// ============================================================================
function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);

  // Étape 1 : Identité, Nationalité & Statut
  const [fullName, setFullName] = useState('');
  const [nationalities, setNationalities] = useState(['Burkina Faso']);
  const [customNationality, setCustomNationality] = useState('');
  const [educationLevel, setEducationLevel] = useState('Master 2 / Cycle Ingénieur');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState(
    'Déjà inscrit(e) dans une école / université'
  );

  // Étape 2 : Choix des 4 centres d'intérêt
  const [interests, setInterests] = useState([
    'stages_finances',
    'bourses_inscription_existante',
    'summits_fellowships',
    'conferences_financees'
  ]);

  // Étape 3 : Régions, langues, compétences & veille 10h
  const [regions, setRegions] = useState(['Monde entier (International)', 'Afrique', 'Europe']);
  const [languages, setLanguages] = useState(['Français', 'Anglais']);
  const [skills, setSkills] = useState(['Informatique', 'Intelligence Artificielle']);
  const [customSkill, setCustomSkill] = useState('');
  const [autoWatch10h, setAutoWatch10h] = useState(true);
  const [formError, setFormError] = useState('');

  const toggleItem = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleAddNationality = (e) => {
    e.preventDefault();
    const cleaned = customNationality.trim();
    if (!cleaned) return;
    if (!nationalities.includes(cleaned)) {
      setNationalities([...nationalities, cleaned]);
    }
    setCustomNationality('');
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleaned = customSkill.trim();
    if (!cleaned) return;
    if (!skills.includes(cleaned)) {
      setSkills([...skills, cleaned]);
    }
    setCustomSkill('');
  };

  const handleNextStep = () => {
    setFormError('');
    if (step === 1) {
      if (!fullName.trim()) {
        setFormError('Veuillez renseigner votre prénom ou nom complet.');
        return;
      }
      if (nationalities.length === 0) {
        setFormError(
          'Veuillez sélectionner au moins une nationalité afin de vérifier votre éligibilité.'
        );
        return;
      }
      if (!fieldOfStudy.trim()) {
        setFormError('Précisez votre domaine d’études ou spécialité.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (interests.length === 0) {
        setFormError('Sélectionnez au moins un centre d’intérêt pour orienter les recherches.');
        return;
      }
      setStep(3);
    }
  };

  const handleFinish = () => {
    if (skills.length === 0) {
      setFormError('Ajoutez au moins une compétence clé.');
      return;
    }
    onComplete({
      fullName: fullName.trim(),
      nationalities,
      educationLevel,
      fieldOfStudy: fieldOfStudy.trim(),
      enrollmentStatus,
      interests,
      regions,
      languages,
      skills,
      autoWatch10h,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-[#faf7ef] via-[#f6f0dc] to-[#efe5c8]">
      <div className="max-w-3xl w-full bg-white border border-amber-900/15 rounded-3xl shadow-lg shadow-amber-950/5 overflow-hidden">
        {/* En-tête Genius Hub (Jaune sable / ambre doux non agressif) */}
        <div className="p-6 sm:p-8 bg-[#f3e6be] border-b border-amber-900/15 text-stone-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center border border-amber-700/20 shadow-2xs">
              <Compass className="w-6 h-6 text-stone-950" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Genius Hub • Assistant d’Éligibilité & Veille 10h
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                Bienvenue ! Configurons votre profil & votre nationalité
              </h1>
            </div>
          </div>

          <p className="text-sm text-stone-700 leading-relaxed">
            Indiquez votre <strong>nationalité</strong> pour vérifier automatiquement quelles
            opportunités acceptent votre passeport, choisissez vos <strong>centres d’intérêt</strong>{' '}
            (stages financés, bourses sur inscription existante, fellowships, conférences) et
            laissez Genius Hub scanner le web <strong>toutes les 10 heures</strong>.
          </p>

          {/* Barre de progression 3 étapes */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { num: 1, title: 'Identité & Nationalité' },
              { num: 2, title: "Centres d'intérêt" },
              { num: 3, title: 'Compétences & Veille' }
            ].map((s) => (
              <div key={s.num}>
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    step >= s.num ? 'bg-amber-600' : 'bg-stone-900/15'
                  }`}
                />
                <p
                  className={`text-xs mt-1.5 font-semibold ${
                    step === s.num ? 'text-stone-950 font-bold' : 'text-stone-600'
                  }`}
                >
                  {s.num}. {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire par étape */}
        <div className="p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ÉTAPE 1 : IDENTITÉ & NATIONALITÉ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Prénom ou Nom complet *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Idrissa Ouédraogo, Fatou, Marc..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Domaine / Spécialité *
                  </label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="Ex: Informatique, IA, Cybersécurité, Réseaux..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Sélection de la Nationalité (Cruciale pour l'éligibilité) */}
              <div className="p-4 rounded-2xl bg-[#faf6ea] border border-amber-900/15 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-700" />
                    <span>Votre Nationalité (pour vérifier l’éligibilité des passeports) *</span>
                  </label>
                </div>

                {/* Nationalités actuellement sélectionnées */}
                <div className="flex flex-wrap gap-1.5">
                  {nationalities.map((nat) => (
                    <span
                      key={nat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-stone-950 border border-amber-700/20 text-xs font-bold shadow-2xs"
                    >
                      <span>{nat}</span>
                      <button
                        type="button"
                        onClick={() => setNationalities(nationalities.filter((n) => n !== nat))}
                        className="hover:text-stone-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {nationalities.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      Aucune nationalité sélectionnée
                    </span>
                  )}
                </div>

                {/* Sélection rapide */}
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_NATIONALITIES.map((nat) => {
                    const active = nationalities.includes(nat);
                    return (
                      <button
                        key={nat}
                        type="button"
                        onClick={() => toggleItem(nationalities, setNationalities, nat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-200/80 border-amber-700/25 text-stone-950 font-semibold'
                            : 'bg-white border-amber-900/15 text-stone-700 hover:bg-amber-50'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {nat}
                      </button>
                    );
                  })}
                </div>

                {/* Ajout libre d'une autre nationalité (ou double nationalité) */}
                <form onSubmit={handleAddNationality} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customNationality}
                    onChange={(e) => setCustomNationality(e.target.value)}
                    placeholder="Autre nationalité (ou ajouter une double nationalité)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-900/15 text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold border border-amber-700/20 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>
              </div>

              {/* Niveau d'études & Statut d'inscription */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Niveau d’études actuel
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Situation universitaire actuelle
                  </label>
                  <select
                    value={enrollmentStatus}
                    onChange={(e) => setEnrollmentStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Déjà inscrit(e) dans une école / université">
                      Déjà inscrit(e) dans une école / université
                    </option>
                    <option value="En recherche d'admission + financement">
                      En recherche d'admission + financement
                    </option>
                    <option value="Jeune diplômé(e) / Chercheur indépendant">
                      Jeune diplômé(e) / Chercheur indépendant
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : CHOIX DES 4 GRANDS CENTRES D'INTÉRÊT */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Choisissez vos centres d’intérêt prioritaires
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Vous pourrez activer ou désactiver chacun de ces axes à tout moment dans les
                  Paramètres.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {INTEREST_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = interests.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleItem(interests, setInterests, cat.id)}
                      className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                        active
                          ? 'bg-[#fbf4de] border-amber-700/35 shadow-2xs'
                          : 'bg-white border-amber-900/10 hover:bg-[#faf7ef]'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          active
                            ? 'bg-amber-500 text-stone-950 border border-amber-700/20'
                            : 'bg-[#f5f0e1] text-stone-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-stone-900">{cat.label}</span>
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold ${
                              active
                                ? 'bg-amber-500 border-amber-700/25 text-stone-950'
                                : 'border-stone-300'
                            }`}
                          >
                            {active && '✓'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : COMPÉTENCES, LANGUES & VEILLE 10H */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Compétences clés & mots-clés de recherche
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {QUICK_SKILLS.map((skill) => {
                    const active = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleItem(skills, setSkills, skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-500 border-amber-700/25 text-stone-950 font-bold'
                            : 'bg-[#faf7ef] border-amber-900/15 text-stone-700 hover:bg-amber-50'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Ajouter une compétence (ex: Java, Python, React, Linux...)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#faf7ef] border border-amber-900/15 text-sm text-stone-900 focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-stone-900 text-[#faf7ef] text-xs font-semibold cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Zones géographiques visées
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TARGET_REGIONS.map((reg) => {
                      const active = regions.includes(reg);
                      return (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => toggleItem(regions, setRegions, reg)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                            active
                              ? 'bg-emerald-50 border-emerald-700/25 text-emerald-900 font-semibold'
                              : 'bg-[#faf7ef] border-amber-900/15 text-stone-600'
                          }`}
                        >
                          {reg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Langues parlées
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES_LIST.map((lang) => {
                      const active = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleItem(languages, setLanguages, lang)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                            active
                              ? 'bg-amber-200/80 border-amber-700/25 text-stone-950 font-semibold'
                              : 'bg-[#faf7ef] border-amber-900/15 text-stone-600'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-2xl bg-[#fbf5e3] border border-amber-700/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWatch10h}
                  onChange={(e) => setAutoWatch10h(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    Activer la recherche automatique toutes les 10 heures
                  </p>
                  <p className="text-xs text-stone-700">
                    Détecte les nouveaux programmes éligibles pour{' '}
                    <strong>{nationalities.join(' / ')}</strong> selon vos centres d’intérêt.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="pt-4 border-t border-amber-900/10 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setStep(step - 1);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#f5f0e1] hover:bg-[#ebe3cb] text-stone-800 text-sm font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold border border-amber-700/20 shadow-2xs cursor-pointer"
              >
                <span>Continuer</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-extrabold border border-amber-700/25 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lancer Genius Hub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : CARTE STATISTIQUE (JAUNE SOBRE)
// ============================================================================
function StatCard({ label, value, sublabel, icon: Icon, accent }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-700/20',
    amber: 'bg-[#f8eed0] text-amber-900 border-amber-700/20',
    stone: 'bg-[#f4efe2] text-stone-800 border-stone-900/15'
  };

  return (
    <div className="bg-white border border-amber-900/10 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3 shadow-2xs">
      <div>
        <p className="text-xs font-semibold text-stone-500">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">{value}</p>
        <p className="text-xs text-stone-600 mt-1 line-clamp-1">{sublabel}</p>
      </div>
      <div className={`p-2.5 rounded-xl border ${styles[accent] || styles.amber}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : CARTE D'OPPORTUNITÉ (CONDITIONS D'ÉLIGIBILITÉ + LIEN PORTAIL)
// ============================================================================
function OpportunityCard({
  opportunity,
  userNationalities,
  onToggleSave,
  onToggleApplied,
  onOpenDetails
}) {
  const catMeta =
    INTEREST_CATEGORIES.find((c) => c.id === opportunity.categoryId) || INTEREST_CATEGORIES[0];
  const CatIcon = catMeta.icon;
  const elig = evaluateNationalityEligibility(opportunity, userNationalities);
  const portalUrl = resolveApplicationPortalUrl(
    opportunity.applicationPortalUrl,
    opportunity.officialPortalHint,
    opportunity.title,
    opportunity.organization
  );

  // Liste synthétique des conditions d'éligibilité affichées directement sur la carte
  const criteriaList =
    Array.isArray(opportunity.eligibilityCriteria) && opportunity.eligibilityCriteria.length > 0
      ? opportunity.eligibilityCriteria
      : [
          opportunity.nationalityCondition,
          `Niveau / Domaine visé : ${opportunity.requiredSkills?.slice(0, 2).join(', ') || 'Candidats motivés'}`
        ].filter(Boolean);

  const eligStyle = {
    ELIGIBLE_ALL: {
      container: 'bg-emerald-50/90 border-emerald-700/20 text-emerald-950',
      icon: ShieldCheck,
      iconColor: 'text-emerald-700'
    },
    ELIGIBLE_INCLUDED: {
      container: 'bg-emerald-50/90 border-emerald-700/20 text-emerald-950',
      icon: ShieldCheck,
      iconColor: 'text-emerald-700'
    },
    CONDITIONAL: {
      container: 'bg-[#fbf4de] border-amber-700/25 text-amber-950',
      icon: ShieldAlert,
      iconColor: 'text-amber-700'
    },
    NOT_ELIGIBLE: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: ShieldX,
      iconColor: 'text-rose-700'
    }
  }[elig.status];

  const EligIcon = eligStyle.icon;

  return (
    <div className="group bg-white border border-amber-900/12 hover:border-amber-700/35 rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md hover:shadow-amber-950/5">
      <div>
        {/* Badges Catégorie & Score */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f7f1de] text-stone-900 border border-amber-900/15">
              <CatIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>{catMeta.shortLabel}</span>
            </span>

            {opportunity.isNew && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 border border-amber-700/20 text-[10px] font-extrabold uppercase tracking-wide">
                Nouveau
              </span>
            )}
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf7ef] text-stone-800 border border-amber-900/15">
            {opportunity.matchScore}% Match
          </span>
        </div>

        {/* Titre & Organisation */}
        <h3
          onClick={onOpenDetails}
          className="text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer leading-snug"
        >
          {opportunity.title}
        </h3>
        <p className="text-sm font-semibold text-stone-600 mt-0.5">{opportunity.organization}</p>

        {/* Encart Vérification Nationalité + Conditions d'éligibilité directes sur la carte */}
        <div className={`mt-3.5 p-3.5 rounded-xl border text-xs ${eligStyle.container}`}>
          <div className="flex items-center gap-1.5 font-bold">
            <EligIcon className={`w-4 h-4 shrink-0 ${eligStyle.iconColor}`} />
            <span>{elig.badgeText}</span>
          </div>
          <p className="mt-1 opacity-95 leading-relaxed">{elig.verdict}</p>

          {/* Conditions d'éligibilité */}
          <div className="mt-2.5 pt-2.5 border-t border-current/10">
            <p className="font-bold text-[11px] uppercase tracking-wider opacity-85 mb-1">
              Conditions d’éligibilité :
            </p>
            <ul className="space-y-1 list-disc list-inside opacity-95">
              {criteriaList.slice(0, 3).map((crit, idx) => (
                <li key={idx} className="leading-snug">
                  {crit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informations clés */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {opportunity.location}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-800">
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
            {opportunity.funding}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            {opportunity.deadline}
          </span>
        </div>

        {/* Lien direct vers le portail d'application */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-[#faf7ef] border border-amber-900/12 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Portail de candidature
            </p>
            <p className="text-xs font-semibold text-stone-800 truncate">
              {opportunity.officialPortalHint || portalUrl}
            </p>
          </div>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-700/20 text-xs font-bold shrink-0 transition-colors"
          >
            <span>Postuler</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Pied de carte */}
      <div className="mt-4 pt-3.5 border-t border-amber-900/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSave}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              opportunity.saved
                ? 'bg-amber-200/80 border-amber-700/25 text-amber-950'
                : 'bg-[#faf7ef] border-amber-900/12 text-stone-600 hover:text-stone-900'
            }`}
            title={opportunity.saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Bookmark className={`w-4 h-4 ${opportunity.saved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={onToggleApplied}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              opportunity.applied
                ? 'bg-emerald-50 border-emerald-700/25 text-emerald-900'
                : 'bg-[#faf7ef] border-amber-900/12 text-stone-700 hover:text-stone-950'
            }`}
          >
            {opportunity.applied ? '✓ Postulé' : 'Marquer postulé'}
          </button>
        </div>

        <button
          onClick={onOpenDetails}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f7f1de] hover:bg-amber-500 text-stone-900 hover:text-stone-950 border border-amber-900/15 text-xs font-bold transition-all cursor-pointer"
        >
          <span>Détails & Checklist</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : MODALE DE DÉTAILS D'UNE OPPORTUNITÉ
// ============================================================================
function OpportunityDetailModal({
  opportunity,
  userNationalities,
  onClose,
  onToggleSave,
  onToggleApplied,
  onToggleChecklist
}) {
  const completed = opportunity.completedChecklist || [];
  const checklist = opportunity.applicationChecklist || [];
  const elig = evaluateNationalityEligibility(opportunity, userNationalities);
  const portalUrl = resolveApplicationPortalUrl(
    opportunity.applicationPortalUrl,
    opportunity.officialPortalHint,
    opportunity.title,
    opportunity.organization
  );

  const criteriaList =
    Array.isArray(opportunity.eligibilityCriteria) && opportunity.eligibilityCriteria.length > 0
      ? opportunity.eligibilityCriteria
      : [opportunity.nationalityCondition].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-amber-900/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#faf7ef]/95 backdrop-blur-md p-6 border-b border-amber-900/10 flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-200/75 text-stone-950 border border-amber-700/20 text-xs font-bold">
                {opportunity.categoryLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-stone-800 border border-amber-900/15 text-xs font-bold">
                {opportunity.matchScore}% Match
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900">{opportunity.title}</h2>
            <p className="text-sm font-medium text-stone-600 mt-0.5">{opportunity.organization}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-900/15 text-stone-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Encart détaillé d'éligibilité & conditions */}
          <div className="p-4 rounded-2xl bg-[#fbf5e3] border border-amber-700/20 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Éligibilité & Conditions — {elig.badgeText}</span>
            </div>
            <p className="text-xs text-stone-800">
              <strong>Verdict pour {userNationalities.join(' / ')} :</strong> {elig.verdict}
            </p>
            <ul className="space-y-1 text-xs text-stone-800 list-disc list-inside pt-1">
              {criteriaList.map((crit, idx) => (
                <li key={idx}>{crit}</li>
              ))}
            </ul>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#faf7ef] border border-amber-900/10">
              <p className="text-xs text-stone-500">Lieu / Format</p>
              <p className="text-sm font-bold text-stone-900 mt-0.5">{opportunity.location}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#faf7ef] border border-amber-900/10">
              <p className="text-xs text-stone-500">Financement / Prise en charge</p>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">{opportunity.funding}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#faf7ef] border border-amber-900/10">
              <p className="text-xs text-stone-500">Date limite</p>
              <p className="text-sm font-bold text-amber-900 mt-0.5">{opportunity.deadline}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#faf7ef] border border-amber-900/10">
              <p className="text-xs text-stone-500">Durée</p>
              <p className="text-sm font-bold text-stone-900 mt-0.5">{opportunity.duration}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-stone-900 mb-1.5">Description du programme</h4>
            <p className="text-sm text-stone-700 leading-relaxed">{opportunity.description}</p>
          </div>

          {/* Conseil IA */}
          <div className="p-4 rounded-2xl bg-[#faf7ef] border border-amber-900/15">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Conseil stratégique Genius Hub pour votre dossier</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {opportunity.motivationTips}
            </p>
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-stone-900 mb-2.5">
                Checklist de candidature ({completed.length}/{checklist.length})
              </h4>
              <div className="space-y-2">
                {checklist.map((stepText, idx) => {
                  const isChecked = completed.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => onToggleChecklist(idx)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-700/20 text-emerald-900 line-through opacity-80'
                          : 'bg-[#faf7ef] border-amber-900/12 text-stone-800 hover:border-amber-700/35'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                          isChecked
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'border-stone-400 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{stepText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Portail officiel de candidature */}
          <div className="p-4 rounded-2xl bg-[#fbf4de] border border-amber-700/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-600">Portail officiel de candidature</p>
              <p className="text-sm font-bold text-stone-900 truncate">
                {opportunity.officialPortalHint}
              </p>
              <p className="text-xs text-stone-600 truncate mt-0.5">{portalUrl}</p>
            </div>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-700/25 text-xs font-extrabold shrink-0 transition-colors"
            >
              <span>Accéder au portail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-amber-900/10 bg-[#faf7ef] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onToggleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
              opportunity.saved
                ? 'bg-amber-200/80 border-amber-700/25 text-amber-950'
                : 'bg-white border-amber-900/15 text-stone-700'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${opportunity.saved ? 'fill-current' : ''}`} />
            <span>{opportunity.saved ? 'Enregistré en favori' : 'Sauvegarder'}</span>
          </button>

          <button
            onClick={onToggleApplied}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              opportunity.applied
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-[#faf7ef]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{opportunity.applied ? 'Candidature marquée envoyée' : 'Marquer comme postulé'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : ONGLET VEILLE 10H & HÉBERGEMENT PRODUCTION
// ============================================================================
function SchedulerAndHostingView({
  scheduler,
  timeRemainingMs,
  scanLogs,
  profile,
  isScanning,
  onToggleScheduler,
  onSimulate10h,
  onRunNow
}) {
  const [copiedCode, setCopiedCode] = useState(false);

  const cronSnippet = `// genius-hub-worker-10h.js — Exécution automatique toutes les 10 heures (Node.js / CRON)
// À déployer sur Render, Railway, VPS ou GitHub Actions après hébergement

import fetch from 'node-fetch';

const CANDIDATE_PROFILE = ${JSON.stringify(
    {
      fullName: profile.fullName,
      nationalities: profile.nationalities,
      educationLevel: profile.educationLevel,
      fieldOfStudy: profile.fieldOfStudy,
      enrollmentStatus: profile.enrollmentStatus,
      interests: profile.interests,
      skills: profile.skills
    },
    null,
    2
  )};

async function runGeniusHub10HourScan() {
  console.log('[Genius Hub] Cycle veille 10h démarré :', new Date().toISOString());
  const prompt = \`Tu es Genius Hub. Trouve les nouvelles opportunités (stages financés, bourses de frais de scolarité sur inscription existante, Youth Summits / Mozilla Fellowship / Microsoft Ambassador, conférences financées) strictement ÉLIGIBLES pour la nationalité : \${CANDIDATE_PROFILE.nationalities.join(' / ')}. Profil : \${JSON.stringify(CANDIDATE_PROFILE)}\`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  const data = await response.json();
  // Brancher ici l'envoi d'email (Resend / Nodemailer) ou notification Telegram
  console.log('[Genius Hub] Scan terminé avec vérification de nationalité.');
}

// Exécution immédiate puis répétition toutes les 10 heures (36 000 000 ms)
runGeniusHub10HourScan();
setInterval(runGeniusHub10HourScan, 10 * 60 * 60 * 1000);`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cronSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Planificateur de Veille Automatique (Cycle de 10 heures)
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              L’horodatage est enregistré dans votre navigateur : dès que 10h00 se sont écoulées
              (même après fermeture de l’onglet), Genius Hub lance automatiquement une recherche
              filtrée sur la nationalité <strong>{profile.nationalities.join(' / ')}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onToggleScheduler}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                scheduler.enabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              {scheduler.enabled ? '● Veille 10h Active' : '○ Veille 10h en Pause'}
            </button>

            <button
              onClick={onSimulate10h}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simuler le cycle 10h</span>
            </button>

            <button
              onClick={onRunNow}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Scan immédiat</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Temps restant avant prochain scan</p>
            <p className="text-2xl font-mono font-extrabold text-indigo-600 mt-1">
              {scheduler.enabled ? formatDuration(timeRemainingMs) : 'En pause'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Dernière exécution</p>
            <p className="text-sm font-bold text-slate-900 mt-2">
              {scheduler.lastScanTimestamp
                ? formatDateTime(new Date(scheduler.lastScanTimestamp).toISOString())
                : 'Aucune'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Prochaine échéance programmée</p>
            <p className="text-sm font-bold text-emerald-700 mt-2">
              {scheduler.enabled
                ? formatDateTime(new Date(scheduler.nextScanTimestamp).toISOString())
                : 'Désactivée'}
            </p>
          </div>
        </div>
      </div>

      {/* Historique des scans */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Historique des recherches automatiques & manuelles ({scanLogs.length})</span>
        </h3>

        {scanLogs.length > 0 ? (
          <div className="space-y-2.5">
            {scanLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {log.status === 'SUCCESS' ? 'SUCCÈS' : 'ERREUR'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(log.timestamp)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    {log.triggerType === 'AUTO_10H'
                      ? 'Cycle Auto 10h'
                      : log.triggerType === 'SIMULATED_10H'
                      ? 'Simulation Cycle 10h'
                      : log.triggerType === 'INITIAL_ONBOARDING'
                      ? 'Configuration Initiale'
                      : 'Scan Manuel'}
                  </span>
                  {log.nationalityChecked && (
                    <span className="text-slate-500">
                      Passeport : <strong>{log.nationalityChecked}</strong>
                    </span>
                  )}
                </div>
                <div className="text-slate-600">
                  <strong className="text-indigo-700">+{log.newMatchesCount}</strong> résultat(s) •{' '}
                  {log.durationSec}s
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun scan enregistré pour le moment.</p>
        )}
      </div>

      {/* Script prêt pour l'hébergement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Worker Serveur 10h prêt pour votre futur hébergement
              </h3>
              <p className="text-xs text-slate-500">
                Script Node.js pré-configuré avec votre nationalité et vos centres d’intérêt pour
                tourner en arrière-plan 24h/24 sur serveur.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Script copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier le script serveur</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto font-mono leading-relaxed">
          {cronSnippet}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : ONGLET PARAMÈTRES, NATIONALITÉ & CENTRES D'INTÉRÊT
// ============================================================================
function SettingsAndProfileView({ profile, onSave, onResetAll }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [nationalities, setNationalities] = useState(profile.nationalities || []);
  const [customNationality, setCustomNationality] = useState('');
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.fieldOfStudy);
  const [enrollmentStatus, setEnrollmentStatus] = useState(
    profile.enrollmentStatus || 'Déjà inscrit(e) dans une école / université'
  );
  const [interests, setInterests] = useState(profile.interests || []);
  const [skills, setSkills] = useState(profile.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleItem = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((i) => i !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleAddNat = (e) => {
    e.preventDefault();
    const cleaned = customNationality.trim();
    if (cleaned && !nationalities.includes(cleaned)) {
      setNationalities([...nationalities, cleaned]);
    }
    setCustomNationality('');
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const cleaned = customSkill.trim();
    if (cleaned && !skills.includes(cleaned)) {
      setSkills([...skills, cleaned]);
    }
    setCustomSkill('');
  };

  const buildUpdatedProfile = () => ({
    ...profile,
    fullName: fullName.trim() || profile.fullName,
    nationalities: nationalities.length > 0 ? nationalities : profile.nationalities,
    educationLevel,
    fieldOfStudy: fieldOfStudy.trim() || profile.fieldOfStudy,
    enrollmentStatus,
    interests: interests.length > 0 ? interests : profile.interests,
    skills,
    updatedAt: new Date().toISOString()
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            Paramètres du Profil, Nationalité & Centres d’Intérêt
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Modifiez votre nationalité ou cochez/décochez vos axes de recherche à tout moment.
          </p>
        </div>

        {/* Identité & Parcours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Nom / Prénom
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Domaine / Spécialité
            </label>
            <input
              type="text"
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Niveau d’études
            </label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Situation d’inscription
            </label>
            <select
              value={enrollmentStatus}
              onChange={(e) => setEnrollmentStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Déjà inscrit(e) dans une école / université">
                Déjà inscrit(e) dans une école / université
              </option>
              <option value="En recherche d'admission + financement">
                En recherche d'admission + financement
              </option>
              <option value="Jeune diplômé(e) / Chercheur indépendant">
                Jeune diplômé(e) / Chercheur indépendant
              </option>
            </select>
          </div>
        </div>

        {/* Nationalité(s) */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
          <label className="block text-sm font-bold text-indigo-950">
            Nationalité(s) pour la vérification d’éligibilité
          </label>
          <div className="flex flex-wrap gap-1.5">
            {nationalities.map((nat) => (
              <span
                key={nat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold"
              >
                {nat}
                <button
                  type="button"
                  onClick={() => setNationalities(nationalities.filter((n) => n !== nat))}
                  className="hover:text-indigo-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_NATIONALITIES.map((nat) => (
              <button
                key={nat}
                type="button"
                onClick={() => toggleItem(nationalities, setNationalities, nat)}
                className={`px-2.5 py-1 rounded-lg text-xs border cursor-pointer ${
                  nationalities.includes(nat)
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {nationalities.includes(nat) ? '✓ ' : '+ '}
                {nat}
              </button>
            ))}
          </div>
          <form onSubmit={handleAddNat} className="flex gap-2">
            <input
              type="text"
              value={customNationality}
              onChange={(e) => setCustomNationality(e.target.value)}
              placeholder="Ajouter une autre nationalité..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
            >
              Ajouter
            </button>
          </form>
        </div>

        {/* Centres d'intérêt modifiables */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2.5">
            Mes centres d’intérêt (Axes de recherche de la veille 10h)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTEREST_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = interests.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleItem(interests, setInterests, cat.id)}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-50/80 border-indigo-500'
                      : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{cat.label}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compétences */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">Compétences clés</label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((s) => s !== skill))}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="Ajouter une compétence..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
            >
              Ajouter
            </button>
          </form>
        </div>

        {/* Boutons d'enregistrement */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onSave(buildUpdatedProfile(), false)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
          >
            Enregistrer les modifications
          </button>

          <button
            type="button"
            onClick={() => onSave(buildUpdatedProfile(), true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Enregistrer & Relancer une recherche IA</span>
          </button>
        </div>
      </div>

      {/* Réinitialisation */}
      <div className="bg-white border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-800">Réinitialiser Genius Hub</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Efface les données locales pour revenir à l’écran d’accueil initial.
          </p>
        </div>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={onResetAll}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Confirmer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT : NOTIFICATIONS TOAST
// ============================================================================
function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl border bg-white shadow-xl flex items-start gap-3 transition-all ${
            toast.type === 'success'
              ? 'border-emerald-200'
              : toast.type === 'error'
              ? 'border-rose-200'
              : 'border-indigo-200'
          }`}
        >
          <div className="mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{toast.title}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}