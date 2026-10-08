import React from 'react'

import type { Post } from '@/payload-types'

import { Caracteristiques } from '@/components/Article/Caracteristiques'
import { ChargeurPub } from '@/components/Publicite/Chargeur'
import { Emplacement } from '@/components/Publicite/Emplacement'
import { Essentiel } from '@/components/Article/Essentiel'
import { ProgressionLecture } from '@/components/Article/ProgressionLecture'
import { Sommaire } from '@/components/Article/Sommaire'
import { PostHero } from '@/heros/PostHero'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import RichText from '@/components/RichText'
import { construireSommaire } from '@/utilities/sommaire'
import { decouperEnTranches, extraireSpecs, nombreEmplacements } from '@/utilities/specsMoto'

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

  // Le sommaire se construit sur le contenu entier : la découpe ci-dessous
  // est une affaire de rendu, elle ne doit pas lui retirer d'ancre.
  const { specs, avant, apres } = extraireSpecs(post.content)

  /*
   * Emplacements publicitaires, en nombre proportionnel à la longueur.
   *
   * Les articles vont de 526 à 31 597 caractères : un nombre fixe écrasait
   * les plus courts et sous-exploitait les plus longs. Un emplacement est
   * toujours en fin de lecture ; les autres se répartissent dans le corps.
   *
   * Sur une fiche du dictionnaire, le tableau technique offre déjà une
   * coupure naturelle — elle sert de premier emplacement quand la fiche en
   * supporte plus d'un.
   */
  const totalPubs = nombreEmplacements(post.content)
  const tranches = specs.length > 0
    ? decouperEnTranches(apres ?? post.content, Math.max(0, totalPubs - 2))
    : decouperEnTranches(post.content, totalPubs - 1)

  return (
    <>
      <ChargeurPub />
      <ProgressionLecture />
      <PostHero post={post} />

      {/* Sommaire en marge sur grand écran, au-dessus du texte en dessous de lg */}
      <div className="container grid items-start gap-8 py-10 md:py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-16">
        {sommaire.length > 1 ? <Sommaire entrees={sommaire} /> : <div className="hidden lg:block" />}

        <div className="max-w-[68ch]">
          {essentiel.length > 0 && <Essentiel points={essentiel} />}

          {specs.length > 0 && (
            <>
              {/* Le titre « Caractéristiques » reste en fin de première
                  moitié : il porte l'ancre du sommaire. */}
              <RichText className="corps-article" data={avant} enableGutter={false} />
              <Caracteristiques specs={specs} />
              {totalPubs > 1 && (
                <Emplacement slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CORPS} />
              )}
            </>
          )}

          {tranches.map((tranche, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Emplacement slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CORPS} />}
              <RichText className="corps-article" data={tranche} enableGutter={false} />
            </React.Fragment>
          ))}

          {/* Dernier emplacement en fin de lecture, plus bas donc plus court. */}
          <Emplacement hauteur={250} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_PIED} />
        </div>
      </div>

      {lies.length > 0 && (
        <>
          <div className="container">
            <hr className="route" />
          </div>
          <div className="container pt-10 md:pt-14">
            <p className="eyebrow">À lire ensuite</p>
            <h2 className="titre-section mt-3 mb-9 max-w-[18ch]">
              Dans la même rubrique
            </h2>
            <RelatedPosts docs={lies} />
          </div>
        </>
      )}
    </>
  )
}
