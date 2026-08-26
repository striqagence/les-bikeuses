import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  posts: CardPostData[]
  /** Passe le premier article en une, sur toute la largeur. */
  avecUne?: boolean
}

export const CollectionArchive: React.FC<Props> = ({ posts, avecUne = true }) => {
  const articles = (posts ?? []).filter((p): p is CardPostData => typeof p === 'object' && p !== null)
  if (!articles.length) return null

  // Une seule mise en avant, et seulement s'il reste de quoi remplir la grille
  // en dessous : un article en une tout seul ferait une page très vide.
  const enUne = avecUne && articles.length > 2 ? articles[0] : null
  const grille = enUne ? articles.slice(1) : articles

  return (
    <div className="container flex flex-col gap-6">
      {enUne && <Card doc={enUne} relationTo="posts" showCategories variante="une" />}

      <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3')}>
        {grille.map((article, i) => (
          <Card className="h-full" doc={article} key={i} relationTo="posts" showCategories />
        ))}
      </div>
    </div>
  )
}
