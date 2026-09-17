import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Remet le formulaire de contact en état.
 *
 * Il venait du gabarit de départ : libellés en anglais, et un téléphone en
 * champ numérique — ce qui mange le zéro initial et refuse un « +33 ».
 *
 * Un motif de demande est ajouté : il coûte un clic à la visiteuse et fait
 * gagner un aller-retour au service client, qui sait d'emblée s'il s'agit d'un
 * conseil de taille ou d'un retour.
 *
 * La notification est configurée dès maintenant bien qu'aucun service d'envoi
 * ne soit branché : Payload se contente alors de la journaliser, sans échec.
 * Le jour où une clé sera posée, les messages partiront sans rien retoucher.
 * D'ici là ils restent consultables dans le back-office, à « Soumissions ».
 */

const texte = (t: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [{ type: 'text', text: t, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
})

const richText = (paragraphes: string[]) => ({
  root: {
    type: 'root',
    children: paragraphes.map(texte),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const formulaires = await payload.find({
    req,
    collection: 'forms',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { title: { equals: 'Contact Form' } },
  })
  const formulaire = formulaires.docs[0]
  if (!formulaire) {
    payload.logger.warn('Formulaire de contact introuvable : rien à faire.')
    return
  }

  await payload.update({
    req,
    collection: 'forms',
    id: formulaire.id,
    data: {
      title: 'Contact',
      submitButtonLabel: 'Envoyer le message',
      confirmationType: 'message',
      confirmationMessage: richText([
        'Merci, votre message est parti.',
        'Nous répondons sous un jour ouvré, du lundi au vendredi.',
      ]),
      fields: [
        { blockType: 'text', name: 'full-name', label: 'Votre nom', required: true, width: 50 },
        { blockType: 'email', name: 'email', label: 'Votre e-mail', required: true, width: 50 },
        {
          // Texte et non nombre : un numéro n'est pas une quantité. En
          // numérique, « 06… » perd son zéro et « +33 » est refusé.
          blockType: 'text',
          name: 'phone',
          label: 'Téléphone (facultatif)',
          required: false,
          width: 50,
        },
        {
          blockType: 'select',
          name: 'sujet',
          label: 'Votre demande',
          required: true,
          width: 50,
          options: [
            { label: 'Un conseil sur un produit', value: 'conseil' },
            { label: 'Ma commande', value: 'commande' },
            { label: 'Un retour ou un échange', value: 'retour' },
            { label: 'Autre', value: 'autre' },
          ],
        },
        { blockType: 'textarea', name: 'message', label: 'Votre message', required: true, width: 100 },
      ],
      emails: [
        {
          emailTo: 'contact@lesbikeuses.fr',
          emailFrom: 'contact@lesbikeuses.fr',
          subject: 'Site Les Bikeuses — {{sujet}} — {{full-name}}',
          message: richText([
            'Nouveau message depuis le formulaire de contact.',
            'Nom : {{full-name}}',
            'E-mail : {{email}}',
            'Téléphone : {{phone}}',
            'Demande : {{sujet}}',
            'Message : {{message}}',
          ]),
        },
      ],
    } as never,
    context: { disableRevalidate: true },
  })
  payload.logger.info('Formulaire de contact : champs, confirmation et notification à jour.')

  // Chapeau de la page de contact : le bloc attend un texte d'introduction.
  const pages = await payload.find({
    req,
    collection: 'pages',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: 'contact' } },
  })
  const page = pages.docs[0]
  if (!page) return

  const layout = [...((page.layout ?? []) as unknown as Record<string, unknown>[])]
  const i = layout.findIndex((b) => b.blockType === 'formBlock')
  if (i < 0) return

  layout[i] = {
    ...layout[i],
    enableIntro: true,
    introContent: richText([
      'Une question sur une taille, une commande ou un retour ? Écrivez-nous.',
      'Nous répondons sous un jour ouvré, du lundi au vendredi.',
    ]),
  }

  await payload.update({
    req,
    collection: 'pages',
    id: page.id,
    depth: 0,
    data: { title: 'Nous contacter', layout } as never,
    context: { disableRevalidate: true },
  })
  payload.logger.info('Page de contact : chapeau posé.')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Formulaire de contact : conservé.')
}
