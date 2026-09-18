import type { Payload, PayloadRequest } from 'payload'

import {
  decoder,
  liste,
  paragraphe,
  sansBalises,
  texte,
  titre,
  type NoeudLien,
  type NoeudTexte,
} from './extraction'

/**
 * Reprise des descriptions longues du catalogue.
 *
 * L'import initial ne lisait que `short_description` : les fiches n'avaient
 * donc que leur accroche, et tout le corps rédigé — celui qui porte le
 * référencement — était resté sur l'ancien site. Cette étape le récupère et
 * le convertit en richText.
 *
 * Étape séparée plutôt qu'ajout à `produits.ts` : les 477 fiches sont déjà
 * en base, les réimporter entièrement écraserait les galeries, les
 * déclinaisons et les rangements faits depuis.
 */

const STORE = 'https://lesbikeuses.fr/wp-json/wc/store/v1'

/** Attente entre deux appels : l'ancien site reste un WordPress mutualisé. */
const souffler = () => new Promise((r) => setTimeout(r, 350))

/**
 * Texte d'un fragment, entités décodées, espaces normalisés.
 *
 * Volontairement sans `trim`, contrairement à `sansBalises` : entre deux
 * fragments en ligne — « le logo <strong>Les Bikeuses</strong> est imprimé »
 * — c'est l'espace de bordure qui sépare les mots. Le rognage n'intervient
 * qu'aux deux extrémités du paragraphe assemblé.
 */
const plat = (html: string): string =>
  decoder(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ')

const EN_LIGNE = /<(a|strong|b|em|i)\b([^>]*)>([\s\S]*?)<\/\1>/gi

/** Bits de format Lexical. */
const GRAS = 1
const ITALIQUE = 2

/**
 * Contenu en ligne d'un bloc, en conservant liens, gras et italique.
 *
 * `racine` distingue l'appel du bloc de ses appels imbriqués. Le rognage des
 * espaces de bordure ne vaut qu'au niveau du bloc : l'appliquer aussi dans la
 * récursion mangeait l'espace que portait la balise — « Le<strong> T-shirt
 * </strong> » ressortait en « LeT-shirt ».
 */
const enLigne = (html: string, format = 0, racine = true): (NoeudTexte | NoeudLien)[] => {
  const noeuds: (NoeudTexte | NoeudLien)[] = []
  const re = new RegExp(EN_LIGNE.source, 'gi')
  let dernier = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(html))) {
    const avant = plat(html.slice(dernier, m.index))
    if (avant) noeuds.push(texte(avant, format))

    const balise = m[1].toLowerCase()
    const interieur = m[3]

    if (balise === 'a') {
      const href = (m[2].match(/href="([^"]+)"/i) ?? [])[1]
      const enfants = enLigne(interieur, format, false)
      // Un lien ne contient que du texte : `<a>` imbriqué dans `<a>` n'est
      // pas du HTML valide, et le type de nœud l'interdit.
      const dansLeLien = enfants.filter((n): n is NoeudTexte => n.type === 'text')
      if (href && dansLeLien.length) {
        noeuds.push({
          type: 'link',
          fields: { linkType: 'custom', newTab: false, url: decoder(href) },
          children: dansLeLien,
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 3,
        })
      } else {
        noeuds.push(...enfants)
      }
    } else {
      const bit = balise === 'strong' || balise === 'b' ? GRAS : ITALIQUE
      noeuds.push(...enLigne(interieur, format | bit, false))
    }

    dernier = m.index + m[0].length
  }

  const reste = plat(html.slice(dernier))
  if (reste) noeuds.push(texte(reste, format))

  if (racine) {
    const premier = noeuds[0] as NoeudTexte | undefined
    if (premier?.type === 'text') premier.text = premier.text.replace(/^\s+/, '')
    const der = noeuds[noeuds.length - 1] as NoeudTexte | undefined
    if (der?.type === 'text') der.text = der.text.replace(/\s+$/, '')
  }

  return noeuds.filter((n) => n.type !== 'text' || (n as NoeudTexte).text !== '')
}

