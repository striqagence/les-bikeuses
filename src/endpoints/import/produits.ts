import type { Payload, PayloadRequest } from 'payload'

import type { Category, Media, Product } from '@/payload-types'

import { recupererMedia } from './medias'

import { decoder } from './extraction'

export type RapportProduits = {
  total: number
  dejaPresents: number
  importes: string[]
  ignores: { slug: string; raison: string }[]
  restants: number
}

type ProduitWoo = {
  id: number
  name: string
  slug: string
  permalink: string
  sku?: string
  short_description?: string
  prices?: { price?: string; currency_minor_unit?: number }
  images?: { src: string; alt?: string }[]
  categories?: { name: string }[]
  brands?: { name: string }[]
  attributes?: { name: string; terms?: { name: string }[] }[]
}

const ardoise = (t: string): string =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const PAR_PAGE = 100

/**
 * Import du catalogue WooCommerce.
 *
 * L'API Store de lesbikeuses.fr est ouverte, contrairement à `wp/v2` : les
 * produits viennent donc de données structurées, pas d'un raclage de HTML.
 *
 * Par lots, comme les articles : cinq cents produits et leurs visuels
 * dépassent la durée maximale d'une fonction.
 */
export const importerProduits = async ({
  payload,
  req,
  taille = 20,
}: {
  payload: Payload
  req: PayloadRequest
  taille?: number
}): Promise<RapportProduits> => {
  const tous = await listerProduits()

  const existants = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 2000,
    pagination: false,
    select: { slug: true, gallery: true, marque: true },
  })
  const dejaLa = new Map(existants.docs.filter((d) => d.slug).map((d) => [d.slug as string, d.id]))

  // Un produit déjà en base est repris s'il lui manque quelque chose que la
  // source possède. Reprendre sur ces critères évite de rejouer les 477
  // produits pour n'en corriger que quelques-uns.
  const sansVisuel = new Set(
    existants.docs.filter((d) => !d.gallery?.length).map((d) => d.slug as string),
  )
  const sansMarque = new Set(
    existants.docs.filter((d) => !d.marque).map((d) => d.slug as string),
  )

  const aFaire = tous.filter((p) => {
    if (!dejaLa.has(p.slug)) return true
    // Visuel manquant : l'envoi avait échoué, le plus souvent sur un nom de
    // fichier accentué, refusé par Supabase Storage.
    if (sansVisuel.has(p.slug)) return true
    // Marque manquante alors que la source en déclare une : le champ a été
    // ajouté après l'import du catalogue. La condition porte sur la source,
    // donc un produit sans marque chez WooCommerce n'est jamais repris en
    // boucle.
    if (p.brands?.[0]?.name && sansMarque.has(p.slug)) return true
    return false
  })
  const lot = aFaire.slice(0, taille)

  const rapport: RapportProduits = {
    total: tous.length,
    dejaPresents: dejaLa.size,
    importes: [],
    ignores: [],
    restants: Math.max(0, aFaire.length - lot.length),
  }

  if (!lot.length) return rapport

  const cacheCategories = new Map<string, number>()
  const cacheMedias = new Map<string, Media | null>()

  for (const woo of lot) {
    try {
      // Un seul visuel par produit : celui qu'affichent les carrousels. Les
      // galeries complètes multiplieraient par trois ou quatre le volume
      // envoyé sur Supabase Storage pour un usage qui n'existe pas encore.
      const principale = woo.images?.[0]
      const image = principale
        ? await recupererMedia(payload, cacheMedias, principale.src, principale.alt || woo.name)
        : null

      const categories = await resoudreCategories(
        payload,
        cacheCategories,
        (woo.categories ?? []).map((c) => decoder(c.name)),
      )

      const donnees = {
        title: decoder(woo.name),
        slug: woo.slug,
        wooId: woo.id,
        sourceUrl: woo.permalink,
        ...(woo.sku ? { reference: woo.sku } : {}),
        ...(woo.brands?.[0]?.name ? { marque: decoder(woo.brands[0].name) } : {}),
        ...(taillesDe(woo).length ? { tailles: taillesDe(woo) } : {}),
        ...(prixEnEuros(woo) !== null ? { price: prixEnEuros(woo)! } : {}),
        ...(woo.short_description
          ? { shortDescription: texteBrut(woo.short_description).slice(0, 500) }
          : {}),
        ...(image ? { gallery: [{ image: image.id }] } : {}),
        category: categories,
      } as Partial<Product>

      const existant = dejaLa.get(woo.slug)

      if (existant) {
        // Mise à jour : l'identifiant est conservé, donc les carrousels des
        // articles qui référencent ce produit ne se cassent pas.
        await payload.update({
          collection: 'products',
          id: existant,
          depth: 0,
          req,
          data: donnees as never,
        })
      } else {
        await payload.create({ collection: 'products', depth: 0, req, data: donnees as never })
      }

      rapport.importes.push(woo.slug)
    } catch (err) {
      payload.logger.error({ err }, `Produit non importé : ${woo.slug}`)
      rapport.ignores.push({
        slug: woo.slug,
        raison: err instanceof Error ? err.message : 'erreur inconnue',
      })
    }
  }

  return rapport
}

/** Tailles déclarées comme attribut WooCommerce. */
const taillesDe = (woo: ProduitWoo): string[] =>
  woo.attributes?.find((a) => /taille/i.test(a.name))?.terms?.map((t) => decoder(t.name)) ?? []

/** L'API Store renvoie les prix en centimes, sous forme de chaîne. */
const prixEnEuros = (woo: ProduitWoo): number | null => {
  const brut = woo.prices?.price
  if (!brut) return null
  const centimes = Number(brut)
  if (!Number.isFinite(centimes)) return null
  const unite = woo.prices?.currency_minor_unit ?? 2
  return centimes / 10 ** unite
}

const texteBrut = (html: string): string =>
  decoder(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

const listerProduits = async (): Promise<ProduitWoo[]> => {
  const tous: ProduitWoo[] = []

  for (let page = 1; page <= 20; page++) {
    const r = await fetch(
      `https://lesbikeuses.fr/wp-json/wc/store/v1/products?per_page=${PAR_PAGE}&page=${page}`,
    )
    if (!r.ok) break

    const lot = (await r.json()) as ProduitWoo[]
    if (!lot.length) break

    tous.push(...lot)
    if (lot.length < PAR_PAGE) break
  }

  return tous
}

const resoudreCategories = async (
  payload: Payload,
  cache: Map<string, number>,
  noms: string[],
): Promise<number[]> => {
  const ids: number[] = []

  for (const nom of noms) {
    const slug = ardoise(nom)
    if (!slug || cache.has(slug)) {
      if (slug && cache.has(slug)) ids.push(cache.get(slug)!)
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
