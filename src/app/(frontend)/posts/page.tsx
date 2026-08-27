import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 24,
    overrideAccess: false,
    sort: '-publishedAt',
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      publishedAt: true,
      heroImage: true,
    },
  })

  return (
    <div className="pt-10 pb-24 md:pt-16">
      <PageClient />

      <header className="container mb-10 md:mb-14">
        <p className="eyebrow">Le journal</p>
        <h1 className="wonk mt-3 max-w-[18ch] text-4xl leading-[1.03] font-medium md:text-6xl">
          Essais, conseils et routes à faire
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted-foreground">
          Choisir sa première moto, s’équiper pour la saison, préparer un long
          trajet : ce qu’on aurait aimé lire en débutant.
        </p>
        <div className="mono-label mt-8 border-t border-border pt-4 text-muted-foreground">
          <PageRange
            collection="posts"
            currentPage={posts.page}
            limit={24}
            totalDocs={posts.totalDocs}
          />
        </div>
      </header>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Le journal | Les Bikeuses`,
  }
}
