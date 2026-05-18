export interface Product {
  name: string;
  price: string;
  emoji: string;
}

export interface Boutique {
  id: number;
  name: string;
  logo: string;
  category: string;
  city: string;
  conventionActive: boolean;
  description: string;
  longDescription: string;
  website: string;
  bannerGradient: string;
  founded: string;
  locations: number;
  products: Product[];
}

export const categories = [
  'Tous',
  'Informatique & Électronique',
  'Grande Distribution',
  'Mode & Beauté',
  'Électroménager',
  'Meubles & Décoration',
  'Sport & Loisirs',
];

export const cities = [
  'Toutes',
  'Tunis',
  'Sfax',
  'Sousse',
  'Ariana',
  'Ben Arous',
  'La Marsa',
  'Nabeul',
  'Monastir',
];

export const boutiques: Boutique[] = [
  {
    id: 1,
    name: 'Aziza',
    logo: '🛒',
    category: 'Grande Distribution',
    city: 'Tunis',
    conventionActive: true,
    description: 'Chaîne de supermarchés tunisienne à prix compétitifs.',
    longDescription:
      'Aziza est une chaîne de supermarchés tunisienne de référence, proposant une large gamme de produits alimentaires, cosmétiques et articles ménagers à des prix parmi les plus compétitifs du marché. Avec un réseau de magasins en pleine expansion à travers le pays, Aziza s\'impose comme un acteur incontournable de la grande distribution en Tunisie.',
    website: 'https://www.aziza.tn',
    bannerGradient: 'from-red-500 to-orange-500',
    founded: '2009',
    locations: 120,
    products: [
      { name: 'Panier alimentaire familial', price: '45 TND', emoji: '🧺' },
      { name: 'Pack produits ménagers', price: '28 TND', emoji: '🧹' },
    ],
  },
  {
    id: 2,
    name: 'MyTek',
    logo: '💻',
    category: 'Informatique & Électronique',
    city: 'Tunis',
    conventionActive: true,
    description: 'Leader de la vente en ligne high-tech en Tunisie.',
    longDescription:
      'MyTek est le leader incontesté de la vente en ligne de matériel informatique, smartphones, électroménager et produits high-tech en Tunisie. Avec une plateforme e-commerce performante et un service de livraison couvrant tout le territoire, MyTek offre une expérience d\'achat moderne avec des facilités de paiement adaptées.',
    website: 'https://www.mytek.tn',
    bannerGradient: 'from-blue-600 to-cyan-500',
    founded: '2010',
    locations: 15,
    products: [
      { name: 'Laptop HP Pavilion 15"', price: '2 499 TND', emoji: '💻' },
      { name: 'iPhone 15 Pro 128Go', price: '4 299 TND', emoji: '📱' },
    ],
  },
  {
    id: 3,
    name: 'Mega PC',
    logo: '🖥️',
    category: 'Informatique & Électronique',
    city: 'Tunis',
    conventionActive: true,
    description: 'Spécialiste PC et composants informatiques.',
    longDescription:
      'Mega PC est le spécialiste tunisien de la vente de PC assemblés, composants informatiques et périphériques. Que vous soyez un gamer, un professionnel ou un étudiant, Mega PC propose les meilleures configurations au meilleur rapport qualité-prix avec un service après-vente réactif.',
    website: 'https://www.megapc.tn',
    bannerGradient: 'from-green-600 to-emerald-500',
    founded: '2005',
    locations: 5,
    products: [
      { name: 'PC Gamer RTX 4060', price: '3 200 TND', emoji: '🎮' },
      { name: 'Écran 27" 144Hz', price: '890 TND', emoji: '🖥️' },
    ],
  },
  {
    id: 4,
    name: 'FATALES',
    logo: '💄',
    category: 'Mode & Beauté',
    city: 'Tunis',
    conventionActive: true,
    description: 'Parfums et cosmétiques de grandes marques.',
    longDescription:
      'FATALES est l\'enseigne tunisienne de référence pour les parfums de luxe, les cosmétiques et les produits de beauté des plus grandes marques internationales. Avec un réseau de boutiques élégantes dans les principaux centres commerciaux, FATALES offre une expérience shopping premium avec des conseils beauté personnalisés.',
    website: 'https://www.fatales.tn',
    bannerGradient: 'from-pink-500 to-rose-500',
    founded: '2003',
    locations: 30,
    products: [
      { name: 'Coffret Dior Sauvage', price: '320 TND', emoji: '✨' },
      { name: 'Palette maquillage MAC', price: '185 TND', emoji: '💄' },
    ],
  },
  {
    id: 5,
    name: 'Zen',
    logo: '🏠',
    category: 'Meubles & Décoration',
    city: 'Tunis',
    conventionActive: true,
    description: 'Mobilier moderne et décoration d\'intérieur.',
    longDescription:
      'Zen est une enseigne tunisienne spécialisée dans le mobilier contemporain et la décoration d\'intérieur. Avec des showrooms spacieux et un catalogue varié allant du salon au bureau, Zen accompagne ses clients dans l\'aménagement de leur espace de vie avec des produits de qualité et un design tendance.',
    website: 'https://www.zen.com.tn',
    bannerGradient: 'from-amber-500 to-yellow-500',
    founded: '2008',
    locations: 10,
    products: [
      { name: 'Canapé d\'angle modulable', price: '2 800 TND', emoji: '🛋️' },
      { name: 'Table basse scandinave', price: '450 TND', emoji: '🪑' },
    ],
  },
  {
    id: 6,
    name: 'Hamadi Abid (HA)',
    logo: '🔌',
    category: 'Électroménager',
    city: 'Tunis',
    conventionActive: true,
    description: 'Électroménager et hi-fi depuis plus de 50 ans.',
    longDescription:
      'Hamadi Abid (HA) est une institution tunisienne de l\'électroménager depuis plus de 50 ans. Reconnu pour la fiabilité de ses produits et la qualité de son service après-vente, HA propose une gamme complète d\'appareils électroménagers, de téléviseurs et de systèmes audio des marques les plus prestigieuses.',
    website: 'https://www.ha.com.tn',
    bannerGradient: 'from-indigo-600 to-blue-500',
    founded: '1970',
    locations: 25,
    products: [
      { name: 'Réfrigérateur Samsung 450L', price: '3 100 TND', emoji: '❄️' },
      { name: 'Machine à laver LG 9kg', price: '1 850 TND', emoji: '🫧' },
    ],
  },
  {
    id: 7,
    name: 'Decathlon',
    logo: '⚽',
    category: 'Sport & Loisirs',
    city: 'Tunis',
    conventionActive: true,
    description: 'Articles de sport pour tous les niveaux.',
    longDescription:
      'Decathlon est le géant mondial du sport, présent en Tunisie avec des magasins offrant des équipements sportifs, vêtements et accessoires pour plus de 80 disciplines. Du débutant au sportif confirmé, Decathlon propose des produits de qualité à prix accessibles grâce à ses marques propres innovantes.',
    website: 'https://www.decathlon.tn',
    bannerGradient: 'from-blue-500 to-sky-400',
    founded: '2017',
    locations: 4,
    products: [
      { name: 'Vélo VTT Rockrider', price: '1 200 TND', emoji: '🚴' },
      { name: 'Tapis de course Domyos', price: '1 850 TND', emoji: '🏃' },
    ],
  },
  {
    id: 8,
    name: 'Kawaragi',
    logo: '👗',
    category: 'Mode & Beauté',
    city: 'Monastir',
    conventionActive: true,
    description: 'Mode et prêt-à-porter tendance à Monastir.',
    longDescription:
      'Kawaragi est une boutique de mode réputée à Monastir, proposant des collections de prêt-à-porter homme et femme alliant style contemporain et élégance. Connue pour sa sélection pointue de marques locales et internationales, Kawaragi est une destination incontournable pour les amateurs de mode dans la région du Sahel.',
    website: 'https://www.kawaragi.tn',
    bannerGradient: 'from-purple-500 to-violet-500',
    founded: '2012',
    locations: 3,
    products: [
      { name: 'Robe de soirée collection 2026', price: '280 TND', emoji: '👗' },
      { name: 'Costume homme slim fit', price: '350 TND', emoji: '👔' },
    ],
  },
  {
    id: 9,
    name: 'Tunisianet',
    logo: '🛍️',
    category: 'Informatique & Électronique',
    city: 'Ariana',
    conventionActive: true,
    description: 'E-commerce informatique et téléphonie.',
    longDescription:
      'Tunisianet est la plateforme e-commerce de référence en Tunisie pour l\'achat de matériel informatique, téléphones, tablettes et accessoires high-tech. Avec un catalogue de plus de 20 000 produits et un service de livraison rapide, Tunisianet offre des prix compétitifs et des promotions régulières.',
    website: 'https://www.tunisianet.com.tn',
    bannerGradient: 'from-teal-500 to-cyan-500',
    founded: '2008',
    locations: 3,
    products: [
      { name: 'Samsung Galaxy S24 Ultra', price: '4 599 TND', emoji: '📱' },
      { name: 'Imprimante HP LaserJet Pro', price: '650 TND', emoji: '🖨️' },
    ],
  },
  {
    id: 10,
    name: 'Electrostar',
    logo: '⚡',
    category: 'Électroménager',
    city: 'Ben Arous',
    conventionActive: true,
    description: 'Fabricant tunisien d\'électroménager.',
    longDescription:
      'Electrostar est un fabricant et distributeur tunisien d\'appareils électroménagers de qualité. Avec des usines locales et un engagement fort envers le made in Tunisia, Electrostar propose des réfrigérateurs, cuisinières, machines à laver et climatiseurs à des prix accessibles pour chaque foyer tunisien.',
    website: 'https://www.electrostar.com.tn',
    bannerGradient: 'from-yellow-500 to-orange-500',
    founded: '1980',
    locations: 45,
    products: [
      { name: 'Cuisinière 5 feux inox', price: '1 650 TND', emoji: '🍳' },
      { name: 'Climatiseur 12000 BTU', price: '1 400 TND', emoji: '❄️' },
    ],
  },
  {
    id: 11,
    name: 'Magasin Général',
    logo: '🏬',
    category: 'Grande Distribution',
    city: 'Tunis',
    conventionActive: true,
    description: 'Réseau historique de grandes surfaces.',
    longDescription:
      'Le Magasin Général est un réseau historique et emblématique de grandes surfaces en Tunisie, présent depuis des décennies dans tout le pays. Il offre un vaste choix de produits alimentaires, électroniques, ménagers et textiles, au service des familles tunisiennes avec un rapport qualité-prix reconnu.',
    website: 'https://www.mg.com.tn',
    bannerGradient: 'from-red-600 to-red-400',
    founded: '1961',
    locations: 70,
    products: [
      { name: 'Pack électroménager cuisine', price: '2 200 TND', emoji: '🏠' },
      { name: 'TV LED 55" 4K', price: '1 500 TND', emoji: '📺' },
    ],
  },
  {
    id: 12,
    name: 'Carrefour Tunisie',
    logo: '🛒',
    category: 'Grande Distribution',
    city: 'Nabeul',
    conventionActive: true,
    description: 'Hypermarché international en Tunisie.',
    longDescription:
      'Carrefour est un hypermarché de renommée internationale implanté en Tunisie, proposant une offre complète : alimentation, textile, high-tech, produits du quotidien et bien plus. Carrefour Tunisie est la destination idéale pour les courses de toute la famille avec des promotions exclusives toute l\'année.',
    website: 'https://www.carrefour.tn',
    bannerGradient: 'from-blue-700 to-blue-500',
    founded: '2001',
    locations: 10,
    products: [
      { name: 'Coffret électroménager Moulinex', price: '450 TND', emoji: '🍴' },
      { name: 'Console PS5 + Jeu offert', price: '2 100 TND', emoji: '🎮' },
    ],
  },
  {
    id: 13,
    name: 'Zoom Informatique',
    logo: '🔍',
    category: 'Informatique & Électronique',
    city: 'Sfax',
    conventionActive: true,
    description: 'Magasins high-tech dans plusieurs villes.',
    longDescription:
      'Zoom Informatique est un réseau de magasins informatique présent dans plusieurs villes tunisiennes. Spécialisé dans le matériel high-tech, les solutions professionnelles et le gaming, Zoom Informatique est le partenaire idéal des entreprises et des passionnés de technologie.',
    website: 'https://www.zoom.com.tn',
    bannerGradient: 'from-slate-600 to-gray-500',
    founded: '2003',
    locations: 8,
    products: [
      { name: 'Setup Gaming complet', price: '4 500 TND', emoji: '🖥️' },
      { name: 'NAS Synology 2 baies', price: '1 200 TND', emoji: '💾' },
    ],
  },
  {
    id: 14,
    name: 'SBS Informatique',
    logo: '🖱️',
    category: 'Informatique & Électronique',
    city: 'Tunis',
    conventionActive: true,
    description: 'Solutions informatiques pour entreprises.',
    longDescription:
      'SBS Informatique est un distributeur de solutions informatiques et réseaux pour entreprises et particuliers, actif depuis plus de 20 ans en Tunisie. Expert en infrastructure IT, SBS accompagne les professionnels dans leurs projets de transformation digitale avec des produits de marques leaders.',
    website: 'https://www.sbs-informatique.com',
    bannerGradient: 'from-gray-700 to-slate-500',
    founded: '2000',
    locations: 3,
    products: [
      { name: 'Serveur Dell PowerEdge', price: '8 500 TND', emoji: '🖥️' },
      { name: 'Switch réseau Cisco 24 ports', price: '2 300 TND', emoji: '🌐' },
    ],
  },
  {
    id: 15,
    name: 'Scoop Informatique',
    logo: '📦',
    category: 'Informatique & Électronique',
    city: 'Sousse',
    conventionActive: true,
    description: 'Informatique et bureautique en ligne.',
    longDescription:
      'Scoop Informatique propose la vente en ligne de matériel informatique, bureautique et accessoires avec un service de livraison rapide à travers tout le pays. Connu pour ses prix compétitifs et son catalogue étendu, Scoop est le choix malin pour équiper son bureau ou sa maison.',
    website: 'https://www.scoop.com.tn',
    bannerGradient: 'from-orange-500 to-amber-500',
    founded: '2011',
    locations: 2,
    products: [
      { name: 'Pack bureau complet (PC + écran + imprimante)', price: '2 800 TND', emoji: '🖨️' },
      { name: 'Cartouches d\'encre multipack', price: '120 TND', emoji: '🖊️' },
    ],
  },
  {
    id: 16,
    name: 'MIDO',
    logo: '🛋️',
    category: 'Meubles & Décoration',
    city: 'La Marsa',
    conventionActive: true,
    description: 'Mobilier design et décoration d\'intérieur.',
    longDescription:
      'MIDO est une enseigne de mobilier et de décoration d\'intérieur haut de gamme, proposant des meubles modernes, des accessoires design et des solutions d\'aménagement sur mesure. Situé à La Marsa, MIDO offre un showroom inspirant pour transformer votre espace de vie avec goût.',
    website: 'https://www.mido.tn',
    bannerGradient: 'from-emerald-500 to-teal-500',
    founded: '2006',
    locations: 4,
    products: [
      { name: 'Chambre à coucher complète', price: '4 200 TND', emoji: '🛏️' },
      { name: 'Bibliothèque murale design', price: '890 TND', emoji: '📚' },
    ],
  },
];
