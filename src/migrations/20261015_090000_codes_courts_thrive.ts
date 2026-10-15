import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Retire les codes courts WordPress restés dans le contenu.
 *
 * La reprise a importé le texte tel qu'il était stocké, codes courts compris :
 * `[thrive_2step id='13301']politique de retour[/thrive_2step]` s'affichait
 * donc en clair sur 193 fiches produit, crochets et entités HTML apparents.
 * Un article portait `[thrive_leads]`, une fiche `[alma-product-eligibility]`.
 *
 * Le libellé encadré par `thrive_2step` devient un lien vers la politique de
 * retour. Le code court ouvrait une fenêtre vers ce contenu : le supprimer
 * sans rien mettre à la place laisserait « Consultez la politique de retour. »
 * sans destination, c'est-à-dire une phrase qui promet et ne tient pas.
 *
 * Le nettoyage opère sur l'arbre Lexical et non sur sa sérialisation : une
 * substitution dans le JSON risquerait de casser une structure voisine.
 */

const OUVRANT = /\[thrive_2step\b[^\]]*\]/gi
const FERMANT = /\[\/thrive_2step\]/gi
const AUTRES = /\[\/?(?:thrive_leads|thrive_[a-z_]+|alma-[a-z-]+)\b[^\]]*\]/gi

type Noeud = Record<string, unknown> & {
  type?: string
  text?: string
  children?: Noeud[]
}

const lien = (libelle: string): Noeud => ({
  type: 'link',
  fields: { linkType: 'custom', newTab: false, url: '/politique-de-retour' },
  children: [
    { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: libelle, version: 1 },
  ],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 3,
})

const nettoyerTexte = (t: string): string =>
  t.replace(OUVRANT, '').replace(FERMANT, '').replace(AUTRES, '').replace(/\s{2,}/g, ' ')

/** Rend la liste d'enfants nettoyée, ou `null` si rien n'a changé. */
const nettoyerEnfants = (enfants: Noeud[]): Noeud[] | null => {
  let touche = false
  const sortie: Noeud[] = []

  for (let i = 0; i < enfants.length; i++) {
    const n = enfants[i]

    // Le motif complet : « …[thrive_2step …] » / « libellé » / « [/thrive_2step] »
    const suivant = enfants[i + 1]
    const apres = enfants[i + 2]
    if (
      typeof n.text === 'string' &&
      OUVRANT.test(n.text) &&
      typeof suivant?.text === 'string' &&
      typeof apres?.text === 'string' &&
      FERMANT.test(apres.text)
    ) {
      OUVRANT.lastIndex = 0
      FERMANT.lastIndex = 0
      const avant = nettoyerTexte(n.text)
      if (avant.trim()) sortie.push({ ...n, text: avant })
      sortie.push(lien(suivant.text.trim()))
      const reste = nettoyerTexte(apres.text)
      if (reste.trim()) sortie.push({ ...apres, text: reste })
      i += 2
      touche = true
      continue
    }
    OUVRANT.lastIndex = 0
    FERMANT.lastIndex = 0

    if (typeof n.text === 'string') {
      const propre = nettoyerTexte(n.text)
      if (propre !== n.text) {
        touche = true
        // Un nœud vidé de tout son contenu disparaît.
        if (!propre.trim()) continue
        sortie.push({ ...n, text: propre })
        continue
      }
    }

    if (Array.isArray(n.children)) {
      const enfantsPropres = nettoyerEnfants(n.children)
      if (enfantsPropres) {
        touche = true
        // Un bloc qui ne contient plus rien d'affichable disparaît aussi.
        if (!enfantsPropres.length && n.type !== 'root') continue
        sortie.push({ ...n, children: enfantsPropres })
        continue
      }
    }

    sortie.push(n)
  }

  return touche ? sortie : null
}

const nettoyer = (riche: unknown): unknown | null => {
  const racine = (riche as { root?: { children?: Noeud[] } } | null)?.root
  if (!Array.isArray(racine?.children)) return null
  const propres = nettoyerEnfants(racine.children)
  return propres ? { ...(riche as object), root: { ...racine, children: propres } } : null
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }
  let produits = 0
  let articles = 0
  let liens = 0

  const lot = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, description: true, shortDescription: true },
  })

  for (const p of lot.docs) {
    const desc = nettoyer(p.description)
    const courte =
      typeof p.shortDescription === 'string' ? nettoyerTexte(p.shortDescription) : null
    const courteChangee = courte !== null && courte !== p.shortDescription

    if (!desc && !courteChangee) continue
    produits++
    liens += JSON.stringify(desc ?? {}).split('/politique-de-retour').length - 1

    await payload.update({
      ...contexte,
      collection: 'products',
      id: p.id,
      depth: 0,
      data: {
        ...(desc ? { description: desc } : {}),
        ...(courteChangee ? { shortDescription: courte } : {}),
      } as never,
      context: { disableRevalidate: true },
    })
  }

  const posts = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, content: true },
  })

  for (const a of posts.docs) {
    const propre = nettoyer(a.content)
    if (!propre) continue
    articles++
    await payload.update({
      ...contexte,
      collection: 'posts',
      id: a.id,
      depth: 0,
      data: { content: propre } as never,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(
    `Codes courts retirés : ${produits} fiche(s) produit, ${articles} article(s), ` +
      `${liens} lien(s) vers la politique de retour rétabli(s).`,
  )
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Codes courts : non rétablis.')
}
