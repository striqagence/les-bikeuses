import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Product } from '@/payload-types'

import { CarteProduit } from '@/components/Boutique/CarteProduit'
import { Facettes, Jetons, type Facette } from '@/components/Boutique/Facettes'
import { PaginationRayon } from '@/components/Boutique/PaginationRayon'

// La page lit `searchParams` : Next la rend donc dynamiquement à chaque
// visite, et `revalidate` ne s'y applique pas. Les deux requêtes qui ne
// dépendent pas des filtres sont mises en cache à la main — sans quoi chaque
// affichage rechargeait la catégorie et jusqu'à mille produits, de quoi
// saturer le pool Postgres à lui seul.
const DUREE_CACHE = 600

const PAR_PAGE = 24

const HOMOLOGATIONS: Record<string, string> = {
  'ce-aa': 'CE niveau AA',
  'ce-a': 'CE niveau A',
  'ce-b': 'CE niveau B',
  'ce-kp': 'CE (gants) KP',
  'ece-2206': 'ECE 22.06',
  aucune: 'Non homologué',
}

const SAISONS: Record<string, string> = {
  ete: 'Été',
  'mi-saison': 'Mi-saison',
  hiver: 'Hiver',
  'toutes-saisons': 'Toutes saisons',
}

const TRIS = {
  nouveau: { libelle: 'Nouveautés', sort: '-createdAt' },
  'prix-croissant': { libelle: 'Prix croissant', sort: 'price' },
  'prix-decroissant': { libelle: 'Prix décroissant', sort: '-price' },
  nom: { libelle: 'Nom (A→Z)', sort: 'title' },
} as const

type Args = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Un paramètre peut être répété : `?taille=S&taille=M`. */
const liste = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

export default async function Rubrique({ params: p, searchParams: sp }: Args) {
  const { slug } = await p
  const params = await sp

  const rubrique = await queryRubrique({ slug })
  if (!rubrique) notFound()

  const payload = await getPayload({ config: configPromise })

  // Les facettes sont calculées sur tout le rayon, pas sur le résultat
  // filtré : sinon les options non retenues disparaissent et on ne peut plus
  // élargir sa recherche. Cette requête ne dépendant pas des filtres, elle est
  // mise en cache.
  const tout = await chargerFacettes(rubrique.id)

  const marques = liste(params.marque)
  const tailles = liste(params.taille)
  const homologations = liste(params.homologation)
  const saisons = liste(params.saison)
  const page = Math.max(1, Number(params.page) || 1)
  const tri = (params.tri as keyof typeof TRIS) in TRIS ? (params.tri as keyof typeof TRIS) : 'nouveau'

  const produits = await payload.find({
    collection: 'products',
    depth: 1,
    limit: PAR_PAGE,
    page,
    sort: TRIS[tri].sort,
    where: {
      and: [
        { category: { in: [rubrique.id] } },
        ...(marques.length ? [{ marque: { in: marques } }] : []),
        ...(tailles.length ? [{ tailles: { in: tailles } }] : []),
        ...(homologations.length ? [{ homologation: { in: homologations } }] : []),
        ...(saisons.length ? [{ saison: { in: saisons } }] : []),
      ],
    },
  })

  const facettes: Facette[] = [
    {
      cle: 'marque',
      titre: 'Marque',
      valeurs: compter(tout, (d) => (d.marque ? [d.marque] : [])),
    },
    {
      cle: 'taille',
      titre: 'Taille',
      pastilles: true,
      valeurs: compter(tout, (d) => d.tailles ?? [], ordreTailles),
    },
    {
      cle: 'homologation',
      titre: 'Homologation',
      valeurs: compter(tout, (d) => (d.homologation ? [d.homologation] : [])).map((v) => ({
        ...v,
        libelle: HOMOLOGATIONS[v.valeur] ?? v.valeur,
      })),
    },
    {
      cle: 'saison',
      titre: 'Saison',
      valeurs: compter(tout, (d) => (d.saison ? [d.saison] : [])).map((v) => ({
        ...v,
        libelle: SAISONS[v.valeur] ?? v.valeur,
      })),
    },
  ]

  const libelles = { ...HOMOLOGATIONS, ...SAISONS }

  return (
    <div className="container pt-6 pb-16 md:pt-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1 className="wonk mt-2 text-3xl leading-[1.03] font-medium md:text-5xl">
            {rubrique.title}
          </h1>
        </div>
        <p className="mono-label text-muted-foreground">
          {tout.length} référence{tout.length > 1 ? 's' : ''}
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24">
          <Facettes facettes={facettes} />
        </aside>

        <div>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <Jetons libelles={libelles} />
            <p className="mono-label text-muted-foreground">
              {produits.totalDocs} résultat{produits.totalDocs > 1 ? 's' : ''}
            </p>
          </div>

          {produits.docs.length ? (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {produits.docs.map((produit) => (
                  <CarteProduit key={produit.id} produit={produit as Product} />
                ))}
              </div>
              <PaginationRayon page={produits.page ?? 1} total={produits.totalPages} />
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              Aucun produit ne correspond à ces filtres. Retirez-en un pour élargir.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Compte les occurrences d'une valeur sur l'ensemble du rayon. */
const compter = (
  docs: Partial<Product>[],
  extraire: (d: Partial<Product>) => string[],
  ordre?: (a: string, b: string) => number,
) => {
  const total = new Map<string, number>()
  for (const d of docs) for (const v of extraire(d)) total.set(v, (total.get(v) ?? 0) + 1)

  return [...total.entries()]
    .sort(([a, na], [b, nb]) => (ordre ? ordre(a, b) : nb - na))
    .map(([valeur, nb]) => ({ valeur, libelle: valeur, nb }))
}

/** XS, S, M, L… plutôt que l'ordre alphabétique, qui donnerait L, M, S, XL. */
const ECHELLE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL']
const ordreTailles = (a: string, b: string) => {
  const ia = ECHELLE.indexOf(a.toUpperCase())
  const ib = ECHELLE.indexOf(b.toUpperCase())
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.localeCompare(b, 'fr', { numeric: true })
}

/** Rayon par slug. `cache` dédoublonne dans un rendu, `unstable_cache` entre les rendus. */
const queryRubrique = cache(
  unstable_cache(
    async ({ slug }: { slug: string }) => {
      const payload = await getPayload({ config: configPromise })
      const r = await payload.find({
        collection: 'categories',
        depth: 0,
        limit: 1,
        pagination: false,
        where: { slug: { equals: slug } },
      })
      return r.docs[0] ?? null
    },
    ['rubrique-par-slug'],
    { revalidate: DUREE_CACHE },
  ),
)

/** Champs à facettes de tout le rayon, indépendants des filtres. */
const chargerFacettes = unstable_cache(
  async (rayonId: number): Promise<Partial<Product>[]> => {
    const payload = await getPayload({ config: configPromise })
    const r = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1000,
      pagination: false,
      where: { category: { in: [rayonId] } },
      select: { marque: true, tailles: true, homologation: true, saison: true },
    })
    return r.docs
  },
  ['facettes-rayon'],
  { revalidate: DUREE_CACHE },
)

export async function generateMetadata({ params: p }: Args): Promise<Metadata> {
  const { slug } = await p
  const rubrique = await queryRubrique({ slug })

  return {
    title: rubrique ? `${rubrique.title} | Les Bikeuses` : 'Boutique | Les Bikeuses',
    description: rubrique
      ? `${rubrique.title} pour femmes : notre sélection d’équipement moto, coupes pensées pour les morphologies féminines.`
      : undefined,
  }
}
