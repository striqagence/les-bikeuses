import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Retire les émojis repris en images de contenu.
 *
 * WordPress rend les émojis en images : un SVG de 36 px servi depuis s.w.org,
 * nommé d'après le point de code du caractère. Rien ne les distingue d'une
 * photo au niveau de la balise, si bien que l'import les a pris pour du
 * contenu — cent six vignettes, réparties sur les articles, et cassées à
 * l'affichage faute de se redimensionner comme une image matricielle.
 *
 * Le garde-fou est posé côté import ; il reste à nettoyer ce qui est déjà en
 * base. Les blocs sont retirés du corps ; les fichiers eux-mêmes sont laissés
 * en médiathèque, leur suppression étant une décision séparée.
 */

/** Un média qui est un émoji WordPress et non une photo. */
const estEmoji = (m: { filename?: string | null; mimeType?: string | null; width?: number | null }) =>
  /^[0-9a-f]{4,6}(-[0-9a-f]{4,6})*\.svg$/i.test(m.filename ?? '') ||
  ((m.mimeType ?? '').includes('svg') && (m.width ?? 0) > 0 && (m.width ?? 0) <= 72)

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const medias = await payload.find({
    ...contexte,
    collection: 'media',
    depth: 0,
    limit: 5000,
    pagination: false,
    select: { filename: true, mimeType: true, width: true },
  })
  const emojis = new Set(medias.docs.filter(estEmoji).map((m) => m.id))

  payload.logger.info(`Émojis repérés en médiathèque : ${emojis.size}`)
  if (!emojis.size) return

  const articles = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, content: true },
  })

  let touches = 0
  let retires = 0

  for (const article of articles.docs) {
    const racine = (article.content as { root?: { children?: unknown[] } } | null)?.root
    const enfants = racine?.children
    if (!Array.isArray(enfants)) continue

    const gardes = enfants.filter((n) => {
      const noeud = n as { type?: string; fields?: { blockType?: string; media?: unknown } }
      if (noeud.type !== 'block' || noeud.fields?.blockType !== 'mediaBlock') return true
      const media = noeud.fields?.media
      const id = typeof media === 'number' ? media : (media as { id?: number } | null)?.id
      return !(typeof id === 'number' && emojis.has(id))
    })

    if (gardes.length === enfants.length) continue

    retires += enfants.length - gardes.length
    touches++

    await payload.update({
      ...contexte,
      collection: 'posts',
      id: article.id,
      depth: 0,
      data: { content: { ...article.content, root: { ...racine, children: gardes } } } as never,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(`Émojis retirés du corps : ${retires} bloc(s) sur ${touches} article(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Émojis : non rétablis.')
}
