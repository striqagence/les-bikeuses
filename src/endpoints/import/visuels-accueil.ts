import { readFile } from 'fs/promises'
import path from 'path'
import type { Payload, PayloadRequest } from 'payload'

import type { Media } from '@/payload-types'

/**
 * Pose les photos de la marque sur la page d'accueil.
 *
 * Le héros et le carrousel se contentaient jusqu'ici d'illustrations
 * d'articles réemployées — dont un comparatif Kawasaki / Honda portant du
 * texte incrusté, recadré en pleine vignette. Aucune refonte de mise en page
 * ne compensait ça : il fallait de vraies photos.
 *
 * Les fichiers sont versionnés dans le dépôt plutôt qu'envoyés depuis un
 * poste : la migration s'exécute au déploiement, où le disque de l'auteur
 * n'existe pas.
 */

const DOSSIER = path.join(process.cwd(), 'src/assets/accueil')

type Visuel = { fichier: string; alt: string }

const VISUELS: Record<string, Visuel> = {
  foret: {
    fichier: 'moto-triumph-foret.webp',
    alt: 'Motarde en t-shirt Les Bikeuses assise sur une Triumph, en forêt',
  },
  campagne: {
    fichier: 'motarde-triumph-campagne.webp',
    alt: 'Motarde casquée debout à côté de sa Triumph Scrambler, dans un champ',
  },
  ville: {
    fichier: 'motardes-triumph-ville.webp',
    alt: 'Motarde et Triumph alignées dans une rue, logo Les Bikeuses',
  },
  lac: {
    fichier: 'groupe-motardes-lac.webp',
    alt: 'Groupe de motardes à l’arrêt au bord d’un lac',
  },
  bande: {
    fichier: 'bande-quatre-motardes.webp',
    alt: 'Quatre motardes de front sur une route au bord de l’eau',
  },
}

export type RapportVisuels = { crees: string[]; reutilises: string[]; places: string[] }

/** Enregistre le fichier s'il n'est pas déjà dans la médiathèque. */
const poser = async (
  payload: Payload,
  req: PayloadRequest | undefined,
  visuel: Visuel,
): Promise<Media | null> => {
  const contexte = req ? { req } : {}

  const connu = await payload.find({
    ...contexte,
    collection: 'media',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { filename: { equals: visuel.fichier } },
  })
  if (connu.docs[0]) return connu.docs[0] as Media

  const data = await readFile(path.join(DOSSIER, visuel.fichier))
  return (await payload.create({
    ...contexte,
    collection: 'media',
    data: { alt: visuel.alt },
    file: {
      name: visuel.fichier,
      data,
      mimetype: 'image/webp',
      size: data.byteLength,
    },
  })) as Media
}

export const poserVisuelsAccueil = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportVisuels> => {
  const contexte = req ? { req } : {}
  const rapport: RapportVisuels = { crees: [], reutilises: [], places: [] }

  const medias: Record<string, Media | null> = {}
  for (const [cle, visuel] of Object.entries(VISUELS)) {
    const avant = await payload.find({
      ...contexte,
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { filename: { equals: visuel.fichier } },
    })
    const existait = Boolean(avant.docs[0])
    medias[cle] = await poser(payload, req, visuel)
    if (medias[cle]) (existait ? rapport.reutilises : rapport.crees).push(visuel.fichier)
  }

  const trouve = await payload.find({
    ...contexte,
    collection: 'pages',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: 'home' } },
  })
  const page = trouve.docs[0]
  if (!page) return rapport

  const hero = { ...((page.hero ?? {}) as Record<string, unknown>) }

  if (medias.foret) {
    hero.media = medias.foret.id
    rapport.places.push('héros — visuel principal')
  }
  if (medias.ville && medias.campagne) {
    // Deux vignettes au lieu de trois : le comparatif Kawasaki / Honda quitte
    // la page, c'était une illustration d'article et non une photo de marque.
    hero.mediaSecondary = [{ image: medias.ville.id }, { image: medias.campagne.id }]
    rapport.places.push('héros — deux vignettes')
  }

  const layout = [...((page.layout ?? []) as unknown as Record<string, unknown>[])]
  const iSlider = layout.findIndex((b) => b.blockType === 'slider')

  if (iSlider >= 0 && medias.lac) {
    const slider = { ...layout[iSlider] }
    const slides = [...((slider.slides ?? []) as Record<string, unknown>[])]
    // Le volet « Débuter la moto » : un groupe de motardes dit la chose mieux
    // qu'une photo de machine isolée.
    const iDebut = slides.findIndex((s) => /d[ée]buter/i.test(String(s.eyebrow ?? '')))
    if (iDebut >= 0) {
      slides[iDebut] = { ...slides[iDebut], image: medias.lac.id }
      slider.slides = slides
      layout[iSlider] = slider
      rapport.places.push('carrousel — volet « Débuter la moto »')
    }
  }

  await payload.update({
    ...contexte,
    collection: 'pages',
    id: page.id,
    depth: 0,
    data: { hero, layout } as never,
    context: { disableRevalidate: true },
  })

  return rapport
}
