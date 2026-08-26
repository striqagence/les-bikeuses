import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { Essentiel } from '@/components/Article/Essentiel'
import { ProgressionLecture } from '@/components/Article/ProgressionLecture'
import { Sommaire } from '@/components/Article/Sommaire'
import { construireSommaire } from '@/utilities/sommaire'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const posts = await payload.find({
      collection: 'posts',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    const params = posts.docs.map(({ slug }) => {
      return { slug }
    })

    return params
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

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const sommaire = construireSommaire(post.content)
  const essentiel = post.essentiel ?? []

  return (
    <article className="pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <ProgressionLecture />
      <PostHero post={post} />

      {/* Sommaire en marge sur grand écran, au-dessus du texte en dessous de lg */}
      <div className="container grid items-start gap-8 py-10 md:py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16">
        {sommaire.length > 1 ? <Sommaire entrees={sommaire} /> : <div className="hidden lg:block" />}

        <div className="max-w-[68ch]">
          {essentiel.length > 0 && <Essentiel points={essentiel} />}
          <RichText className="corps-article" data={post.content} enableGutter={false} />
        </div>
      </div>

      {post.relatedPosts && post.relatedPosts.length > 0 && (
        <>
          <div className="container">
            <hr className="route" />
          </div>
          <div className="container pt-10 md:pt-14">
            <p className="eyebrow">À lire ensuite</p>
            <h2 className="wonk mt-2 mb-8 text-3xl font-medium md:text-4xl">
              Dans la même rubrique
            </h2>
            <RelatedPosts docs={post.relatedPosts.filter((post) => typeof post === 'object')} />
          </div>
        </>
      )}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
