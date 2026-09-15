import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importerVariantes } from '../endpoints/import/variantes'

/**
 * Poursuit la reprise des déclinaisons, à chaque déploiement.
 *
 * Près de trois mille appels sont nécessaires sur un site toujours en
 * production : la cadence est bridée, et l'opération ne tient pas dans un seul
 * build. Une migration ne s'exécutant qu'une fois, la suite passe par une
 * étape de build qui reprend là où elle s'est arrêtée.
 *
 * Une fois le catalogue complet, l'étape coûte une requête et rend la main.
 */
const BUDGET = 10 * 60 * 1000

const completer = async (): Promise<void> => {
  const payload = await getPayload({ config: configPromise })
  const depart = Date.now()

  let fiches = 0
  let declinaisons = 0
  let restants = 0

  for (;;) {
    const r = await importerVariantes({ payload, taille: 10 })
    fiches += r.importes.length
    declinaisons += r.declinaisons
    restants = r.restants

    if (!r.importes.length || !r.restants) break
    if (Date.now() - depart > BUDGET) break
  }

  if (fiches) {
    payload.logger.info(
      `Déclinaisons : ${declinaisons} reprises sur ${fiches} fiche(s)` +
        (restants ? `, ${restants} restante(s) au prochain déploiement.` : ', catalogue complet.'),
    )
  } else {
    payload.logger.info('Déclinaisons : catalogue déjà complet.')
  }
}

await completer()
// Payload garde des connexions ouvertes : sans sortie explicite, le build
// resterait suspendu une fois le travail fini.
process.exit(0)
