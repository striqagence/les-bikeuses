import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { siteUrl } from '@/utilities/siteUrl'

/**
 * Plan de site des rayons et des pages à gabarit dédié.
 *
 * Un rayon vide est omis : déclarer une page de catégorie sans produit revient
 * à soumettre du contenu mince, ce qu'un moteur sanctionne plutôt qu'il ne
 * l'ignore.
 */
const ROUTES_DEDIEES = [
  'posts',
  'dictionnaire-moto',
  'marques',
  'avis-des-clients',
  'debuter-la-moto',
  'apprendre-la-moto',
  'fond-decran-et-wallpaper',
  'faq',
  'contact',
]

const planRayons = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const base = siteUrl()
    const defaut = new Date().toISOString()

    const categories = await payload.find({
      collection: 'categories',
      overrideAccess: false,
      depth: 0,
      limit: 500,
      pagination: false,
      select: { slug: true, updatedAt: true },
    })

    const rayons: { loc: string; lastmod: string }[] = []
    for (const c of categories.docs) {
      if (!c.slug) continue
      const { totalDocs } = await payload.count({
        collection: 'products',
        where: { category: { in: [c.id] } },
      })
      if (!totalDocs) continue
      rayons.push({ loc: `${base}/rubrique/${c.slug}`, lastmod: c.updatedAt || defaut })
    }

    return [
      ...ROUTES_DEDIEES.map((r) => ({ loc: `${base}/${r}`, lastmod: defaut })),
      ...rayons,
    ]
  },
  ['rayons-sitemap'],
  { tags: ['rayons-sitemap'] },
)

export async function GET() {
  return getServerSideSitemap(await planRayons())
}
