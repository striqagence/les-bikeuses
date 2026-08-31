import type { Payload, PayloadRequest } from 'payload'

const SITE = 'https://lesbikeuses.fr'

/**
 * Bascule la navigation vers les rayons de ce site.
 *
 * Opération isolée, et non un reseed : celui-ci vide les collections et
 * effacerait les articles, les produits et les médias importés. Ici on ne
 * touche qu'aux deux globales.
 *
 * Chaque entrée est vérifiée en base avant d'être posée : un rayon absent est
 * simplement omis, pour ne pas remplacer un lien qui marche vers l'ancien
 * site par une page vide.
 */

export type Entree = { libelle: string; slug: string }

export const EQUIPEMENTS: Entree[] = [
  { libelle: 'Blousons moto', slug: 'blousons-moto' },
  { libelle: 'Gants', slug: 'gants' },
  { libelle: 'Casques', slug: 'casques' },
  { libelle: 'Pantalons & jeans', slug: 'pantalon-jeans' },
  { libelle: 'Bottes', slug: 'bottes' },
  { libelle: 'Baskets moto', slug: 'baskets' },
  { libelle: 'Sous-vêtements', slug: 'sous-vetements-moto' },
]

export const ACCESSOIRES: Entree[] = [
  { libelle: 'Bagagerie', slug: 'bagagerie' },
  { libelle: 'Confort', slug: 'confort' },
  { libelle: 'Entretien moto', slug: 'entretien-moto' },
  { libelle: 'Sécurité', slug: 'securite' },
  { libelle: 'Tour de cou', slug: 'tour-de-cou' },
  { libelle: 'Intercom', slug: 'intercom' },
  { libelle: 'Antivol', slug: 'antivol' },
]

export const VETEMENTS: Entree[] = [
  { libelle: 'T-shirts', slug: 't-shirts' },
  { libelle: 'Maroquinerie', slug: 'maroquinerie' },
  { libelle: 'Sweat-shirts', slug: 'sweat-shirt' },
  { libelle: 'Casquettes', slug: 'casquettes' },
]

/**
 * Rayons de la boutique, dans l'ordre du menu.
 *
 * Un produit appartient à plusieurs catégories — sa marque en est une. Cette
 * liste dit lesquelles sont des rayons, et sert donc aussi à ranger un avis.
 */
export const RAYONS: Entree[] = [...EQUIPEMENTS, ...ACCESSOIRES, ...VETEMENTS]

export type RapportNavigation = {
  posees: string[]
  omises: string[]
}

