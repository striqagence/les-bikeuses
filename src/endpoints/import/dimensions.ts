import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import sharp from 'sharp'

import { getServerSideURL } from '@/utilities/getURL'

/**
 * Répare les visuels enregistrés sans dimensions.
 *
 * Une part de la médiathèque est arrivée avec un type MIME `image/jpg`, qui
 * n'existe pas : sharp n'a donc extrait ni largeur, ni hauteur. Sans
 * dimensions, `next/image` ne peut pas construire de `srcset` et réclame
 * chaque visuel en 3840 px de large — une page rayon pesait 3,3 Mo là où
 * 346 Ko suffisaient.
 *
 * Seules les métadonnées sont recalculées, pas les déclinaisons : régénérer
 * sept tailles pour un millier de fichiers dépasserait le temps d'un
 * déploiement, alors que la largeur seule suffit à rétablir le `srcset`. Les
 * visuels d'origine pèsent de 20 à 300 Ko, l'optimiseur s'en accommode.
 */

/** Le type MIME est réécrit au passage : `image/jpg` n'est pas reconnu. */
const TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
}

export type RapportDimensions = {
  reparees: number
  echecs: { filename: string; raison: string }[]
  restantes: number
}

type Ligne = { id: number; filename: string | null; url?: string | null }

/** Plusieurs téléchargements de front : la lenteur vient du réseau, pas du calcul. */
const FRONT = 6

export const reparerDimensions = async (
  payload: Payload,
  { limite = 2000 }: { limite?: number } = {},
): Promise<RapportDimensions> => {
  const rapport: RapportDimensions = { reparees: 0, echecs: [], restantes: 0 }
  const base = getServerSideURL()

  const aTraiter = await payload.db.drizzle.execute(
    sql`SELECT "id", "filename" FROM "media" WHERE "width" IS NULL AND "filename" IS NOT NULL ORDER BY "id" LIMIT ${limite}`,
  )
  const lignes = (aTraiter.rows ?? aTraiter) as unknown as Ligne[]

  let curseur = 0

  const travailleur = async () => {
    while (curseur < lignes.length) {
      const ligne = lignes[curseur++]
      const nom = ligne.filename as string

      try {
        // Le fichier vit dans Supabase Storage, derrière un compartiment privé :
        // on repasse par le proxy Payload, seul chemin de lecture disponible.
        // Pendant un déploiement, c'est la version précédente qui répond.
        const r = await fetch(`${base}/api/media/file/${encodeURIComponent(nom)}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)

        const buffer = Buffer.from(await r.arrayBuffer())
        const meta = await sharp(buffer).metadata()

        if (!meta.width || !meta.height) throw new Error('dimensions illisibles')

        const type = TYPES[meta.format ?? ''] ?? `image/${meta.format}`

        await payload.db.drizzle.execute(
          sql`UPDATE "media" SET "width" = ${meta.width}, "height" = ${meta.height}, "mime_type" = ${type}, "filesize" = ${buffer.byteLength} WHERE "id" = ${ligne.id}`,
        )

        rapport.reparees++
      } catch (err) {
        rapport.echecs.push({
          filename: nom,
          raison: err instanceof Error ? err.message : 'erreur inconnue',
        })
      }
    }
  }

  await Promise.all(Array.from({ length: FRONT }, travailleur))

  const reste = await payload.db.drizzle.execute(
    sql`SELECT COUNT(*)::int AS n FROM "media" WHERE "width" IS NULL AND "filename" IS NOT NULL`,
  )
  const lignesReste = (reste.rows ?? reste) as unknown as { n: number }[]
  rapport.restantes = lignesReste[0]?.n ?? 0

  return rapport
}
