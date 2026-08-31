import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerAvis } from '../endpoints/import/avis'
import { importerFondsDecran } from '../endpoints/import/fonds-decran'
import { basculerNavigation } from '../endpoints/navigation'

/** Reprises par un gabarit dédié : leur version texte n'a plus lieu d'être. */
const OBSOLETES = ['avis-des-clients', 'fond-decran-et-wallpaper']

/**
 * Reprend les avis clients et les fonds d'écran.
 *
 * La migration précédente les avait avalés comme du texte et n'en avait tiré
 * que le chapeau : ni l'un ni l'autre n'en était. Les avis vivaient dans un
 * greffon WooCommerce — la Store API les rend tous, avec la note, la date et
 * l'achat vérifié ; les fonds d'écran étaient une galerie, ce sont les images
 * qui font la page.
 *
 * Elle rejoue aussi la bascule de navigation. La fois précédente, la lecture
 * des pages se faisait hors transaction : elle ne voyait pas celles que la
 * migration venait de créer, et le pied de page est resté sur l'ancien site.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const avis = await importerAvis(payload, { req })
  payload.logger.info(
    `Avis clients : ${avis.crees} repris sur ${avis.total} lus` +
      (avis.ignores ? `, ${avis.ignores} déjà présent(s)` : ''),
  )

  const fonds = await importerFondsDecran(payload, { req })
  payload.logger.info(
    `Fonds d’écran : ${fonds.smartphone} smartphone, ${fonds.ordinateur} ordinateur` +
      (fonds.echecs.length ? `, ${fonds.echecs.length} échec(s)` : ''),
  )

  // Les deux fiches texte feraient doublon : le slug est désormais servi par
  // une route, et une page fantôme resterait modifiable dans le back-office.
  const doublons = await payload.find({
    req,
    collection: 'pages',
    depth: 0,
    limit: 10,
    pagination: false,
    where: { slug: { in: OBSOLETES } },
  })
  for (const page of doublons.docs) {
    await payload.delete({
      req,
      collection: 'pages',
      id: page.id,
      context: { disableRevalidate: true },
    })
  }
  if (doublons.docs.length) {
    payload.logger.info(`Pages devenues caduques supprimées : ${doublons.docs.length}.`)
  }

  const nav = await basculerNavigation(payload, { revalider: false, req })
  payload.logger.info(`Navigation remise à jour : ${nav.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Les avis sont la parole des clientes et les fonds d'écran des visuels de
  // la médiathèque : ni les uns ni les autres ne se détruisent au retour en
  // arrière d'un déploiement.
  payload.logger.info('Avis et fonds d’écran : conservés.')
}