export const basculerNavigation = async (
  payload: Payload,
  /**
   * Purge les caches après écriture.
   *
   * À couper hors requête HTTP : les hooks appellent `revalidateTag`, qui
   * n'existe que dans un rendu Next. Depuis une migration, l'appel échoue sur
   * « static generation store missing » et fait tomber le déploiement — et de
   * toute façon un build produit des caches neufs.
   */
  {
    revalider = true,
    req,
  }: {
    revalider?: boolean
    /**
     * Requête à joindre, indispensable depuis une migration.
     *
     * Les migrations tournent dans une transaction : sans la transmettre, les
     * lectures se font hors transaction et ne voient pas ce que la migration
     * vient d'écrire. C'est ainsi que la bascule a manqué les pages ressources
     * créées quelques lignes plus haut.
     */
    req?: PayloadRequest
  } = {},
): Promise<RapportNavigation> => {
  const contexte = { context: { disableRevalidate: !revalider }, ...(req ? { req } : {}) }

  const rapport: RapportNavigation = { posees: [], omises: [] }

  const categories = await payload.find({
    ...(req ? { req } : {}),
    collection: 'categories',
    depth: 0,
    limit: 500,
    pagination: false,
    select: { slug: true, title: true },
  })
  const parSlug = new Map(categories.docs.map((c) => [c.slug as string, c]))

  /** Compte les produits d'un rayon, pour la mention affichée au survol. */
  const compter = async (id: number) =>
    (
      await payload.count({
        ...(req ? { req } : {}),
        collection: 'products',
        where: { category: { in: [id] } },
      })
    ).totalDocs

  const sousEntrees = async (entrees: Entree[]) => {
    const sorties: { link: Record<string, unknown>; meta?: string }[] = []

    for (const { libelle, slug } of entrees) {
      const cat = parSlug.get(slug)
      if (!cat) {
        rapport.omises.push(`${libelle} (rayon absent)`)
        continue
      }
      const nb = await compter(cat.id)
      if (!nb) {
        rapport.omises.push(`${libelle} (rayon vide)`)
        continue
      }
      rapport.posees.push(libelle)
      sorties.push({
        link: { type: 'custom', label: libelle, url: `/rubrique/${slug}` },
        meta: `${nb} réf.`,
      })
    }

    return sorties
  }

  const equipements = await sousEntrees(EQUIPEMENTS)
  const accessoires = await sousEntrees(ACCESSOIRES)
  const vetements = await sousEntrees(VETEMENTS)

  /** L'entrée de premier niveau mène au premier rayon réellement disponible. */
  const tete = (
    libelle: string,
    prefere: string,
    sous: { link: Record<string, unknown> }[],
    repli: string,
  ) => {
    if (parSlug.has(prefere)) return { type: 'custom', label: libelle, url: `/rubrique/${prefere}` }
    const premier = sous[0]?.link?.url as string | undefined
    return premier
      ? { type: 'custom', label: libelle, url: premier }
      : { type: 'custom', label: libelle, url: repli, newTab: true }
  }

  const navItems = [
    {
      link: tete('Équipements', 'blousons-moto', equipements, `${SITE}/rubrique/blouson-moto/`),
      sousItems: equipements,
    },
    {
      link: tete('Accessoires', 'accessoires', accessoires, `${SITE}/rubrique/accessoires/`),
      sousItems: accessoires,
    },
    {
      link: tete('Vêtements', 'vetements', vetements, `${SITE}/rubrique/vetements/`),
      sousItems: vetements,
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
    ...(parSlug.has('bons-plans')
      ? [{ link: { type: 'custom', label: 'Bons plans', url: '/rubrique/bons-plans' } }]
      : []),
    {
      link: { type: 'custom', label: 'Dictionnaire moto', url: '/dictionnaire-moto' },
    },
    {
      // Pas d'équivalent ici : le guide vit toujours sur l'ancien site.
      link: {
        type: 'custom',
        label: 'Débuter la moto',
        url: `${SITE}/debuter-la-moto/`,
        newTab: true,
      },
    },
  ]

  await payload.updateGlobal({ slug: 'header', data: { navItems } as never, ...contexte })

  // Pages ressources déjà reprises ici : leurs liens basculent en interne.
  const pages = await payload.find({
    ...(req ? { req } : {}),
    collection: 'pages',
    depth: 0,
    limit: 200,
    pagination: false,
    select: { slug: true },
  })
  const pagesLocales = new Set(pages.docs.map((d) => d.slug).filter(Boolean) as string[])

  // Reprises par un gabarit dédié plutôt que par la collection des pages :
  // elles sont bien ici, mais aucune fiche ne porte leur slug.
  for (const slug of ['dictionnaire-moto', 'avis-des-clients', 'fond-decran-et-wallpaper']) {
    pagesLocales.add(slug)
  }

  /** Chemin interne si la page existe ici, adresse d'origine sinon. */
  const versPage = (slug: string) =>
    pagesLocales.has(slug)
      ? { type: 'custom' as const, url: `/${slug}` }
      : { type: 'custom' as const, url: `${SITE}/${slug}/`, newTab: true }

  const footer = await payload.findGlobal({ slug: 'footer', depth: 0, ...(req ? { req } : {}) })
  const colonnes = (footer?.colonnes ?? []).map((colonne) => {
    if (colonne.titre === 'Ressources') {
      return {
        ...colonne,
        items: [
          { link: { type: 'custom' as const, label: 'Débuter la moto', url: `${SITE}/debuter-la-moto/`, newTab: true } },
          { link: { type: 'custom' as const, label: 'Dictionnaire moto', url: '/dictionnaire-moto' } },
          { link: { label: 'Foire aux questions', ...versPage('faq') } },
          { link: { label: 'Fonds d’écran gratuits', ...versPage('fond-decran-et-wallpaper') } },
          { link: { label: 'Avis des clients', ...versPage('avis-des-clients') } },
        ],
      }
    }

    if (colonne.titre === 'La marque') {
      return {
        ...colonne,
        items: [
          { link: { label: 'Qui sommes-nous', ...versPage('a-propos') } },
          { link: { type: 'custom' as const, label: 'Le journal', url: '/posts' } },
          { link: { label: 'Politique de retour', ...versPage('politique-de-retour') } },
          { link: { type: 'custom' as const, label: 'Nous contacter', url: `${SITE}/contact/`, newTab: true } },
        ],
      }
    }

    if (colonne.titre !== 'Boutique') return colonne

    const items = [
      { libelle: 'Blousons moto', slug: 'blousons-moto' },
      { libelle: 'Gants', slug: 'gants' },
      { libelle: 'Casques', slug: 'casques' },
      { libelle: 'Accessoires', slug: 'accessoires' },
      { libelle: 'Vêtements', slug: 'vetements' },
    ]
      .filter(({ slug }) => parSlug.has(slug))
      .map(({ libelle, slug }) => ({
        link: { type: 'custom' as const, label: libelle, url: `/rubrique/${slug}` },
      }))

    return { ...colonne, items }
  })

  const navItemsPied = [
    { link: { label: 'CGVU', ...versPage('cgv') } },
    { link: { label: 'Mentions légales', ...versPage('mentions-legales') } },
    { link: { label: 'RGPD', ...versPage('politique-de-confidentialite-rgpd') } },
    { link: { type: 'custom' as const, label: 'Admin', url: '/admin' } },
  ]

  await payload.updateGlobal({
    slug: 'footer',
    data: { colonnes, navItems: navItemsPied } as never,
    ...contexte,
  })

  return rapport
}
