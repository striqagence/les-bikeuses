import type { Payload, PayloadRequest } from 'payload'
import type { Category, Media } from '@/payload-types'

import {
  chargerCatalogue,
  extraireArticle,
  listerSlugs,
  type ArticleExtrait,
  type NoeudImage,
  type NoeudProduits,
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
  forcer = false,
  avant,
}: {
  payload: Payload
  req: PayloadRequest
  taille?: number
  /**
   * Reprend aussi les articles déjà en base, en les mettant à jour.
   *
   * Nécessaire pour les huit articles posés par le seed : ils viennent d'un
   * export figé, antérieur à la reprise des images et des liens, et le mode
   * normal les saute puisqu'ils existent.
   */
  forcer?: boolean
  /**
   * En mode forcer, borne de reprise : seuls les articles modifiés avant cet
   * instant sont retraités.
   *
   * Sans elle, `aFaire` contenait les 202 slugs et le lot prenait toujours les
   * huit premiers — rien ne marquait ce qui venait d'être fait, et la boucle
   * tournait indéfiniment sur les mêmes articles sans jamais atteindre les
   * suivants. Chaque article traité voit son `updatedAt` avancer et sort donc
   * de l'ensemble à traiter.
   */
  avant?: string
}): Promise<Rapport> => {
  const slugs = await listerSlugs()

  const existants = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, updatedAt: true },
  })
  const dejaLa = new Map(
    existants.docs.filter((d) => d.slug).map((d) => [d.slug as string, d.id]),
  )
  const misAJour = new Map(
    existants.docs.filter((d) => d.slug).map((d) => [d.slug as string, d.updatedAt]),
  )

  const borne = avant ? Date.parse(avant) : Number.POSITIVE_INFINITY

  const aFaire = forcer
    ? slugs.filter((s) => {
        const quand = misAJour.get(s)
        // Jamais importé, ou pas encore retraité depuis le début de la reprise.
        return !quand || Date.parse(quand) < borne
      })
    : slugs.filter((s) => !dejaLa.has(s))
  const lot = aFaire.slice(0, taille)

  const rapport: Rapport = {
    total: slugs.length,
    dejaPresents: dejaLa.size,
    importes: [],
    ignores: [],
    restants: Math.max(0, aFaire.length - lot.length),
  }

  if (!lot.length) return rapport

  // Le jeu de filtrage réunit les rayons et marques WooCommerce et les titres
  // des produits en base. Les noms de rayons ne suffisaient pas : les cartes
  // des carrousels laissent derrière elles le titre complet du produit, en
  // paragraphe isolé — « Blouson moto femme Targa Helstons » sur une ligne.
  const catalogue = new Set([...(await chargerCatalogue()), ...(await titresProduits(payload))])
  const auteur = await trouverAuteur(payload)
  const cacheCategories = new Map<string, number>()
  // Les mêmes visuels reviennent d'un article à l'autre : on ne les envoie
  // qu'une fois par exécution.
  const cacheMedias = new Map<string, Media | null>()
  const cacheProduits = new Map<number, number | null>()

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

      const contenu = await construireContenu(payload, cacheMedias, cacheProduits, article)
      const categories = await resoudreCategories(payload, cacheCategories, article.categories)

      const donnees = {
        slug,
        _status: 'published' as const,
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
      }

      const existant = dejaLa.get(slug)

      if (existant) {
        // Mise à jour plutôt que suppression/recréation : l'identifiant est
        // conservé, donc les articles liés qui pointent dessus ne se cassent
        // pas. `essentiel` n'est pas touché — c'est de l'éditorial saisi ici,
        // absent de la source.
        await payload.update({
          collection: 'posts',
          id: existant,
          depth: 0,
          req,
          context: { disableRevalidate: true },
          data: donnees,
        })
      } else {
        await payload.create({
          collection: 'posts',
          depth: 0,
          req,
          context: { disableRevalidate: true },
          data: donnees,
        })
      }

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
  cacheProduits: Map<number, number | null>,
  article: ArticleExtrait,
) => {
  const enfants: Record<string, unknown>[] = []

  for (const bloc of article.blocs) {
    if ((bloc as NoeudProduits).type === '__produits') {
      const ids = await resoudreProduits(payload, cacheProduits, (bloc as NoeudProduits).produits)
      // Un carrousel dont aucun produit n'est en base est omis : mieux vaut
      // rien qu'un bandeau vide. Il réapparaîtra à la réimportation, une fois
      // le catalogue en place.
      if (ids.length) {
        enfants.push({
          type: 'block',
          fields: { blockType: 'carrouselProduits', produits: ids },
          format: '',
          version: 2,
        })
      }
      continue
    }

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

/* ---------- produits des carrousels ---------- */

/**
 * Retrouve en base les produits cités par un carrousel.
 *
 * Recherche par identifiant WooCommerce d'abord, par slug ensuite : le slug
 * peut avoir été modifié à l'import, l'identifiant non.
 */
const resoudreProduits = async (
  payload: Payload,
  cache: Map<number, number | null>,
  cites: { wooId: number; slug: string }[],
): Promise<number[]> => {
  const ids: number[] = []

  for (const { wooId, slug } of cites) {
    if (cache.has(wooId)) {
      const connu = cache.get(wooId)
      if (connu) ids.push(connu)
      continue
    }

    const trouve = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { or: [{ wooId: { equals: wooId } }, { slug: { equals: slug } }] },
    })

    const id = trouve.docs[0]?.id ?? null
    cache.set(wooId, id)
    if (id) ids.push(id)
  }

  return ids
}

/** Titres des produits en base, normalisés, pour écarter les restes de cartes. */
const titresProduits = async (payload: Payload): Promise<string[]> => {
  const produits = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 2000,
    pagination: false,
    select: { title: true },
  })

  return produits.docs
    .map((p) => p.title?.toLowerCase().replace(/\s+/g, ' ').trim())
    .filter((t): t is string => Boolean(t))
}
