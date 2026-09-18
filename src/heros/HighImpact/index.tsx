import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

/**
 * Héros affiche.
 *
 * La promesse est posée *dans* la photo et non à côté : une image encartée,
 * pleine largeur, coins adoucis, le titre en bas à gauche. La version en deux
 * colonnes mettait le type et la photo à égalité — deux centres d'attention,
 * donc aucun.
 *
 * Le contraste du titre ne dépend pas pour autant du hasard de l'image : un
 * dégradé sombre monte du bas et garantit le rapport, quelle que soit la photo
 * que la rédaction dépose.
 */
/** Colonnes de la bande secondaire, indexées par le nombre de visuels. */
const COLONNES: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

export const HighImpactHero: React.FC<Page['hero']> = ({
  eyebrow,
  links,
  marquee,
  media,
  mediaSecondary,
  richText,
}) => {
  const visuelsSecondaires = (mediaSecondary ?? []).filter(
    (item) => item.image && typeof item.image === 'object',
  )
  const mentions = (marquee ?? []).map((item) => item.text).filter(Boolean)

  return (
    // `-mt-16` annule le `pt-16` de l'article : le héros porte son propre
    // rythme vertical, et le bandeau défilant doit toucher le bloc suivant.
    <section className="-mt-16 pt-4 md:pt-6">
      <div className="container">
        <div className="relative isolate flex min-h-[clamp(400px,62vh,600px)] flex-col justify-end overflow-hidden rounded-slide bg-bitume">
          {media && typeof media === 'object' && (
            <Media
              className="absolute inset-0 -z-10"
              imgClassName="h-full w-full object-cover"
              // `<picture>` est en ligne par défaut : sans passer en bloc, la
              // hauteur du cadre ne descend pas jusqu'à l'image, qui se charge
              // sans jamais s'afficher.
              pictureClassName="block h-full w-full"
              priority
              resource={media}
              size="(max-width: 1280px) 100vw, 1200px"
              variante="large"
            />
          )}

          {/* Un seul dégradé, montant du bas.
              En croiser un second par la gauche paraissait plus sûr pour le
              contraste ; sur une photo déjà sombre — un sous-bois — les deux
              se multipliaient et le quart supérieur gauche virait au noir
              plein. La photo disparaissait derrière son propre voile. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 via-45% to-black/10"
          />

          <div className="p-6 md:p-12 lg:p-16">
            {eyebrow && (
              <p className="mono-label mb-5 flex items-center gap-3 text-white/75">
                <span aria-hidden="true" className="h-px w-8 bg-brand-bright" />
                {eyebrow}
              </p>
            )}

            {richText && (
              <RichText
                className="heros-titre text-white"
                data={richText}
                enableGutter={false}
                enableProse={false}
              />
            )}

            {Array.isArray(links) && links.length > 0 && (
              <ul className="mt-8 flex flex-wrap items-center gap-3">
                {links.map(({ link }, i) => (
                  <li key={i}>
                    {/* Sur une photo, le blanc plein est le seul aplat dont le
                        contraste est acquis d'avance : l'orange de marque, lui,
                        dépend de ce qu'il y a dessous. Il reste sur le filet du
                        sur-titre, où il ne porte pas de texte. */}
                    <CMSLink
                      {...link}
                      appearance="link"
                      className={
                        'mono-label inline-flex items-center gap-2.5 rounded-pilule border px-6 py-3.5 transition-colors ' +
                        (i === 0
                          ? 'border-white bg-white text-bitume hover:bg-white/85'
                          : 'border-white/45 text-white hover:border-white hover:bg-white hover:text-bitume')
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {visuelsSecondaires.length > 0 && (
          // Autant de colonnes que de visuels : une grille de quatre pour deux
          // images laissait la moitié droite vide, ce qui se lit comme un
          // gabarit mal rempli plutôt que comme une bande.
          <div className={`mt-3 grid grid-cols-2 gap-3 ${COLONNES[Math.min(visuelsSecondaires.length, 4)]}`}>
            {visuelsSecondaires.map((item, i) => (
              <div
                className="aspect-[2/1] overflow-hidden rounded-panneau bg-secondary"
                key={item.id ?? i}
              >
                <Media
                  className="h-full"
                  imgClassName="h-full w-full object-cover"
                  pictureClassName="block h-full w-full"
                  resource={item.image}
                  size="(max-width: 768px) 50vw, 40vw"
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
  <div aria-hidden="true" className="mt-10 overflow-hidden border-y border-border py-3.5">
    <div className="flex whitespace-nowrap">
      {[0, 1].map((piste) => (
        <div className="bandeau-piste flex shrink-0 gap-12 pr-12" key={piste}>
          {mentions.map((mention, i) => (
            <span className="mono-label flex items-center gap-3 text-muted-foreground" key={i}>
              <span className="text-[0.5rem] text-brand-bright">◆</span>
              {mention}
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
)
