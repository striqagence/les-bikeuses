/**
 * Extraction d'un article WordPress de lesbikeuses.fr.
 *
 * L'API `wp/v2` du site renvoie 401 : tout passe donc par la lecture du HTML.
 * Ce module ne fait que produire une structure ; l'écriture en base et
 * l'envoi des images sont du ressort de l'importeur.
 */

export type NoeudTexte = {
  type: 'text'
  detail: 0
  format: number
  mode: 'normal'
  style: ''
  text: string
  version: 1
}

export type NoeudLien = {
  type: 'link'
  fields: { linkType: 'custom'; newTab: boolean; url: string }
  children: NoeudTexte[]
  direction: 'ltr'
  format: ''
  indent: 0
  version: 3
}

/** Image repérée dans le corps, résolue en nœud `upload` à l'import. */
export type NoeudImage = {
  type: '__image'
  url: string
  alt: string
}

export type BlocExtrait = Record<string, unknown> | NoeudImage

export type ArticleExtrait = {
  slug: string
  titre: string
  extrait: string
  publieLe: string | null
  categories: string[]
  imageUne: string | null
  blocs: BlocExtrait[]
}

const ENTITES: [RegExp, string][] = [
  [/&#0?39;|&apos;|&rsquo;|&#8217;/g, '’'],
  [/&nbsp;|&#160;/g, ' '],
  [/&laquo;\s?/g, '« '],
  [/\s?&raquo;/g, ' »'],
  [/&hellip;/g, '…'],
  [/&eacute;/g, 'é'],
  [/&egrave;/g, 'è'],
  [/&agrave;/g, 'à'],
  [/&ccedil;/g, 'ç'],
  [/&ecirc;/g, 'ê'],
  [/&ocirc;/g, 'ô'],
  [/&icirc;/g, 'î'],
  [/&ugrave;/g, 'ù'],
  [/&deg;/g, '°'],
  [/&euro;/g, '€'],
  [/&quot;/g, '"'],
  [/&#8211;|&ndash;/g, '–'],
  [/&#8212;|&mdash;/g, '—'],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&amp;/g, '&'],
]

export const decoder = (s: string): string =>
  ENTITES.reduce((acc, [re, rep]) => acc.replace(re, rep), s)

const sansBalises = (html: string): string =>
  decoder(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

const meta = (html: string, nom: string): string | null =>
  (html.match(new RegExp(`<meta property="${nom}" content="([^"]*)"`)) ||
    html.match(new RegExp(`<meta name="${nom}" content="([^"]*)"`)) ||
    [])[1] ?? null

/* ---------- fabriques de nœuds Lexical ---------- */

const texte = (t: string, format = 0): NoeudTexte => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: t,
  version: 1,
})

const paragraphe = (enfants: (NoeudTexte | NoeudLien)[]) => ({
  type: 'paragraph',
  children: enfants,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const titre = (t: string, tag: 'h2' | 'h3') => ({
  type: 'heading',
  children: [texte(t)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag,
  version: 1,
})

const liste = (items: (NoeudTexte | NoeudLien)[][]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  children: items.map((enfants, i) => ({
    type: 'listitem',
    value: i + 1,
    children: enfants,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  })),
})

/**
 * Contenu d'un fragment HTML en nœuds Lexical, en conservant les liens.
 *
 * Les liens sont conservés plutôt qu'aplatis : sur deux cents articles très
 * maillés entre eux, tout mettre à plat perdrait le maillage interne.
 */
const enrichir = (html: string): (NoeudTexte | NoeudLien)[] => {
  const noeuds: (NoeudTexte | NoeudLien)[] = []
  const re = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let dernier = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(html))) {
    const avant = sansBalises(html.slice(dernier, m.index))
    if (avant) noeuds.push(texte(avant))

    const libelle = sansBalises(m[2])
    if (libelle) {
      noeuds.push({
        type: 'link',
        fields: { linkType: 'custom', newTab: false, url: decoder(m[1]) },
        children: [texte(libelle)],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 3,
      })
    }
    dernier = m.index + m[0].length
  }

  const reste = sansBalises(html.slice(dernier))
  if (reste) noeuds.push(texte(reste))

  return noeuds.length ? noeuds : [texte(sansBalises(html))]
}

/* ---------- extraction ---------- */

const PARASITES =
  /^(acheter|ajouter au panier|promo\s*!?|en rupture|voir le produit|lire la suite|sommaire|contenus|partager|articles similaires)$/i
const PRIX = /^\s*\d+([.,]\d+)?\s*(€|euros?)\s*$/i

/**
 * Lit un article et en extrait le contenu.
 *
 * `catalogue` contient les noms de rayons et de marques WooCommerce : les
 * articles embarquent des carrousels produits dont les intitulés se
 * retrouveraient sinon dans le corps sous forme de paragraphes.
 */
export const extraireArticle = async (
  slug: string,
  catalogue: Set<string>,
): Promise<ArticleExtrait | null> => {
  const reponse = await fetch(`https://lesbikeuses.fr/${slug}/`, {
    headers: { 'user-agent': 'les-bikeuses-import/1.0' },
  })
  if (!reponse.ok) return null
  const html = await reponse.text()

  // Bornes fiables : de `entry-content` au premier `</article>`. Un
  // `</div></div>` naïf coupe au premier div imbriqué (sommaire lwptoc).
  const debut = html.indexOf('entry-content')
  const fin = html.indexOf('</article>', debut)
  if (debut === -1 || fin === -1) return null

  const corps = html
    .slice(debut, fin)
    // `noscript` est conservé : le lazy-load de WordPress y place le vrai
    // `src`, le `<img>` visible ne portant qu'un placeholder en data:URI.
    .replace(/<(script|style|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<div class="lwptoc[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<div[^>]*class="[^"]*(share|author|newsletter)[^"]*"[\s\S]{0,4000}?<\/div>/gi, ' ')

  const estParasite = (t: string) =>
    !t || catalogue.has(t.toLowerCase().trim()) || PARASITES.test(t.trim()) || PRIX.test(t)

  const blocs: BlocExtrait[] = []
  const vues = new Set<string>()

  /** Empile les images d'un fragment, en écartant les placeholders. */
  const empilerImages = (fragment: string) => {
    for (const img of fragment.matchAll(/<img\b[^>]*>/gi)) {
      const src = img[0].match(/(?:data-)?src="([^"]+)"/i)?.[1]
      // Le placeholder du lazy-load est un data:URI : c'est le jumeau dans
      // `noscript` qui porte l'adresse réelle.
      if (!src || /^data:/.test(src)) continue

      const url = new URL(decoder(src), 'https://lesbikeuses.fr').toString()
      if (vues.has(url)) continue
      vues.add(url)

      blocs.push({
        type: '__image',
        url,
        alt: decoder(img[0].match(/alt="([^"]*)"/i)?.[1] ?? ''),
      })
    }
  }

  // Les `<img>` isolés sont balayés au même titre que les blocs de texte :
  // beaucoup ne sont enveloppés dans aucun paragraphe.
  const re = /<(p|h2|h3|ul|figure)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(corps))) {
    const [complet, balise, interieur] = m

    if (!balise) {
      empilerImages(complet)
      continue
    }

    const tag = balise.toLowerCase()

    // Un paragraphe peut mêler texte et images : on sort les images d'abord,
    // puis le texte restant.
    if (/<img\b/i.test(complet)) {
      empilerImages(complet)
      if (tag === 'figure') continue
    }

    if (tag === 'ul') {
      const items = [...interieur.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((li) => li[1])
        .filter((brut) => {
          const t = sansBalises(brut)
          return t && !estParasite(t)
        })
        .map(enrichir)
      if (items.length) blocs.push(liste(items))
      continue
    }

    const nettoye = interieur.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<img\b[^>]*>/gi, ' ')
    const brut = sansBalises(nettoye)
    if (!brut || brut.length < 3 || estParasite(brut)) continue

    // Doublons consécutifs : Flatsome duplique certains blocs mobile/desktop.
    const precedent = blocs[blocs.length - 1] as { children?: { text?: string }[] } | undefined
    if (precedent?.children?.[0]?.text === brut) continue

    blocs.push(tag === 'p' ? paragraphe(enrichir(nettoye)) : titre(brut, tag as 'h2' | 'h3'))
  }

  const categories = [...new Set([...html.matchAll(/rel="category tag">([^<]+)</g)].map((c) => decoder(c[1])))]

  return {
    slug,
    titre: decoder(meta(html, 'og:title') ?? '').replace(/\s*[-|]\s*Les Bikeuses\s*$/, '').trim(),
    extrait: decoder(meta(html, 'og:description') ?? meta(html, 'description') ?? ''),
    publieLe: meta(html, 'article:published_time'),
    categories,
    imageUne: meta(html, 'og:image'),
    blocs,
  }
}

/** Noms de rayons et de marques WooCommerce, pour filtrer les carrousels. */
export const chargerCatalogue = async (): Promise<Set<string>> => {
  try {
    const r = await fetch(
      'https://lesbikeuses.fr/wp-json/wc/store/v1/products/categories?per_page=100',
    )
    if (!r.ok) return new Set()
    const cats = (await r.json()) as { name: string }[]
    return new Set(cats.map((c) => decoder(c.name).toLowerCase().trim()))
  } catch {
    return new Set()
  }
}

/** Tous les slugs d'articles, depuis le sitemap. */
export const listerSlugs = async (): Promise<string[]> => {
  const r = await fetch('https://lesbikeuses.fr/post-sitemap.xml')
  if (!r.ok) throw new Error(`Sitemap injoignable (${r.status})`)
  const xml = await r.text()

  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace('https://lesbikeuses.fr/', '').replace(/\/$/, ''))
    // `blog` est la page d'index du blog, pas un article.
    .filter((s) => s && s !== 'blog' && !s.includes('/'))
}
