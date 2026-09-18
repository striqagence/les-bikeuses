import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Category, Product } from '@/payload-types'

import { CarteProduit } from '@/components/Boutique/CarteProduit'
import { AchatProduit } from '@/components/Boutique/AchatProduit'
import { Galerie } from '@/components/Boutique/Galerie'
import RichText from '@/components/RichText'

export const revalidate = 600

/**
 * Pré-génère les fiches au build.
 *
 * Sans cette liste, une fiche est rendue à chaque visite : le gabarit racine
 * appelle `draftMode()` pour la barre d'administration, ce qui exclut du
 * cache toute page qui n'a pas été pré-générée. Les fiches répondaient donc
 * en 900 ms là où le CDN sert une page pré-rendue en cinquante.
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const produits = await payload.find({
      collection: 'products',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })

    return produits.docs.map(({ slug }) => ({ slug })).filter((p) => Boolean(p.slug))
  } catch {
    // Base injoignable au build : les fiches basculent en rendu à la demande
    // plutôt que de faire tomber le déploiement.
    return []
  }
}

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

type Args = { params: Promise<{ slug: string }> }

export default async function FicheProduit({ params: p }: Args) {
  const { slug } = await p
  const produit = await queryProduit({ slug })
  if (!produit) notFound()

  const rayon = produit.category?.find((c): c is Category => typeof c === 'object')

  // Caractéristiques : seules celles renseignées sont affichées. Une ligne
  // « Matière : — » n'apprend rien et alourdit le tableau.
  const specs = [
    ['Référence', produit.reference],
    ['Marque', produit.marque],
    ['Matière', produit.matiere],
    ['Homologation', produit.homologation ? HOMOLOGATIONS[produit.homologation] : null],
    ['Protections', produit.protections],
    ['Saison', produit.saison ? SAISONS[produit.saison] : null],
    ['Tailles', produit.tailles?.length ? produit.tailles.join(' · ') : null],
  ].filter((l): l is [string, string] => Boolean(l[1]))

  const similaires = rayon ? await queryapparentes({ rayonId: rayon.id, exclure: produit.id }) : []

  return (
    <div className="container pt-6 pb-16 md:pt-10">
      <nav aria-label="Fil d’Ariane" className="mono-label mb-6 flex flex-wrap gap-2 text-muted-foreground">
        <Link className="transition-colors hover:text-primary" href="/">
          Accueil
        </Link>
        <span aria-hidden="true" className="opacity-50">
          /
        </span>
        {rayon && (
          <>
            <Link className="transition-colors hover:text-primary" href={`/rubrique/${rayon.slug}`}>
              {rayon.title}
            </Link>
            <span aria-hidden="true" className="opacity-50">
              /
            </span>
          </>
        )}
        <span>{produit.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
        <Galerie images={produit.gallery ?? []} titre={produit.title} />

        <div>
          {produit.marque && <p className="eyebrow">{produit.marque}</p>}
          <h1 className="wonk mt-3 text-3xl leading-[1.08] md:text-4xl">
            {produit.title}
          </h1>

          <AchatProduit produit={produit} />

          {!!specs.length && (
            <dl className="mt-8 grid grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-8">
              {specs.map(([cle, valeur]) => (
                <div
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
                  key={cle}
                >
                  <dt className="mono-label m-0 text-muted-foreground">{cle}</dt>
                  <dd className="m-0 text-right text-sm font-semibold">{valeur}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Le corps rédigé, sous les deux colonnes et non dans la colonne
          d'achat : il porte des titres et des listes, et une mesure de
          trente caractères les rendrait illisibles. C'est aussi le texte qui
          porte le référencement de la fiche. */}
      {produit.description && (
        <section className="mt-14 border-t border-border pt-12">
          <p className="eyebrow">La fiche</p>
          <h2 className="titre-section mt-3 mb-8 max-w-[18ch]">Description</h2>
          <RichText
            className="corps-article mx-0! max-w-[68ch]"
            data={produit.description}
            enableGutter={false}
          />
        </section>
      )}

      {!!similaires.length && (
        <section className="pt-14">
          <p className="eyebrow">Dans le même rayon</p>
          <h2 className="wonk mt-2 mb-7 text-2xl md:text-3xl">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {similaires.map((p) => (
              <CarteProduit key={p.id} produit={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const queryProduit = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })
  const r = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  })
  return r.docs[0] ?? null
})

const queryapparentes = async ({ rayonId, exclure }: { rayonId: number; exclure: number }) => {
  const payload = await getPayload({ config: configPromise })
  const r = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 4,
    where: { and: [{ category: { in: [rayonId] } }, { id: { not_equals: exclure } }] },
  })
  return r.docs as Product[]
}

export async function generateMetadata({ params: p }: Args): Promise<Metadata> {
  const { slug } = await p
  const produit = await queryProduit({ slug })

  return {
    title: produit ? `${produit.title} | Les Bikeuses` : 'Produit | Les Bikeuses',
    description: produit?.shortDescription ?? undefined,
  }
}
