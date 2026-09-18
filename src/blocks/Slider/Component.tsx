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
              className="relative isolate flex min-h-[clamp(360px,56vh,560px)] flex-col justify-end p-6 md:p-12"
              hidden={!actif}
              id={`${idBase}-slide-${i}`}
              key={slide.id ?? i}
            >
              {image && typeof image === 'object' && (
                <Media
                  className="absolute inset-0 -z-10 h-full w-full"
                  pictureClassName="block h-full w-full"
                  imgClassName={cn(
                    'h-full w-full object-cover',
                    POSITIONS[slide.positionImage ?? 'center'] ?? 'object-center',
                  )}
                  priority={i === 0}
                  resource={image}
                  size="(max-width: 768px) 100vw, 1240px"
                  variante="large"
                />
              )}

              {/* Le dégradé porte le contraste à la place du carton opaque.
                  Un panneau blanc posé sur la photo garantissait la lisibilité,
                  mais masquait le tiers de l'image qu'il venait couvrir — et la
                  diapositive se lisait comme une annonce collée sur un fond,
                  non comme une image qui parle. */}
              {/* Un voile latéral en plus du montant, contrairement au héros.
                  Là-bas, croiser deux dégradés noyait une photo de sous-bois
                  déjà sombre. Ici le cas est inverse : les visuels sont
                  clairs — ciel, plan d'eau — et le texte est posé sur le côté,
                  à mi-hauteur, là où un dégradé montant n'arrive plus. Le
                  voile suit donc le côté où la rédaction a rangé le texte. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-black/20 to-transparent"
              />
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 -z-10',
                  slide.coteCarton === 'droite'
                    ? 'bg-gradient-to-l from-black/60 via-black/25 via-45% to-transparent'
                    : 'bg-gradient-to-r from-black/60 via-black/25 via-45% to-transparent',
                )}
              />

              <div
                className={cn(
                  'relative flex max-w-[min(36rem,100%)] flex-col items-start gap-4 text-white',
                  slide.coteCarton === 'droite' && 'ml-auto',
                )}
              >
                {slide.eyebrow && (
                  <p className="mono-label flex items-center gap-3 text-white/75">
                    <span aria-hidden="true" className="h-px w-8 bg-brand-bright" />
                    {slide.eyebrow}
                  </p>
                )}
                <h2 className="titre-section max-w-[16ch]">
                  {slide.titre}{' '}
                  {slide.titreAccent && <em>{slide.titreAccent}</em>}
                </h2>
                {slide.texte && <p className="max-w-[46ch] text-sm text-white/80">{slide.texte}</p>}
                {slide.links?.[0]?.link && (
                  <CMSLink
                    {...slide.links[0].link}
                    appearance="link"
                    className="mono-label mt-1 inline-flex items-center gap-2.5 rounded-pilule border border-white bg-white px-6 py-3.5 text-bitume transition-colors hover:bg-white/85"
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
              className="absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 gap-2"
              role="tablist"
            >
              {slides?.map((_, i) => (
                <button
                  aria-controls={`${idBase}-slide-${i}`}
                  aria-current={i === index}
                  aria-label={`Diapositive ${i + 1}`}
                  className={cn(
                    'h-[5px] rounded-pilule transition-all duration-200',
                    i === index ? 'w-11 bg-white' : 'w-[30px] bg-white/45',
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
      'absolute top-1/2 z-[2] hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-white/50 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-bitume sm:grid',
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
