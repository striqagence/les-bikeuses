import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Le bandeau défilant de l'accueil annonce le contenu du site.
 *
 * Il affichait jusqu'ici les horaires du service client et les moyens de
 * paiement acceptés — de la logistique, utile en bas de page mais sans objet
 * sous le héros, à l'endroit précis où une visiteuse décide si le site a
 * quelque chose pour elle.
 *
 * Les cinq mentions reposent sur des volumes relevés en base le 06/10/2026 :
 * 477 produits, 201 articles, 80 motos au dictionnaire. Pas de promesse, pas
 * de superlatif — ce qui s'y trouve, et rien d'autre. Un chiffre faux dans un
 * bandeau se repère tout de suite et coûte la confiance du reste.
 */
const MENTIONS = [
  '477 références d’équipement moto femme',
  '80 motos passées en revue au dictionnaire',
  '201 articles : essais, conseils et routes à faire',
  'Niveau CE, matière et plage de tailles sur chaque fiche',
  'Du permis à la première machine, étape par étape',
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const r = await payload.find({
    ...contexte,
    collection: 'pages',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: 'home' } },
  })

  const accueil = r.docs[0]
  if (!accueil) {
    payload.logger.warn('Bandeau : page d’accueil introuvable, rien à faire.')
    return
  }

  const hero = (accueil.hero ?? {}) as Record<string, unknown>

  await payload.update({
    ...contexte,
    collection: 'pages',
    id: accueil.id,
    depth: 0,
    data: { hero: { ...hero, marquee: MENTIONS.map((text) => ({ text })) } } as never,
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Bandeau de l’accueil : ${MENTIONS.length} mentions posées.`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Bandeau : non rétabli.')
}
