import React from 'react'

import type { ParcoursBlock as ParcoursBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const ParcoursBlock: React.FC<ParcoursBlockProps & { id?: string }> = ({
  id,
  entrees,
  eyebrow,
  intro,
  title,
}) => {
  if (!entrees?.length) return null

  return (
    <section className="py-16 md:py-28" id={`block-${id}`}>
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="titre-section mt-3 max-w-[18ch]">
              {title}
            </h2>
          </div>
          {intro && <p className="max-w-[34ch] text-sm text-muted-foreground">{intro}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {entrees.map((entree, i) => (
            <article
              // Cartes détachées plutôt qu'une grille au trait : une seule
              // ligne d'un pixel entre des angles vifs donnait un tableau,
              // pas une sélection dans laquelle on a envie d'entrer.
              className="flex flex-col gap-3.5 rounded-panneau border border-border bg-card p-7 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_14px_30px_-18px_rgb(0_0_0/0.3)] md:p-10"
              key={entree.id ?? i}
            >
              <h3 className="wonk text-2xl leading-tight font-semibold">{entree.title}</h3>
              {entree.text && <p className="text-sm text-muted-foreground">{entree.text}</p>}
              {entree.link && (
                <CMSLink
                  {...entree.link}
                  className="mono-label mt-auto self-start border-b-[1.5px] border-primary pb-[3px] transition-colors hover:text-primary"
                >
                  {' '}
                  <span aria-hidden="true">→</span>
                </CMSLink>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
