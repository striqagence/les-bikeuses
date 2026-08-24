import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import type { Post } from '@/payload-types'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { articleVersPost, articlesImportes } from './lesbikeuses-posts'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]

const globals: GlobalSlug[] = ['header', 'footer']

// Catégories du blog, reprises du menu « Blog » de lesbikeuses.fr.
// Le slug est explicite : « Permis moto » dérivé automatiquement donnerait un
// slug avec une espace. Les slugs doivent rester alignés sur le champ
// `category` de lesbikeuses-posts.json.
const categories = [
  { title: 'Équipements', slug: 'equipements' },
  { title: 'Technique', slug: 'technique' },
  { title: 'Permis moto', slug: 'permis-moto' },
  { title: 'Style', slug: 'style' },
  { title: 'Divers', slug: 'divers' },
]

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'demo-author@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@example.com',
        password: 'password',
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),
  ])

  const categoryDocs = await Promise.all(
    categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: category,
      }),
    ),
  )

  payload.logger.info(`— Seeding posts (${articlesImportes.length} articles importés)...`)

  // Les images à la une viennent de l'ancien site. Si l'une n'est plus
  // joignable, on retombe sur une image déjà créée plutôt que d'interrompre
  // tout le seed pour un fichier manquant.
  const heroImages = await Promise.all(
    articlesImportes.map(async (article) => {
      try {
        const file = await fetchFileByURL(article.imageUrl)
        return await payload.create({
          collection: 'media',
          data: { alt: article.title },
          file,
        })
      } catch (err) {
        payload.logger.warn(`Image indisponible pour « ${article.slug} », repli : ${err}`)
        return image1Doc
      }
    }),
  )

  // Créés en série pour que `createdAt` respecte l'ordre du tableau.
  const postDocs: Post[] = []
  for (const [index, article] of articlesImportes.entries()) {
    postDocs.push(
      await payload.create({
        collection: 'posts',
        depth: 0,
        context: {
          disableRevalidate: true,
        },
        data: articleVersPost({
          article,
          heroImage: heroImages[index],
          author: demoAuthor,
          categories: categoryDocs,
        }),
      }),
    )
  }

  // Articles liés : les deux suivants dans la liste, en boucle.
  await Promise.all(
    postDocs.map((post, index) =>
      payload.update({
        id: post.id,
        collection: 'posts',
        context: { disableRevalidate: true },
        data: {
          relatedPosts: [
            postDocs[(index + 1) % postDocs.length].id,
            postDocs[(index + 2) % postDocs.length].id,
          ],
        },
      }),
    ),
  )

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      // Visuels du héros : de vraies photos de lesbikeuses.fr, déjà
      // téléchargées pour les articles, plutôt que les images du template.
      data: home({
        heroImage: heroImages[1] ?? imageHomeDoc,
        metaImage: heroImages[1] ?? image2Doc,
        gantsImage: heroImages[0] ?? image1Doc,
        casqueImage: heroImages[2] ?? image3Doc,
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Soldes',
              url: 'https://lesbikeuses.fr/soldes-2/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Équipements',
              url: 'https://lesbikeuses.fr/rubrique/blouson-moto/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Accessoires',
              url: 'https://lesbikeuses.fr/rubrique/accessoires/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Vêtements',
              url: 'https://lesbikeuses.fr/rubrique/vetements/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Bons plans',
              url: 'https://lesbikeuses.fr/rubrique/bons-plans/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Blog',
              url: '/posts',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Qui sommes-nous',
              url: 'https://lesbikeuses.fr/a-propos/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Politique de retour',
              url: 'https://lesbikeuses.fr/politique-de-retour/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Dictionnaire moto',
              url: 'https://lesbikeuses.fr/dictionnaire-moto/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'FAQ',
              url: 'https://lesbikeuses.fr/faq/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'CGVU',
              url: 'https://lesbikeuses.fr/cgv/',
              newTab: true,
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
