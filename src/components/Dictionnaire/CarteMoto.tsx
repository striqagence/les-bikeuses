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
  /** Première rangée : chargée sans attendre, comme les cartes produit. */
  prioritaire?: boolean
}> = ({ moto, caracteristiques, marque, prioritaire = false }) => {
  const image = moto.meta?.image ?? moto.heroImage
  const specs = caracteristiques(moto)
  const nom = marque(moto)

  return (
    // Cliquable en entier, par un lien unique étiré : voir CarteProduit.
    <article className="group relative flex flex-col gap-3.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 focus-within:ring-offset-background">
      <div className="aspect-[4/3] overflow-hidden rounded-panneau bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            resource={image}
            priority={prioritaire}
            size="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 300px"
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
        <h3 className="text-[0.9375rem] leading-snug transition-colors group-hover:text-primary">
          <Link
            className="outline-none after:absolute after:inset-0 after:content-['']"
            href={`/${moto.slug}`}
          >
            {moto.title}
          </Link>
        </h3>

        {specs.length > 0 && (
          // Une ligne de données séparées par des points, plutôt que trois
          // pastilles grises. Les aplats faisaient de caractéristiques — une
          // cylindrée, un poids, un type — des étiquettes d'arrière-boutique,
          // alors que c'est précisément ce qu'on vient lire sur une fiche.
          <ul className="mono-label mt-auto flex list-none flex-wrap items-baseline gap-x-3 gap-y-1 p-0 pt-1.5 text-muted-foreground">
            {/*
              * Un losange devant chaque valeur, y compris la première, comme
              * le bandeau du héros. Ne le poser qu'entre les valeurs laissait
              * un losange orphelin en tête de seconde ligne dès que la liste
              * se repliait — trois caractéristiques sur une carte étroite,
              * c'est-à-dire presque toujours.
              */}
            {specs.map((valeur) => (
              <li className="flex items-baseline gap-1.5" key={valeur}>
                <span aria-hidden="true" className="text-[0.5rem] text-primary/60">
                  ◆
                </span>
                {valeur}
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
