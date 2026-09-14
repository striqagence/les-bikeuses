import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerArticles } from '../endpoints/import'
import { recupererImagesManquantes } from '../endpoints/import/images-manquantes'

/**
 * Rejoue les dix derniers articles amputés par l'ancienne extraction.
 *
 * La règle du carrousel écartait tout bloc tombant dans son empan, titres
 * compris. La réparation précédente n'avait traité que les six articles
 * repérés par le décompte d'images ; un contrôle des titres de section sur les
 * deux cent un articles en a révélé dix autres — dont « le rose », « le noir »
 * et « le rouge », frères de ceux déjà corrigés, qui n'apparaissaient pas dans
 * le premier relevé faute d'images éditoriales à leur manquer.
 *
 * Le pire du lot, « Quels équipements pendant la canicule », ne gardait qu'un
 * titre sur sept.
 */
const ARTICLES = [
  'quels-equipements-de-moto-choisir-pendant-la-canicule',
  'comment-passer-les-vitesses-facilement-sur-une-moto',
  'le-rose-pour-vos-equipements-de-moto',
  'le-noir-pour-vos-equipements-de-moto',
  'le-rouge-pour-vos-equipements-de-moto',
  'fete-des-meres-quels-cadeaux-pour-une-motarde',
  'casque-de-scooter-pour-femme-faire-le-bon-choix',
  'quelle-veste-de-moto-quand-il-fait-froid',
  'quel-blouson-moto-femme-choisir',
  'preparer-son-road-trip-le-guide-complet',
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
    `Articles amputés : ${reprise.importes.length} repris` +
      (reprise.ignores.length ? `, ${reprise.ignores.length} en échec` : ''),
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
  payload.logger.info('Articles amputés : conservés.')
}
