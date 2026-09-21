import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Nettoie les résumés SEO pollués par le sommaire de WordPress.
 *
 * L'ancien site insérait sa table des matières dans le corps de la page, et sa
 * balise `description` la reprenait telle quelle. L'import lisant cette
 * balise, quatre-vingts résumés s'ouvrent sur « Contenus masquer 1
 * Caractéristiques 2 Ce qu'on en pense ?… » — c'est ce que les moteurs
 * affichent sous le titre, et c'est illisible.
 *
 * Deux formes se présentent : les fiches du dictionnaire commencent par le
 * sommaire, quelques articles l'ont accolé après un vrai résumé. La coupe à
 * l'amorce traite les deux ; quand il ne reste rien d'exploitable, le résumé
 * est reconstruit depuis le premier paragraphe rédigé du corps.
 */

const AMORCE = /contenus\s+masquer/i

/** Longueur usuelle d'un résumé affiché par un moteur. */
const LONGUEUR = 155

type Noeud = { type?: string; text?: string; children?: Noeud[] }
const plat = (n: Noeud): string => n.text ?? (n.children ?? []).map(plat).join('')

/** Une ligne de fiche technique — « Marque : Triumph » — n'est pas un résumé. */
const TECHNIQUE = /^[^:?]{2,44}?\s*[:?]\s*\S/

/** Coupe au dernier mot entier plutôt qu'au milieu d'un mot. */
const rogner = (t: string): string => {
  if (t.length <= LONGUEUR) return t
  const coupe = t.slice(0, LONGUEUR)
  const espace = coupe.lastIndexOf(' ')
  return (espace > 60 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.–—-]+$/, '') + '…'
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const articles = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, meta: true, content: true },
  })

  let coupes = 0
  let reconstruits = 0
  let sansRemede = 0

  for (const article of articles.docs) {
    const meta = (article.meta ?? {}) as { description?: string | null }
    const actuel = (meta.description ?? '').trim()
    if (!actuel || !AMORCE.test(actuel)) continue

    let nouveau = actuel.slice(0, actuel.search(AMORCE)).trim().replace(/[\s,;:–—-]+$/, '')

    if (nouveau.length < 60) {
      const enfants = (article.content as { root?: { children?: Noeud[] } } | null)?.root?.children
      const prose = (Array.isArray(enfants) ? enfants : [])
        .filter((n) => n.type === 'paragraph')
        .map((n) => plat(n).replace(/\s+/g, ' ').trim())
        .find((t) => t.length >= 80 && !TECHNIQUE.test(t))
      if (!prose) {
        sansRemede++
        continue
      }
      nouveau = prose
      reconstruits++
    } else {
      coupes++
    }

    await payload.update({
      ...contexte,
      collection: 'posts',
      id: article.id,
      depth: 0,
      data: { meta: { ...meta, description: rogner(nouveau) } } as never,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(
    `Résumés : ${coupes} coupé(s), ${reconstruits} reconstruit(s) depuis le corps, ` +
      `${sansRemede} laissé(s) en l'état faute de prose exploitable.`,
  )
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Résumés : non rétablis.')
}
