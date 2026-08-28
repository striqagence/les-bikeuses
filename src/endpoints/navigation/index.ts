import type { Payload } from 'payload'

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

type Entree = { libelle: string; slug: string }

const EQUIPEMENTS: Entree[] = [
  { libelle: 'Blousons moto', slug: 'blousons-moto' },
  { libelle: 'Gants', slug: 'gants' },
  { libelle: 'Casques', slug: 'casques' },
  { libelle: 'Pantalons & jeans', slug: 'pantalon-jeans' },
  { libelle: 'Bottes', slug: 'bottes' },
  { libelle: 'Baskets moto', slug: 'baskets' },
  { libelle: 'Sous-vêtements', slug: 'sous-vetements-moto' },
]

const ACCESSOIRES: Entree[] = [
  { libelle: 'Bagagerie', slug: 'bagagerie' },
  { libelle: 'Confort', slug: 'confort' },
  { libelle: 'Entretien moto', slug: 'entretien-moto' },
  { libelle: 'Sécurité', slug: 'securite' },
  { libelle: 'Tour de cou', slug: 'tour-de-cou' },
  { libelle: 'Intercom', slug: 'intercom' },
  { libelle: 'Antivol', slug: 'antivol' },
]

const VETEMENTS: Entree[] = [
  { libelle: 'T-shirts', slug: 't-shirts' },
  { libelle: 'Maroquinerie', slug: 'maroquinerie' },
  { libelle: 'Sweat-shirts', slug: 'sweat-shirt' },
  { libelle: 'Casquettes', slug: 'casquettes' },
]

export type RapportNavigation = {
  posees: string[]
  omises: string[]
}

export const basculerNavigation = async (payload: Payload): Promise<RapportNavigation> => {
  const rapport: RapportNavigation = { posees: [], omises: [] }

  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 500,
    pagination: false,
    select: { slug: true, title: true },
  })
  const parSlug = new Map(categories.docs.map((c) => [c.slug as string, c]))

  /** Compte les produits d'un rayon, pour la mention affichée au survol. */
  const compter = async (id: number) =>
    (await payload.count({ collection: 'products', where: { category: { in: [id] } } })).totalDocs

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
      // Pas d'équivalent ici : le guide vit toujours sur l'ancien site.
      link: {
        type: 'custom',
        label: 'Débuter la moto',
        url: `${SITE}/debuter-la-moto/`,
        newTab: true,
      },
    },
  ]

  await payload.updateGlobal({ slug: 'header', data: { navItems } as never })

  // Le pied de page : seule la colonne « Boutique » bascule en interne.
  const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
  const colonnes = (footer?.colonnes ?? []).map((colonne) => {
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

  await payload.updateGlobal({ slug: 'footer', data: { colonnes } as never })

  return rapport
}
