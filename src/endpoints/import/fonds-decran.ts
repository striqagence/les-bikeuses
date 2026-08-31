import type { Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

import { recupererMedia } from './medias'

const SOURCE = 'https://lesbikeuses.fr/fond-decran-et-wallpaper/'

/**
 * Reprise des fonds d'écran.
 *
 * L'ancienne page n'était pas du texte mais deux galeries — 23 visuels posés
 * par un module de mise en page. Les reprendre comme du contenu rédactionnel
 * n'aurait sauvé que les deux phrases d'introduction ; ce sont les images qui
 * font la page.
 *
 * Le vrai `src` se lit dans le jumeau `<noscript>` : le chargement différé de
 * WordPress ne laisse dans le `<img>` visible qu'un substitut en data:URI.
 */

export type Format = 'smartphone' | 'ordinateur'

export type RapportFonds = { smartphone: number; ordinateur: number; echecs: string[] }

const visuelsDe = (bloc: string): string[] => [
  ...new Set(
    [
      ...bloc.matchAll(/src="(https:\/\/lesbikeuses\.fr\/wp-content\/uploads\/[^"]+\.(?:png|jpe?g|webp))"/gi),
    ].map((m) => m[1]),
  ),
]

export const importerFondsDecran = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportFonds> => {
  const rapport: RapportFonds = { smartphone: 0, ordinateur: 0, echecs: [] }

  const r = await fetch(SOURCE, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`Page des fonds d’écran : HTTP ${r.status}`)
  const html = await r.text()

  const principal = /<main[\s\S]*?<\/main>/i.exec(html)?.[0]
  if (!principal) throw new Error('Page des fonds d’écran : bloc principal introuvable')

  // Les deux galeries sont séparées par leurs titres de section ; le format se
  // déduit du titre plutôt que des dimensions, qui varient d'un visuel à l'autre.
  const sections = principal.split(/<h2/i).slice(1)
  const cache = new Map<string, Media | null>()

  for (const section of sections) {
    const titre = /<\/h2>/i.test(section) ? section.slice(0, section.search(/<\/h2>/i)) : ''
    const format: Format = /ordinateur|bureau|desktop/i.test(titre) ? 'ordinateur' : 'smartphone'

    for (const url of visuelsDe(section)) {
      const media = await recupererMedia(
        payload,
        cache,
        url,
        format === 'smartphone'
          ? 'Fond d’écran moto pour smartphone — Les Bikeuses'
          : 'Fond d’écran moto pour ordinateur — Les Bikeuses',
      )

      if (!media) {
        rapport.echecs.push(url)
        continue
      }

      // Le marqueur est reposé à chaque import : il rattrape les visuels déjà
      // présents dans la médiathèque, arrivés par un autre chemin.
      if (media.fondDecran !== format) {
        await payload.update({
          ...(req ? { req } : {}),
          collection: 'media',
          id: media.id,
          data: { fondDecran: format },
          context: { disableRevalidate: true },
        })
      }

      rapport[format]++
    }
  }

  return rapport
}
