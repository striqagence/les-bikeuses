import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Category, Media, User } from '@/payload-types'

import donnees from './lesbikeuses-posts.json'

/**
 * Articles repris de lesbikeuses.fr (WordPress).
 *
 * Le contenu est figé dans `lesbikeuses-posts.json`, extrait une fois depuis
 * l'ancien site : l'API `wp/v2` y renvoie 401, il a donc fallu lire le HTML.
 * Figer plutôt que rejouer le scraping au seed garde ce dernier déterministe
 * et indépendant de la disponibilité de l'ancien site.
 *
 * Extraction : bloc `entry-content` → premier `</article>`, sommaire `lwptoc`
 * retiré, et les carrousels produits WooCommerce filtrés à partir de la liste
 * réelle des catégories du site (leurs noms de marque et de rayon se
 * retrouvaient sinon dans le corps sous forme de paragraphes).
 *
 * Ce qui n'est pas repris : les images en cours d'article (seule l'image à la
 * une l'est) et la mise en forme inline (gras, liens).
 */

export type ArticleImporte = {
  slug: string
  title: string
  /** Slug de la catégorie de blog : technique, divers, permis-moto, equipements */
  category: string
  excerpt: string
  publishedAt: string
  imageUrl: string
  content: RequiredDataFromCollectionSlug<'posts'>['content']
}

export const articlesImportes = donnees as unknown as ArticleImporte[]

/**
 * « L'essentiel » par article. C'est un travail de synthèse éditoriale, pas
 * une extraction : seul l'article Permis A2 en a un, rédigé depuis son
 * contenu réel et validé. Les autres restent à écrire dans l'admin.
 */
const ESSENTIELS: Record<string, string[]> = {
  'permis-a2-quelle-moto-femme-choisir': [
    'Le permis A2 plafonne à **35 kW (47,5 ch)**. Une moto plus puissante reste éligible si elle est bridée par un professionnel agréé, et si sa puissance d’origine n’excède pas le double.',
    'Le code moto se passe avant tout : **35 bonnes réponses sur 40** sont exigées, soit 87,5 %.',
    'Pour un gabarit féminin, les critères qui comptent sont la **hauteur de selle**, le **poids à l’arrêt** et la largeur du cadre — pas la puissance.',
    'Quinze modèles A2 sont passés en revue, de la **KTM 390 Duke** (poids plume) à la **Yamaha MT-07**, avec le coût du bridage pour chacun.',
    'Avant d’acheter : **faire un essai**, pieds au sol, à l’arrêt comme en manœuvre.',
  ],
}

type Args = {
  article: ArticleImporte
  heroImage: Media
  author: User
  categories: Category[]
}

export const articleVersPost = ({
  article,
  heroImage,
  author,
  categories,
}: Args): RequiredDataFromCollectionSlug<'posts'> => {
  const categorie = categories.find((c) => c.slug === article.category)

  return {
    slug: article.slug,
    _status: 'published',
    title: article.title,
    authors: [author.id],
    categories: categorie ? [categorie.id] : [],
    publishedAt: article.publishedAt,
    heroImage: heroImage.id,
    essentiel: (ESSENTIELS[article.slug] ?? []).map((texte) => ({ texte })),
    content: article.content,
    meta: {
      title: article.title,
      description: article.excerpt,
      image: heroImage.id,
    },
  }
}
