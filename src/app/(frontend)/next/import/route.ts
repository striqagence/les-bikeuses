import { createLocalReq, getPayload } from 'payload'
import { headers } from 'next/headers'
import config from '@payload-config'

import { importerArticles } from '@/endpoints/import'
import { importerGaleries } from '@/endpoints/import/galeries'
import { importerProduits } from '@/endpoints/import/produits'

// L'import télécharge et réenvoie les visuels de chaque article : il faut de
// la marge. Un lot est volontairement petit pour rester loin du plafond.
export const maxDuration = 300

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) return new Response('Action forbidden.', { status: 403 })

  try {
    const url = new URL(request.url)
    const demande = Number(url.searchParams.get('taille'))
    // Plafonné à 12 : au-delà, un lot dépasse la durée maximale de la fonction.
    const taille = Number.isFinite(demande) ? Math.min(Math.max(demande, 1), 12) : 8

    const forcer = url.searchParams.get('forcer') === '1'
    const req = await createLocalReq({ user }, payload)

    // `?quoi=produits` importe le catalogue WooCommerce ; par défaut, les
    // articles. Les produits doivent passer en premier : un carrousel dont
    // aucun produit n'est en base est omis à l'import de l'article.
    if (url.searchParams.get('quoi') === 'produits') {
      return Response.json(await importerProduits({ payload, req, taille }))
    }

    // `?quoi=galeries` complète les fiches déjà en base avec les visuels
    // secondaires. Un lot est plus petit : une référence peut porter seize
    // visuels, chacun redimensionné en sept déclinaisons.
    if (url.searchParams.get('quoi') === 'galeries') {
      return Response.json(await importerGaleries({ payload, req, taille: Math.min(taille, 6) }))
    }

    const rapport = await importerArticles({
      payload,
      req,
      taille,
      forcer,
      avant: url.searchParams.get('avant') ?? undefined,
    })

    return Response.json(rapport)
  } catch (e) {
    payload.logger.error({ err: e, message: 'Import des articles en échec' })
    return new Response("Erreur pendant l'import.", { status: 500 })
  }
}