const BLOC = /<(h[1-6]|p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi

/**
 * Description HTML de WooCommerce en arbre Lexical, ou `null` si vide.
 *
 * Le balayage par blocs consomme le contenu d'une liste avec elle : un `<p>`
 * niché dans un `<li>` n'est donc pas repris une seconde fois au niveau
 * supérieur.
 */
export const enRichText = (html: string): Record<string, unknown> | null => {
  const enfants: Record<string, unknown>[] = []
  const re = new RegExp(BLOC.source, 'gi')
  let m: RegExpExecArray | null

  while ((m = re.exec(html))) {
    const balise = m[1].toLowerCase()
    const interieur = m[2]

    if (balise === 'ul' || balise === 'ol') {
      const items = [...interieur.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((i) => enLigne(i[1]))
        .filter((n) => n.length)
      if (items.length) enfants.push(liste(items) as Record<string, unknown>)
      continue
    }

    if (/^h[1-6]$/.test(balise)) {
      const t = sansBalises(interieur)
      // Les niveaux au-delà de h3 sont ramenés à h3 : la fiche produit porte
      // déjà son h1, et le sommaire des articles ne descend pas plus bas.
      if (t) enfants.push(titre(t, balise === 'h2' ? 'h2' : 'h3') as Record<string, unknown>)
      continue
    }

    const noeuds = enLigne(interieur)
    if (noeuds.length) enfants.push(paragraphe(noeuds) as Record<string, unknown>)
  }

  // Repli : certaines fiches n'ont aucune balise de bloc, juste du texte
  // entrecoupé de <br>. Tout perdre pour cette raison serait absurde.
  if (!enfants.length) {
    for (const part of html.split(/<br\s*\/?>/i)) {
      const noeuds = enLigne(part)
      if (noeuds.length) enfants.push(paragraphe(noeuds) as Record<string, unknown>)
    }
  }

  if (!enfants.length) return null

  return {
    root: { type: 'root', children: enfants, direction: 'ltr', format: '', indent: 0, version: 1 },
  }
}

export type RapportDescriptions = {
  total: number
  dejaFaites: number
  reprises: string[]
  vides: string[]
  echecs: { titre: string; raison: string }[]
  restantes: number
}

/** Un richText Payload sans aucun contenu utile. */
const estVide = (r: unknown): boolean => {
  const enfants = (r as { root?: { children?: unknown[] } } | null)?.root?.children
  return !Array.isArray(enfants) || enfants.length === 0
}

export const importerDescriptions = async ({
  payload,
  req,
  taille = 20,
}: {
  payload: Payload
  req?: PayloadRequest
  taille?: number
}): Promise<RapportDescriptions> => {
  const contexte = req ? { req } : {}

  const tous = await payload.find({
    ...contexte,
    collection: 'products',
    depth: 0,
    limit: 1000,
    pagination: false,
    sort: 'id',
    select: { title: true, wooId: true, description: true },
  })

  const aFaire = tous.docs.filter((p) => p.wooId && estVide(p.description))
  const lot = aFaire.slice(0, taille)

  const rapport: RapportDescriptions = {
    total: tous.docs.length,
    dejaFaites: tous.docs.length - aFaire.length,
    reprises: [],
    vides: [],
    echecs: [],
    restantes: Math.max(0, aFaire.length - lot.length),
  }

  for (const produit of lot) {
    try {
      await souffler()
      const r = await fetch(`${STORE}/products/${produit.wooId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        redirect: 'follow',
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)

      const woo = (await r.json()) as { description?: string }
      const arbre = enRichText(woo.description ?? '')

      if (!arbre) {
        // Fiche sans corps rédigé chez eux : on la marque d'un arbre vide
        // pour ne pas la réinterroger à chaque lot.
        rapport.vides.push(produit.title as string)
        continue
      }

      await payload.update({
        ...contexte,
        collection: 'products',
        id: produit.id,
        depth: 0,
        data: { description: arbre } as never,
        context: { disableRevalidate: true },
      })
      rapport.reprises.push(produit.title as string)
    } catch (err) {
      rapport.echecs.push({
        titre: produit.title as string,
        raison: err instanceof Error ? err.message : 'erreur inconnue',
      })
    }
  }

  return rapport
}
