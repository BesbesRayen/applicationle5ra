export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export const faqCategories = [
  'Général',
  'Paiement',
  'Compte',
  'Boutiques',
  'Sécurité',
];

export const faqs: FAQ[] = [
  {
    id: 1,
    question: "Qu'est-ce que CreditTN ?",
    answer:
      "CreditTN est une plateforme tunisienne de paiement échelonné (Buy Now, Pay Later). Elle vous permet d'acheter des produits dans nos boutiques partenaires et de payer en plusieurs mensualités sans frais cachés.",
    category: 'Général',
  },
  {
    id: 2,
    question: 'Comment fonctionne le paiement échelonné ?',
    answer:
      "Choisissez vos articles dans une boutique partenaire, sélectionnez CreditTN comme mode de paiement, et divisez le montant en 3, 6 ou 12 mensualités. Le premier versement est effectué à l'achat, les suivants sont prélevés automatiquement.",
    category: 'Paiement',
  },
  {
    id: 3,
    question: 'Comment créer un compte CreditTN ?',
    answer:
      "Téléchargez l'application CreditTN ou inscrivez-vous sur notre site web. Renseignez vos informations personnelles, vérifiez votre email et votre numéro de téléphone. Votre compte sera activé après vérification de votre identité.",
    category: 'Compte',
  },
  {
    id: 4,
    question: 'Quelles sont les boutiques partenaires ?',
    answer:
      "CreditTN collabore avec plus de 100 boutiques partenaires en Tunisie couvrant l'électronique, la mode, l'électroménager, le sport et plus encore. Consultez notre page Boutiques pour la liste complète.",
    category: 'Boutiques',
  },
  {
    id: 5,
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Absolument. CreditTN utilise un chiffrement SSL de bout en bout, l'authentification à deux facteurs et se conforme aux normes PCI DSS pour la protection des données bancaires. Vos informations personnelles ne sont jamais partagées avec des tiers.",
    category: 'Sécurité',
  },
  {
    id: 6,
    question: 'Y a-t-il des frais ou intérêts ?',
    answer:
      'CreditTN propose des plans de paiement sans intérêts pour les échéanciers de 3 mois. Pour les plans de 6 et 12 mois, des frais de service transparents sont appliqués et clairement affichés avant validation.',
    category: 'Paiement',
  },
  {
    id: 7,
    question: 'Que se passe-t-il en cas de retard de paiement ?',
    answer:
      "En cas de retard, vous recevrez une notification de rappel. Après 7 jours de retard, des pénalités peuvent s'appliquer. Nous vous encourageons à nous contacter dès que possible pour trouver une solution adaptée.",
    category: 'Paiement',
  },
  {
    id: 8,
    question: 'Comment devenir une boutique partenaire ?',
    answer:
      "Si vous êtes un commerçant en Tunisie et souhaitez proposer le paiement CreditTN à vos clients, contactez-nous via le formulaire de partenariat ou à l'adresse partenaires@credittn.tn. Notre équipe vous accompagnera dans l'intégration.",
    category: 'Boutiques',
  },
  {
    id: 9,
    question: "Puis-je modifier ou annuler un plan d'échelonnement ?",
    answer:
      "Les modifications sont possibles dans les 24h suivant la transaction. L'annulation complète est soumise à la politique de retour de la boutique partenaire. Contactez notre support pour toute demande spécifique.",
    category: 'Paiement',
  },
  {
    id: 10,
    question: "Comment réinitialiser mon mot de passe ?",
    answer:
      "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Un lien de réinitialisation sera envoyé à votre adresse email. Le lien est valable pendant 24 heures.",
    category: 'Compte',
  },
];
