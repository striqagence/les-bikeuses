import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(slug: T, depth = 0): Promise<DataFromGlobalSlug<T>> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  return global
}

/**
 * Identifiant du déploiement, ajouté à la clé de cache.
 *
 * Vercel restaure le cache de build d'un déploiement à l'autre. Une globale
 * modifiée hors requête HTTP — depuis une migration, par exemple — ne peut pas
 * purger son étiquette : `revalidateTag` n'existe que dans un rendu. L'entrée
 * périmée survivait donc au déploiement suivant, et toutes les pages étaient
 * pré-générées avec l'ancienne navigation alors que la base était à jour.
 *
 * Rattacher la clé au déploiement rend l'entrée caduque à chaque mise en
 * ligne. Le coût est d'une lecture en base par globale et par déploiement.
 */
const deploiement = process.env.VERCEL_DEPLOYMENT_ID ?? 'local'

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  unstable_cache(async () => getGlobal<T>(slug, depth), [slug, deploiement], {
    tags: [`global_${slug}`],
  })
