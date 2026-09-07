import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { ETAPES, type Etape } from './etapes'

export const revalidate = 600

/** Fiche modèle du dictionnaire, par opposition à un article. */
const MARQUEUR_MOTOS = 'Motos'

/**
 * Charge les articles du parcours et les chiffres du bandeau.
 *
 * Une seule requête pour les vingt-trois articles plutôt qu'une par étape :
 * la page est pré-générée, mais elle se régénère toutes les dix minutes et
 * n'a aucune raison de coûter cinq allers-retours à chaque fois.
 */
const chargerParcours = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const slugs = ETAPES.flatMap((e) => e.slugs)

    const [articles, motos, produits] = await Promise.all([
      payload.find({
        collection: 'posts',
        depth: 1,
        limit: 100,
        pagination: false,
        where: { slug: { in: slugs } },
        select: { slug: true, title: true, heroImage: true, meta: true, categories: true },
      }),
      payload.count({
        collection: 'posts',
        where: { 'categories.title': { equals: MARQUEUR_MOTOS } },
      }),
      payload.count({ collection: 'products' }),
    ])

    return {
      parSlug: Object.fromEntries(articles.docs.map((p) => [p.slug as string, p as Post])),
      nbMotos: motos.totalDocs,
      nbProduits: produits.totalDocs,
      nbGuides: articles.docs.length,
    }
  },
  ['parcours-debuter'],
  { revalidate: 600 },
)

export default async function DebuterLaMoto() {
  const { parSlug, nbMotos, nbProduits, nbGuides } = await chargerParcours()

  return (
    <div className="pb-20">
      <header className="container pt-8 md:pt-14">
        <p className="eyebrow">Débuter</p>
        <h1 className="wonk mt-3 max-w-[16ch] text-4xl leading-[1.02] font-medium md:text-6xl">
          Commencer la moto, étape par étape
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg text-muted-foreground">
          Commencer la moto quand on est une femme, ce n’est pas si compliqué — mais les questions
          arrivent toujours dans le même ordre. Cette page les prend une par une, du premier doute
          au premier équipement.
        </p>

        <dl className="route mt-9 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-5 pt-7 sm:grid-cols-4">
          <Chiffre valeur={nbGuides} libelle="guides du parcours" />
          <Chiffre valeur={ETAPES.length} libelle="étapes" />
          <Chiffre valeur={nbMotos} libelle="modèles au dictionnaire" />
          <Chiffre valeur={nbProduits} libelle="références en boutique" />
        </dl>

        {/* Sommaire : sur une page longue, savoir où l'on va évite de la parcourir en entier. */}
        <nav aria-label="Les étapes" className="mt-10 flex flex-wrap gap-2">
          {ETAPES.map((e) => (
            <a
              className="mono-label inline-flex items-baseline gap-2 rounded-pilule border border-border px-3.5 py-2 transition-colors hover:border-primary hover:text-primary"
              href={`#etape-${e.numero}`}
              key={e.numero}
            >
              <span className="text-primary">{e.numero}</span>
              {e.titre}
            </a>
          ))}
        </nav>
      </header>

      {ETAPES.map((etape) => (
        <SectionEtape etape={etape} key={etape.numero} parSlug={parSlug} />
      ))}

      <section className="container mt-20">
        <div className="rounded-panneau border border-border bg-card p-8 md:p-12">
          <p className="eyebrow">Et après</p>
          <h2 className="wonk mt-3 max-w-[24ch] text-2xl leading-tight font-medium md:text-3xl">
            Le journal continue là où ce parcours s’arrête
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            Essais de machines, retours d’équipement, récits de voyage : tout ce qu’on écrit une
            fois le permis en poche.
          </p>
          <Link
            className="mono-label mt-6 inline-flex items-center gap-2 rounded-pilule bg-primary px-5 py-3 text-primary-foreground transition-opacity hover:opacity-90"
            href="/posts"
          >
            Lire le journal
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

const Chiffre: React.FC<{ valeur: number; libelle: string }> = ({ valeur, libelle }) => (
  <div>
    <dt className="sr-only">{libelle}</dt>
    <dd className="wonk text-3xl leading-none font-medium tabular-nums md:text-4xl">{valeur}</dd>
    <p className="mono-label mt-2 text-muted-foreground">{libelle}</p>
  </div>
)

const SectionEtape: React.FC<{ etape: Etape; parSlug: Record<string, Post> }> = ({
  etape,
  parSlug,
}) => {
  // Un article retiré du site disparaît de l'étape sans casser la page.
  const articles = etape.slugs.map((s) => parSlug[s]).filter(Boolean)
  if (!articles.length) return null

  return (
    <section className="container mt-16 scroll-mt-24 md:mt-24" id={`etape-${etape.numero}`}>
      <div className="route grid gap-x-12 gap-y-4 pt-7 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <p className="mono-label text-primary">Étape {etape.numero}</p>
          <h2 className="wonk mt-2 text-2xl leading-tight font-medium md:text-4xl">
            {etape.titre}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground italic">« {etape.question} »</p>
        </div>
        <p className="max-w-[52ch] self-end text-muted-foreground">{etape.chapeau}</p>
      </div>

      <ul className="mt-8 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <CarteGuide article={article} />
          </li>
        ))}
      </ul>

      {etape.suite && (
        <Link
          className="group mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-panneau border border-primary/40 bg-accent p-6 transition-colors hover:border-primary"
          href={etape.suite.url}
        >
          <div className="max-w-[52ch]">
            <p className="mono-label text-primary">Pour aller plus loin</p>
            <p className="wonk mt-1.5 text-xl font-medium">{etape.suite.libelle}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{etape.suite.detail}</p>
          </div>
          <span
            aria-hidden="true"
            className="mono-label shrink-0 rounded-pilule bg-primary px-4 py-2.5 text-primary-foreground transition-transform group-hover:translate-x-1"
          >
            Y aller →
          </span>
        </Link>
      )}
    </section>
  )
}

/** Même idiome que les cartes du catalogue : un seul lien, étiré sur la carte. */
const CarteGuide: React.FC<{ article: Post }> = ({ article }) => {
  const image = article.heroImage

  return (
    <article className="group relative flex h-full flex-col gap-3.5 rounded-panneau border border-border bg-card p-2.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div className="aspect-[16/10] overflow-hidden rounded-[14px] bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            resource={image}
            size="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            variante="small"
          />
        ) : (
          <div className="mono-label grid h-full place-items-center text-muted-foreground">
            Sans visuel
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1">
        <h3 className="font-sans text-[0.9375rem] leading-snug font-bold transition-colors group-hover:text-primary">
          <Link
            className="outline-none after:absolute after:inset-0 after:content-['']"
            href={`/${article.slug}`}
          >
            {article.title}
          </Link>
        </h3>
        {article.meta?.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {article.meta.description}
          </p>
        )}
      </div>
    </article>
  )
}

export const metadata: Metadata = {
  title: 'Débuter la moto — le parcours complet | Les Bikeuses',
  description:
    'Du premier doute au premier équipement : permis, choix de la machine et protections, expliqués étape par étape pour les femmes qui commencent la moto.',
}
