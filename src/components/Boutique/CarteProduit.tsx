import Link from 'next/link'
import React from 'react'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

export const prixFr = (n?: number | null): string | null =>
  typeof n === 'number'
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : null

/**
 * Carte produit du catalogue.
 *
 * Double arrondi, comme les cartes du journal : la carte et l'image, séparées
 * par un liseré. L'image est en `contain` et non `cover` — les visuels
 * produits sont détourés sur fond blanc, un recadrage couperait les manches.
 */
export const CarteProduit: React.FC<{ produit: Product; className?: string }> = ({
  produit,
  className,
}) => {
  const image = produit.gallery?.[0]?.image
  const prix = prixFr(produit.price)
  const nbTailles = produit.tailles?.length ?? 0

  return (
    <article
      className={cn(
        'group flex flex-col gap-3.5 rounded-panneau border border-border bg-card p-2.5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40',
        className,
      )}
    >
      <div className="aspect-square overflow-hidden rounded-[14px] bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.05]"
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

      <div className="flex flex-1 flex-col gap-0.5 px-1">
        {produit.marque && <p className="mono-label text-muted-foreground">{produit.marque}</p>}
        <h3 className="font-sans text-[0.9375rem] leading-snug font-bold transition-colors group-hover:text-primary">
          <Link href={`/produit/${produit.slug}`}>{produit.title}</Link>
        </h3>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
          {prix && <span className="font-mono text-base tabular-nums">{prix}</span>}
          <span className="mono-label text-muted-foreground">
            {nbTailles ? `${nbTailles} tailles` : 'Taille unique'}
          </span>
        </div>
      </div>
    </article>
  )
}
