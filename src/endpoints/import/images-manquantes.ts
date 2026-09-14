import { randomBytes } from 'crypto'
import type { Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

import { recupererMedia } from './medias'

/**
 * Récupère les images éditoriales oubliées par la reprise initiale.
 *
 * Six articles bâtis autour de carrousels produits ont perdu quelques photos :
 * l'extraction, qui écarte les résidus de carrousel, emportait au passage les
 * visuels qui les jouxtaient. Rejouer l'import complet les perdrait de la même
 * façon — d'où cette passe ciblée.
 *
 * Une image n'est reprise que si elle n'appartient pas au catalogue : les
 * vignettes produit arrivent déjà par les blocs carrousel, les remettre en
 * doublon alourdirait l'article sans rien ajouter.
 *
 * Le placement suit la source : on relève le titre qui précède l'image et le
 * nombre de paragraphes qui l'en séparent, puis on insère au même rang. À
 * défaut de repère, l'image est écartée plutôt que posée au hasard.
 */

const ARTICLES = [
  'le-marron-pour-vos-equipements-de-moto',
  'le-gris-pour-vos-equipements-de-moto',
  'le-bleu-pour-vos-equipements-de-moto',
  'le-kaki-pour-vos-equipements-de-moto',
  'trouvez-le-style-qui-va-avec-le-scooter',
  'une-bikeuse-nous-parle-de-la-securite-a-moto',
]

export type RapportImagesManquantes = {
  articles: { slug: string; ajoutees: number; sansRepere: number }[]
  ajoutees: number
  sansRepere: number
}

const decoder = (s: string): string =>
  s
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

const texteBrut = (html: string): string =>
  decoder(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

/** Normalise un nom de fichier pour comparer une vignette à son original. */
const racine = (fichier: string): string =>
  fichier
    .toLowerCase()
    .replace(/-\d+x\d+(?=\.[a-z]+$)/, '')
    .replace(/-e\d{10,}/, '')

type Jeton =
  | { genre: 'titre'; texte: string }
  | { genre: 'paragraphe' }
  | { genre: 'image'; url: string; fichier: string }

/** Séquence titres / paragraphes / images du corps d'origine, dans l'ordre. */
const lireSource = (corps: string): Jeton[] => {
  const jetons: Jeton[] = []
  const motif =
    /<(h[23])[^>]*>([\s\S]*?)<\/\1>|<p[^>]*>([\s\S]*?)<\/p>|<img[^>]+src="(https:\/\/lesbikeuses\.fr\/wp-content\/uploads\/[^"]+)"/gi

  for (const m of corps.matchAll(motif)) {
    if (m[1]) {
      const t = texteBrut(m[2] ?? '')
      if (t) jetons.push({ genre: 'titre', texte: t })
    } else if (m[3] !== undefined) {
      if (texteBrut(m[3]).length > 30) jetons.push({ genre: 'paragraphe' })
    } else if (m[4]) {
      jetons.push({ genre: 'image', url: m[4], fichier: m[4].split('/').pop() ?? '' })
    }
  }
  return jetons
}

type Noeud = Record<string, unknown>

const texteDuNoeud = (n: Noeud): string => {
  if (typeof n.text === 'string') return n.text
  const enfants = (n.children ?? []) as Noeud[]
  return enfants.map(texteDuNoeud).join('')
}

export const recupererImagesManquantes = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportImagesManquantes> => {
  const contexte = req ? { req } : {}
  const rapport: RapportImagesManquantes = { articles: [], ajoutees: 0, sansRepere: 0 }

  // Les visuels du catalogue, pour ne pas remettre en doublon ce que les
  // carrousels apportent déjà.
  const produits = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 1,
    limit: 1000,
    pagination: false,
    select: { gallery: true },
  })
  const racinesCatalogue = new Set<string>()
  for (const p of produits.docs) {
    for (const g of p.gallery ?? []) {
      const m = g.image
      if (m && typeof m === 'object' && (m as Media).filename) {
        racinesCatalogue.add(racine((m as Media).filename as string))
      }
    }
  }

  const cache = new Map<string, Media | null>()

  for (const slug of ARTICLES) {
    const trouve = await payload.find({
      ...contexte,
      collection: 'posts',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { slug: { equals: slug } },
    })
    const article = trouve.docs[0]
    if (!article) continue

    const r = await fetch(`https://lesbikeuses.fr/${slug}/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!r.ok) continue
    const html = await r.text()
    const debut = html.indexOf('entry-content')
    const fin = html.indexOf('</article>', debut)
    if (debut < 0) continue
    const corps = html.slice(debut, fin > 0 ? fin : html.length)

    const jetons = lireSource(corps)

    // Position de chaque image éditoriale : titre précédent, rang du paragraphe.
    const aPlacer: { url: string; titre: string | null; apresParagraphes: number }[] = []
    let titreCourant: string | null = null
    let paragraphes = 0
    const vues = new Set<string>()

    for (const j of jetons) {
      if (j.genre === 'titre') {
        titreCourant = j.texte
        paragraphes = 0
      } else if (j.genre === 'paragraphe') {
        paragraphes++
      } else {
        if (racinesCatalogue.has(racine(j.fichier)) || vues.has(racine(j.fichier))) continue
        vues.add(racine(j.fichier))
        aPlacer.push({ url: j.url, titre: titreCourant, apresParagraphes: paragraphes })
      }
    }

    if (!aPlacer.length) continue

    const contenu = article.content as unknown as { root: { children: Noeud[] } }
    const enfants = [...(contenu?.root?.children ?? [])]
    let ajoutees = 0
    let sansRepere = 0

    // On insère du dernier au premier : les rangs relevés restent valides.
    for (const image of [...aPlacer].reverse()) {
      if (!image.titre) {
        sansRepere++
        continue
      }

      const iTitre = enfants.findIndex(
        (n) => n.type === 'heading' && texteBrut(texteDuNoeud(n)) === image.titre,
      )
      if (iTitre < 0) {
        sansRepere++
        continue
      }

      let position = iTitre + 1
      let restants = image.apresParagraphes
      while (position < enfants.length && restants > 0) {
        if (enfants[position].type === 'paragraph') restants--
        position++
      }

      const media = await recupererMedia(payload, cache, image.url, article.title as string)
      if (!media) {
        sansRepere++
        continue
      }

      enfants.splice(position, 0, {
        type: 'block',
        format: '',
        version: 2,
        fields: { id: randomBytes(12).toString('hex'), blockType: 'mediaBlock', media: media.id },
      })
      ajoutees++
    }

    if (ajoutees) {
      await payload.update({
        ...contexte,
        collection: 'posts',
        id: article.id,
        depth: 0,
        data: { content: { ...contenu, root: { ...contenu.root, children: enfants } } } as never,
        context: { disableRevalidate: true },
      })
    }

    rapport.articles.push({ slug, ajoutees, sansRepere })
    rapport.ajoutees += ajoutees
    rapport.sansRepere += sansRepere
  }

  return rapport
}
