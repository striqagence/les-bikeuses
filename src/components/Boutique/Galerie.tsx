'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Entree = NonNullable<Product['gallery']>[number]

/**
 * Galerie de la fiche produit : miniatures et visuel principal.
 *
 * `object-contain` : les visuels produits sont détourés sur fond blanc, un
 * recadrage couperait les manches et les extrémités.
 *
 * Le nombre de visuels va de un à seize selon les références. La colonne de
 * miniatures défile donc plutôt que de s'allonger indéfiniment, et se replie
 * en bandeau horizontal sous le visuel dès que la largeur manque.
 */
export const Galerie: React.FC<{ images: Entree[]; titre: string }> = ({ images, titre }) => {
  const visuels = images.filter((e) => e.image && typeof e.image === 'object')
  const [actif, setActif] = useState(0)
  const [agrandi, setAgrandi] = useState(false)

  const courantIndex = Math.min(actif, Math.max(0, visuels.length - 1))

  const deplacer = useCallback(
    (pas: number) => {
      setActif((i) => {
        const n = visuels.length
        return n ? (i + pas + n) % n : 0
      })
    },
    [visuels.length],
  )

  if (!visuels.length) {
    return (
      <div className="mono-label grid aspect-square place-items-center rounded-panneau border border-border bg-secondary text-muted-foreground">
        Sans visuel
      </div>
    )
  }

  const courant = visuels[courantIndex]
  const multiple = visuels.length > 1

  return (
    <div
      className={cn(
        'grid gap-3',
        multiple ? 'sm:grid-cols-[88px_minmax(0,1fr)] sm:items-start' : 'grid-cols-1',
      )}
    >
      {multiple && (
        <div
          className={cn(
            'flex gap-2.5 max-sm:order-2 max-sm:overflow-x-auto max-sm:pb-1',
            // Au-delà de six vignettes la colonne défile plutôt que de
            // dépasser la hauteur du visuel qu'elle accompagne.
            'sm:max-h-[620px] sm:flex-col sm:overflow-y-auto sm:pr-1',
          )}
        >
          {visuels.map((e, i) => (
            <button
              aria-current={i === courantIndex}
              aria-label={`Visuel ${i + 1} sur ${visuels.length}`}
              className={cn(
                'aspect-square w-[72px] shrink-0 overflow-hidden rounded-xl border bg-card transition-colors sm:w-full',
                i === courantIndex
                  ? 'border-2 border-primary'
                  : 'border-border hover:border-primary/50',
              )}
              key={e.id ?? i}
              onClick={() => setActif(i)}
              type="button"
            >
              <Media
                className="h-full"
                imgClassName="h-full w-full object-contain"
                resource={e.image}
                size="88px"
                variante="thumbnail"
              />
            </button>
          ))}
        </div>
      )}

      <div className="min-w-0">
        <button
          aria-label="Voir le visuel en grand"
          className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-panneau border border-border bg-card"
          onClick={() => setAgrandi(true)}
          type="button"
        >
          <Media
            className="h-full"
            imgClassName="h-full w-full object-contain"
            priority
            resource={courant.image}
            size="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 760px"
            variante="large"
          />

          <span
            aria-hidden="true"
            className="mono-label absolute right-3 bottom-3 rounded-pilule bg-background/90 px-2.5 py-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Agrandir
          </span>

          {multiple && (
            <span className="mono-label absolute top-3 left-3 rounded-pilule bg-background/90 px-2.5 py-1.5 tabular-nums">
              {courantIndex + 1} / {visuels.length}
            </span>
          )}
        </button>
      </div>

      {agrandi && (
        <VueAgrandie
          index={courantIndex}
          onDeplacer={deplacer}
          onFermer={() => setAgrandi(false)}
          titre={titre}
          visuels={visuels}
        />
      )}
    </div>
  )
}

/**
 * Visuel en plein écran.
 *
 * Un équipement se juge sur le détail — la couture d'une coque, le grain d'un
 * cuir — que la vignette de la fiche ne rend pas. La vue s'ouvre au clic, se
 * ferme par Échap, et les flèches font défiler les visuels.
 */
const VueAgrandie: React.FC<{
  visuels: Entree[]
  index: number
  titre: string
  onFermer: () => void
  onDeplacer: (pas: number) => void
}> = ({ visuels, index, titre, onFermer, onDeplacer }) => {
  const fermeture = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    fermeture.current?.focus()

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
      if (e.key === 'ArrowRight') onDeplacer(1)
      if (e.key === 'ArrowLeft') onDeplacer(-1)
    }

    // Le fond ne défile plus tant que la vue est ouverte.
    const defilement = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', auClavier)

    return () => {
      document.body.style.overflow = defilement
      window.removeEventListener('keydown', auClavier)
    }
  }, [onFermer, onDeplacer])

  const multiple = visuels.length > 1

  return (
    <div
      aria-label={`${titre} — visuel ${index + 1} sur ${visuels.length}`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-bitume/95 p-4 backdrop-blur-sm sm:p-8"
      onClick={onFermer}
      role="dialog"
    >
      <div className="flex shrink-0 items-center justify-between gap-4">
        <p className="mono-label text-background/70">
          {multiple ? `${index + 1} / ${visuels.length}` : titre}
        </p>
        <button
          className="mono-label rounded-pilule bg-background px-3.5 py-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          onClick={onFermer}
          ref={fermeture}
          type="button"
        >
          Fermer
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-3 py-4">
        {multiple && (
          <Fleche
            direction="precedent"
            onClick={(e) => {
              e.stopPropagation()
              onDeplacer(-1)
            }}
          />
        )}

        <div className="flex h-full min-w-0 flex-1 items-center justify-center">
          <Media
            className="flex h-full w-full items-center justify-center"
            imgClassName="max-h-full w-auto max-w-full object-contain"
            resource={visuels[index]?.image}
            size="(max-width: 1024px) 92vw, 1400px"
          />
        </div>

        {multiple && (
          <Fleche
            direction="suivant"
            onClick={(e) => {
              e.stopPropagation()
              onDeplacer(1)
            }}
          />
        )}
      </div>
    </div>
  )
}

const Fleche: React.FC<{
  direction: 'precedent' | 'suivant'
  onClick: (e: React.MouseEvent) => void
}> = ({ direction, onClick }) => (
  <button
    aria-label={direction === 'precedent' ? 'Visuel précédent' : 'Visuel suivant'}
    className="grid size-11 shrink-0 place-items-center rounded-pilule bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
    onClick={onClick}
    type="button"
  >
    <svg
      aria-hidden="true"
      className="size-5 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === 'precedent' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
)
