import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerPages } from '../endpoints/import/pages'
import { basculerNavigation } from '../endpoints/navigation'

/**
 * Reprend le programme d'entraînement, et pose l'index des marques.
 *
 * Le programme « pousser sa moto » tenait sur deux pages de l'ancien site :
 * l'annonce et les cinquante et un exercices. Pousser sa machine est une
 * épreuve du permis, et c'est l'un des obstacles que citent le plus les
 * débutantes — le contenu vaut d'être repris.
 *
 * L'index des marques, lui, n'est pas importé : il est bâti depuis le champ
 * « marque » des produits, si bien qu'une marque qui entre au catalogue y
 * apparaît sans que personne ait à y penser.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const pages = await importerPages({ payload, req })

  payload.logger.info(
    `Pages : ${pages.importees.length} reprise(s)` +
      (pages.ignorees.length
        ? `, ${pages.ignorees.length} ignorée(s) : ${pages.ignorees.map((i) => `${i.slug} (${i.raison})`).join(', ')}`
        : ''),
  )

  const nav = await basculerNavigation(payload, { revalider: false, req })
  payload.logger.info(`Navigation remise à jour : ${nav.posees.length} entrée(s).`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Pages et navigation : conservées.')
}
