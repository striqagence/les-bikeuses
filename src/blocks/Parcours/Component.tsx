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

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))] lg:gap-12">
          {entrees.map((entree, i) => (
            <article
              // Rien dans une boîte : un filet en tête, le texte posé à même
              // le fond. Les cartes ombrées et surélevées au survol dataient
              // l'ensemble à elles seules — trois panneaux flottants dans une
              // page qui, partout ailleurs, ne flotte pas.
              className="group flex flex-col gap-3.5 border-t-[1.5px] border-foreground pt-6"
              key={entree.id ?? i}
            >
              <h3 className="wonk text-2xl leading-tight">{entree.title}</h3>
              {entree.text && <p className="text-sm text-muted-foreground">{entree.text}</p>}
              {entree.link && (
                <CMSLink
                  {...entree.link}
                  className="mono-label mt-auto inline-flex items-center gap-2.5 self-start rounded-pilule border border-border px-5 py-2.5 transition-colors group-hover:border-primary group-hover:text-primary"
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
