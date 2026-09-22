import type { Payload, PayloadRequest } from 'payload'

const SITE = 'https://lesbikeuses.fr'

/**
 * Ramène vers ce site les liens écrits dans le contenu.
 *
 * Les articles ont été repris avec leurs liens d'origine, qui pointaient tous
 * vers lesbikeuses.fr : à l'époque, ni le catalogue ni la plupart des pages
 * n'existaient ici. Ce n'est plus le cas — une lectrice qui suit un lien au
 * milieu d'un article se retrouvait expédiée sur l'ancien site.
 *
 * Un lien n'est réécrit que si sa destination existe réellement en base. Le
 * reste est laissé tel quel : mieux vaut un lien vers l'ancien site qu'un lien
 * vers une page absente.
 */

/**
 * Rayons dont le slug a changé à la reprise.
 *
 * Table explicite et non rapprochement automatique : celui-ci proposait
 * « blouson-hiver » pour « blouson-moto » et « pantalon-moto-cuir » pour
 * « pantalons-jeans ».
 */
const RAYONS_RENOMMES: Record<string, string> = {
  'blouson-moto': 'blousons-moto',
  'pantalons-jeans': 'pantalon-jeans',
  'sous-vetement-moto': 'sous-vetements-moto',
}

/** Pages servies par une route dédiée plutôt que par la collection. */
const ROUTES_DEDIEES = [
  'dictionnaire-moto',
  'avis-des-clients',
  'fond-decran-et-wallpaper',
  'debuter-la-moto',
  'apprendre-la-moto',
  'marques',
  'faq',
  'contact',
  'panier',
  'posts',
]

export type RapportLiens = {
  articles: number
  pages: number
  liensReecrits: number
  restants: { cible: string; nb: number }[]
}

export const internaliserLiens = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportLiens> => {
  const contexte = req ? { req } : {}

  const [posts, produits, categories, pages] = await Promise.all([
    payload.find({ ...contexte, collection: 'posts', depth: 0, limit: 500, pagination: false, select: { slug: true } }),
    payload.find({ ...contexte, collection: 'products', depth: 0, limit: 1000, pagination: false, select: { slug: true } }),
    payload.find({ ...contexte, collection: 'categories', depth: 0, limit: 500, pagination: false, select: { slug: true } }),
    payload.find({ ...contexte, collection: 'pages', depth: 0, limit: 200, pagination: false, select: { slug: true } }),
  ])

  const slugsArticles = new Set(posts.docs.map((d) => d.slug as string))
  const slugsProduits = new Set(produits.docs.map((d) => d.slug as string))
  const slugsRayons = new Set(categories.docs.map((d) => d.slug as string))
  const slugsPages = new Set([...pages.docs.map((d) => d.slug as string), ...ROUTES_DEDIEES])

  /** Chemin local équivalent, ou `null` s'il n'y en a pas. */
  const versLocal = (chemin: string): string | null => {
    const propre = chemin.replace(/^\/+|\/+$/g, '')
    if (!propre) return null

    const produit = /^product\/([^/]+)$/.exec(propre)
    if (produit) return slugsProduits.has(produit[1]) ? `/produit/${produit[1]}` : null

    // L'ancienne boutique emboîtait ses rayons — « /rubrique/gants/
    // gants-chauffants/ », « /rubrique/marques/helstons/ ». Le catalogue
    // d'ici est à plat : c'est le dernier segment qui porte le rayon.
    const rayon = /^rubrique\/(?:[^/]+\/)*([^/]+)$/.exec(propre)
    if (rayon) {
      const slug = RAYONS_RENOMMES[rayon[1]] ?? rayon[1]
      return slugsRayons.has(slug) ? `/rubrique/${slug}` : null
    }

    // Les articles vivaient sous « /blog/ » avant de passer à la racine.
    const article = /^blog\/([^/]+)$/.exec(propre)
    if (article) return slugsArticles.has(article[1]) ? `/${article[1]}` : null

    // L'entrée de la boutique : le premier rayon du menu.
    if (propre === 'shop') return slugsRayons.has('blousons-moto') ? '/rubrique/blousons-moto' : null
    if (propre === 'blog') return '/posts'

    /*
     * Sous-pages du dictionnaire que ce site rend par un filtre plutôt que
     * par une page à part. Les recopier aurait créé deux pages disant la même
     * chose, qui se cannibalisent dans les résultats de recherche ; le lien
     * mène donc au dictionnaire déjà filtré.
     */
    if (propre === 'dictionnaire-moto/motos-faciles-a-conduire')
      return '/dictionnaire-moto?gabarit=Petit+gabarit'
    if (propre === 'dictionnaire-moto/categories-moto') return '/dictionnaire-moto'

    if (propre.includes('/')) return null
    if (slugsArticles.has(propre) || slugsPages.has(propre)) return `/${propre}`
    return null
  }

  const rapport: RapportLiens = { articles: 0, pages: 0, liensReecrits: 0, restants: [] }
  const restants = new Map<string, number>()

  /**
   * Réécrit les adresses dans le document sérialisé.
   *
   * Le remplacement vise les champs `url`, jamais le texte visible : un
   * article qui cite « lesbikeuses.fr » en toutes lettres doit continuer à
   * l'écrire.
   */
  const reecrire = (doc: unknown): { valeur: unknown; nb: number } => {
    let nb = 0
    const brut = JSON.stringify(doc)
    if (!brut) return { valeur: doc, nb: 0 }

    const sortie = brut.replace(
      /"url":"https:\/\/lesbikeuses\.fr(\/[^"]*)?"/g,
      (entier, chemin: string | undefined) => {
        const local = versLocal(chemin ?? '')
        if (!local) {
          const cle = chemin ?? '/'
          restants.set(cle, (restants.get(cle) ?? 0) + 1)
          return entier
        }
        nb++
        return `"url":"${local}"`
      },
    )

    return { valeur: JSON.parse(sortie), nb }
  }

  // Les pages portent des liens dans leur en-tête comme dans leur corps :
  // les deux boutons du héros de l'accueil vivent dans `hero`, pas `layout`.
  const CHAMPS = { posts: ['content'], pages: ['hero', 'layout'] } as const

  for (const collection of ['posts', 'pages'] as const) {
    const docs = await payload.find({
      ...contexte,
      collection,
      depth: 0,
      limit: 500,
      pagination: false,
    })

    for (const doc of docs.docs) {
      const modifs: Record<string, unknown> = {}
      let nbDoc = 0

      for (const champ of CHAMPS[collection]) {
        const source = (doc as unknown as Record<string, unknown>)[champ]
        if (!source) continue

        const { valeur, nb } = reecrire(source)
        if (!nb) continue

        modifs[champ] = valeur
        nbDoc += nb
      }

      if (!nbDoc) continue

      await payload.update({
        ...contexte,
        collection,
        id: doc.id,
        depth: 0,
        data: modifs as never,
        context: { disableRevalidate: true },
      })

      rapport.liensReecrits += nbDoc
      if (collection === 'posts') rapport.articles++
      else rapport.pages++
    }
  }

  rapport.restants = [...restants.entries()]
    .map(([cible, nb]) => ({ cible, nb }))
    .sort((a, b) => b.nb - a.nb)
    .slice(0, 15)

  return rapport
}
