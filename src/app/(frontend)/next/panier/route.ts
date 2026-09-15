import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Media, Product } from '@/payload-types'

/**
 * Recalcule un panier à partir de ses seuls identifiants.
 *
 * Le navigateur n'envoie que des produits, des déclinaisons et des quantités :
 * prix, libellés et disponibilité sont relus en base à chaque affichage. Un
 * panier trafiqué dans le stockage local ne peut donc pas imposer son prix, et
 * une remise appliquée entre-temps descend d'elle-même.
 *
 * Une ligne dont le produit a disparu est signalée plutôt que supprimée en
 * silence : la cliente doit comprendre pourquoi son panier a changé.
 */

type LigneDemandee = { produit: number; variante: number | null; quantite: number }

export type LigneResolue = {
  produit: number
  variante: number | null
  quantite: number
  titre: string
  slug: string | null
  marque: string | null
  taille: string | null
  declinaison: string | null
  reference: string | null
  image: string | null
  prixUnitaire: number | null
  total: number | null
  disponible: boolean
  quantiteMax: number | null
  probleme: 'introuvable' | 'epuise' | 'stock-insuffisant' | null
}

export type PanierResolu = {
  lignes: LigneResolue[]
  sousTotal: number
  nbArticles: number
  problemes: number
}

const MAX_LIGNES = 50

export async function POST(request: Request): Promise<Response> {
  let demandees: LigneDemandee[] = []
  try {
    const corps = await request.json()
    if (Array.isArray(corps?.lignes)) demandees = corps.lignes.slice(0, MAX_LIGNES)
  } catch {
    return Response.json({ erreur: 'Requête illisible.' }, { status: 400 })
  }

  const propres = demandees.filter(
    (l) => Number.isInteger(l?.produit) && Number.isFinite(l?.quantite) && l.quantite > 0,
  )
  if (!propres.length) {
    return Response.json({ lignes: [], sousTotal: 0, nbArticles: 0, problemes: 0 } as PanierResolu)
  }

  const payload = await getPayload({ config: configPromise })
  const produits = await payload.find({
    collection: 'products',
    depth: 1,
    limit: MAX_LIGNES,
    pagination: false,
    where: { id: { in: [...new Set(propres.map((l) => l.produit))] } },
  })
  const parId = new Map(produits.docs.map((p) => [p.id, p as Product]))

  const lignes: LigneResolue[] = propres.map((l) => {
    const produit = parId.get(l.produit)

    if (!produit) {
      return {
        ...l,
        titre: 'Article retiré du catalogue',
        slug: null,
        marque: null,
        taille: null,
        declinaison: null,
        reference: null,
        image: null,
        prixUnitaire: null,
        total: null,
        disponible: false,
        quantiteMax: null,
        probleme: 'introuvable',
      }
    }

    const variante = (produit.variantes ?? []).find((v) => v.wooId === l.variante) ?? null
    const prixUnitaire = variante?.prix ?? produit.price ?? null
    const stock = typeof variante?.stock === 'number' ? variante.stock : null
    const disponible = variante ? variante.disponible !== false : produit.enStock !== false

    // Le stock n'est renseigné que sur une partie du catalogue : quand il
    // manque, la disponibilité fait foi et la quantité n'est pas bornée.
    const quantite = stock !== null ? Math.min(l.quantite, stock) : l.quantite
    const probleme = !disponible
      ? ('epuise' as const)
      : stock !== null && l.quantite > stock
        ? ('stock-insuffisant' as const)
        : null

    const premiere = produit.gallery?.[0]?.image
    const image =
      premiere && typeof premiere === 'object' ? ((premiere as Media).url ?? null) : null

    return {
      produit: l.produit,
      variante: l.variante,
      quantite,
      titre: produit.title,
      slug: produit.slug ?? null,
      marque: produit.marque ?? null,
      taille: variante?.taille ?? null,
      declinaison: variante?.declinaison ?? null,
      reference: variante?.reference ?? produit.reference ?? null,
      image,
      prixUnitaire,
      total: prixUnitaire !== null ? prixUnitaire * quantite : null,
      disponible,
      quantiteMax: stock,
      probleme,
    }
  })

  return Response.json({
    lignes,
    sousTotal: lignes.reduce((s, l) => s + (l.disponible ? (l.total ?? 0) : 0), 0),
    nbArticles: lignes.reduce((s, l) => s + (l.disponible ? l.quantite : 0), 0),
    problemes: lignes.filter((l) => l.probleme).length,
  } as PanierResolu)
}
