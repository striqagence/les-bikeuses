import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

/**
 * Héros éditorial.
 *
 * Le type porte la promesse à gauche, la photo tient la droite — le contraste
 * du titre ne dépend donc jamais de l'image posée derrière, contrairement à un
 * bandeau pleine largeur en surimpression.
 *
 * Les chiffres sont posés sur la photo plutôt qu'alignés sous les boutons :
 * détachés, ils allongeaient la colonne de texte et ajoutaient un deuxième
 * filet horizontal juste après celui des boutons. Sur l'image, ils tiennent le
 * rôle du bandeau de caractéristiques d'une fiche d'équipement — la ligne
 * directrice de la charte.
 *
 * Les visuels secondaires passent au second plan, en bande étroite : trois
 * images de même poids donnaient un collage, où l'œil ne savait pas où aller.
 */
export const HighImpactHero: React.FC<Page['hero']> = ({
  eyebrow,
  links,
  marquee,
  media,
  mediaSecondary,
  richText,
  stats,
}) => {
  const visuelsSecondaires = (mediaSecondary ?? []).filter(
    (item) => item.image && typeof item.image === 'object',
  )
  const mentions = (marquee ?? []).map((item) => item.text).filter(Boolean)
  const chiffres = stats ?? []

  return (
    // `-mt-16` annule le `pt-16` de l'article : le héros porte son propre
    // rythme vertical, et le bandeau défilant doit toucher le bloc suivant.
    <section className="-mt-16">
      <div className="container grid items-center gap-10 border-b border-border py-10 md:grid-cols-[1.02fr_0.98fr] md:gap-14 md:py-16">
        <div>
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}

          {richText && (
            <RichText
              className="heros-titre"
              data={richText}
              enableGutter={false}
              enableProse={false}
            />
          )}

          {Array.isArray(links) && links.length > 0 && (
            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              {links.map(({ link }, i) => (
                <li key={i}>
                  {/* Le premier appel tranche, le second s'efface : deux
                      boutons pleins se disputaient le regard. */}
                  <CMSLink
                    {...link}
                    appearance={i === 0 ? undefined : 'link'}
                    className={
                      i === 0
                        ? 'inline-flex items-center gap-2.5 rounded-pilule bg-primary px-7 py-3.5 font-bold text-primary-foreground transition-colors hover:bg-brand-bright'
                        : 'mono-label inline-flex items-center gap-2 underline-offset-4 hover:text-primary hover:underline'
                    }
                    size={i === 0 ? 'lg' : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {media && typeof media === 'object' && (
          <div className="flex flex-col gap-3">
            <figure className="relative m-0 aspect-[5/4] overflow-hidden rounded-slide bg-secondary md:aspect-[4/5]">
              <Media
                className="h-full"
                imgClassName="h-full w-full object-cover"
                priority
                resource={media}
                size="(max-width: 768px) 100vw, 46vw"
                variante="large"
              />

              {chiffres.length > 0 && (
                <dl className="absolute inset-x-0 bottom-0 m-0 flex flex-wrap gap-x-7 gap-y-2 bg-linear-to-t from-bitume via-bitume/85 to-transparent px-5 pt-12 pb-5 text-sur-bitume">
                  {chiffres.map((stat, i) => (
                    <div className="flex flex-col" key={stat.id ?? i}>
                      <dt className="mono-label text-sur-bitume/60">{stat.label}</dt>
                      <dd className="wonk order-first m-0 text-2xl leading-none font-medium tabular-nums">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </figure>

            {visuelsSecondaires.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {visuelsSecondaires.map((item, i) => (
                  <div
                    className="aspect-[3/2] overflow-hidden rounded-panneau bg-secondary"
                    key={item.id ?? i}
                  >
                    <Media
                      className="h-full"
                      imgClassName="h-full w-full object-cover"
                      resource={item.image}
                      size="(max-width: 768px) 50vw, 23vw"
                      variante="small"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {mentions.length > 0 && <Bandeau mentions={mentions} />}
    </section>
  )
}

// Deux pistes identiques défilent côte à côte pour boucler sans à-coup.
// En `prefers-reduced-motion`, l'animation est coupée (cf. globals.css) : la
// première piste reste lisible, la seconde est purement décorative.
const Bandeau: React.FC<{ mentions: string[] }> = ({ mentions }) => (
  <div aria-hidden="true" className="overflow-hidden bg-bitume py-3 text-sur-bitume">
    <div className="flex whitespace-nowrap">
      {[0, 1].map((piste) => (
        <div className="bandeau-piste flex shrink-0 gap-12 pr-12" key={piste}>
          {mentions.map((mention, i) => (
            <span className="mono-label flex items-center gap-3" key={i}>
              <span className="text-[0.5rem] text-brand-bright">◆</span>
              {mention}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
)
