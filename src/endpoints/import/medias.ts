import type { Payload } from 'payload'
import type { Media } from '@/payload-types'

/**
 * Nom de fichier acceptable par Supabase Storage.
 *
 * Le stockage refuse les clés non-ASCII : « femme-à-moto-3.jpeg » et
 * « xsr125-–-Yamaha-711x400.jpg » (tiret cadratin) échouaient en
 * `InvalidKey`, et leurs images étaient perdues à l'import.
 */
export const nomDeFichier = (url: string, repli = 'image'): string => {
  const brut = decodeURIComponent(url.split('/').pop() ?? '').split('?')[0]

  const nettoye = brut
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+/, '')

  if (!nettoye || nettoye === '.') return `${repli}.jpg`
  return nettoye.length > 120 ? nettoye.slice(-120) : nettoye
}

const typeMime = (nom: string): string => {
  const ext = (nom.split('.').pop() ?? 'jpeg').toLowerCase()
  if (ext === 'jpg') return 'image/jpeg'
  if (ext === 'svg') return 'image/svg+xml'
  return `image/${ext}`
}

/**
 * Télécharge un visuel et l'enregistre, en réutilisant celui déjà présent.
 *
 * Le cache est propre à une exécution : les mêmes visuels reviennent d'un
 * article à l'autre, on ne les envoie qu'une fois.
 */
export const recupererMedia = async (
  payload: Payload,
  cache: Map<string, Media | null>,
  url: string,
  alt: string,
): Promise<Media | null> => {
  if (cache.has(url)) return cache.get(url) ?? null

  const nom = nomDeFichier(url)

  try {
    const connu = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { filename: { equals: nom } },
    })
    if (connu.docs[0]) {
      cache.set(url, connu.docs[0])
      return connu.docs[0]
    }

    const r = await fetch(url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = Buffer.from(await r.arrayBuffer())

    const creer = (nomFichier: string) =>
      payload.create({
        collection: 'media',
        data: { alt: alt.slice(0, 200) },
        file: { name: nomFichier, data, mimetype: typeMime(nomFichier), size: data.byteLength },
      })

    let media: Media
    try {
      media = await creer(nom)
    } catch (err) {
      // Payload refuse un nom déjà pris : « The following field is invalid:
      // filename ». Le cas se produit quand deux URL différentes portent le
      // même nom de fichier, ou quand un envoi précédent a laissé l'entrée.
      // On réessaie une fois avec un suffixe plutôt que de perdre l'image.
      if (!/filename/i.test(String(err))) throw err

      const point = nom.lastIndexOf('.')
      const base = point > 0 ? nom.slice(0, point) : nom
      const ext = point > 0 ? nom.slice(point) : ''
      media = await creer(`${base}-${Date.now().toString(36).slice(-5)}${ext}`)
    }

    cache.set(url, media)
    return media
  } catch (err) {
    payload.logger.warn(`Visuel indisponible (${url}) : ${err}`)
    cache.set(url, null)
    return null
  }
}
