import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Media as TypeMedia, Product } from '@/payload-types'

import { Media } from '@/components/Media'

export const revalidate = 600

type Marque = {
  nom: string
  nb: number
  url: string
  visuel: TypeMedia | null
}

/**
 * Index des marques du catalogue.
 *
 * Construit depuis le champ « marque » des produits, et non depuis une liste
 * tenue à la main comme sur l'ancien site : une marque qui entre au catalogue
 * apparaît ici sans que personne ait à y penser, et une marque qui en sort
 * disparaît plutôt que de laisser un logo mort.
 *
 * Chaque marque mène à son rayon quand il en existe un. Les deux marques qui
 * n'en ont pas — deux références chacune — passent par la recherche, faute de
 * quoi elles auraient été silencieusement absentes de la page.
 */
const chargerMarques = unstable_cache(
  async (): Promise<Marque[]> => {
    const payload = await getPayload({ config: configPromise })

    const [produits, categories] = await Promise.all([
      payload.find({
        collection: 'products',
        depth: 1,
        limit: 1000,
        pagination: false,
        sort: '-createdAt',
        select: { marque: true, gallery: true },
      }),
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 500,
        pagination: false,
        select: { slug: true, title: true },
      }),
    ])

    const parTitre = new Map(
      categories.docs
        .filter((c) => c.title && c.slug)
        .map((c) => [(c.title as string).toLowerCase(), c.slug as string]),
    )

    const compte = new Map<string, { nb: number; visuel: TypeMedia | null }>()
    for (const p of produits.docs as Product[]) {
      if (!p.marque) continue
      const entree = compte.get(p.marque) ?? { nb: 0, visuel: null }
      entree.nb++
      // Le visuel le plus récent de la marque sert de vignette.
      if (!entree.visuel) {
        const image = p.gallery?.[0]?.image
        if (image && typeof image === 'object') entree.visuel = image as TypeMedia
      }
      compte.set(p.marque, entree)
    }

    return [...compte.entries()]
      .map(([nom, { nb, visuel }]) => {
        const slug = parTitre.get(nom.toLowerCase())
        return {
          nom,
          nb,
          visuel,
          url: slug ? `/rubrique/${slug}` : `/search?q=${encodeURIComponent(nom)}`,
        }
      })
      .sort((a, b) => b.nb - a.nb || a.nom.localeCompare(b.nom, 'fr'))
  },
  ['index-marques'],
  { revalidate: 600 },
)

export default async function Marques() {
  const marques = await chargerMarques()
  const total = marques.reduce((s, m) => s + m.nb, 0)

  return (
    <div className="container pt-8 pb-20 md:pt-14">
      <header className="max-w-[60ch]">
        <p className="eyebrow">Le catalogue</p>
        <h1 className="wonk mt-3 text-4xl leading-[1.02] font-medium md:text-6xl">
          Toutes les marques
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {marques.length} maisons d’équipement au catalogue, {total} références. Chacune mène à
          son rayon.
        </p>
      </header>

      <hr className="route mt-10" />

      <ul className="mt-8 grid list-none grid-cols-2 gap-5 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {marques.map((m, i) => (
          <li key={m.nom}>
            <article className="group relative flex h-full flex-col gap-3 rounded-panneau border border-border bg-card p-2.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
              <div className="aspect-square overflow-hidden rounded-[14px] bg-secondary">
                {m.visuel ? (
                  <Media
                    className="h-full"
                    imgClassName="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.05]"
                    priority={i < 5}
                    resource={m.visuel}
                    size="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                    variante="small"
                  />
                ) : (
                  <div className="mono-label grid h-full place-items-center text-muted-foreground">
                    Sans visuel
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-2 px-1 pb-1">
                <h2 className="font-sans text-[0.9375rem] leading-snug font-bold transition-colors group-hover:text-primary">
                  <Link
                    className="outline-none after:absolute after:inset-0 after:content-['']"
                    href={m.url}
                  >
                    {m.nom}
                  </Link>
                </h2>
                <span className="mono-label shrink-0 tabular-nums text-muted-foreground">
                  {m.nb}
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Toutes les marques d’équipement moto femme | Les Bikeuses',
  description:
    'Les maisons d’équipement moto présentes au catalogue Les Bikeuses : blousons, casques, gants et bottes coupés pour les morphologies féminines.',
}
