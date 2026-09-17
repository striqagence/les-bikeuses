import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { poserVisuelsAccueil } from '../endpoints/import/visuels-accueil'

/**
 * Pose les photos de la marque sur la page d'accueil.
 *
 * Le héros et le carrousel se contentaient d'illustrations d'articles
 * réemployées — dont un comparatif Kawasaki / Honda portant son titre
 * incrusté, recadré en pleine vignette. Aucune refonte de mise en page ne
 * compensait cela.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await poserVisuelsAccueil(payload, { req })

  payload.logger.info(
    `Visuels d'accueil : ${r.crees.length} ajouté(s) à la médiathèque` +
      (r.reutilises.length ? `, ${r.reutilises.length} déjà présent(s)` : ''),
  )
  for (const place of r.places) payload.logger.info(`  posé : ${place}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Visuels d’accueil : conservés.')
}
