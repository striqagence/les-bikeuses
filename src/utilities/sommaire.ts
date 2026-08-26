import type { Post } from '@/payload-types'

export type EntreeSommaire = {
  id: string
  texte: string
  niveau: 2 | 3
  /** Numéro affiché, seulement sur les h2 */
  numero?: number
}

type NoeudLexical = {
  type?: string
  tag?: string
  text?: string
  children?: NoeudLexical[]
}

/**
 * Identifiant d'ancre à partir d'un intitulé. Doit produire exactement la même
 * chaîne côté sommaire et côté rendu du texte, sinon les liens ne pointent sur
 * rien — d'où la fonction unique partagée par les deux.
 */
export const ancre = (texte: string): string =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'

const texteDe = (noeud: NoeudLexical): string =>
  noeud.text ?? (noeud.children ?? []).map(texteDe).join('')

/**
 * Sommaire construit depuis le contenu Lexical, côté serveur : le sommaire est
 * donc dans le HTML dès la première peinture, sans attendre le JavaScript.
 *
 * Les doublons d'intitulé reçoivent un suffixe : plusieurs articles ont deux
 * sections homonymes, et deux ancres identiques renverraient toujours vers la
 * première.
 */
export const construireSommaire = (contenu: Post['content']): EntreeSommaire[] => {
  const racine = (contenu as unknown as { root?: NoeudLexical })?.root
  if (!racine?.children) return []

  const entrees: EntreeSommaire[] = []
  const compteur = new Map<string, number>()
  let numero = 0

  for (const noeud of racine.children) {
    if (noeud.type !== 'heading') continue
    if (noeud.tag !== 'h2' && noeud.tag !== 'h3') continue

    const texte = texteDe(noeud).trim()
    if (!texte) continue

    const base = ancre(texte)
    const vu = compteur.get(base) ?? 0
    compteur.set(base, vu + 1)
    const id = vu === 0 ? base : `${base}-${vu + 1}`

    const niveau = noeud.tag === 'h2' ? 2 : 3
    if (niveau === 2) numero += 1

    entrees.push({ id, texte, niveau, ...(niveau === 2 ? { numero } : {}) })
  }

  return entrees
}

/** ~200 mots/minute, arrondi au supérieur. Jamais moins d'une minute. */
export const dureeLecture = (contenu: Post['content']): number => {
  const racine = (contenu as unknown as { root?: NoeudLexical })?.root
  if (!racine) return 1

  const mots = texteDe(racine).trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(mots / 200))
}

/** Format « 31.12.2024 » — les dates font partie des données, donc en mono. */
export const dateCourte = (valeur?: string | null): string | null => {
  if (!valeur) return null
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(date)
    .replace(/\//g, '.')
}
