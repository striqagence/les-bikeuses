import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { basculerNavigation } from '../endpoints/navigation'

/**
 * Ajoute « Apprendre la moto » au pied de page.
 *
 * La page vit dans la colonne Ressources plutôt que dans le menu du haut :
 * une huitième entrée l'aurait fait déborder, et la page est de toute façon
 * atteinte depuis « Débuter la moto », dont elle est la suite.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const nav = await basculerNavigation(payload, { revalider: false, req })
  payload.logger.info(`Navigation remise à jour : ${nav.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Navigation : conservée.')
}
