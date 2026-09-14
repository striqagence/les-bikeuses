import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerArticles } from '../endpoints/import'
import { recupererImagesManquantes } from '../endpoints/import/images-manquantes'

/**
 * Rend aux articles les sections portant un nom de rayon.
 *
 * Pour écarter les libellés de carrousel, l'extraction confrontait chaque bloc
 * aux noms de rayons, de marques et de produits. Le filtre s'appliquait aussi
 * aux titres — or un titre de section est structurel : qu'il porte le nom d'un
 * rayon ne le rend pas suspect.
 *
 * « Casque jet », « Casque intégral » et « Casque modulable » sont à la fois
 * trois rayons de la boutique et les trois sections d'un article sur le choix
 * d'un casque : elles avaient disparu toutes les trois. De même pour
 * « Sécurité » dans le guide du road trip, ou « LS2 », « Shark » et « Bell »
 * dans la sélection de la fête des mères.
 *
 * « Le noir pour vos équipements » est repris au passage : son réimport avait
 * échoué à la passe précédente.
 */
const ARTICLES = [
  'casque-de-scooter-pour-femme-faire-le-bon-choix',
  'fete-des-meres-quels-cadeaux-pour-une-motarde',
  'preparer-son-road-trip-le-guide-complet',
  'le-noir-pour-vos-equipements-de-moto',
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const reprise = await importerArticles({
    payload,
    req,
    forcer: true,
    seulement: ARTICLES,
    taille: ARTICLES.length,
  })
  payload.logger.info(
    `Sections rendues : ${reprise.importes.length} article(s) repris` +
      (reprise.ignores.length
        ? `, ${reprise.ignores.length} en échec : ${reprise.ignores.map((i) => `${i.slug} (${i.raison})`).join(', ')}`
        : ''),
  )

  const images = await recupererImagesManquantes(payload, { req, slugs: ARTICLES })
  payload.logger.info(`Photos éditoriales replacées : ${images.ajoutees}.`)
  for (const a of images.articles) {
    payload.logger.info(
      `  ${a.slug} : ${a.ajoutees} ajoutée(s)` + (a.sansRepere ? `, ${a.sansRepere} sans repère` : ''),
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Sections : conservées.')
}
