/**
 * Extraction normalisée de la fiche technique d'une moto.
 *
 * Les quatre-vingts fiches du dictionnaire portent leurs caractéristiques en
 * paragraphes « Libellé : valeur », hérités de l'ancien site. Elles avaient
 * produit quatre-vingt-six intitulés différents, et les unités manquaient sur
 * la plupart des valeurs — « 69 » et « 710 » désignent la même hauteur de
 * selle dans deux échelles.
 *
 * On reconnaît donc par motif et non par intitulé exact, et on ramène tout à
 * une unité unique : millimètres pour la selle, kilogrammes pour le poids,
 * euros pour le prix.
 */

export type SpecsMoto = {
  prix?: number
  typeMoto?: string
  cylindree?: number
  hauteurSelle?: number
  poids?: number
  poidsAvecPlein?: boolean
  permisA2?: boolean
  annee?: number
}

type Noeud = { type?: string; text?: string; children?: Noeud[] }

const plat = (n: Noeud): string => n.text ?? (n.children ?? []).map(plat).join('')

const LIGNE = /^([^:?]{2,44}?)\s*[:?]\s*(.+)$/

/**
 * Nombre contenu dans une valeur, séparateurs français compris.
 *
 * « 4 590 € » et « 13 350€ » emploient l'espace comme séparateur de milliers,
 * parfois insécable ; « 1,5 » emploie la virgule décimale. Les deux doivent
 * tomber sur le même nombre qu'en notation anglaise.
 */
const nombre = (v: string): number | undefined => {
  const m = v.replace(/[  \s](?=\d{3}\b)/g, '').match(/-?\d+(?:[.,]\d+)?/)
  if (!m) return undefined
  const n = Number(m[0].replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Hauteur de selle en millimètres.
 *
 * Quand l'unité est absente — c'est le cas de soixante-quatorze fiches sur
 * soixante-dix-huit — elle se déduit de l'ordre de grandeur : aucune moto
 * n'a une selle de 150 mm, aucune n'en a une de 1500 cm. Le seuil tombe donc
 * dans un vide, ce qui le rend sûr.
 */
const enMillimetres = (v: string): number | undefined => {
  const n = nombre(v)
  if (n === undefined) return undefined
  if (/\bmm\b/i.test(v)) return Math.round(n)
  if (/\bcm\b/i.test(v)) return Math.round(n * 10)
  return Math.round(n < 150 ? n * 10 : n)
}

export const extraireSpecsMoto = (content: unknown): SpecsMoto => {
  const enfants = (content as { root?: { children?: Noeud[] } } | null)?.root?.children
  if (!Array.isArray(enfants)) return {}

  const i = enfants.findIndex(
    (n) => n.type === 'heading' && /^caract/i.test(plat(n).trim()),
  )
  if (i === -1) return {}

  const specs: SpecsMoto = {}

  for (let j = i + 1; j < enfants.length && enfants[j].type === 'paragraph'; j++) {
    const texte = plat(enfants[j]).replace(/\s+/g, ' ').trim()
    if (!texte || texte.length > 90) break
    const m = texte.match(LIGNE)
    if (!m) break

    const libelle = m[1].trim()
    const valeur = m[2].trim()
    const l = libelle.toLowerCase()

    // Le prix se reconnaît à son unité, non à son intitulé : soixante-quatorze
    // fiches sur soixante-dix-neuf l'annoncent sous le nom du modèle.
    if (valeur.includes('€') && specs.prix === undefined) {
      specs.prix = nombre(valeur)
      continue
    }
    if (/type/.test(l) && !specs.typeMoto) {
      specs.typeMoto = valeur
    } else if (/cylindr/.test(l) && specs.cylindree === undefined) {
      specs.cylindree = nombre(valeur)
    } else if (/selle/.test(l) && specs.hauteurSelle === undefined) {
      specs.hauteurSelle = enMillimetres(valeur)
    } else if (/poids/.test(l) && specs.poids === undefined) {
      // Une fiche porte « Poids (avec le plein) : Inconnu ». Sans cette
      // garde, le drapeau se posait sur un poids qui n'existe pas — et une
      // fiche annonçait « tous pleins faits » sans dire de combien.
      const kg = nombre(valeur)
      if (kg !== undefined) {
        specs.poids = kg
        specs.poidsAvecPlein = /plein/i.test(libelle) || /plein/i.test(valeur)
      }
    } else if (/permis/.test(l) && specs.permisA2 === undefined) {
      specs.permisA2 = /\boui\b/i.test(valeur)
    } else if (/ann[ée]e/.test(l) && specs.annee === undefined) {
      const a = nombre(valeur)
      if (a !== undefined && a >= 1950 && a <= 2100) specs.annee = a
    }
  }

  return specs
}
