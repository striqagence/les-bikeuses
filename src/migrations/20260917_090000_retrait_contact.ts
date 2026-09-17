import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Retire le téléphone et l'adresse e-mail des surfaces d'affichage.
 *
 * Deux endroits les portaient : le bloc « Nous contacter » du pied de page et
 * le bandeau défilant de l'accueil.
 *
 * Seules les valeurs sont effacées, les champs restent : le jour où un service
 * d'e-mail sera branché, les remettre se fera depuis le back-office sans
 * déploiement.
 *
 * Les pages légales ne sont pas touchées. Mentions légales, CGV, politique de
 * retour et politique de confidentialité doivent offrir un moyen de joindre
 * l'éditeur — les en retirer mettrait le site en défaut.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const pied = await payload.findGlobal({ slug: 'footer', depth: 0, req })
  const contact = (pied?.contact ?? {}) as Record<string, unknown>

  await payload.updateGlobal({
    slug: 'footer',
    req,
    data: { contact: { ...contact, telephone: null, email: null } } as never,
    context: { disableRevalidate: true },
  })
  payload.logger.info('Pied de page : téléphone et e-mail retirés.')

  const accueil = await payload.find({
    req,
    collection: 'pages',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: 'home' } },
  })
  const page = accueil.docs[0]
  if (!page) return

  const hero = (page.hero ?? {}) as { marquee?: { text?: string | null }[] }
  const mentions = hero.marquee ?? []

  // Une mention qui porte un « @ » ou une suite de chiffres est une coordonnée.
  const gardees = mentions.filter(
    (m) => !/@/.test(m.text ?? '') && !/(?:\+?\d[\d .]{7,})/.test(m.text ?? ''),
  )

  if (gardees.length === mentions.length) return

  await payload.update({
    req,
    collection: 'pages',
    id: page.id,
    depth: 0,
    data: { hero: { ...hero, marquee: gardees } } as never,
    context: { disableRevalidate: true },
  })
  payload.logger.info(
    `Bandeau de l’accueil : ${mentions.length - gardees.length} mention(s) retirée(s).`,
  )
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Coordonnées : à ressaisir depuis le back-office si besoin.')
}
