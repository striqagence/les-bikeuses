import React from 'react'

import type { CarrouselProduitsBlock as Props, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

/**
 * Bande de produits défilante horizontalement.
 *
 * Défilement natif par `overflow-x` et non carrousel scripté : sur mobile le
 * geste est déjà le bon, et il n'y a aucun état à synchroniser.
 */
export const CarrouselProduitsBlock: React.FC<Props & { className?: string }> = ({
  className,
  titre,
  produits,
}) => {
  const fiches = (produits ?? []).filter((p): p is Product => typeof p === 'object')
  if (!fiches.length) return null

  return (
    <aside className={cn('my-10 not-prose', className)}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="mono-label text-primary">{titre || 'Produits associés'}</h2>
        <span className="mono-label text-muted-foreground">
          {fiches.length} référence{fiches.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Marges négatives : la bande déborde la mesure du texte et va se
          couper au bord de l'écran, pour qu'on voie qu'elle défile. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        <ul className="flex list-none gap-4 p-0">
          {fiches.map((produit) => (
            <li className="w-[190px] shrink-0" key={produit.id}>
              <Fiche produit={produit} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

const Fiche: React.FC<{ produit: Product }> = ({ produit }) => {
  const image = produit.gallery?.[0]?.image
  const prix =
    typeof produit.price === 'number'
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(produit.price)
      : null

  const contenu = (
    <>
      <div className="aspect-square overflow-hidden rounded-[14px] border border-border bg-card">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            resource={image}
            size="190px"
            variante="square"
          />
        ) : (
          <div className="mono-label grid h-full place-items-center text-muted-foreground">
            Sans visuel
          </div>
        )}
      </div>
      <p className="mt-2.5 mb-0 line-clamp-2 text-sm leading-snug font-semibold transition-colors group-hover:text-primary">
        {produit.title}
      </p>
      {prix && <p className="mono-label mt-1 mb-0 text-muted-foreground">{prix}</p>}
    </>
  )

  // Pas de fiche produit sur ce site tant que la boutique n'est pas ouverte :
  // le lien renvoie vers lesbikeuses.fr, où l'on peut réellement acheter.
  return produit.sourceUrl ? (
    <a className="group block" href={produit.sourceUrl} rel="noopener noreferrer" target="_blank">
      {contenu}
    </a>
  ) : (
    <div className="group block">{contenu}</div>
  )
}
