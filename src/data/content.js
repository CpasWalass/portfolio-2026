// Single source of truth for the portfolio content.
// Facts come from the CV, the public GitHub repositories and Walass's own corrections (oct. 2026).
// Editorial rule: professional tone, and no em dash character anywhere in displayed text.

export const profile = {
  alias: 'Walass',
  fullName: 'Lawadan Kodjo Wulfred Gomese Elom',
  role: 'Développeur Full-Stack',
  employer: 'E-business Afrique',
  // Full-Stack since August 2026, after three months as a junior developer (from May 2026).
  roleSince: 'août 2026',
  degree: 'Ingénieur des Travaux Informatiques, option Génie Logiciel',
  school: "Institut Africain d'Informatique (IAI-Togo)",
  graduation: '2026',
  location: 'Lomé, Togo',
  email: 'wulfredlawadan@gmail.com',
  phone: '+228 98 82 00 81',
  phoneHref: 'tel:+22898820081',
  cv: '/cv/CV_Lawadan_Kodjo_Wulfred.pdf',
  languages: 'Français, Ewé, Anglais (intermédiaire)',
  socials: [
    { label: 'GitHub', handle: 'CpasWalass', href: 'https://github.com/CpasWalass' },
    { label: 'LinkedIn', handle: 'walass-lawadan', href: 'https://www.linkedin.com/in/walass-lawadan-15716b217' },
    { label: 'TikTok', handle: '@cpaswalass', href: 'https://www.tiktok.com/@cpaswalass' },
  ],
};

// The five seas of the world map, each holding one kind of project.
// label: where the sea name is written on the 1040 × 770 map.
export const seas = [
  { id: 'grand-line', name: 'Grand Line', theme: 'Entreprise', color: '#c4302b', label: { x: 760, y: 362 } },
  { id: 'north-blue', name: 'North Blue', theme: 'Applications web', color: '#2a6f8f', label: { x: 330, y: 318 } },
  { id: 'east-blue', name: 'East Blue', theme: 'Mobile, desktop et IA', color: '#3f8a4a', label: { x: 760, y: 318 } },
  { id: 'west-blue', name: 'West Blue', theme: 'Sites et interfaces', color: '#8a5a2e', label: { x: 300, y: 512 } },
  { id: 'south-blue', name: 'South Blue', theme: 'Vie associative', color: '#b8741a', label: { x: 760, y: 512 } },
]

