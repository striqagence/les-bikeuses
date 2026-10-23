import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Retire les codes courts refermés par une parenthèse.
 *
 * La passe du 15/10 exigeait un crochet fermant. Quatre fiches portent
 * `[/thrive_2step)` — parenthèse au lieu de crochet, faute de frappe d'origine
 * recopiée telle quelle par la reprise. L'ouvrant, lui, était bien formé et a
 * donc été retiré : il ne restait que le fermant, visible en clair.
 *
 * La tolérance porte sur le caractère de fermeture, pas sur le reste : le
 * motif reste ancré sur un nom de code court connu, pour ne pas emporter du
 * texte entre crochets qui n'en serait pas un.
 *
 * Le libellé qui précède devient un lien vers la politique de retour, comme
 * sur les 190 autres fiches — c'est ce que le code court désignait.
 */
const CODE = /\[\/?(?:thrive_[a-z_]+|alma-[a-z-]+)\b[^\]).]{0,80}[\])]/gi

type Noeud = Record<string, unknown> & { type?: string; text?: string; children?: Noeud[] }

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

const nettoyerEnfants = (enfants: Noeud[]): Noeud[] | null => {
  let touche = false
  const sortie: Noeud[] = []

  for (const n of enfants) {
    if (typeof n.text === 'string' && CODE.test(n.text)) {
      CODE.lastIndex = 0
      const propre = n.text.replace(CODE, '').replace(/\s{2,}/g, ' ')
      touche = true

      // Le libellé juste avant perdait son code court encadrant : on lui rend
      // la destination que celui-ci portait.
      const precedent = sortie[sortie.length - 1]
      if (
        !propre.trim() &&
        precedent &&
        typeof precedent.text === 'string' &&
        /politique de retour/i.test(precedent.text)
      ) {
        sortie[sortie.length - 1] = lien(precedent.text.trim())
        continue
      }
      if (propre.trim()) sortie.push({ ...n, text: propre })
      continue
    }
    CODE.lastIndex = 0

    if (Array.isArray(n.children)) {
      const propres = nettoyerEnfants(n.children)
      if (propres) {
        touche = true
        if (!propres.length && n.type !== 'root') continue
        sortie.push({ ...n, children: propres })
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
  let n = 0

  // Deux boucles explicites plutôt qu'une générique : l'union des deux
  // collections fait s'effondrer le type des documents en `never`, et forcer
  // le type reviendrait à masquer ce que le compilateur a raison de refuser.
  const produits = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, description: true },
  })
  for (const doc of produits.docs) {
    const propre = nettoyer(doc.description)
    if (!propre) continue
    n++
    await payload.update({
      ...contexte,
      collection: 'products',
      id: doc.id,
      depth: 0,
      data: { description: propre } as never,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`  nettoyé : ${doc.slug}`)
  }

  const articles = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, content: true },
  })
  for (const doc of articles.docs) {
    const propre = nettoyer(doc.content)
    if (!propre) continue
    n++
    await payload.update({
      ...contexte,
      collection: 'posts',
      id: doc.id,
      depth: 0,
      data: { content: propre } as never,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`  nettoyé : ${doc.slug}`)
  }

  payload.logger.info(`Codes courts mal fermés retirés : ${n} document(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Codes courts mal fermés : non rétablis.')
}
