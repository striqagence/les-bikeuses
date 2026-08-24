import React from 'react'

import type { ParcoursBlock as ParcoursBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

const LETTRES = 'ABCDEFGH'

export const ParcoursBlock: React.FC<ParcoursBlockProps & { id?: string }> = ({
  id,
  entrees,
  eyebrow,
  intro,
  title,
}) => {
  if (!entrees?.length) return null

  return (
    <section className="py-14 md:py-24" id={`block-${id}`}>
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="mt-2 max-w-[18ch] text-3xl leading-[1.08] text-balance md:text-[2.75rem]">
              {title}
            </h2>
          </div>
          {intro && <p className="max-w-[34ch] text-sm text-muted-foreground">{intro}</p>}
        </div>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {entrees.map((entree, i) => (
            <article
              className="flex flex-col gap-3 bg-card p-7 transition-colors hover:bg-accent md:p-10"
              key={entree.id ?? i}
            >
              <span className="mono-label text-primary">Entrée {LETTRES[i] ?? i + 1}</span>
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
