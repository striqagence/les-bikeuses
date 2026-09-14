import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { internaliserLiens } from '../endpoints/import/liens'

/**
 * Rattrape les rayons emboîtés et les articles préfixés.
 *
 * L'ancienne boutique emboîtait ses rayons — « /rubrique/gants/
 * gants-chauffants/ », « /rubrique/marques/helstons/ ». Le catalogue d'ici
 * est à plat, et les seize destinations citées par les articles existent
 * toutes : c'est le dernier segment qui porte le rayon. Les articles, eux,
 * vivaient sous « /blog/ » avant de passer à la racine.
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
