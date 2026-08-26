import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { dateCourte, dureeLecture } from '@/utilities/sommaire'

/**
 * Chapeau d'article.
 *
 * Le titre n'est plus posé en blanc sur la photo : sa lisibilité ne dépend
 * donc plus du visuel chargé, qui illustre au lieu de servir de fond.
 */
export const PostHero: React.FC<{ post: Post }> = ({ post }) => {
  const { categories, content, heroImage, meta, publishedAt, title } = post

  const rubrique = categories?.find((c) => typeof c === 'object')
  const nomRubrique = typeof rubrique === 'object' ? rubrique.title : null
  const date = dateCourte(publishedAt)
  const duree = dureeLecture(content)

  return (
    <header className="container pt-7 md:pt-12">
      <nav aria-label="Fil d’Ariane" className="mono-label mb-7 flex flex-wrap items-center gap-2 text-muted-foreground">
        <Link className="transition-colors hover:text-primary" href="/">
          Accueil
        </Link>
        <span aria-hidden="true" className="opacity-50">
          /
        </span>
        <Link className="transition-colors hover:text-primary" href="/posts">
          Le journal
        </Link>
        {nomRubrique && (
          <>
            <span aria-hidden="true" className="opacity-50">
              /
            </span>
            <span>{nomRubrique}</span>
          </>
        )}
      </nav>

      {nomRubrique && <p className="eyebrow mb-4">{nomRubrique}</p>}

      <h1 className="wonk max-w-[20ch] text-4xl leading-[1.02] font-medium tracking-[-0.02em] md:text-6xl">
        {title}
      </h1>

      {meta?.description && (
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground">
          {meta.description}
        </p>
      )}

      <dl className="mono-label mt-8 flex flex-wrap gap-x-8 border-y border-border py-4 text-muted-foreground">
        {date && (
          <div className="flex items-baseline gap-2">
            <dt>Publié le</dt>
            <dd className="m-0 font-medium text-foreground">{date}</dd>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <dt>Lecture</dt>
          <dd className="m-0 font-medium text-foreground">{duree} min</dd>
        </div>
        {nomRubrique && (
          <div className="flex items-baseline gap-2">
            <dt>Rubrique</dt>
            <dd className="m-0 font-medium text-foreground">{nomRubrique}</dd>
          </div>
        )}
      </dl>

      {heroImage && typeof heroImage === 'object' && (
        <figure className="m-0 mt-8">
          <div className="aspect-video overflow-hidden rounded-slide bg-secondary">
            <Media
              className="h-full"
              imgClassName="h-full w-full object-cover"
              priority
              resource={heroImage}
              size="(max-width: 1024px) 100vw, 1240px"
            />
          </div>
          {heroImage.alt && (
            <figcaption className="mono-label mt-3 text-muted-foreground">
              {heroImage.alt}
            </figcaption>
          )}
        </figure>
      )}
    </header>
  )
}
