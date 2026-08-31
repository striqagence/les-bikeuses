import type { Payload, PayloadRequest } from 'payload'

import type { Category } from '@/payload-types'

import { RAYONS } from '../navigation'

const STORE = 'https://lesbikeuses.fr/wp-json/wc/store/v1'

/**
 * Reprise des avis clients.
 *
 * L'ancienne page les affichait par un greffon WordPress : 370 avis derrière
 * huit lignes de HTML et une pagination en Ajax. Les gratter aurait figé un
 * échantillon ; la Store API de WooCommerce les rend tous, avec la note, la
 * date, l'achat vérifié et le produit concerné.
 */

type AvisWoo = {
  id: number
  date_created: string
  product_name?: string
  product_permalink?: string
  reviewer?: string
  review?: string
  rating?: number
  verified?: boolean
}

export type RapportAvis = { crees: number; rayons: number; ignores: number; total: number }

const decoder = (s: string): string =>
  s
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

/** Le corps d'un avis est du HTML minimal : paragraphes et sauts de ligne. */
const enTexte = (html: string): string =>
  decoder(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const slugDe = (permalink?: string): string | null => {
  const m = /\/product\/([^/?#]+)/.exec(permalink ?? '')
  return m ? m[1] : null
}

export const importerAvis = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportAvis> => {
  const rapport: RapportAvis = { crees: 0, rayons: 0, ignores: 0, total: 0 }
  const contexte = req ? { req } : {}

  // Les avis déjà repris, pour rendre l'import rejouable sans doublon. Leur
  // rayon est relu au passage : il se déduit du catalogue, qui bouge, et un
  // avis rangé nulle part échappe aux filtres de la page.
  const connus = await payload.find({
    ...contexte,
    collection: 'avis',
    depth: 0,
    limit: 2000,
    pagination: false,
    select: { wooId: true, rayon: true },
  })
  const dejaLa = new Map(
    connus.docs.map((d) => [d.wooId as number, { id: d.id, rayon: d.rayon ?? null }]),
  )

  // Le rayon d'un avis vient de son produit. Un produit relève de plusieurs
  // catégories — sa marque en est une — : seules celles qui figurent au menu
  // sont des rayons, et c'est la première d'entre elles qui est retenue.
  const rangDuRayon = new Map(RAYONS.map((r, i) => [r.slug, i]))
  const produits = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 1,
    limit: 1000,
    pagination: false,
    select: { slug: true, category: true },
  })

  const rayonParSlug = new Map<string, string>()
  for (const p of produits.docs) {
    if (!p.slug) continue

    const rayons = (Array.isArray(p.category) ? p.category : [p.category])
      .filter((c): c is Category => typeof c === 'object' && c !== null)
      .filter((c) => typeof c.slug === 'string' && rangDuRayon.has(c.slug))
      .sort((a, b) => rangDuRayon.get(a.slug!)! - rangDuRayon.get(b.slug!)!)

    if (rayons[0]?.title) rayonParSlug.set(p.slug, rayons[0].title)
  }

  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`${STORE}/products/reviews?per_page=100&page=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      redirect: 'follow',
    })
    if (!r.ok) throw new Error(`Store API : HTTP ${r.status} page ${page}`)

    const lot = (await r.json()) as AvisWoo[]
    if (!lot.length) break
    rapport.total += lot.length

    for (const a of lot) {
      const slug = slugDe(a.product_permalink)
      const rayon = (slug && rayonParSlug.get(slug)) || null

      const connu = dejaLa.get(a.id)
      if (connu) {
        if (connu.rayon !== rayon) {
          await payload.update({
            ...contexte,
            collection: 'avis',
            id: connu.id,
            data: { rayon },
            context: { disableRevalidate: true },
          })
          rapport.rayons++
        } else {
          rapport.ignores++
        }
        continue
      }

      await payload.create({
        ...contexte,
        collection: 'avis',
        data: {
          wooId: a.id,
          auteur: decoder(a.reviewer ?? '').trim() || 'Cliente',
          note: Math.min(5, Math.max(1, Math.round(a.rating ?? 5))),
          texte: enTexte(a.review ?? '') || undefined,
          publieLe: new Date(a.date_created).toISOString(),
          verifie: Boolean(a.verified),
          produitNom: a.product_name ? decoder(a.product_name) : undefined,
          produitSlug: slug ?? undefined,
          rayon,
        },
        context: { disableRevalidate: true },
      })

      rapport.crees++
    }

    if (lot.length < 100) break
  }

  return rapport
}
