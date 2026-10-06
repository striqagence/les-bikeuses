import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { extraireSpecsMoto } from '../endpoints/import/specsMotoNormalisees'

/**
 * Remplit la fiche technique des motos depuis le corps de l'article.
 *
 * Les valeurs y vivaient en paragraphes « Libellé : valeur », et les
 * quatre-vingts fiches avaient produit quatre-vingt-six intitulés différents.
 * Surtout, les unités manquaient : soixante-quatorze hauteurs de selle et
 * soixante-quinze poids étaient des nombres nus. Rien n'était comparable.
 *
 * Le corps de l'article n'est pas touché : il reste la source, et les champs
 * en sont la lecture normalisée. Relancer cette migration après une
 * correction en back-office reprendrait donc la valeur corrigée.
 *
 * Restreinte à la rubrique « motos » : un article d'équipement peut avoir un
 * titre « Caractéristiques » sans être une fiche de dictionnaire.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const r = await payload.find({
    ...contexte,
    collection: 'posts',
    depth: 0,
    limit: 500,
    pagination: false,
    where: { 'categories.slug': { equals: 'motos' } },
    select: { slug: true, content: true },
  })

  const compte: Record<string, number> = {}
  let remplies = 0

  for (const article of r.docs) {
    const specs = extraireSpecsMoto(article.content)
    const champs = Object.keys(specs).filter((k) => specs[k as keyof typeof specs] !== undefined)
    if (!champs.length) continue

    for (const c of champs) compte[c] = (compte[c] ?? 0) + 1
    remplies++

    await payload.update({
      ...contexte,
      collection: 'posts',
      id: article.id,
      depth: 0,
      data: { moto: specs } as never,
      context: { disableRevalidate: true },
    })
  }

  payload.logger.info(`Fiches techniques remplies : ${remplies} / ${r.docs.length}`)
  for (const [c, n] of Object.entries(compte).sort((a, b) => b[1] - a[1])) {
    payload.logger.info(`  ${c} : ${n}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Fiches techniques : valeurs conservées (le corps reste la source).')
}
