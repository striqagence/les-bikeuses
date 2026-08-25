import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import type { Media, Post } from '@/payload-types'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { articleVersPost, articlesImportes } from './lesbikeuses-posts'
import { navigationEntete, navigationPied } from './navigation'

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

  // Une seule image du template Payload est conservée : elle sert de repli
  // quand un visuel d'article n'est plus joignable sur l'ancien site. Tous les
  // autres visuels du site viennent désormais de lesbikeuses.fr.
  const demoAuthor = await payload.create({
    collection: 'users',
    data: {
      name: 'Demo Author',
      email: 'demo-author@example.com',
      password: 'password',
    },
  })

  const image1Doc = await payload.create({
    collection: 'media',
    data: image1,
    file: await fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post1.webp',
    ),
  })

  const categoryDocs = await Promise.all(
    categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: category,
      }),
    ),
  )

  // Visuels du slider, repris de lesbikeuses.fr. Choisis pour leur cadrage
  // paysage : les deux autres bannières du site portent du texte incrusté,
  // impossible d'y poser un carton par-dessus.
  const VISUELS_SLIDER = [
    ['banniere.jpg', 'Quatre motardes côte à côte sur leurs machines'],
    ['bikeuse-woman-smiling-2.webp', 'Motarde souriante au guidon, casque jet et lunettes de soleil'],
    ['moto-petit-gabarit.webp', 'Réservoir orange d’une Ducati Scrambler à la lumière du soir'],
  ] as const

  const CHEMINS_SLIDER: Record<string, string> = {
    'banniere.jpg': '2022/09/banniere.jpg',
    'bikeuse-woman-smiling-2.webp': '2022/05/bikeuse-woman-smiling-2.webp',
    'moto-petit-gabarit.webp': '2022/05/moto-petit-gabarit.webp',
  }

  const slidesMedia: Media[] = []
  for (const [fichier, alt] of VISUELS_SLIDER) {
    try {
      const file = await fetchFileByURL(
        `https://lesbikeuses.fr/wp-content/uploads/${CHEMINS_SLIDER[fichier]}`,
      )
      slidesMedia.push(
        await payload.create({ collection: 'media', data: { alt }, file }),
      )
    } catch (err) {
      payload.logger.warn(`Visuel de slider indisponible (${fichier}), repli : ${err}`)
      slidesMedia.push(image1Doc)
    }
  }

  payload.logger.info(`— Seeding posts (${articlesImportes.length} articles importés)...`)

  // Les images à la une viennent de l'ancien site. Si l'une n'est plus
  // joignable, on retombe sur une image déjà créée plutôt que d'interrompre
  // tout le seed pour un fichier manquant.
  //
  // En série, et non en Promise.all : huit envois simultanés vers Supabase
  // Storage réclamaient autant de connexions d'un coup, ce qui saturait le
  // pool (15 connexions pour tout le projet).
  const heroImages: Media[] = []
  for (const article of articlesImportes) {
    try {
      const file = await fetchFileByURL(article.imageUrl)
      heroImages.push(
        await payload.create({
          collection: 'media',
          data: { alt: article.title },
          file,
        }),
      )
    } catch (err) {
      payload.logger.warn(`Image indisponible pour « ${article.slug} », repli : ${err}`)
      heroImages.push(image1Doc)
    }
  }

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
  // En série, pour la même raison que les images.
  for (const [index, post] of postDocs.entries()) {
    await payload.update({
      id: post.id,
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        relatedPosts: [
          postDocs[(index + 1) % postDocs.length].id,
          postDocs[(index + 2) % postDocs.length].id,
        ],
      },
    })
  }

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
        heroImage: heroImages[1],
        metaImage: heroImages[1],
        gantsImage: heroImages[0],
        casqueImage: heroImages[2],
        slideGroupe: slidesMedia[0],
        slidePortrait: slidesMedia[1],
        slideMoto: slidesMedia[2],
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await payload.updateGlobal({
    slug: 'header',
    data: {
      annonce: {
        actif: true,
        // Pas d'annonce commerciale tant que la boutique n'ouvre pas : afficher
        // des soldes qui n'existent pas et renvoyer vers l'accueil tromperait
        // le visiteur.
        texte: 'Le nouveau site Les Bikeuses arrive — **la boutique ouvre bientôt**. Le journal est déjà en ligne.',
        url: '/posts',
      },
      baseline: 'LE site pour les femmes à moto',
      navItems: navigationEntete,
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    data: { navItems: navigationPied },
  })

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
