import { permanentRedirect } from 'next/navigation'

/**
 * Ancienne pagination du journal, conservée en redirection.
 *
 * Le filtre par thème a fait passer le journal aux paramètres d'URL, comme le
 * catalogue : `?theme=…&page=…`. Deux schémas coexistants auraient produit la
 * même liste sous deux adresses — du contenu dupliqué aux yeux d'un moteur.
 * Cette route reste donc en place pour les liens déjà émis, et redirige.
 */
type Args = { params: Promise<{ pageNumber: string }> }

export default async function Page({ params }: Args) {
  const { pageNumber } = await params
  const n = Number(pageNumber)
  permanentRedirect(Number.isInteger(n) && n > 1 ? `/posts?page=${n}` : '/posts')
}
