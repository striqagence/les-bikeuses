import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Configure la notification du formulaire de contact.
 *
 * Le formulaire n'en portait aucune : `emails` était un tableau vide. Les
 * soumissions étaient donc enregistrées en base — visibles dans l'admin — mais
 * personne n'était prévenu. Avec l'adaptateur Resend désormais en place, il ne
 * manquait plus que ce destinataire.
 *
 * L'expéditeur reste sur lesbikeuses.fr : c'est le domaine vérifié chez
 * Resend, et un expéditeur non vérifié ne provoque pas d'erreur visible — le
 * message part et finit en indésirable. Le destinataire, lui, peut être
 * n'importe quelle adresse.
 *
 * `{{*}}` restitue tous les champs soumis sans les énumérer : ajouter un
 * champ au formulaire ne demandera pas de revenir modifier le message.
 */
const DESTINATAIRE = 'audrey@abcm.io'
const EXPEDITEUR = 'contact@lesbikeuses.fr'

const texte = (t: string, format = 0) => ({
  type: 'text', detail: 0, format, mode: 'normal', style: '', text: t, version: 1,
})

const paragraphe = (enfants: unknown[]) => ({
  type: 'paragraph', children: enfants, direction: 'ltr', format: '', indent: 0,
  textFormat: 0, version: 1,
})

const CORPS = {
  root: {
    type: 'root',
    children: [
      paragraphe([texte('Nouveau message reçu depuis le formulaire de contact.')]),
      paragraphe([texte('{{*}}')]),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const contexte = { req }

  const r = await payload.find({
    ...contexte,
    collection: 'forms',
    depth: 0,
    limit: 10,
    pagination: false,
    where: { title: { equals: 'Contact' } },
  })

  const formulaire = r.docs[0]
  if (!formulaire) {
    payload.logger.warn('Formulaire « Contact » introuvable, rien à faire.')
    return
  }

  await payload.update({
    ...contexte,
    collection: 'forms',
    id: formulaire.id,
    depth: 0,
    data: {
      emails: [
        {
          emailTo: DESTINATAIRE,
          emailFrom: EXPEDITEUR,
          subject: 'Nouveau message depuis lesbikeuses.fr',
          message: CORPS,
        },
      ],
    } as never,
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Formulaire de contact : notification vers ${DESTINATAIRE}.`)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Notification de contact : conservée.')
}
