import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Donne un titre à la page de contact.
 *
 * Elle s'ouvrait directement sur le chapeau puis le formulaire, sans dire où
 * l'on était : le seul repère était l'onglet du navigateur. Les autres pages
 * ressources portent un en-tête discret, celle-ci s'y aligne.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
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

  await payload.update({
    req,
    collection: 'pages',
    id: page.id,
    depth: 0,
    data: {
      hero: {
        type: 'lowImpact',
        richText: {
          root: {
            type: 'root',
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'heading',
                tag: 'h1',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: 'Nous contacter',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    version: 1,
                  },
                ],
              },
            ],
          },
        },
      },
    } as never,
    context: { disableRevalidate: true },
  })
  payload.logger.info('Page de contact : titre posé.')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  payload.logger.info('Titre de la page de contact : conservé.')
}
