import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerVariantes } from '../endpoints/import/variantes'

/**
 * Reprend les déclinaisons vendables : taille, coloris, référence, prix.
 *
 * Première pierre de la boutique. Jusqu'ici une fiche portait une liste de
 * tailles — des étiquettes utiles aux filtres, incapables de dire si le M
 * était encore là. Vendre demande de connaître chaque combinaison.
 *
 * Il faut une requête par variation pour en obtenir le prix et la
 * disponibilité, soit près de trois mille appels sur un site toujours en
 * production. La migration s'arrête donc au bout de douze minutes et reprend
 * au déploiement suivant : mieux vaut trois builds qu'un site ralenti.
 */
const BUDGET = 12 * 60 * 1000

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const depart = Date.now()
  let fiches = 0
  let declinaisons = 0
  let restants = 0
  const echecs: string[] = []

  for (;;) {
    const r = await importerVariantes({ payload, req, taille: 10 })
    fiches += r.importes.length
    declinaisons += r.declinaisons
    restants = r.restants
    echecs.push(...r.ignores.map((i) => `${i.slug} (${i.raison})`))

    if (!r.importes.length || !r.restants) break
    if (Date.now() - depart > BUDGET) break
  }

  payload.logger.info(
    `Déclinaisons : ${declinaisons} reprises sur ${fiches} fiche(s)` +
      (restants ? `, ${restants} fiche(s) restante(s)` : ', catalogue complet') +
      (echecs.length ? ` · ${echecs.length} échec(s)` : ''),
  )
  for (const e of echecs.slice(0, 10)) payload.logger.warn(`  ${e}`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Déclinaisons : conservées.')
}
