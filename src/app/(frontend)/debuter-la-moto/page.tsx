import type { Metadata } from 'next'

import configPromise from '@payload-config'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'

import { CarteGuide, Passerelle } from '@/components/Guides/CarteGuide'
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

        <hr className="route mt-9 max-w-3xl" />
        <dl className="mt-7 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
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

      {/* Une fois le permis en poche, la suite se joue sur la page sœur. */}
      <section className="container mt-16 md:mt-24">
        <Passerelle
          action="Voir les leçons"
          detail="Maniement, conduite par mauvais temps, normes de protection et entretien : ce qu'on apprend une fois en selle."
          eyebrow="Déjà le permis ?"
          titre="Apprendre la moto"
          url="/apprendre-la-moto"
        />
      </section>

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
      <hr className="route" />
      <div className="mt-7 grid gap-x-12 gap-y-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
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
        <Passerelle
          detail={etape.suite.detail}
          eyebrow="Pour aller plus loin"
          titre={etape.suite.libelle}
          url={etape.suite.url}
        />
      )}
    </section>
  )
}

export const metadata: Metadata = {
  title: 'Débuter la moto — le parcours complet | Les Bikeuses',
  description:
    'Du premier doute au premier équipement : permis, choix de la machine et protections, expliqués étape par étape pour les femmes qui commencent la moto.',
}
