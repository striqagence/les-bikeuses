import Link from 'next/link'
import React from 'react'

import type { Category, Post } from '@/payload-types'

import { Media } from '@/components/Media'

/**
 * Fiche moto du dictionnaire.
 *
 * Les caractéristiques affichées sont tirées des catégories de la fiche :
 * cylindrée, poids et type. Ce sont elles qui font la décision quand on
 * cherche une première moto, bien avant le descriptif.
 */
export const CarteMoto: React.FC<{
  moto: Post
  caracteristiques: (p: Post) => string[]
  marque: (p: Post) => string | null
}> = ({ moto, caracteristiques, marque }) => {
  const image = moto.meta?.image ?? moto.heroImage
  const specs = caracteristiques(moto)
  const nom = marque(moto)

  return (
    <article className="group flex flex-col gap-3.5 rounded-panneau border border-border bg-card p-2.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
      <div className="aspect-[4/3] overflow-hidden rounded-[14px] bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            resource={image}
            size="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 25vw"
            variante="small"
          />
        ) : (
          <div className="mono-label grid h-full place-items-center text-muted-foreground">
            Sans visuel
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
        {nom && <p className="mono-label text-muted-foreground">{nom}</p>}
        <h3 className="font-sans text-[0.9375rem] leading-snug font-bold transition-colors group-hover:text-primary">
          <Link href={`/${moto.slug}`}>{moto.title}</Link>
        </h3>

        {specs.length > 0 && (
          <ul className="mt-auto flex list-none flex-wrap gap-1 p-0 pt-1">
            {specs.map((s) => (
              <li
                className="mono-label rounded-pilule bg-secondary px-2 py-0.5 text-muted-foreground"
                key={s}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

/** Intitulés des catégories d'une fiche, quelle que soit la profondeur reçue. */
export const titresDe = (post: Post): string[] =>
  (post.categories ?? [])
    .filter((c): c is Category => typeof c === 'object')
    .map((c) => c.title)
    .filter(Boolean)
