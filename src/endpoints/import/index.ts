import type { Payload, PayloadRequest } from 'payload'
import type { Category, Media } from '@/payload-types'

import {
  chargerCatalogue,
  extraireArticle,
  listerSlugs,
  type ArticleExtrait,
  type NoeudImage,
} from './extraction'

export type Rapport = {
  total: number
  dejaPresents: number
  importes: string[]
  ignores: { slug: string; raison: string }[]
  restants: number
}

const ardoise = (t: string): string =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

/**
 * Import des articles de lesbikeuses.fr, par lots.
 *
 * Par lots et non d'un bloc : deux cents articles et leurs images dépassent
 * de loin la durée maximale d'une fonction. Chaque appel reprend là où le
 * précédent s'est arrêté — l'opération est idempotente, un article déjà en
 * base est simplement sauté.
 */
export const importerArticles = async ({
  payload,
  req,
  taille = 8,
}: {
  payload: Payload
  req: PayloadRequest
  taille?: number
}): Promise<Rapport> => {
  const slugs = await listerSlugs()

  const existants = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true },
  })
  const dejaLa = new Set(existants.docs.map((d) => d.slug).filter(Boolean) as string[])

  const aFaire = slugs.filter((s) => !dejaLa.has(s))
  const lot = aFaire.slice(0, taille)

  const rapport: Rapport = {
    total: slugs.length,
    dejaPresents: dejaLa.size,
    importes: [],
    ignores: [],
    restants: Math.max(0, aFaire.length - lot.length),
  }

  if (!lot.length) return rapport

  const catalogue = await chargerCatalogue()
  const auteur = await trouverAuteur(payload)
  const cacheCategories = new Map<string, number>()
  // Les mêmes visuels reviennent d'un article à l'autre : on ne les envoie
  // qu'une fois par exécution.
  const cacheMedias = new Map<string, Media | null>()

  for (const slug of lot) {
    try {
      const article = await extraireArticle(slug, catalogue)
      if (!article || !article.titre) {
        rapport.ignores.push({ slug, raison: 'contenu illisible' })
        continue
      }
      if (!article.blocs.length) {
        rapport.ignores.push({ slug, raison: 'corps vide' })
        continue
      }

      const imageUne = article.imageUne
        ? await recupererMedia(payload, cacheMedias, article.imageUne, article.titre)
        : null

      const contenu = await construireContenu(payload, cacheMedias, article)
      const categories = await resoudreCategories(payload, cacheCategories, article.categories)

      await payload.create({
        collection: 'posts',
        depth: 0,
        req,
        context: { disableRevalidate: true },
        data: {
          slug,
          _status: 'published',
          title: article.titre,
          authors: auteur ? [auteur] : [],
          categories,
          publishedAt: article.publieLe ?? new Date().toISOString(),
          ...(imageUne ? { heroImage: imageUne.id } : {}),
          content: contenu,
          meta: {
            title: article.titre,
            description: article.extrait,
            ...(imageUne ? { image: imageUne.id } : {}),
          },
        },
      })

      rapport.importes.push(slug)
    } catch (err) {
      // Un article qui échoue ne doit pas interrompre le lot : on le note et
      // on continue, il sera retenté au prochain appel.
      payload.logger.error({ err }, `Import impossible pour « ${slug} »`)
      rapport.ignores.push({ slug, raison: err instanceof Error ? err.message : 'erreur inconnue' })
    }
  }

  return rapport
}

/* ---------- contenu ---------- */

const construireContenu = async (
  payload: Payload,
  cache: Map<string, Media | null>,
  article: ArticleExtrait,
) => {
  const enfants: Record<string, unknown>[] = []

  for (const bloc of article.blocs) {
    if ((bloc as NoeudImage).type === '__image') {
      const { url, alt } = bloc as NoeudImage
      const media = await recupererMedia(payload, cache, url, alt || article.titre)
      // Une image qu'on n'a pas pu récupérer est omise, pas remplacée : mieux
      // vaut un article sans illustration qu'un cadre vide.
      if (media) {
        enfants.push({
          type: 'upload',
          relationTo: 'media',
          value: media.id,
          fields: null,
          format: '',
          version: 3,
        })
      }
      continue
    }
    enfants.push(bloc as Record<string, unknown>)
  }

  return {
    root: { type: 'root', children: enfants, direction: 'ltr', format: '', indent: 0, version: 1 },
  } as never
}

/* ---------- médias ---------- */

const recupererMedia = async (
  payload: Payload,
  cache: Map<string, Media | null>,
  url: string,
  alt: string,
): Promise<Media | null> => {
  if (cache.has(url)) return cache.get(url) ?? null

  try {
    const nom = decodeURIComponent(url.split('/').pop() ?? '').split('?')[0] || `image-${cache.size}`

    // Déjà envoyé lors d'une exécution précédente ? On réutilise.
    const connu = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { filename: { equals: nom } },
    })
    if (connu.docs[0]) {
      cache.set(url, connu.docs[0])
      return connu.docs[0]
    }

    const r = await fetch(url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = Buffer.from(await r.arrayBuffer())

    const media = await payload.create({
      collection: 'media',
      data: { alt: alt.slice(0, 200) },
      file: {
        name: nom,
        data,
        mimetype: `image/${(nom.split('.').pop() ?? 'jpeg').toLowerCase()}`,
        size: data.byteLength,
      },
    })

    cache.set(url, media)
    return media
  } catch (err) {
    payload.logger.warn(`Visuel indisponible (${url}) : ${err}`)
    cache.set(url, null)
    return null
  }
}

/* ---------- catégories et auteur ---------- */

const resoudreCategories = async (
  payload: Payload,
  cache: Map<string, number>,
  noms: string[],
): Promise<number[]> => {
  const ids: number[] = []

  for (const nom of noms) {
    const slug = ardoise(nom)
    if (!slug) continue

    if (cache.has(slug)) {
      ids.push(cache.get(slug)!)
      continue
    }

    const existante = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { slug: { equals: slug } },
    })

    const doc: Category =
      existante.docs[0] ??
      (await payload.create({ collection: 'categories', data: { title: nom, slug } }))

    cache.set(slug, doc.id)
    ids.push(doc.id)
  }

  return ids
}

const trouverAuteur = async (payload: Payload): Promise<number | null> => {
  const users = await payload.find({ collection: 'users', depth: 0, limit: 1, pagination: false })
  return users.docs[0]?.id ?? null
}
