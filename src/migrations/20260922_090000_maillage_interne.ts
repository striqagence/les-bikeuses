import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { internaliserLiens } from '../endpoints/import/liens'

/**
 * Rejoue l'internalisation des liens, le catalogue étant désormais en place.
 *
 * La première passe datait d'un moment où ni les fiches produit ni les rayons
 * n'existaient ici : un lien n'étant réécrit que si sa destination existe
 * réellement, la plupart sont restés sur lesbikeuses.fr. Relevé du 22/09/2026
 * sur le contenu en base : 182 liens d'articles pointaient encore dehors, dont
 * 46 vers des fiches produit et une centaine vers des articles que ce site
 * héberge pourtant.
 *
 * Ce que ça coûtait : une lectrice qui suivait un lien au milieu d'un article
 * quittait le site, et l'autorité de chaque lien partait avec elle.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await internaliserLiens(payload, { req })

  payload.logger.info(
    `Maillage : ${r.liensReecrits} lien(s) ramené(s) vers ce site, ` +
      `sur ${r.articles} article(s) et ${r.pages} page(s).`,
  )
  for (const { cible, nb } of r.restants) {
    payload.logger.info(`  reste externe : ${cible} (${nb})`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Maillage : conservé.')
}
