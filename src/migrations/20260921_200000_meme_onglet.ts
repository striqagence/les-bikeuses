import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { basculerNavigation } from '../endpoints/navigation'

/**
 * Réécrit la navigation sans « ouvrir dans un nouvel onglet ».
 *
 * Le rendu ignore désormais ce réglage partout (cf. `CMSLink`), si bien que le
 * comportement est déjà correct sans cette migration. Elle sert à ce que la
 * base dise la même chose que le code : un réglage laissé à `true` dans les
 * globales finirait par égarer celui qui les relit.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await basculerNavigation(payload, { revalider: false, req })
  payload.logger.info(`Navigation réécrite : ${r.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Navigation : conservée.')
}
