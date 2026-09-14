import { randomBytes } from 'crypto'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Convertit les images insérées dans l'éditeur en blocs.
 *
 * Le bouton « image » de la barre d'outils produit un nœud `upload`. Or le
 * convertisseur de Payload abandonne sans un mot quand le média d'un tel nœud
 * n'est pas peuplé — `if (typeof node.value !== 'object') return null` — et la
 * population ne se déclenche pas sur ce champ. Une image ajoutée depuis
 * l'éditeur serait donc enregistrée, visible en back-office, et invisible sur
 * le site : le pire des trois états.
 *
 * Quatre cent trente-cinq images d'articles sont restées ainsi pendant des
 * mois. Le nœud est donc réécrit en bloc `mediaBlock` à l'enregistrement, ce
 * qui rend l'image visible et la fait passer par l'optimiseur.
 */
const enBloc = (noeud: Record<string, unknown>) => ({
  type: 'block',
  format: '',
  version: 2,
  fields: {
    id: randomBytes(12).toString('hex'),
    blockType: 'mediaBlock',
    media: noeud.value,
  },
})

/** Un bloc ne vit qu'à la racine : une image dans un paragraphe est laissée. */
const convertir = (noeud: unknown, racine: boolean): unknown => {
  if (Array.isArray(noeud)) return noeud.map((n) => convertir(n, racine))
  if (!noeud || typeof noeud !== 'object') return noeud

  const n = noeud as Record<string, unknown>
  if (racine && n.type === 'upload' && n.relationTo === 'media' && n.value != null) {
    return enBloc(n)
  }

  const sortie: Record<string, unknown> = { ...n }
  if (n.root) sortie.root = convertir(n.root, false)
  if (Array.isArray(n.children)) sortie.children = convertir(n.children, n.type === 'root')
  return sortie
}

export const imagesEnBlocs =
  (champ: string): CollectionBeforeChangeHook =>
  ({ data }) => {
    if (!data?.[champ]) return data
    return { ...data, [champ]: convertir(data[champ], false) }
  }
