import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Category, Product } from '@/payload-types'

import { CarteProduit, prixFr } from '@/components/Boutique/CarteProduit'
import { Galerie } from '@/components/Boutique/Galerie'

export const revalidate = 600

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
  const prix = prixFr(produit.price)

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
          <h1 className="wonk mt-3 text-3xl leading-[1.08] font-medium md:text-4xl">
            {produit.title}
          </h1>

          {prix && (
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-mono text-3xl tabular-nums">{prix}</span>
              <span className="mono-label text-muted-foreground">TTC</span>
            </div>
          )}

          {produit.shortDescription && (
            <p className="mt-5 max-w-[52ch] text-muted-foreground">{produit.shortDescription}</p>
          )}

          {!!produit.tailles?.length && (
            <div className="mt-7">
              <h2 className="mono-label mb-3">Tailles disponibles</h2>
              <ul className="flex list-none flex-wrap gap-1.5 p-0">
                {produit.tailles.map((t) => (
                  <li
                    className="min-w-[42px] rounded-[10px] border border-border px-2.5 py-1.5 text-center font-mono text-[0.6875rem]"
                    key={t}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pas de panier tant que la boutique n'est pas ouverte : le bouton
              mène là où la commande est réellement possible. */}
          {produit.sourceUrl && (
            <a
              className="mt-7 inline-flex items-center gap-2.5 rounded-pilule bg-primary px-7 py-4 font-bold text-primary-foreground transition-colors hover:bg-brand-bright"
              href={produit.sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Commander sur lesbikeuses.fr <span aria-hidden="true">→</span>
            </a>
          )}

          <p className="mt-4 rounded-xl border border-primary/25 bg-accent px-4 py-3 text-sm">
            <strong>La boutique n’est pas encore ouverte ici.</strong> La commande se fait sur
            lesbikeuses.fr, où le catalogue est en ligne.
          </p>

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

      {!!similaires.length && (
        <section className="pt-14">
          <p className="eyebrow">Dans le même rayon</p>
          <h2 className="wonk mt-2 mb-7 text-2xl font-medium md:text-3xl">Vous aimerez aussi</h2>
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
