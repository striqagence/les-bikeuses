import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { internaliserLiens } from '../endpoints/import/liens'

/**
 * Ramène vers ce site les liens écrits dans les articles et la page d'accueil.
 *
 * Ils pointaient tous vers lesbikeuses.fr : à la reprise, ni le catalogue ni
 * la plupart des pages n'existaient encore ici. Une lectrice qui suivait un
 * lien au milieu d'un article se retrouvait expédiée sur l'ancien site.
 *
 * Un lien n'est réécrit que si sa destination existe réellement en base.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await internaliserLiens(payload, { req })

  payload.logger.info(
    `Liens internalisés : ${r.liensReecrits} lien(s) sur ${r.articles} article(s) ` +
      `et ${r.pages} page(s).`,
  )

  for (const { cible, nb } of r.restants) {
    payload.logger.info(`  reste externe : ${cible} (${nb})`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Liens : conservés.')
}
