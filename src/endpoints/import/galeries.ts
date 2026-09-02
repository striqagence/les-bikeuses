import type { Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

import { nomDeFichier, recupererMedia } from './medias'

const STORE = 'https://lesbikeuses.fr/wp-json/wc/store/v1'

/**
 * Complète les galeries produit.
 *
 * Le premier import ne gardait que le visuel de tête, celui des carrousels.
 * Or une référence en compte deux à seize sur l'ancienne boutique — coloris,
 * dos, détails de coque — et c'est ce qui manquait le plus à la fiche.
 *
 * L'opération se fait par lots : mille quatre cents visuels à télécharger,
 * redimensionner et renvoyer sur Supabase dépassent de loin la durée d'une
 * fonction comme celle d'un déploiement.
 */

type ImageWoo = { src: string; alt?: string }
type ProduitWoo = { id: number; images?: ImageWoo[] }

/** Même forme que les autres rapports d'import : le bouton enchaîne les lots. */
export type RapportGaleries = {
  total: number
  dejaPresents: number
  importes: string[]
  visuelsAjoutes: number
  ignores: { slug: string; raison: string }[]
  restants: number
}

/**
 * Visuels distincts d'un produit, dans l'ordre de la boutique.
 *
 * WooCommerce répète volontiers le visuel de tête en deuxième position : le
 * dédoublonnage se fait sur le nom de fichier, deux URL pouvant ne différer
 * que par leur suffixe de taille.
 */
const visuelsDistincts = (woo: ProduitWoo): ImageWoo[] => {
  const vus = new Set<string>()
  const sortie: ImageWoo[] = []

  for (const image of woo.images ?? []) {
    if (!image?.src) continue
    const cle = nomDeFichier(image.src)
    if (vus.has(cle)) continue
    vus.add(cle)
    sortie.push(image)
  }

  return sortie
}

export const importerGaleries = async ({
  payload,
  req,
  taille = 6,
}: {
  payload: Payload
  req?: PayloadRequest
  taille?: number
}): Promise<RapportGaleries> => {
  const contexte = req ? { req } : {}

  // Le catalogue distant tient en cinq requêtes : le relire à chaque lot
  // coûte moins que d'en garder un état entre deux appels de fonction.
  const distants = new Map<number, ImageWoo[]>()
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${STORE}/products?per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      redirect: 'follow',
    })
    if (!r.ok) throw new Error(`Store API : HTTP ${r.status} page ${page}`)

    const lot = (await r.json()) as ProduitWoo[]
    if (!lot.length) break
    for (const p of lot) distants.set(p.id, visuelsDistincts(p))
    if (lot.length < 100) break
  }

  const locaux = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, title: true, wooId: true, gallery: true },
  })

  // Un produit est à compléter tant qu'il porte moins de visuels que la
  // boutique d'origine n'en propose.
  const aFaire = locaux.docs.filter((p) => {
    const attendus = p.wooId ? (distants.get(p.wooId)?.length ?? 0) : 0
    return attendus > (p.gallery?.length ?? 0)
  })

  const lot = aFaire.slice(0, Math.max(1, taille))

  const rapport: RapportGaleries = {
    total: locaux.docs.length,
    dejaPresents: locaux.docs.length - aFaire.length,
    importes: [],
    visuelsAjoutes: 0,
    ignores: [],
    restants: Math.max(0, aFaire.length - lot.length),
  }

  const cache = new Map<string, Media | null>()

  for (const produit of lot) {
    const slug = (produit.slug as string) ?? String(produit.id)

    try {
      const attendus = distants.get(produit.wooId as number) ?? []
      const avant = produit.gallery?.length ?? 0

      const entrees: { image: number }[] = []
      for (const image of attendus) {
        const media = await recupererMedia(
          payload,
          cache,
          image.src,
          image.alt || (produit.title as string) || slug,
        )
        // Un visuel introuvable est sauté : mieux vaut une galerie de quatre
        // images sur cinq qu'une fiche laissée en l'état.
        if (media) entrees.push({ image: media.id })
      }

      if (!entrees.length) {
        rapport.ignores.push({ slug, raison: 'aucun visuel récupéré' })
        continue
      }

      await payload.update({
        ...contexte,
        collection: 'products',
        id: produit.id,
        depth: 0,
        data: { gallery: entrees } as never,
        context: { disableRevalidate: true },
      })

      rapport.importes.push(slug)
      rapport.visuelsAjoutes += Math.max(0, entrees.length - avant)
    } catch (err) {
      payload.logger.error({ err }, `Galerie non complétée : ${slug}`)
      rapport.ignores.push({
        slug,
        raison: err instanceof Error ? err.message : 'erreur inconnue',
      })
    }
  }

  return rapport
}
