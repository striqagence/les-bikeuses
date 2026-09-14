import { randomBytes } from 'crypto'
import type { Payload, PayloadRequest } from 'payload'

/**
 * Rend visibles les images du corps des articles.
 *
 * L'import les avait posées en nœuds `upload`, la forme que produit l'éditeur
 * quand on insère une image. Or ces nœuds ne s'affichaient pas : le
 * convertisseur par défaut de Payload abandonne silencieusement dès que le
 * média n'est pas peuplé — `if (typeof node.value !== 'object') return null` —
 * et la population ne se déclenchait pas sur ce champ, à aucune profondeur.
 * Vingt-trois images en base, aucune à l'écran.
 *
 * Les nœuds deviennent donc des blocs `mediaBlock`, dont le champ média se
 * peuple, lui, sans difficulté. Le rendu y gagne au passage : le bloc passe
 * par notre composant `Media`, donc par l'optimiseur — dimensions, `srcset`,
 * chargement différé — là où le convertisseur d'origine posait une balise
 * `img` brute en pleine résolution.
 */

export type RapportImages = {
  articles: number
  pages: number
  images: number
  horsRacine: number
}

type Noeud = Record<string, unknown>

/** Identifiant de bloc, au format attendu par Payload. */
const identifiant = () => randomBytes(12).toString('hex')

export const convertirImagesEnBlocs = async (
  payload: Payload,
  { req }: { req?: PayloadRequest } = {},
): Promise<RapportImages> => {
  const contexte = req ? { req } : {}
  const rapport: RapportImages = { articles: 0, pages: 0, images: 0, horsRacine: 0 }

  const enBloc = (noeud: Noeud): Noeud => ({
    type: 'block',
    format: '',
    version: 2,
    fields: { id: identifiant(), blockType: 'mediaBlock', media: noeud.value },
  })

  /**
   * Remplace les nœuds image d'un niveau donné.
   *
   * Un bloc ne peut vivre qu'à la racine du document. Un nœud image imbriqué
   * dans un paragraphe est donc laissé tel quel et signalé plutôt que déplacé :
   * le sortir de son paragraphe couperait la phrase en deux.
   */
  const parcourir = (noeud: unknown, racine: boolean): { valeur: unknown; nb: number } => {
    if (Array.isArray(noeud)) {
      let nb = 0
      const sortie = noeud.map((enfant) => {
        const r = parcourir(enfant, racine)
        nb += r.nb
        return r.valeur
      })
      return { valeur: sortie, nb }
    }

    if (!noeud || typeof noeud !== 'object') return { valeur: noeud, nb: 0 }

    const n = noeud as Noeud

    if (n.type === 'upload' && n.relationTo === 'media' && n.value != null) {
      if (!racine) {
        rapport.horsRacine++
        return { valeur: n, nb: 0 }
      }
      return { valeur: enBloc(n), nb: 1 }
    }

    let nb = 0
    const sortie: Noeud = { ...n }

    if (n.root) {
      const r = parcourir(n.root, false)
      sortie.root = r.valeur
      nb += r.nb
    }
    if (Array.isArray(n.children)) {
      // Les enfants directs de `root` sont au premier niveau du document.
      const r = parcourir(n.children, n.type === 'root')
      sortie.children = r.valeur
      nb += r.nb
    }

    return { valeur: sortie, nb }
  }

  for (const collection of ['posts', 'pages'] as const) {
    const docs = await payload.find({
      ...contexte,
      collection,
      depth: 0,
      limit: 500,
      pagination: false,
    })

    for (const doc of docs.docs) {
      const champ = collection === 'posts' ? 'content' : 'layout'
      const source = (doc as unknown as Record<string, unknown>)[champ]
      if (!source) continue

      const { valeur, nb } = parcourir(source, false)
      if (!nb) continue

      await payload.update({
        ...contexte,
        collection,
        id: doc.id,
        depth: 0,
        data: { [champ]: valeur } as never,
        context: { disableRevalidate: true },
      })

      rapport.images += nb
      if (collection === 'posts') rapport.articles++
      else rapport.pages++
    }
  }

  return rapport
}
