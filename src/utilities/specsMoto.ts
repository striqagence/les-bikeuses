import type { Post } from '@/payload-types'

export type Spec = { libelle: string; valeur: string }

type Noeud = { type?: string; tag?: string; text?: string; children?: Noeud[] }

const plat = (n: Noeud): string =>
  n.text ?? (n.children ?? []).map(plat).join('')

/**
 * Une ligne de caractéristique : « Libellé : valeur » ou « Libellé ? valeur ».
 *
 * Le libellé exclut les deux séparateurs, si bien que « Compatible Permis
 * A2 ? Non » se coupe au point d'interrogation et non avant.
 */
const LIGNE = /^([^:?]{2,44}?)\s*[:?]\s*(.+)$/

/**
 * Sépare la fiche technique du corps rédigé.
 *
 * Les fiches du dictionnaire ouvrent sur une série de paragraphes « Marque :
 * Triumph », « Cylindré : 1200cc », « Hauteur de selle : 69cm »… C'est ainsi
 * que l'ancien site les composait, faute de champ dédié. Alignés comme du
 * texte courant, ils se lisent mal : rien ne distingue l'intitulé de la
 * valeur, et l'œil ne peut pas comparer deux machines.
 *
 * On les repère après le titre « Caractéristiques » et on les rend à part, en
 * tableau. Le titre, lui, reste dans le flux : il porte l'ancre du sommaire.
 *
 * Rien n'est réécrit en base — si la rédaction change ces lignes, la mise en
 * page suit.
 */
export const extraireSpecs = (
  content: Post['content'],
): { specs: Spec[]; avant: Post['content']; apres: Post['content'] | null } => {
  const racine = (content as { root?: { children?: Noeud[] } } | null)?.root
  const enfants = racine?.children
  const rien = { specs: [], avant: content, apres: null }
  if (!Array.isArray(enfants)) return rien

  const iTitre = enfants.findIndex(
    (n) => n.type === 'heading' && /^caract[ée]ristiques/i.test(plat(n).trim()),
  )
  if (iTitre === -1) return rien

  const specs: Spec[] = []
  let i = iTitre + 1
  while (i < enfants.length && enfants[i].type === 'paragraph') {
    const texte = plat(enfants[i]).replace(/\s+/g, ' ').trim()
    // Au-delà d'une ligne, ce n'est plus une caractéristique mais une phrase.
    if (!texte || texte.length > 90) break
    const m = texte.match(LIGNE)
    if (!m) break
    specs.push({ libelle: m[1].trim(), valeur: m[2].trim() })
    i++
  }

  // En deçà de trois lignes, le tableau coûte plus qu'il ne rapporte : deux
  // valeurs se lisent aussi bien en paragraphes.
  if (specs.length < 3) return rien

  const decouper = (debut: number, fin?: number) =>
    ({ ...(content as object), root: { ...racine, children: enfants.slice(debut, fin) } }) as Post['content']

  return { specs, avant: decouper(0, iTitre + 1), apres: decouper(i) }
}

/**
 * Coupe le corps après le n-ième bloc de premier niveau.
 *
 * Sert à glisser un emplacement publicitaire en cours de lecture plutôt qu'en
 * pied d'article, où personne ne descend. La coupe ne tombe qu'entre deux
 * blocs : jamais au milieu d'un paragraphe, jamais entre un titre et le texte
 * qu'il annonce — d'où le décalage d'un cran quand le bloc visé est un titre.
 *
 * Rend `null` pour la seconde moitié quand l'article est trop court pour
 * supporter une coupure : mieux vaut pas d'emplacement qu'un emplacement qui
 * hache trois paragraphes.
 */
export const couperApres = (
  content: Post['content'],
  n: number,
): { avant: Post['content']; apres: Post['content'] | null } => {
  const racine = (content as { root?: { children?: Noeud[] } } | null)?.root
  const enfants = racine?.children
  if (!Array.isArray(enfants) || enfants.length < n + 3) return { avant: content, apres: null }

  // Un titre annonce ce qui suit : couper juste après l'en séparerait.
  let coupe = n
  while (coupe < enfants.length - 2 && enfants[coupe]?.type === 'heading') coupe++

  const decouper = (debut: number, fin?: number) =>
    ({ ...(content as object), root: { ...racine, children: enfants.slice(debut, fin) } }) as Post['content']

  return { avant: decouper(0, coupe), apres: decouper(coupe) }
}

/** Longueur du texte d'un corps, en caractères. */
const longueurDe = (content: Post['content']): number => {
  const enfants = (content as { root?: { children?: Noeud[] } } | null)?.root?.children
  if (!Array.isArray(enfants)) return 0
  return enfants.map(plat).join(' ').replace(/\s+/g, ' ').trim().length
}

/**
 * Nombre d'emplacements publicitaires pour un article.
 *
 * Proportionnel à la longueur et non fixe : les 201 articles vont de 526 à
 * 31 597 caractères, soit un écart de soixante fois. Deux blocs partout
 * revenait à écraser une fiche de cinq paragraphes et à laisser un dossier de
 * trente mille signes sous-exploité.
 *
 * Plafonné à six : au-delà, la page cesse d'être un article avec de la
 * publicité pour devenir l'inverse, et la lectrice s'en va.
 */
export const nombreEmplacements = (content: Post['content']): number => {
  const n = longueurDe(content)
  if (n < 1500) return 1
  if (n < 3000) return 2
  if (n < 6000) return 3
  return Math.min(6, 4 + Math.floor((n - 6000) / 5000))
}

/**
 * Découpe le corps en tranches de longueur comparable.
 *
 * La coupure tombe entre deux blocs, et jamais juste après un titre : celui-ci
 * annonce ce qui suit, les séparer laisserait un intertitre orphelin au-dessus
 * d'une publicité.
 *
 * Rend une seule tranche quand l'article est trop court pour supporter une
 * coupure — mieux vaut pas d'emplacement intercalaire qu'un emplacement qui
 * hache trois paragraphes.
 */
export const decouperEnTranches = (
  content: Post['content'],
  coupures: number,
): Post['content'][] => {
  const racine = (content as { root?: { children?: Noeud[] } } | null)?.root
  const enfants = racine?.children
  if (!Array.isArray(enfants) || coupures < 1 || enfants.length < (coupures + 1) * 3) {
    return [content]
  }

  const decouper = (debut: number, fin?: number) =>
    ({ ...(content as object), root: { ...racine, children: enfants.slice(debut, fin) } }) as Post['content']

  const points: number[] = []
  const pas = enfants.length / (coupures + 1)

  for (let i = 1; i <= coupures; i++) {
    let p = Math.round(i * pas)
    while (p < enfants.length - 2 && enfants[p]?.type === 'heading') p++
    // Deux coupures ne tombent jamais au même endroit, ni collées.
    if (points.length && p - points[points.length - 1] < 2) continue
    if (p > 1 && p < enfants.length - 1) points.push(p)
  }

  const tranches: Post['content'][] = []
  let debut = 0
  for (const p of points) {
    tranches.push(decouper(debut, p))
    debut = p
  }
  tranches.push(decouper(debut))
  return tranches
}
