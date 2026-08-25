'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

import type { SliderBlock as SliderBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

const POSITIONS: Record<string, string> = {
  center: 'object-center',
  left: 'object-left',
  right: 'object-right',
  top: 'object-top',
  bottom: 'object-bottom',
}

export const SliderBlock: React.FC<SliderBlockProps & { id?: string }> = ({
  id,
  slides,
  defilementAuto,
  delai,
}) => {
  const total = slides?.length ?? 0
  const [index, setIndex] = useState(0)
  const [enPause, setEnPause] = useState(false)
  const conteneur = useRef<HTMLDivElement>(null)
  const idBase = useId()

  const aller = useCallback(
    (n: number) => setIndex((n + total) % total),
    [total],
  )

  useEffect(() => {
    if (!defilementAuto || enPause || total < 2) return
    // Respecte le réglage système : pas de défilement imposé à qui a demandé
    // moins d'animations. Les flèches et les pastilles restent utilisables.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, (delai ?? 6) * 1000)

    return () => window.clearInterval(t)
  }, [defilementAuto, delai, enPause, total])

  if (!total) return null

  return (
    <section
      aria-label="Mises en avant"
      aria-roledescription="carrousel"
      className="container"
      id={`block-${id}`}
    >
      <div
        className="relative isolate mt-5 overflow-hidden rounded-slide bg-secondary"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setEnPause(false)
        }}
        // Suspendu au survol et pendant la navigation au clavier : sinon la
        // diapositive se dérobe pendant qu'on la lit.
        onFocus={() => setEnPause(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') aller(index - 1)
          if (e.key === 'ArrowRight') aller(index + 1)
        }}
        onMouseEnter={() => setEnPause(true)}
        onMouseLeave={() => setEnPause(false)}
        ref={conteneur}
      >
        {slides?.map((slide, i) => {
          const actif = i === index
          const image = slide.image

          return (
            // Une seule diapositive dans le flux : rien d'invisible n'attrape
            // le clavier, travers classique des carrousels.
            <article
              aria-label={`${i + 1} sur ${total}`}
              aria-roledescription="diapositive"
              className={cn(
                'relative flex min-h-[clamp(360px,56vh,580px)] items-center p-5 md:p-12',
                slide.coteCarton === 'droite' && 'justify-end',
              )}
              hidden={!actif}
              id={`${idBase}-slide-${i}`}
              key={slide.id ?? i}
            >
              {image && typeof image === 'object' && (
                <Media
                  className="absolute inset-0 z-0 h-full w-full"
                  imgClassName={cn(
                    'h-full w-full object-cover',
                    POSITIONS[slide.positionImage ?? 'center'] ?? 'object-center',
                  )}
                  priority={i === 0}
                  resource={image}
                  size="(max-width: 768px) 100vw, 1240px"
                />
              )}

              {/* Carton opaque : la lisibilité du titre ne dépend jamais de
                  la photo posée derrière. */}
              <div className="relative z-[1] flex max-w-[min(30rem,100%)] flex-col items-start gap-3.5 rounded-panneau border border-border bg-card p-6 md:p-9">
                {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
                <h2 className="wonk text-3xl leading-[1.03] font-medium md:text-[2.75rem]">
                  {slide.titre}{' '}
                  {slide.titreAccent && <em className="text-primary">{slide.titreAccent}</em>}
                </h2>
                {slide.texte && <p className="text-sm text-muted-foreground">{slide.texte}</p>}
                {slide.links?.[0]?.link && (
                  <CMSLink
                    {...slide.links[0].link}
                    className="mt-1 inline-flex items-center gap-2.5 rounded-pilule bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-brand-bright"
                  />
                )}
              </div>
            </article>
          )
        })}

        {total > 1 && (
          <>
            <Fleche direction="prec" onClick={() => aller(index - 1)} />
            <Fleche direction="suiv" onClick={() => aller(index + 1)} />

            <div
              aria-label="Choisir une diapositive"
              className="absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 gap-2 rounded-pilule border border-border bg-card/90 px-3 py-2 backdrop-blur-sm"
              role="tablist"
            >
              {slides?.map((_, i) => (
                <button
                  aria-controls={`${idBase}-slide-${i}`}
                  aria-current={i === index}
                  aria-label={`Diapositive ${i + 1}`}
                  className={cn(
                    'h-[5px] rounded-pilule transition-all duration-200',
                    i === index ? 'w-11 bg-primary' : 'w-[30px] bg-border',
                  )}
                  key={i}
                  onClick={() => aller(i)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const Fleche: React.FC<{ direction: 'prec' | 'suiv'; onClick: () => void }> = ({
  direction,
  onClick,
}) => (
  <button
    aria-label={direction === 'prec' ? 'Diapositive précédente' : 'Diapositive suivante'}
    className={cn(
      'absolute top-1/2 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:grid',
      direction === 'prec' ? 'left-2 md:left-4' : 'right-2 md:right-4',
    )}
    onClick={onClick}
    type="button"
  >
    <svg aria-hidden="true" className="size-[18px] fill-none stroke-current stroke-2" viewBox="0 0 24 24">
      <path
        d={direction === 'prec' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
)
