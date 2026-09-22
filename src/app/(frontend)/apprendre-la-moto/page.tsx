import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import configPromise from '@payload-config'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Post } from '@/payload-types'

import { CarteGuide, Passerelle } from '@/components/Guides/CarteGuide'
import { DOMAINES, type Domaine } from './domaines'

export const revalidate = 600

const chargerGuides = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const slugs = DOMAINES.flatMap((d) => d.slugs)

    const articles = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 100,
      pagination: false,
      where: { slug: { in: slugs } },
      select: { slug: true, title: true, heroImage: true, meta: true },
    })

    return {
      parSlug: Object.fromEntries(articles.docs.map((p) => [p.slug as string, p as Post])),
      nb: articles.docs.length,
    }
  },
  ['guides-apprendre'],
  { revalidate: 600 },
)

export default async function ApprendreLaMoto() {
  const { parSlug, nb } = await chargerGuides()

  return (
    <div className="pb-20">
      <header className="container pt-8 md:pt-14">
        <p className="eyebrow">Apprendre</p>
        <h1 className="titre-section mt-3 max-w-[18ch]">
          Ce qu’on apprend une fois en selle
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg text-muted-foreground">
          Le permis apprend à conduire ; la route apprend le reste. {nb} leçons sur le maniement,
          la conduite par mauvais temps, les normes de protection et l’entretien.
        </p>

        <nav aria-label="Les domaines" className="mt-9 flex flex-wrap gap-2">
          {DOMAINES.map((d) => (
            <a
              className="mono-label rounded-pilule border border-border px-3.5 py-2 transition-colors hover:border-primary hover:text-primary"
              href={`#${d.cle}`}
              key={d.cle}
            >
              {d.titre}
            </a>
          ))}
        </nav>

        {/* La page d'origine reprenait ici douze articles sur le permis. Ils
            vivent sur « Débuter la moto » : un renvoi vaut mieux qu'une redite. */}
        <Passerelle
          action="Voir le parcours"
          detail="Le doute, le permis, le choix de la machine et le premier équipement : tout ce qui vient avant la route."
          eyebrow="Pas encore le permis ?"
          titre="Débuter la moto"
          url="/debuter-la-moto"
        />
      </header>

      {DOMAINES.map((domaine, i) => (
        <SectionDomaine domaine={domaine} key={domaine.cle} parSlug={parSlug} premier={i === 0} />
      ))}

      <section className="container mt-20">
        <div className="rounded-panneau border border-border bg-card p-8 md:p-12">
          <p className="eyebrow">Et ensuite</p>
          <h2 className="wonk mt-3 max-w-[24ch] text-2xl leading-tight md:text-3xl">
            Le journal, pour la suite du voyage
          </h2>
          <p className="mt-4 max-w-[60ch] text-muted-foreground">
            Essais de machines, retours d’équipement, récits de route — écrits par des motardes.
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

const SectionDomaine: React.FC<{
  domaine: Domaine
  parSlug: Record<string, Post>
  premier: boolean
}> = ({ domaine, parSlug, premier }) => {
  // Un article retiré du site disparaît du domaine sans casser la page.
  const articles = domaine.slugs.map((s) => parSlug[s]).filter(Boolean)
  if (!articles.length) return null

  return (
    <section className="container mt-16 scroll-mt-24 md:mt-24" id={domaine.cle}>
      <hr className="route" />
      <div className="mt-7 grid gap-x-12 gap-y-3 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <h2 className="wonk text-2xl leading-tight md:text-4xl">{domaine.titre}</h2>
        <p className="max-w-[54ch] self-end text-muted-foreground">{domaine.chapeau}</p>
      </div>

      <ul className="mt-8 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
          <li key={article.id}>
            {/* Seule la première rangée du premier domaine est visible d'emblée. */}
            <CarteGuide article={article} prioritaire={premier && i < 3} />
          </li>
        ))}
      </ul>

      {domaine.suite && <Passerelle {...domaine.suite} />}
    </section>
  )
}

export const metadata: Metadata = {
  title: 'Apprendre la moto — conduite, normes et entretien | Les Bikeuses',
  description:
    'Maniement, conduite par mauvais temps, normes de protection et entretien : les leçons qui viennent après le permis, pour les femmes à moto.',
  openGraph: mergeOpenGraph({
    title: 'Apprendre la moto — conduite, normes et entretien | Les Bikeuses',
    description: 'Maniement, conduite par mauvais temps, normes de protection et entretien : les leçons qui viennent après le permis, pour les femmes à moto.',
  }),
}
