'use client'

import React, { useState } from 'react'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Entree = NonNullable<Product['gallery']>[number]

/**
 * Galerie de la fiche produit : miniatures verticales et visuel principal.
 *
 * `object-contain` : les visuels produits sont détourés sur fond blanc, un
 * recadrage couperait les manches et les extrémités.
 */
export const Galerie: React.FC<{ images: Entree[]; titre: string }> = ({ images, titre }) => {
  const visuels = images.filter((e) => e.image && typeof e.image === 'object')
  const [actif, setActif] = useState(0)

  if (!visuels.length) {
    return (
      <div className="mono-label grid aspect-square place-items-center rounded-panneau border border-border bg-secondary text-muted-foreground">
        Sans visuel
      </div>
    )
  }

  const courant = visuels[Math.min(actif, visuels.length - 1)]

  return (
    <div className="grid gap-3 max-sm:grid-cols-1 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start">
      {visuels.length > 1 && (
        <div className="flex gap-2.5 max-sm:order-2 sm:flex-col">
          {visuels.map((e, i) => (
            <button
              aria-current={i === actif}
              aria-label={`Visuel ${i + 1} sur ${visuels.length}`}
              className={cn(
                'aspect-square w-[72px] overflow-hidden rounded-xl border bg-card transition-colors sm:w-full',
                i === actif ? 'border-2 border-primary' : 'border-border hover:border-primary/50',
              )}
              key={e.id ?? i}
              onClick={() => setActif(i)}
              type="button"
            >
              <Media
                className="h-full"
                imgClassName="h-full w-full object-contain"
                resource={e.image}
                size="72px"
                variante="thumbnail"
              />
            </button>
          ))}
        </div>
      )}

      <div className="aspect-square overflow-hidden rounded-panneau border border-border bg-card">
        <Media
          className="h-full"
          imgClassName="h-full w-full object-contain"
          priority
          resource={courant.image}
          size="(max-width: 1024px) 100vw, 620px"
          variante="medium"
        />
      </div>
      <span className="sr-only">{titre}</span>
    </div>
  )
}
