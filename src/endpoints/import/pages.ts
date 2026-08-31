import type { Payload, PayloadRequest } from 'payload'

import { decoder } from './extraction'

export type RapportPages = {
  importees: string[]
  ignorees: { slug: string; raison: string }[]
}

/**
 * Pages ressources reprises de lesbikeuses.fr.
 *
 * Contrairement aux articles, ces pages utilisent le constructeur Flatsome :
 * pas de `entry-content`, le contenu vit entre `<main>` et `</main>`.
 *
 * Deux pages n'y figurent pas : « Avis des clients » et « Fonds d'écran »
 * n'étaient du texte ni l'une ni l'autre — un greffon d'avis pour la première,
 * une galerie pour la seconde. Les reprendre ainsi n'aurait sauvé que le
 * chapeau. Elles ont leur propre gabarit et leur propre import.
 */
const PAGES: { slug: string; titre: string }[] = [
  { slug: 'a-propos', titre: 'Qui sommes-nous' },
  { slug: 'faq', titre: 'Foire aux questions' },
  { slug: 'politique-de-retour', titre: 'Politique de retour' },
  { slug: 'cgv', titre: 'Conditions générales de vente' },
  { slug: 'mentions-legales', titre: 'Mentions légales' },
  { slug: 'politique-de-confidentialite-rgpd', titre: 'Politique de confidentialité' },
]

const PARASITES =
  /^(accueil|panier|votre panier est vide|retour à la boutique|rechercher|menu|connexion|se connecter|s’inscrire|copyright|précédent|suivant|voir|lire la suite|partager)$/i

const texte = (t: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: t,
  version: 1,
})

const paragraphe = (t: string) => ({
  type: 'paragraph',
  children: [texte(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const titreNoeud = (t: string, tag: 'h2' | 'h3' | 'h4') => ({
  type: 'heading',
  children: [texte(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag,
  version: 1,
})

const liste = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  children: items.map((t, i) => ({
    type: 'listitem',
    value: i + 1,
    children: [texte(t)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
})

const racine = (enfants: unknown[]) => ({
  root: { type: 'root', children: enfants, direction: 'ltr', format: '', indent: 0, version: 1 },
})

/**
 * Texte d'un fragment HTML.
 *
 * Les sauts de ligne deviennent des espaces avant le retrait des balises :
 * sans cela « Hébergement<br>Société » ressortait collé en « HébergementSociété ».
 */
const sansBalises = (html: string): string =>
  decoder(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()

export const importerPages = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<RapportPages> => {
  const rapport: RapportPages = { importees: [], ignorees: [] }

  const existantes = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 200,
    pagination: false,
    select: { slug: true },
  })
  const dejaLa = new Map(
    existantes.docs.filter((d) => d.slug).map((d) => [d.slug as string, d.id]),
  )

  for (const { slug, titre } of PAGES) {
    try {
      const r = await fetch(`https://lesbikeuses.fr/${slug}/`, {
        headers: { 'user-agent': 'les-bikeuses-import/1.0' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const html = await r.text()

      const debut = html.search(/<main[^>]*>/)
      const fin = html.indexOf('</main>')
      if (debut === -1 || fin === -1) throw new Error('bornes <main> introuvables')

      const corps = html
        .slice(debut, fin)
        .replace(/<(script|style|noscript|form|iframe)[\s\S]*?<\/\1>/gi, ' ')

      const enfants: unknown[] = []
      for (const m of corps.matchAll(/<(p|h2|h3|h4|ul)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
        const [, balise, interieur] = m
        const tag = balise.toLowerCase()

        if (tag === 'ul') {
          const items = [...interieur.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
            .map((li) => sansBalises(li[1]))
            .filter((t) => t && !PARASITES.test(t))
          if (items.length) enfants.push(liste(items))
          continue
        }

        const t = sansBalises(interieur)
        if (!t || t.length < 3 || PARASITES.test(t)) continue

        // Doublons consécutifs : Flatsome duplique certains blocs mobile/desktop.
        const precedent = enfants[enfants.length - 1] as { children?: { text?: string }[] } | undefined
        if (precedent?.children?.[0]?.text === t) continue

        enfants.push(tag === 'p' ? paragraphe(t) : titreNoeud(t, tag as 'h2' | 'h3' | 'h4'))
      }

      if (!enfants.length) throw new Error('contenu vide')

      const resume = (enfants.find((e) => (e as { type?: string }).type === 'paragraph') as
        | { children?: { text?: string }[] }
        | undefined)?.children?.[0]?.text

      const donnees = {
        slug,
        _status: 'published' as const,
        title: titre,
        hero: { type: 'lowImpact' as const, richText: racine([titreNoeud(titre, 'h2')]) },
        layout: [
          {
            blockType: 'content' as const,
            columns: [{ size: 'full' as const, richText: racine(enfants) }],
          },
        ],
        meta: {
          title: `${titre} | Les Bikeuses`,
          description: resume?.slice(0, 200),
        },
      }

      const existante = dejaLa.get(slug)
      if (existante) {
        await payload.update({
          collection: 'pages',
          id: existante,
          depth: 0,
          req,
          context: { disableRevalidate: true },
          data: donnees as never,
        })
      } else {
        await payload.create({
          collection: 'pages',
          depth: 0,
          req,
          context: { disableRevalidate: true },
          data: donnees as never,
        })
      }

      rapport.importees.push(slug)
    } catch (err) {
      payload.logger.warn(`Page non reprise (${slug}) : ${err}`)
      rapport.ignorees.push({ slug, raison: err instanceof Error ? err.message : 'erreur' })
    }
  }

  return rapport
}
