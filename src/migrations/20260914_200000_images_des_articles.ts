import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { convertirImagesEnBlocs } from '../endpoints/import/images-articles'

/**
 * Rend visibles les images du corps des articles.
 *
 * Elles étaient bien en base — vingt-trois pour le seul article sur le permis
 * A2 — mais aucune ne s'affichait. Le convertisseur par défaut de Payload
 * abandonne sans un mot dès que le média n'est pas peuplé, et la population ne
 * se déclenchait pas sur ce champ, à aucune profondeur. Les seules images
 * qu'on voyait dans les articles venaient des carrousels produits.
 *
 * Les nœuds deviennent des blocs `mediaBlock`, dont le champ média se peuple
 * sans difficulté et qui passent par l'optimiseur.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await convertirImagesEnBlocs(payload, { req })

  payload.logger.info(
    `Images des articles : ${r.images} converties sur ${r.articles} article(s) ` +
      `et ${r.pages} page(s).`,
  )
  if (r.horsRacine) {
    payload.logger.warn(
      `  ${r.horsRacine} image(s) imbriquée(s) dans un paragraphe, laissée(s) en l'état.`,
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Images des articles : conservées.')
}
