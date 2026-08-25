import type { Header } from '@/payload-types'

const SITE = 'https://lesbikeuses.fr'

const rubrique = (slug: string) => `${SITE}/rubrique/${slug}/`

const sous = (label: string, slug: string, refs?: number) => ({
  link: { type: 'custom' as const, label, url: rubrique(slug), newTab: true },
  ...(refs ? { meta: `${refs} réf.` } : {}),
})

/**
 * Navigation reprise de lesbikeuses.fr, avec les compteurs réels du catalogue
 * relevés via l'API WooCommerce Store.
 *
 * Les liens catalogue pointent vers l'ancien site en absolu : les rayons
 * n'existent pas encore ici, des chemins internes seraient des 404. Le blog,
 * lui, est déjà migré et pointe en interne.
 */
export const navigationEntete: NonNullable<Header['navItems']> = [
  {
    link: { type: 'custom', label: 'Équipements', url: rubrique('blouson-moto'), newTab: true },
    sousItems: [
      sous('Blousons moto', 'blouson-moto', 112),
      sous('Gants', 'gants', 83),
      sous('Casques', 'casques', 82),
      sous('Pantalons & jeans', 'pantalons-jeans', 37),
      sous('Bottes', 'bottes', 27),
      sous('Baskets moto', 'baskets', 11),
      sous('Sous-vêtements', 'sous-vetement-moto', 5),
      {
        link: { type: 'custom', label: 'Toutes les marques', url: rubrique('marques'), newTab: true },
        meta: '35 marques',
      },
    ],
  },
  {
    link: { type: 'custom', label: 'Accessoires', url: rubrique('accessoires'), newTab: true },
    sousItems: [
      sous('Bagagerie', 'bagagerie', 31),
      sous('Confort', 'confort', 14),
      sous('Entretien moto', 'entretien-moto', 14),
      sous('Sécurité', 'securite', 12),
      sous('Tour de cou', 'tour-de-cou', 11),
      sous('Intercom', 'intercom', 9),
      sous('Antivol', 'antivol', 4),
      {
        link: { type: 'custom', label: 'Tout le rayon', url: rubrique('accessoires'), newTab: true },
        meta: '106 réf.',
      },
    ],
  },
  {
    link: { type: 'custom', label: 'Vêtements', url: rubrique('vetements'), newTab: true },
    sousItems: [
      sous('T-shirts', 't-shirts', 9),
      sous('Maroquinerie', 'maroquinerie', 7),
      sous('Sweat-shirts', 'sweat-shirt', 2),
      sous('Casquettes', 'casquettes', 2),
      {
        link: { type: 'custom', label: 'Tout le rayon', url: rubrique('vetements'), newTab: true },
        meta: '21 réf.',
      },
    ],
  },
  {
    link: { type: 'custom', label: 'Le journal', url: '/posts' },
    sousItems: [
      { link: { type: 'custom', label: 'Équipements', url: '/posts' } },
      { link: { type: 'custom', label: 'Technique', url: '/posts' } },
      { link: { type: 'custom', label: 'Permis moto', url: '/posts' } },
      { link: { type: 'custom', label: 'Style', url: '/posts' } },
      { link: { type: 'custom', label: 'Divers', url: '/posts' } },
    ],
  },
  {
    link: { type: 'custom', label: 'Bons plans', url: rubrique('bons-plans'), newTab: true },
  },
  {
    link: { type: 'custom', label: 'Débuter la moto', url: `${SITE}/debuter-la-moto/`, newTab: true },
  },
]

/**
 * Pied de page, repris de lesbikeuses.fr : à propos, colonnes de liens,
 * coordonnées, puis mentions légales.
 *
 * Les moyens de paiement de l'ancien site (Visa, PayPal, Stripe, Mastercard)
 * ne sont volontairement pas repris : les afficher sur un site qui ne vend pas
 * encore laisserait croire qu'on peut y payer.
 */
export const piedDePage = {
  aPropos: {
    titre: 'À propos',
    texte:
      'Les Bikeuses vous aident à **trouver votre style de motarde** tout en restant **féminine et sécurisée**, pour vivre votre passion à fond.',
  },
  colonnes: [
    {
      titre: 'Boutique',
      items: [
        { link: { type: 'custom' as const, label: 'Équipements', url: rubrique('blouson-moto'), newTab: true } },
        { link: { type: 'custom' as const, label: 'Accessoires', url: rubrique('accessoires'), newTab: true } },
        { link: { type: 'custom' as const, label: 'Vêtements', url: rubrique('vetements'), newTab: true } },
        { link: { type: 'custom' as const, label: 'Marques', url: rubrique('marques'), newTab: true } },
        { link: { type: 'custom' as const, label: 'Bons plans', url: rubrique('bons-plans'), newTab: true } },
      ],
    },
    {
      titre: 'Ressources',
      items: [
        { link: { type: 'custom' as const, label: 'Débuter la moto', url: `${SITE}/debuter-la-moto/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Dictionnaire moto', url: `${SITE}/dictionnaire-moto/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Foire aux questions', url: `${SITE}/faq/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Fonds d’écran gratuits', url: `${SITE}/fond-decran-et-wallpaper/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Avis des clients', url: `${SITE}/avis-des-clients/`, newTab: true } },
      ],
    },
    {
      titre: 'La marque',
      items: [
        { link: { type: 'custom' as const, label: 'Qui sommes-nous', url: `${SITE}/a-propos/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Le journal', url: '/posts' } },
        { link: { type: 'custom' as const, label: 'Politique de retour', url: `${SITE}/politique-de-retour/`, newTab: true } },
        { link: { type: 'custom' as const, label: 'Nous contacter', url: `${SITE}/contact/`, newTab: true } },
      ],
    },
  ],
  contact: {
    titre: 'Nous contacter',
    mention: 'Notre service client vous répond 5J/7',
    telephone: '+33 6 16 76 32 90',
    email: 'contact@lesbikeuses.fr',
    horaires: 'Lundi à vendredi · 9h–12h30 / 13h30–18h',
  },
  paiements: [],
  navItems: [
    { link: { type: 'custom' as const, label: 'CGVU', url: `${SITE}/cgv/`, newTab: true } },
    { link: { type: 'custom' as const, label: 'Mentions légales', url: `${SITE}/cgv/`, newTab: true } },
    { link: { type: 'custom' as const, label: 'RGPD', url: `${SITE}/cgv/`, newTab: true } },
    { link: { type: 'custom' as const, label: 'Admin', url: '/admin' } },
  ],
}
