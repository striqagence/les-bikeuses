import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { basculerNavigation } from '../endpoints/navigation'

/**
 * Fait pointer les sous-entrées du journal vers le filtre par thème.
 *
 * Elles portaient toutes `/posts` : cinq intitulés différents — Équipements,
 * Technique, Permis moto, Style, Divers — menant à la même liste entière.
 * Le menu promettait un tri qu'il ne tenait pas. Le filtre par thème existant
 * désormais, elles mènent à ce qu'elles annoncent.
 *
 * La bascule reconstruit les deux globales de navigation, en-tête et pied :
 * c'est le seul endroit qui sait ce qui est une entrée et ce qui n'en est pas.
 * Chaque thème est vérifié en base et omis s'il est absent ou vide.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // `revalider: false` : les hooks appellent `revalidateTag`, qui n'existe que
  // dans un rendu Next. Depuis une migration l'appel échoue et fait tomber le
  // déploiement — et de toute façon un build produit des caches neufs.
  const r = await basculerNavigation(payload, { revalider: false, req })

  payload.logger.info(`Navigation : ${r.posees.length} entrée(s) posée(s).`)
  for (const omise of r.omises) payload.logger.info(`  omise : ${omise}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Navigation : conservée.')
}
