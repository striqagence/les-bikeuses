import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { internaliserLiens } from '../endpoints/import/liens'

/**
 * Reprend les liens que la passe précédente ne savait pas résoudre.
 *
 * Elle avait ramené 160 liens sur 182. Les 22 restants tenaient à deux
 * lacunes de la table de correspondance : `marques` ne figurait pas parmi les
 * routes dédiées, et les sous-pages du dictionnaire — rendues ici par un
 * filtre plutôt que par une page à part — n'avaient pas d'équivalent déclaré.
 *
 * Ce qui reste après cette passe n'a pas de destination sur ce site : trois
 * pages « gamme », un quiz et un PDF. Ils vivent encore sur lesbikeuses.fr et
 * fonctionnent tant qu'il tourne.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const r = await internaliserLiens(payload, { req })

  payload.logger.info(`Maillage : ${r.liensReecrits} lien(s) supplémentaire(s) ramené(s).`)
  for (const { cible, nb } of r.restants) {
    payload.logger.info(`  sans équivalent ici : ${cible} (${nb})`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Maillage : conservé.')
}
