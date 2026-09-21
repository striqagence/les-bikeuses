import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { FiltreThemes } from '@/components/Journal/FiltreThemes'
import { PaginationRayon } from '@/components/Boutique/PaginationRayon'
import { THEMES } from '@/utilities/themesJournal'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'

const PAR_PAGE = 36

// La page lit `searchParams` : Next la rend donc à chaque visite, et
// `revalidate` ne s'y applique pas. Le décompte des thèmes, qui ne dépend
// d'aucun filtre, est mis en cache à la main — sans quoi chaque affichage
// relisait les deux cent un articles pour rien.
const DUREE_CACHE = 600

type Args = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Thèmes réellement pourvus, avec leur nombre d'articles.
 *
 * Un thème vide est omis plutôt qu'affiché à zéro : une entrée de filtre qui
 * ne mène à rien n'est pas une information, c'est une impasse.
 */
const chargerThemes = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const categories = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 500,
      pagination: false,
      select: { slug: true },
    })
    const idParSlug = new Map(categories.docs.map((c) => [c.slug as string, c.id]))

    const articles = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { categories: true },
    })

    const compte = new Map<number, number>()
    for (const article of articles.docs) {
      for (const c of article.categories ?? []) {
        const id = typeof c === 'number' ? c : c?.id
        if (typeof id === 'number') compte.set(id, (compte.get(id) ?? 0) + 1)
      }
    }

    const themes = THEMES.map((t) => {
      const id = idParSlug.get(t.slug)
      return { ...t, id: id ?? null, nb: id ? (compte.get(id) ?? 0) : 0 }
    }).filter((t): t is typeof t & { id: number } => t.id !== null && t.nb > 0)

    return { themes, total: articles.docs.length }
  },
  ['themes-journal'],
  { revalidate: DUREE_CACHE },
)

export default async function Page({ searchParams: sp }: Args) {
  const params = await sp
  const payload = await getPayload({ config: configPromise })

  const { themes, total } = await chargerThemes()

  const demande = typeof params.theme === 'string' ? params.theme : undefined
  // Un thème inconnu est ignoré plutôt que traité en 404 : l'URL reste
  // lisible, et le lecteur tombe sur le journal entier plutôt que sur une
  // page d'erreur.
  const choisi = themes.find((t) => t.slug === demande) ?? null
  const page = Math.max(1, Number(params.page) || 1)

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: PAR_PAGE,
    page,
    overrideAccess: false,
    sort: '-publishedAt',
    ...(choisi ? { where: { categories: { in: [choisi.id] } } } : {}),
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      publishedAt: true,
      heroImage: true,
    },
  })

  const debut = (posts.page ?? 1) * PAR_PAGE - PAR_PAGE + 1
  const fin = Math.min((posts.page ?? 1) * PAR_PAGE, posts.totalDocs)

  return (
    <div className="pt-10 pb-24 md:pt-16">
      <PageClient />

      <header className="container mb-10 md:mb-14">
        <p className="eyebrow">Le journal</p>
        <h1 className="titre-section mt-3 max-w-[18ch]">
          Essais, conseils et routes à faire
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted-foreground">
          Choisir sa première moto, s’équiper pour la saison, préparer un long
          trajet : ce qu’on aurait aimé lire en débutant.
        </p>

        <div className="mt-9 border-t border-border pt-7">
          <FiltreThemes themes={themes} total={total} />
        </div>

        <p className="mono-label mt-7 text-muted-foreground">
          {posts.totalDocs
            ? `${debut}-${fin} sur ${posts.totalDocs} article${posts.totalDocs > 1 ? 's' : ''}`
            : 'Aucun article'}
          {choisi && ` · ${choisi.libelle}`}
        </p>
      </header>

      {posts.docs.length ? (
        <>
          <CollectionArchive posts={posts.docs} />
          <div className="container">
            <PaginationRayon page={posts.page ?? 1} total={posts.totalPages} />
          </div>
        </>
      ) : (
        <p className="container py-16 text-center text-muted-foreground">
          Aucun article dans ce thème pour l’instant.
        </p>
      )}
    </div>
  )
}

export async function generateMetadata({ searchParams: sp }: Args): Promise<Metadata> {
  const params = await sp
  const theme = THEMES.find((t) => t.slug === params.theme)

  return {
    title: theme ? `${theme.libelle} — Le journal | Les Bikeuses` : 'Le journal | Les Bikeuses',
    // Les vues filtrées pointent vers le journal entier : ce sont des tris
    // d'une même collection, pas des pages à indexer séparément.
    alternates: { canonical: '/posts' },
  }
}
