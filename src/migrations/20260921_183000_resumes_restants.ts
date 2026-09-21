import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Reprend les résumés que la passe précédente n'a pas su reconstruire.
 *
 * Celle-ci écartait tout paragraphe ressemblant à « Libellé : valeur » pour ne
 * pas prendre une ligne de fiche technique pour un résumé. La règle était trop
 * grossière : une phrase rédigée qui contient un deux-points — « Le point fort
 * ultime : son style. Nous avons… » — s'y faisait prendre, alors qu'elle court
 * sur deux cent cinquante caractères.
 *
 * Une caractéristique est courte : c'est cette condition qui manquait. La
 * migration précédente n'est pas retouchée — elle a déjà tourné, et la
 * réécrire ferait diverger le fichier de ce qui s'est exécuté.
 */

const AMORCE = /contenus\s+masquer/i
const LONGUEUR = 155

type Noeud = { type?: string; text?: string; children?: Noeud[] }
const plat = (n: Noeud): string => n.text ?? (n.children ?? []).map(plat).join('')

/** Une ligne de fiche technique : la forme « Libellé : valeur », ET courte. */
const estTechnique = (t: string) => t.length <= 90 && /^[^:?]{2,44}?\s*[:?]\s*\S/.test(t)

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

  let repris = 0
  const restants: string[] = []

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
        .find((t) => t.length >= 80 && !estTechnique(t))
      if (!prose) {
        restants.push(article.slug as string)
        continue
      }
      nouveau = prose
    }

    repris++
    await payload.update({
      ...contexte,
      collection: 'posts',
      id: article.id,
      depth: 0,
      data: { meta: { ...meta, description: rogner(nouveau) } } as never,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(`Résumés repris : ${repris}.`)
  for (const slug of restants) payload.logger.info(`  toujours sans prose exploitable : ${slug}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Résumés : non rétablis.')
}