// image: real screenshot when one exists; otherwise the UI draws a typographic cover.
// mapLabel: shorter name used on the map and in the index when the title is too long.
// x / y: position of the island on the 1040 × 770 map.
export const projects = [
  {
    id: 'eba-management-tool',
    sea: 'grand-line',
    title: 'EBA Management Tool',
    year: '2026',
    x: 640, y: 405,
    context: 'E-business Afrique',
    summary: "Plateforme de gestion financière interne de l'entreprise.",
    stack: ['Next.js', 'Laravel'],
    links: [],
    confidential: true,
  },
  {
    id: 'eba-test-manager',
    sea: 'grand-line',
    title: 'EBA Test Manager',
    year: '2026',
    x: 790, y: 420,
    context: 'E-business Afrique',
    summary:
      "Plateforme de gestion des tests d'acceptation IAT et UAT : organisation des campagnes de recette, suivi des cas de test et de leurs résultats.",
    stack: ['Laravel', 'PHP', 'Blade'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/ebatestmanager' }],
  },
  {
    id: 'kora-web',
    sea: 'grand-line',
    title: 'Kora Microfinance',
    year: '2025',
    x: 920, y: 400,
    context: 'Stage, Groupe Atakora SARL',
    summary:
      'Système modulaire de gestion de microfinance : clients, agents, tontines, groupes, prêts, épargne, comptes bloqués et transactions.',
    stack: ['Laravel', 'PHP', 'MySQL', 'Bootstrap', 'Chart.js'],
    image: '/images/projects/kora-web.webp',
    links: [],
  },
  {
    id: 'kora-agent',
    sea: 'grand-line',
    title: 'Agent Kora',
    year: '2025',
    x: 300, y: 410,
    context: 'Application mobile, Groupe Atakora SARL',
    summary:
      'Application des agents de terrain : collecte des tontines, gestion des clients, objectifs journaliers et synchronisation avec la plateforme.',
    stack: ['Flutter', 'Dart', 'Firebase'],
    image: '/images/projects/kora-agent.webp',
    imageFit: 'contain',
    links: [],
  },
  {
    id: 'ega-banking',
    sea: 'north-blue',
    title: 'EGA Banking',
    year: '2026',
    x: 150, y: 130,
    context: 'Projet JEE, IAI',
    summary:
      'Système bancaire : clients, comptes, versements, retraits, virements, relevés et tableau de bord. API REST sécurisée par JWT et front-end séparé.',
    stack: ['Java', 'Spring Boot', 'Spring Security', 'JWT', 'REST API'],
    image: '/images/projects/ega-banking.webp',
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/TP_JEE_GLSIA_LAWADAN_KODJO_WULFRED_2026' }],
  },
  {
    id: 'microfinance-core',
    sea: 'north-blue',
    title: 'Microfinance Core',
    year: '2025',
    x: 330, y: 105,
    context: 'Module ERP',
    summary:
      "Module Odoo 16 de microfinance : clients et groupes, crédits, épargne, tontines, remboursements et tableau de bord, intégré à la comptabilité d'Odoo.",
    stack: ['Python', 'Odoo'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/microfinance_core' }],
  },
  {
    id: 'food-ordering',
    sea: 'north-blue',
    title: 'Plateforme de commande de repas',
    mapLabel: 'Commande de repas',
    year: '2026',
    x: 415, y: 225,
    context: 'Intégration et API',
    summary:
      "Plateforme de commande de repas en ligne (restaurants, offres, panier, paiement, suivi de commande), intégrée d'abord en HTML et CSS puis portée sous Laravel avec une API documentée par Swagger.",
    stack: ['Laravel', 'Blade', 'REST API', 'Swagger', 'HTML', 'CSS'],
    image: '/images/projects/food-ordering.webp',
    links: [
      { label: 'Code Laravel', href: 'https://github.com/CpasWalass/exo2formation' },
      { label: 'Code intégration', href: 'https://github.com/CpasWalass/exercice' },
    ],
  },
  {
    id: 'ecommerce',
    sea: 'north-blue',
    title: 'Boutique en ligne',
    year: '2025',
    x: 245, y: 240,
    context: 'Application web',
    summary: 'Site e-commerce : catalogue de produits, panier, commandes, paiement et gestion des utilisateurs.',
    stack: ['Laravel', 'PHP', 'MySQL'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/ecommerce2' }],
  },
  {
    id: 'smart-home',
    sea: 'east-blue',
    title: 'Smart Home',
    year: '2025',
    x: 690, y: 140,
    context: 'Projet personnel',
    summary:
      "Surveillance intelligente : détection par caméra, analyse d'images, alertes e-mail et streaming vidéo en temps réel.",
    stack: ['Python', 'Flask', 'OpenCV', 'TensorFlow'],
    links: [],
  },
  {
    id: 'oracle-guide',
    sea: 'west-blue',
    title: 'Architecture Oracle',
    year: '2025',
    x: 150, y: 575,
    context: 'Support pédagogique interactif',
    summary:
      "Guide interactif de l'architecture Oracle : processus d'arrière-plan, instance, structures de stockage et flux entre composants.",
    stack: ['HTML', 'CSS', 'JavaScript', 'Oracle'],
    image: '/images/projects/oracle.webp',
    links: [
      { label: 'Voir le site', href: 'https://oracle-site-two.vercel.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/oracleSite' },
    ],
  },
  {
    id: 'salle-sport',
    sea: 'east-blue',
    title: 'Gestion de salle de sport',
    mapLabel: 'Salle de sport',
    year: '2025',
    x: 870, y: 120,
    context: 'Application desktop',
    summary: 'Gestion des membres, des abonnements et des statistiques avec une interface Swing.',
    stack: ['Java', 'Swing', 'MySQL', 'JDBC'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/GestionSalleSport' }],
  },
  {
    id: 'minimarket',
    sea: 'east-blue',
    title: 'MiniMarket',
    year: '2025',
    x: 820, y: 245,
    context: 'Application mobile',
    summary: "Application d'achat et de vente de produits entre particuliers.",
    stack: ['Flutter', 'Dart'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/minimarket' }],
  },
  {
    id: 'onepiece-encyclopedia',
    sea: 'north-blue',
    title: 'Encyclopédie One Piece',
    year: '2025',
    x: 110, y: 265,
    context: 'Application web',
    summary: 'Catalogue de personnages avec fiches détaillées, commentaires et favoris par utilisateur.',
    stack: ['Laravel', 'PHP', 'Blade'],
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/onepiece-laravel' }],
  },
  {
    id: 'onepiece-quiz',
    sea: 'west-blue',
    title: 'One Piece Quiz',
    year: '2025',
    x: 330, y: 610,
    context: 'Projet personnel',
    summary: "Quiz de personnalité qui associe chaque joueur à un membre de l'équipage.",
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: '/images/projects/onepiece-quiz.webp',
    links: [
      { label: 'Voir le site', href: 'https://monprojetonepiece.vercel.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/monprojetonepiece' },
    ],
  },
  {
    id: 'resto',
    sea: 'west-blue',
    title: 'Resto La Plazza',
    year: '2026',
    x: 210, y: 680,
    context: 'Site vitrine',
    summary: "Site vitrine d'un restaurant : accueil, carte et page de contact.",
    stack: ['HTML', 'CSS'],
    image: '/images/projects/resto.webp',
    links: [{ label: 'Code source', href: 'https://github.com/CpasWalass/resto' }],
  },
  {
    id: 'portfolio-2026',
    sea: 'west-blue',
    title: 'Portfolio 2026',
    year: '2026',
    x: 430, y: 553,
    context: 'Projet personnel',
    summary:
      'Ce site : une mer en 3D temps réel pilotée par le défilement, un navire en style animé, une carte des projets interactive, un cycle météo jour, nuit, vent et pluie, et une ambiance sonore synthétisée.',
    stack: ['Three.js', 'JavaScript', 'Vite', 'HTML', 'CSS'],
    image: '/images/projects/portfolio.webp',
    links: [
      { label: 'Voir le site', href: 'https://walassportfolio.netlify.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/portfolio-2026' },
    ],
  },
  {
    id: 'genius-scorer',
    sea: 'south-blue',
    title: 'Genius Scorer',
    year: '2026',
    x: 680, y: 575,
    context: 'Club de Culture Générale IAI',
    summary:
      'Tableau des scores pour les matchs de culture générale : espace d’administration pour créer et piloter les matchs, page publique dédiée à chaque match.',
    stack: ['Next.js', 'TypeScript', 'REST API'],
    image: '/images/projects/genius-scorer.webp',
    links: [
      { label: 'Voir le site', href: 'https://genius-scorer.vercel.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/GENIUS_SCORER' },
    ],
  },
  {
    id: 'proces-ia',
    sea: 'south-blue',
    title: 'Site événementiel IAI',
    year: '2026',
    x: 880, y: 600,
    context: 'Journées Portes Ouvertes',
    summary: "Site de présentation d'un événement des Journées Portes Ouvertes : programme, rôles et calendrier.",
    stack: ['HTML', 'CSS'],
    image: '/images/projects/proces-ia.webp',
    links: [
      { label: 'Voir le site', href: 'https://proces-eight.vercel.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/proces' },
    ],
  },
  {
    id: 'christmas-quiz',
    sea: 'south-blue',
    title: 'Ô Christmas Quiz',
    year: '2025',
    x: 760, y: 680,
    context: 'Événement de fin d’année',
    summary: 'Page de présentation d’un quiz de Noël organisé en fin d’année 2025.',
    stack: ['HTML', 'CSS'],
    image: '/images/projects/christmas-quiz.webp',
    links: [
      { label: 'Voir le site', href: 'https://log25-d.vercel.app' },
      { label: 'Code source', href: 'https://github.com/CpasWalass/log25D' },
    ],
  },
];

// Skills grouped by domain. Projects using each one are derived from `projects`.
export const arsenal = [
  { id: 'back', name: 'Back-end', tools: ['Laravel', 'PHP', 'Java', 'Spring Boot', 'Spring Security', 'Python', 'Flask', 'Odoo', 'REST API', 'JWT', 'Swagger'] },
  { id: 'front', name: 'Front-end', tools: ['Next.js', 'Angular', 'TypeScript', 'JavaScript', 'Three.js', 'HTML', 'CSS', 'Blade', 'Bootstrap', 'Tailwind', 'Chart.js', 'Vite'] },
  { id: 'mobile', name: 'Mobile et desktop', tools: ['Flutter', 'Dart', 'Swing'] },
  { id: 'data', name: 'Données', tools: ['MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'Firebase', 'JDBC'] },
  { id: 'ia', name: 'Vision par ordinateur', tools: ['OpenCV', 'TensorFlow'] },
  { id: 'method', name: 'Méthodes et outils', tools: ['Merise', 'UML', 'Agile', 'Git', 'Docker', 'Figma'] },
];

export const journey = [
  {
    period: 'Depuis août 2026',
    title: 'Développeur Full-Stack',
    place: 'E-business Afrique',
    text: "Développement des plateformes internes de l'entreprise, dans la continuité de mes trois premiers mois comme développeur junior.",
    kind: 'work',
  },
  {
    period: 'Mai - juil. 2026',
    title: 'Développeur Junior',
    place: 'E-business Afrique',
    text:
      "Développement de deux plateformes internes : EBA Management Tool pour la gestion financière, et EBA Test Manager pour piloter les tests d'acceptation IAT et UAT.",
    kind: 'work',
  },
  {
    period: '2023 - 2026',
    title: 'Ingénieur des Travaux Informatiques',
    place: "Institut Africain d'Informatique, option Génie Logiciel",
    text:
      "Diplômé en 2026. Applications distribuées, bases de données, architectures orientées services, conception de systèmes d'information avec Merise et UML.",
    kind: 'school',
  },
  {
    period: 'Juin - sept. 2025',
    title: 'Stage Développeur Full-Stack',
    place: 'Groupe Atakora SARL',
    text: 'Conception et développement d’un système modulaire de gestion de microfinance en Laravel, et de son application mobile pour les agents de terrain.',
    kind: 'work',
  },
  {
    period: '2023',
    title: 'Baccalauréat série D',
    place: 'Togo',
    text: 'Mathématiques et sciences physiques.',
    kind: 'school',
  },
];

// Listed briefly, as requested: role, organisation, period and competitions.
export const offstage = [
  {
    role: 'Responsable',
    org: 'Club de Génie en Herbe IAI-Togo',
    period: 'Nov. 2024 - 2026',
    events: ["C'est du Génie", 'Knowledge Master', 'BAPTISMUS', 'Génie Campus'],
  },
  {
    role: 'Responsable',
    org: "Club d'Art Oratoire IAI-Togo",
    period: 'Nov. 2025 - 2026',
    events: ['Orathon', 'CUAO', "La Voix de l'Influence Positive"],
  },
  {
    role: 'Rédacteur en chef',
    org: 'IAI-MAG, magazine de l’IAI-Togo',
    period: null,
    events: [],
  },
  {
    role: 'Communication',
    org: 'Togo Code Run',
    period: null,
    events: [],
  },
  {
    role: 'Membre',
    org: 'Amazing Voice',
    period: null,
    events: [],
  },
  {
    role: 'Membre',
    org: 'Chorale Holy Star',
    period: null,
    events: [],
  },
  {
    role: 'Membre',
    org: 'Groupe LGD',
    period: null,
    events: [],
  },
];
