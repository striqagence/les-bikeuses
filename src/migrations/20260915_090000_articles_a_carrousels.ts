import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import { importerArticles } from '../endpoints/import'
import { recupererImagesManquantes } from '../endpoints/import/images-manquantes'

/**
 * Répare les six articles bâtis autour de carrousels produits.
 *
 * L'extraction écartait tout bloc dont la position tombait dans l'empan d'un
 * carrousel — titres et prose compris. Or ces articles alternent sections et
 * carrousels : « Le gris pour vos équipements » avait perdu trois de ses six
 * sections et les trois quarts de son texte.
 *
 * La règle est devenue sélective : un titre passe toujours, un paragraphe de
 * plus de quatre-vingts caractères aussi. On rejoue donc l'extraction sur ces
 * six-là seulement, puis on replace les photos éditoriales que le carrousel
 * masquait encore.
 */
const ARTICLES = [
  'le-marron-pour-vos-equipements-de-moto',
  'le-gris-pour-vos-equipements-de-moto',
  'le-bleu-pour-vos-equipements-de-moto',
  'le-kaki-pour-vos-equipements-de-moto',
  'trouvez-le-style-qui-va-avec-le-scooter',
  'une-bikeuse-nous-parle-de-la-securite-a-moto',
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
    `Articles à carrousels : ${reprise.importes.length} repris` +
      (reprise.ignores.length ? `, ${reprise.ignores.length} en échec` : ''),
  )

  const images = await recupererImagesManquantes(payload, { req })
  payload.logger.info(`Photos éditoriales replacées : ${images.ajoutees}.`)
  for (const a of images.articles) {
    payload.logger.info(
      `  ${a.slug} : ${a.ajoutees} ajoutée(s)` + (a.sansRepere ? `, ${a.sansRepere} sans repère` : ''),
    )
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Articles à carrousels : conservés.')
}
