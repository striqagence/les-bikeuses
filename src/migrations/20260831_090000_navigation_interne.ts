import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { basculerNavigation } from '../endpoints/navigation'

/**
 * Bascule la navigation vers les rayons et le dictionnaire de ce site.
 *
 * Migration de données et non de schéma : la navigation vit dans les globales,
 * donc dans la base, et un déploiement ne livre que du code. Sans ce
 * mécanisme, chaque évolution du menu demandait un clic dans le back-office.
 *
 * Elle ne tourne qu'une fois — Payload marque les migrations appliquées — donc
 * elle n'écrasera pas les retouches faites ensuite à la main.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Hors requête HTTP : pas de revalidation, elle échouerait.
  const rapport = await basculerNavigation(payload, { revalider: false })

  payload.logger.info(
    `Navigation : ${rapport.posees.length} entrée(s) posée(s)` +
      (rapport.omises.length ? `, ${rapport.omises.length} omise(s) : ${rapport.omises.join(', ')}` : ''),
  )
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Rien à défaire : la navigation est du contenu, elle se réédite dans le
  // back-office. Restaurer d'anciens liens automatiquement écraserait les
  // modifications faites depuis.
  payload.logger.info('Navigation : rien à défaire, contenu éditable dans le back-office.')
}
