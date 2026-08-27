import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { VueArticle } from '@/components/Article/VueArticle'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

/**
 * Pages et articles partagent cette route : les articles vivent à la racine,
 * comme sur lesbikeuses.fr, et non sous un préfixe.
 */
export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })

    const [pages, posts] = await Promise.all([
      payload.find({
        collection: 'pages',
        draft: false,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: { slug: true },
      }),
      payload.find({
        collection: 'posts',
        draft: false,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: { slug: true },
      }),
    ])

    return [...pages.docs, ...posts.docs]
      .map(({ slug }) => slug)
      .filter((slug): slug is string => Boolean(slug) && slug !== 'home')
      .map((slug) => ({ slug }))
  } catch {
    // Base non joignable / non initialisée au build : pages générées à la demande.
    return []
  }
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  // Pas de page à ce slug : c'est peut-être un article. Les pages passent en
  // premier — en cas d'homonymie, la page l'emporte.
  if (!page) {
    const post = await queryPostBySlug({ slug: decodedSlug })

    if (post) {
      return (
        <article className="pb-16">
          <PageClient />
          <PayloadRedirects disableNotFound url={url} />
          {draft && <LivePreviewListener />}
          <VueArticle post={post} />
        </article>
      )
    }

    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({ slug: decodedSlug })
  const doc = page ?? (await queryPostBySlug({ slug: decodedSlug }))

  return generateMeta({ doc })
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  return result.docs?.[0] || null
})
