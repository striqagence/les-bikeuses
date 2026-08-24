import React from 'react'

import type { DebuterBlock as DebuterBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const DebuterBlock: React.FC<DebuterBlockProps & { id?: string }> = ({
  id,
  etapes,
  eyebrow,
  intro,
  links,
  title,
  titleAccent,
}) => {
  return (
    <section className="bg-bitume py-14 text-sur-bitume md:py-24" id={`block-${id}`}>
      <div className="container grid items-start gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div>
          {eyebrow && <p className="eyebrow text-brand-bright">{eyebrow}</p>}
          <h2 className="wonk mt-3 text-3xl leading-[1.05] font-medium md:text-5xl">
            {title}{' '}
            {titleAccent && <em className="text-brand-bright">{titleAccent}</em>}
          </h2>
          {intro && <p className="mt-5 max-w-[40ch] text-taupe-nuit">{intro}</p>}
          {!!links?.length && (
            <div className="mt-8 flex flex-wrap gap-3">
              {links.map(({ link }, i) => (
                <CMSLink
                  {...link}
                  className="inline-flex items-center gap-2 border-[1.5px] border-sur-bitume px-6 py-3.5 text-sm font-bold transition-colors hover:bg-sur-bitume hover:text-bitume"
                  key={i}
                />
              ))}
            </div>
          )}
        </div>

        {!!etapes?.length && (
          <ol className="flex flex-col">
            {etapes.map((etape, i) => (
              <li
                className="grid grid-cols-[3rem_1fr] gap-5 border-t border-trait-nuit py-5 last:border-b"
                key={etape.id ?? i}
              >
                <span className="mono-label pt-1 text-brand-bright">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-sans text-base font-bold">{etape.title}</h3>
                  {etape.text && <p className="mt-1 text-sm text-taupe-nuit">{etape.text}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
