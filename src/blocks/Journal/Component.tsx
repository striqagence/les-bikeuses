import type { JournalBlock as JournalBlockProps, Post } from '@/payload-types'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'

// Format « 18.08.2026 » — les dates font partie des données affichées en mono.
const formatDateFR = (value?: string | null): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/\//g, '.')
}

const premiereCategorie = (post: Post): string | null => {
  const categorie = post.categories?.find((category) => typeof category === 'object')
  return typeof categorie === 'object' ? (categorie.title ?? null) : null
}

export const JournalBlock: React.FC<JournalBlockProps & { id?: string }> = async (props) => {
  const {
    id,
    categories,
    eyebrow,
    limit: limitFromProps,
    links,
    populateBy,
    selectedDocs,
    title,
  } = props

  let posts: Post[] = []

  if (populateBy === 'selection') {
    posts = (selectedDocs ?? [])
      .map((doc) => doc.value)
      .filter((value): value is Post => typeof value === 'object')
  } else {
    const payload = await getPayload({ config: configPromise })
    const categoryIds = categories
      ?.map((category) => (typeof category === 'object' ? category.id : category))
      .filter(Boolean)

    const fetched = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: limitFromProps || 5,
      sort: '-publishedAt',
      ...(categoryIds?.length ? { where: { categories: { in: categoryIds } } } : {}),
    })

    posts = fetched.docs
  }

  if (!posts.length) return null

  const [une, ...breves] = posts

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
          {links?.[0]?.link && (
            <CMSLink
              {...links[0].link}
              className="mono-label border-b-[1.5px] border-primary pb-[3px] transition-colors hover:text-primary"
            >
              {' '}
              <span aria-hidden="true">→</span>
            </CMSLink>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
          <Une post={une} />

          {!!breves.length && (
            <div className="flex flex-col">
              {breves.map((post) => (
                <Breve key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

const Meta: React.FC<{ post: Post }> = ({ post }) => {
  const categorie = premiereCategorie(post)
  const date = formatDateFR(post.publishedAt)

  if (!categorie && !date) return null

  return (
    <p className="mono-label flex gap-2.5 text-muted-foreground">
      {categorie && <span className="text-primary">{categorie}</span>}
      {date && <span>{date}</span>}
    </p>
  )
}

const Une: React.FC<{ post: Post }> = ({ post }) => {
  const image = post.meta?.image ?? post.heroImage

  return (
    <Link className="group flex flex-col gap-4" href={`/posts/${post.slug}`}>
      {image && typeof image === 'object' && (
        <div className="aspect-video overflow-hidden border border-border bg-secondary">
          <Media
            className="h-full"
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            resource={image}
            size="60vw"
          />
        </div>
      )}
      <Meta post={post} />
      <h3 className="wonk max-w-[22ch] text-2xl leading-[1.12] font-medium transition-colors group-hover:text-primary md:text-[2rem]">
        {post.title}
      </h3>
      {post.meta?.description && (
        <p className="max-w-[52ch] text-muted-foreground">{post.meta.description}</p>
      )}
    </Link>
  )
}

const Breve: React.FC<{ post: Post }> = ({ post }) => (
  <Link
    className="group flex flex-col gap-1.5 border-t border-border py-5 last:border-b"
    href={`/posts/${post.slug}`}
  >
    <Meta post={post} />
    <h4 className="font-sans text-base leading-snug font-bold transition-colors group-hover:text-primary">
      {post.title}
    </h4>
  </Link>
)
