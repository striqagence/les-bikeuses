import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerAvis } from '../endpoints/import/avis'

/**
 * Range les avis par rayon.
 *
 * La reprise précédente lisait `category` comme une catégorie unique alors
 * qu'un produit en porte plusieurs — sa marque en fait partie. Les 370 avis
 * sont donc arrivés sans rayon, et le filtre correspondant ne s'affichait pas.
 *
 * L'import est rejoué : il ne recrée rien, il relit le rayon de chaque avis
 * déjà présent.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const avis = await importerAvis(payload, { req })

  payload.logger.info(
    `Avis clients : ${avis.rayons} rangé(s) par rayon, ${avis.crees} nouveau(x), ` +
      `${avis.ignores} inchangé(s) sur ${avis.total}.`,
  )
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Rayon des avis : conservé.')
}
