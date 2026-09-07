import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { basculerNavigation } from '../endpoints/navigation'

/**
 * Fait pointer « Débuter la moto » sur ce site.
 *
 * C'était la dernière entrée du menu à renvoyer vers lesbikeuses.fr, faute
 * d'équivalent ici. La page existe désormais, bâtie sur nos propres articles
 * plutôt que recopiée : un parcours en quatre étapes qui reprend l'ordre dans
 * lequel les questions se posent réellement.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const nav = await basculerNavigation(payload, { revalider: false, req })
  payload.logger.info(`Navigation remise à jour : ${nav.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Navigation : conservée.')
}
