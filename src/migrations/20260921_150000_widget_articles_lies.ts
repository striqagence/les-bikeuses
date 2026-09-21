import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Retire le widget « Vous pourriez être aussi intéressé par ».
 *
 * WordPress le composait dans le corps de l'article : un titre suivi d'une
 * liste de liens, en toute fin. L'import l'a repris comme du contenu, faute de
 * pouvoir le distinguer d'une vraie section. Or ce site porte son propre
 * « À lire ensuite », nourri par les articles liés — le lecteur avait donc
 * deux listes de suggestions coup sur coup, dont l'une aux liens figés.
 *
 * Le titre et la liste qui le suit sortent ensemble : séparés, il resterait
 * une liste de liens sans intitulé.
 */
const EST_WIDGET = /^vous pourriez [êe]tre aussi int[ée]ress/i

type Noeud = { type?: string; text?: string; children?: Noeud[] }
const plat = (n: Noeud): string => n.text ?? (n.children ?? []).map(plat).join('')

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

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
    const racine = (article.content as { root?: { children?: Noeud[] } } | null)?.root
    const enfants = racine?.children
    if (!Array.isArray(enfants)) continue

    const i = enfants.findIndex(
      (n) => n.type === 'heading' && EST_WIDGET.test(plat(n).replace(/\s+/g, ' ').trim()),
    )
    if (i === -1) continue

    // La liste qui suit immédiatement part avec le titre ; rien d'autre.
    const fin = i + 1 < enfants.length && enfants[i + 1].type === 'list' ? i + 2 : i + 1
    const gardes = [...enfants.slice(0, i), ...enfants.slice(fin)]

    retires += fin - i
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

  payload.logger.info(`Widget « articles liés » : ${retires} bloc(s) retiré(s) sur ${touches} article(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Widget « articles liés » : non rétabli.')
}
