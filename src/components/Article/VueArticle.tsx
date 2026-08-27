import React from 'react'

import type { Post } from '@/payload-types'

import { Essentiel } from '@/components/Article/Essentiel'
import { ProgressionLecture } from '@/components/Article/ProgressionLecture'
import { Sommaire } from '@/components/Article/Sommaire'
import { PostHero } from '@/heros/PostHero'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import RichText from '@/components/RichText'
import { construireSommaire } from '@/utilities/sommaire'

/**
 * Rendu complet d'un article.
 *
 * Extrait dans un composant parce que les articles vivent désormais à la
 * racine, dans la même route `[slug]` que les pages : la route arbitre entre
 * les deux, et délègue ici pour un article.
 */
export const VueArticle: React.FC<{ post: Post }> = ({ post }) => {
  const sommaire = construireSommaire(post.content)
  const essentiel = post.essentiel ?? []
  const lies = (post.relatedPosts ?? []).filter((p): p is Post => typeof p === 'object')

  return (
    <>
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

      {lies.length > 0 && (
        <>
          <div className="container">
            <hr className="route" />
          </div>
          <div className="container pt-10 md:pt-14">
            <p className="eyebrow">À lire ensuite</p>
            <h2 className="wonk mt-2 mb-8 text-3xl font-medium md:text-4xl">
              Dans la même rubrique
            </h2>
            <RelatedPosts docs={lies} />
          </div>
        </>
      )}
    </>
  )
}
