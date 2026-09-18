import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

/**
 * Carte d'article, pour les pages-carrefour.
 *
 * Même idiome que les cartes du catalogue : la carte entière est cliquable,
 * mais ne contient qu'un seul lien — celui du titre, étiré par un
 * pseudo-élément. Deux liens par carte doubleraient chaque article dans la
 * liste des liens de la page.
 */
export const CarteGuide: React.FC<{ article: Post; prioritaire?: boolean }> = ({
  article,
  prioritaire = false,
}) => {
  const image = article.heroImage

  return (
    <article className="group relative flex h-full flex-col gap-3.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 focus-within:ring-offset-background">
      <div className="aspect-[16/10] overflow-hidden rounded-panneau bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            priority={prioritaire}
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

/** Encart de fin de section : la destination du site vers laquelle elle mène. */
export const Passerelle: React.FC<{
  eyebrow: string
  titre: string
  detail: string
  url: string
  action?: string
}> = ({ eyebrow, titre, detail, url, action = 'Y aller' }) => (
  <Link
    className="group mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-panneau border border-primary/40 bg-accent p-6 transition-colors hover:border-primary"
    href={url}
  >
    <div className="max-w-[52ch]">
      <p className="mono-label text-primary">{eyebrow}</p>
      <p className="wonk mt-1.5 text-xl font-medium">{titre}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>
    </div>
    <span
      aria-hidden="true"
      className="mono-label shrink-0 rounded-pilule bg-primary px-4 py-2.5 text-primary-foreground transition-transform group-hover:translate-x-1"
    >
      {action} →
    </span>
  </Link>
)
