import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { recupererImagesManquantes } from '../endpoints/import/images-manquantes'

/**
 * Récupère les photos oubliées par la reprise initiale.
 *
 * Six articles bâtis autour de carrousels produits ont perdu quelques visuels :
 * l'extraction, qui écarte les résidus de carrousel, emportait au passage les
 * photos qui les jouxtaient. Rejouer l'import complet les perdrait de la même
 * façon, d'où cette passe ciblée — et le placement suit la source, titre par
 * titre, plutôt que d'empiler les images en fin d'article.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Passe historique : la liste vivait alors dans le module.
  const r = await recupererImagesManquantes(payload, { req, slugs: [] })

  payload.logger.info(`Images oubliées : ${r.ajoutees} récupérée(s).`)
  for (const a of r.articles) {
    payload.logger.info(
      `  ${a.slug} : ${a.ajoutees} ajoutée(s)` +
        (a.sansRepere ? `, ${a.sansRepere} sans repère` : ''),
    )
  }
  if (r.sansRepere) {
    payload.logger.warn(
      `  ${r.sansRepere} image(s) sans point d'ancrage sûr : écartée(s) plutôt que posée(s) au hasard.`,
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Images oubliées : conservées.')
}
