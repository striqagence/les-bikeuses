import type { Payload, PayloadRequest } from 'payload'

const STORE = 'https://lesbikeuses.fr/wp-json/wc/store/v1'

/**
 * Reprend les déclinaisons vendables de l'ancienne boutique.
 *
 * Une référence se vend par combinaison — taille et, souvent, coloris — que
 * WooCommerce appelle « variation ». Chacune porte sa référence, son prix et
 * sa disponibilité, là où le champ `tailles` repris jusqu'ici ne portait que
 * des étiquettes : utiles aux filtres, incapables de dire si le M est encore
 * là.
 *
 * WooCommerce n'expose pas les quantités, seulement l'état « en stock ». Le
 * champ `stock` reste donc vide, à renseigner en back-office pour permettre un
 * décompte réel. Tant qu'il l'est, la disponibilité fait foi.
 *
 * La fiche parente ne donne que les identifiants des variations : il faut une
 * requête par variation pour en connaître le prix et la disponibilité. D'où
 * l'import par lots, comme pour les galeries.
 */

type Attribut = { name: string; value: string }
type Variation = { id: number; attributes?: Attribut[] }
type ProduitWoo = {
  id: number
  type?: string
  variations?: Variation[]
  prices?: { price?: string; currency_minor_unit?: number }
  is_in_stock?: boolean
  sku?: string
}
type DetailVariation = {
  id: number
  sku?: string
  is_in_stock?: boolean
  prices?: { price?: string; currency_minor_unit?: number }
}

export type RapportVariantes = {
  total: number
  dejaFaits: number
  importes: string[]
  ignores: { slug: string; raison: string }[]
  restants: number
  declinaisons: number
}

/** Les prix arrivent en centimes, avec le nombre de décimales en clair. */
const enEuros = (prix?: { price?: string; currency_minor_unit?: number }): number | null => {
  if (!prix?.price) return null
  const brut = Number(prix.price)
  if (!Number.isFinite(brut)) return null
  return brut / 10 ** (prix.currency_minor_unit ?? 2)
}

const valeur = (attrs: Attribut[] | undefined, nom: RegExp): string | null =>
  attrs?.find((a) => nom.test(a.name))?.value ?? null

export const importerVariantes = async ({
  payload,
  req,
  taille = 12,
}: {
  payload: Payload
  req?: PayloadRequest
  taille?: number
}): Promise<RapportVariantes> => {
  const contexte = req ? { req } : {}

  const locaux = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, wooId: true, variantes: true, price: true },
  })

  // Une fiche déjà pourvue est sautée : l'import se relance sans tout refaire.
  const aFaire = locaux.docs.filter((p) => p.wooId && !(p.variantes?.length ?? 0))
  const lot = aFaire.slice(0, Math.max(1, taille))

  const rapport: RapportVariantes = {
    total: locaux.docs.length,
    dejaFaits: locaux.docs.length - aFaire.length,
    importes: [],
    ignores: [],
    restants: Math.max(0, aFaire.length - lot.length),
    declinaisons: 0,
  }

  // lesbikeuses.fr est toujours en production : on ne le bombarde pas. Une
  // pause courte ramène la cadence sous cinq requêtes par seconde.
  const souffler = () => new Promise((r) => setTimeout(r, 90))

  const lire = async (chemin: string) => {
    await souffler()
    const r = await fetch(`${STORE}${chemin}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      redirect: 'follow',
    })
    if (!r.ok) throw new Error(`HTTP ${r.status} sur ${chemin}`)
    return r.json()
  }

  for (const produit of lot) {
    const slug = (produit.slug as string) ?? String(produit.id)

    try {
      const woo = (await lire(`/products/${produit.wooId}`)) as ProduitWoo

      // Produit simple : une seule déclinaison, celle du produit lui-même.
      const variations: Variation[] =
        woo.type === 'variable' && woo.variations?.length
          ? woo.variations
          : [{ id: woo.id, attributes: [] }]

      const declinaisons: Record<string, unknown>[] = []
      for (const v of variations) {
        const detail =
          v.id === woo.id ? (woo as DetailVariation) : ((await lire(`/products/${v.id}`)) as DetailVariation)

        const prix = enEuros(detail.prices)
        declinaisons.push({
          wooId: v.id,
          taille: valeur(v.attributes, /taille|size/i),
          declinaison: valeur(v.attributes, /mod[èe]le|couleur|coloris|color/i),
          reference: detail.sku || null,
          // Le prix n'est porté que s'il diffère de celui de la fiche : sinon
          // une remise sur le produit ne redescendrait jamais aux tailles.
          prix: prix !== null && prix !== produit.price ? prix : null,
          stock: null,
          disponible: detail.is_in_stock !== false,
        })
      }

      await payload.update({
        ...contexte,
        collection: 'products',
        id: produit.id,
        depth: 0,
        data: {
          variantes: declinaisons,
          enStock: declinaisons.some((d) => d.disponible),
        } as never,
        context: { disableRevalidate: true },
      })

      rapport.importes.push(slug)
      rapport.declinaisons += declinaisons.length
    } catch (err) {
      payload.logger.error({ err }, `Déclinaisons non reprises : ${slug}`)
      rapport.ignores.push({
        slug,
        raison: err instanceof Error ? err.message : 'erreur inconnue',
      })
    }
  }

  return rapport
}
