import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

// Héros éditorial : le type porte la promesse à gauche, les visuels tiennent la
// droite. Ce n'est plus un bandeau photo pleine largeur avec le texte en
// surimpression — le contraste du texte ne dépend donc plus de la photo.
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

  return (
    // `-mt-16` annule le `pt-16` de l'article : le héros porte son propre
    // rythme vertical, et le bandeau défilant doit toucher le bloc suivant.
    <section className="-mt-16">
      <div className="container grid items-center gap-10 border-b border-border py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-20">
        <div>
          {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}

          {richText && (
            <RichText
              className="heros-titre"
              data={richText}
              enableGutter={false}
              enableProse={false}
            />
          )}

          {Array.isArray(links) && links.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-3">
              {links.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink {...link} size="lg" />
                </li>
              ))}
            </ul>
          )}

          {!!stats?.length && (
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6">
              {stats.map((stat, i) => (
                <div className="flex flex-col" key={stat.id ?? i}>
                  <dt className="mono-label text-muted-foreground">{stat.label}</dt>
                  <dd className="wonk order-first m-0 text-2xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {media && typeof media === 'object' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 aspect-[16/10] overflow-hidden border border-border bg-secondary">
              <Media
                className="h-full"
                imgClassName="h-full w-full object-cover"
                priority
                resource={media}
                size="(max-width: 768px) 100vw, 45vw"
                variante="medium"
              />
            </div>
            {visuelsSecondaires.map((item, i) => (
              <div
                className="aspect-[4/5] overflow-hidden border border-border bg-secondary"
                key={item.id ?? i}
              >
                <Media
                  className="h-full"
                  imgClassName="h-full w-full object-cover"
                  resource={item.image}
                  size="(max-width: 768px) 50vw, 22vw"
                  variante="small"
                />
              </div>
            ))}
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
