import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { internaliserLiens } from '../endpoints/import/liens'

/**
 * Rattrape les liens de l'en-tête des pages.
 *
 * La passe précédente ne parcourait que le corps (`layout`). Les deux boutons
 * du héros de l'accueil — « la boutique » et « débuter la moto » — vivent dans
 * `hero`, et renvoyaient donc encore vers l'ancien site depuis la page la plus
 * visitée.
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
