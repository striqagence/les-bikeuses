import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { extraireSpecsMoto } from '../endpoints/import/specsMotoNormalisees'

/**
 * Rectifie la cylindrée de la Triumph Rocket 3.
 *
 * La fiche annonçait 2548 cm³ ; le moteur en fait 2458. Deux chiffres
 * intervertis, repris tels quels de l'ancien site — l'extraction était fidèle,
 * c'est la donnée d'origine qui était fausse. Repérée par le contrôle de
 * plausibilité de l'extracteur, qui signale toute cylindrée au-delà de
 * 2500 cm³.
 *
 * La correction porte d'abord sur le corps de l'article, qui reste la source :
 * ne rectifier que le champ aurait laissé la valeur fausse réapparaître à la
 * prochaine extraction. Le champ est ensuite recalculé depuis le corps
 * corrigé, plutôt qu'écrit à la main — c'est le même chemin que pour les
 * soixante-dix-neuf autres fiches.
 */
const SLUG = 'rocket-3-triumph'
const FAUX = '2548'
const JUSTE = '2458'

type Noeud = { text?: string; children?: Noeud[] }

/** Remplace dans les nœuds de texte, en laissant la structure intacte. */
const rectifier = (n: unknown): unknown => {
  if (Array.isArray(n)) return n.map(rectifier)
  if (!n || typeof n !== 'object') return n
  const noeud = n as Noeud & Record<string, unknown>
  const sortie: Record<string, unknown> = { ...noeud }
  if (typeof noeud.text === 'string' && noeud.text.includes(FAUX)) {
    sortie.text = noeud.text.replace(FAUX, JUSTE)
  }
  for (const [cle, valeur] of Object.entries(noeud)) {
    if (cle !== 'text' && valeur && typeof valeur === 'object') sortie[cle] = rectifier(valeur)
  }
  return sortie
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const r = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: SLUG } },
  })

  const fiche = r.docs[0]
  if (!fiche) {
    payload.logger.warn(`Rocket 3 : fiche « ${SLUG} » introuvable, rien à faire.`)
    return
  }

  const contenu = rectifier(fiche.content)
  const specs = extraireSpecsMoto(contenu)

  if (specs.cylindree !== Number(JUSTE)) {
    payload.logger.warn(
      `Rocket 3 : après rectification l'extraction donne ${specs.cylindree}, attendu ${JUSTE}. Abandon.`,
    )
    return
  }

  await payload.update({
    ...contexte,
    collection: 'posts',
    id: fiche.id,
    depth: 0,
    data: { content: contenu, moto: specs } as never,
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Rocket 3 : cylindrée rectifiée, ${FAUX} → ${JUSTE} cm³.`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Rocket 3 : valeur rectifiée conservée.')
}
