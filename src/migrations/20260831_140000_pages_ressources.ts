import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerPages } from '../endpoints/import/pages'
import { basculerNavigation } from '../endpoints/navigation'

/**
 * Reprend les pages ressources de lesbikeuses.fr, puis remet la navigation à
 * jour pour qu'elle pointe dessus.
 *
 * Contrairement aux articles, ces pages utilisent le constructeur Flatsome :
 * le contenu vit entre `<main>` et `</main>`, il n'y a pas d'`entry-content`.
 *
 * Une page qui échoue est notée et n'interrompt pas la migration : mieux vaut
 * sept pages sur huit qu'un déploiement bloqué.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const pages = await importerPages({ payload, req })

  payload.logger.info(
    `Pages ressources : ${pages.importees.length} reprise(s)` +
      (pages.ignorees.length
        ? `, ${pages.ignorees.length} ignorée(s) : ${pages.ignorees.map((i) => `${i.slug} (${i.raison})`).join(', ')}`
        : ''),
  )

  // Hors requête HTTP : pas de revalidation, elle échouerait.
  const nav = await basculerNavigation(payload, { revalider: false })
  payload.logger.info(`Navigation remise à jour : ${nav.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Les pages reprises restent : les supprimer effacerait les retouches
  // éditoriales faites depuis. Elles se suppriment dans le back-office.
  payload.logger.info('Pages ressources : conservées, à supprimer manuellement si besoin.')
}
