'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<
  Post,
  'slug' | 'categories' | 'meta' | 'title' | 'publishedAt' | 'heroImage'
>

/**
 * Carte d'article.
 *
 * Deux niveaux d'arrondi : la carte, et l'image à l'intérieur. L'image n'est
 * pas à fleur de bord — un liseré de carte la sépare du fond, ce qui rend
 * l'arrondi lisible même sur une photo claire.
 *
 * `variante="une"` bascule en horizontal pour le premier article de la liste.
 */
export const Card: React.FC<{
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
  variante?: 'grille' | 'une'
}> = ({ className, doc, relationTo, showCategories, title: titreProp, variante = 'grille' }) => {
  const { card, link } = useClickableCard({})
  const { slug, categories, meta, title, publishedAt, heroImage } = doc || {}
  const { description, image: metaImage } = meta || {}

  const image = metaImage ?? heroImage
  const titre = titreProp || title
  const href = `/${relationTo}/${slug}`
  const une = variante === 'une'

  const rubrique = categories?.find((c) => typeof c === 'object')
  const nomRubrique = typeof rubrique === 'object' ? rubrique.title : null

  return (
    <article
      className={cn(
        'group flex cursor-pointer flex-col gap-4 rounded-panneau border border-border bg-card p-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40',
        une && 'md:grid md:grid-cols-2 md:items-center md:gap-7 md:p-4',
        className,
      )}
      ref={card.ref}
    >
      <div
        className={cn(
          'overflow-hidden rounded-[14px] bg-secondary',
          une ? 'aspect-[16/10]' : 'aspect-[3/2]',
        )}
      >
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            resource={image}
            size={une ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'}
            variante={une ? 'medium' : 'small'}
          />
        ) : (
          <div className="mono-label grid h-full place-items-center text-muted-foreground">
            Sans visuel
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-2.5 px-1.5 pb-2', une && 'md:px-3')}>
        <div className="mono-label flex flex-wrap items-center gap-3 text-muted-foreground">
          {showCategories && nomRubrique && (
            <span className="rounded-pilule bg-accent px-2.5 py-1 text-primary">{nomRubrique}</span>
          )}
          {publishedAt && <time dateTime={publishedAt}>{dateCourte(publishedAt)}</time>}
        </div>

        {titre && (
          <h3
            className={cn(
              'font-sans leading-snug font-bold transition-colors group-hover:text-primary',
              une ? 'text-xl md:text-3xl' : 'text-base',
            )}
          >
            <Link href={href} ref={link.ref}>
              {titre}
            </Link>
          </h3>
        )}

        {description && (
          <p
            className={cn(
              'text-sm text-muted-foreground',
              // Deux lignes en grille, quatre pour la une : les cartes de la
              // grille doivent rester de hauteur comparable.
              une ? 'line-clamp-4 md:text-base' : 'line-clamp-2',
            )}
          >
            {description.replace(/\s/g, ' ')}
          </p>
        )}
      </div>
    </article>
  )
}

const dateCourte = (valeur: string): string => {
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(date)
    .replace(/\//g, '.')
}
