import React from 'react'

import type { IndexCategoriesBlock as IndexCategoriesBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const IndexCategoriesBlock: React.FC<IndexCategoriesBlockProps & { id?: string }> = ({
  id,
  eyebrow,
  items,
  title,
}) => {
  if (!items?.length) return null

  return (
    <section className="bg-secondary py-16 md:py-28" id={`block-${id}`}>
      <div className="container">
        <div className="mb-10">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="mt-3 max-w-[16ch] text-[2.1rem] leading-[0.98] tracking-[-0.025em] text-balance md:text-[3.25rem]">
            {title}
          </h2>
        </div>

        <div className="grid gap-x-8 md:grid-cols-2 lg:gap-x-20">
          {items.map((item, i) => (
            <CMSLink
              {...item.link}
              className="flex items-baseline justify-between gap-4 border-b border-border py-4 transition-[padding,color] hover:pl-3 hover:text-primary"
              key={item.id ?? i}
            >
              <span className="wonk text-lg font-medium md:text-2xl">{item.label}</span>
              {item.meta && (
                <span className="mono-label shrink-0 text-muted-foreground">{item.meta}</span>
              )}
            </CMSLink>
          ))}
        </div>
      </div>
    </section>
  )
}
