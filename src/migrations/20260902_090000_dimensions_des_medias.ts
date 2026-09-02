import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { reparerDimensions } from '../endpoints/import/dimensions'

/**
 * Rend leurs dimensions aux visuels de la médiathèque.
 *
 * Les deux tiers des médias étaient enregistrés en `image/jpg` — un type MIME
 * qui n'existe pas. Sharp n'avait donc extrait ni largeur ni hauteur, et
 * `next/image`, privé de dimensions, réclamait chaque visuel en 3840 px :
 * une page rayon pesait 3,3 Mo au lieu de 346 Ko.
 *
 * La réparation ne fait que relire les métadonnées ; aucun fichier n'est
 * réécrit ni remplacé.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const r = await reparerDimensions(payload)

  payload.logger.info(
    `Dimensions des médias : ${r.reparees} réparé(s)` +
      (r.echecs.length ? `, ${r.echecs.length} échec(s)` : '') +
      (r.restantes ? `, ${r.restantes} restant(s)` : ''),
  )

  // Les échecs sont détaillés mais n'interrompent rien : un visuel sans
  // dimensions s'affiche toujours, seulement plus lourdement qu'il ne faut.
  for (const e of r.echecs.slice(0, 20)) {
    payload.logger.warn(`  ${e.filename} : ${e.raison}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Dimensions des médias : conservées.')
}
