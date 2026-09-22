import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { siteUrl } from '@/utilities/siteUrl'

/**
 * Plan de site du catalogue.
 *
 * Les 477 fiches produit n'étaient déclarées nulle part : le plan ne couvrait
 * que les articles et les pages, soit 211 adresses sur près de huit cents. Un
 * moteur finit par trouver ce qui est maillé, mais il le trouve tard, et il
 * ne le revisite pas au rythme qu'un plan lui indique.
 */
const planProduits = unstable_cache(
  async () => {
    const payload = await getPayload({ config })

    const r = await payload.find({
      collection: 'products',
      overrideAccess: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      select: { slug: true, updatedAt: true },
    })

    const defaut = new Date().toISOString()

    return r.docs
      .filter((p) => Boolean(p?.slug))
      .map((p) => ({
        loc: `${siteUrl()}/produit/${p.slug}`,
        lastmod: p.updatedAt || defaut,
      }))
  },
  ['products-sitemap'],
  { tags: ['products-sitemap'] },
)

export async function GET() {
  return getServerSideSitemap(await planProduits())
}
