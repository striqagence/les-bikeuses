import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

import type { Post } from '@/payload-types'

import { CarteMoto, titresDe } from '@/components/Dictionnaire/CarteMoto'
import { Facettes, Jetons, type Facette } from '@/components/Boutique/Facettes'
import { PaginationRayon } from '@/components/Boutique/PaginationRayon'

const PAR_PAGE = 24
const DUREE_CACHE = 600

/** Catégorie qui marque une fiche modèle, par opposition à un article. */
const MARQUEUR = 'Motos'

/**
 * Groupes de facettes.
 *
 * Les fiches portent une taxonomie déjà structurée : cylindrée, poids, type,
 * permis, gabarit. Elle est reprise telle quelle plutôt que réinventée — c'est
 * elle que l'ancien site utilisait déjà pour classer ses motos, sans jamais
 * l'exposer autrement que par une liste de marques.
 */
const GROUPES: {
  cle: string
  titre: string
  valeurs: string[]
  pastilles?: boolean
  interrupteur?: boolean
}[] = [
  { cle: 'permis', titre: 'Permis', valeurs: ['Compatible permis A2'], interrupteur: true },
  { cle: 'gabarit', titre: 'Gabarit', valeurs: ['Petit gabarit'], interrupteur: true },
  { cle: 'cylindree', titre: 'Cylindrée', valeurs: ['125cc', '250cc - 600cc', 'Plus de 600cc'] },
  { cle: 'poids', titre: 'Poids', valeurs: ['130kg - 190kg', '190kg - 225kg', 'Plus de 225kg'] },
  {
    cle: 'type',
    titre: 'Type',
    valeurs: ['Roadsters', 'Custom Rétro', 'Sportive', 'Trail', 'Routière et GT', 'Scooter'],
  },
]

/** Valeur numérique d'une fiche technique, ou `null` si elle manque. */
const valeurDe = (post: Post, champ: 'prix' | 'hauteurSelle' | 'poids'): number | null => {
  const v = post.moto?.[champ]
  return typeof v === 'number' ? v : null
}

/**
 * Facettes par tranche, assises sur la fiche technique.
 *
 * Les groupes ci-dessus reposent sur la taxonomie héritée, qui range une moto
 * dans « Plus de 600cc » sans jamais dire combien. Ces tranches-ci lisent les
 * valeurs réelles, désormais normalisées — d'où la possibilité de demander
 * « moins de 76 cm de selle », ce qu'aucune catégorie ne savait exprimer.
 *
 * Le découpage de la selle suit l'usage plutôt qu'une progression régulière :
 * 76 cm est le seuil autour duquel une personne d'1 m 60 pose les deux pieds,
 * et c'est la question que pose ce lectorat avant toutes les autres.
 */
const TRANCHES: {
  cle: string
  titre: string
  valeurs: { valeur: string; test: (m: Post) => boolean }[]
}[] = [
  {
    cle: 'selle',
    titre: 'Hauteur de selle',
    valeurs: [
      { valeur: 'Moins de 76 cm', test: (m) => (valeurDe(m, 'hauteurSelle') ?? 1e9) < 760 },
      { valeur: '76 à 80 cm', test: (m) => { const h = valeurDe(m, 'hauteurSelle'); return h !== null && h >= 760 && h < 800 } },
      { valeur: '80 à 84 cm', test: (m) => { const h = valeurDe(m, 'hauteurSelle'); return h !== null && h >= 800 && h < 840 } },
      { valeur: '84 cm et plus', test: (m) => (valeurDe(m, 'hauteurSelle') ?? -1) >= 840 },
    ],
  },
  {
    cle: 'budget',
    titre: 'Budget',
    valeurs: [
      { valeur: 'Moins de 5 000 €', test: (m) => (valeurDe(m, 'prix') ?? 1e9) < 5000 },
      { valeur: '5 000 à 10 000 €', test: (m) => { const p = valeurDe(m, 'prix'); return p !== null && p >= 5000 && p < 10000 } },
      { valeur: '10 000 à 15 000 €', test: (m) => { const p = valeurDe(m, 'prix'); return p !== null && p >= 10000 && p < 15000 } },
      { valeur: '15 000 € et plus', test: (m) => (valeurDe(m, 'prix') ?? -1) >= 15000 },
    ],
  },
]

/**
 * Tris disponibles.
 *
 * Les fiches sans valeur passent en dernier plutôt qu'en tête : une moto dont
 * on ignore le poids n'est pas la plus légère.
 */
const TRIS: Record<string, { libelle: string; champ: 'prix' | 'hauteurSelle' | 'poids'; sens: 1 | -1 }> = {
  'prix-croissant': { libelle: 'Prix croissant', champ: 'prix', sens: 1 },
  'prix-decroissant': { libelle: 'Prix décroissant', champ: 'prix', sens: -1 },
  'selle-basse': { libelle: 'Selle la plus basse', champ: 'hauteurSelle', sens: 1 },
  'plus-legere': { libelle: 'La plus légère', champ: 'poids', sens: 1 },
}

/** Tout ce qui n'appartient à aucun groupe technique est une marque. */
const NON_MARQUES = new Set([MARQUEUR, ...GROUPES.flatMap((g) => g.valeurs), 'À la une', 'Lieux'])

const marqueDe = (post: Post): string | null =>
  titresDe(post).find((t) => !NON_MARQUES.has(t)) ?? null

/** Cylindrée, poids et type : les trois critères qui décident d'un achat. */
const caracteristiquesDe = (post: Post): string[] => {
  const titres = new Set(titresDe(post))
  return ['cylindree', 'poids', 'type']
    .map((cle) => GROUPES.find((g) => g.cle === cle)?.valeurs.find((v) => titres.has(v)))
    .filter((v): v is string => Boolean(v))
}

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const liste = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

export default async function Dictionnaire({ searchParams: sp }: Args) {
  const params = await sp
  const motos = await chargerMotos()

  // Filtrage en mémoire : quatre-vingts fiches tiennent largement, et cumuler
  // plusieurs catégories en base donnerait un OU là où il faut un ET.
  const filtres = [...GROUPES.map((g) => g.cle), 'marque']
  const retenues = motos.filter((moto) => {
    const titres = new Set(titresDe(moto))
    const parTaxonomie = filtres.every((cle) => {
      const choisies = liste(params[cle])
      if (!choisies.length) return true
      return choisies.every((v) => (cle === 'marque' ? marqueDe(moto) === v : titres.has(v)))
    })
    if (!parTaxonomie) return false

    // Les tranches se cumulent en OU à l'intérieur d'un même critère — deux
    // fourchettes de prix cochées élargissent la recherche — et en ET entre
    // critères, comme le reste des facettes.
    return TRANCHES.every(({ cle, valeurs }) => {
      const choisies = liste(params[cle])
      if (!choisies.length) return true
      return choisies.some((v) => valeurs.find((t) => t.valeur === v)?.test(moto))
    })
  })

  const tri = typeof params.tri === 'string' ? TRIS[params.tri] : undefined
  if (tri) {
    retenues.sort((a, b) => {
      const va = valeurDe(a, tri.champ)
      const vb = valeurDe(b, tri.champ)
      // Une valeur absente part en fin de liste quel que soit le sens.
      if (va === null) return vb === null ? 0 : 1
      if (vb === null) return -1
      return (va - vb) * tri.sens
    })
  }

  const page = Math.max(1, Number(params.page) || 1)
  const totalPages = Math.max(1, Math.ceil(retenues.length / PAR_PAGE))
  const visibles = retenues.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)

  const compter = (valeur: string, cle: string) =>
    motos.filter((m) => (cle === 'marque' ? marqueDe(m) === valeur : titresDe(m).includes(valeur)))
      .length

  const facettes: Facette[] = [
    {
      cle: 'marque',
      titre: 'Marque',
      valeurs: [...new Set(motos.map(marqueDe).filter((m): m is string => Boolean(m)))]
        .map((valeur) => ({ valeur, libelle: valeur, nb: compter(valeur, 'marque') }))
        .sort((a, b) => b.nb - a.nb || a.libelle.localeCompare(b.libelle, 'fr')),
    },
    ...TRANCHES.map(({ cle, titre, valeurs }) => ({
      cle,
      titre,
      valeurs: valeurs
        .map(({ valeur, test }) => ({
          valeur,
          libelle: valeur,
          nb: motos.filter(test).length,
        }))
        .filter((v) => v.nb > 0),
    })),
    ...GROUPES.map((g) => ({
      cle: g.cle,
      titre: g.titre,
      pastilles: g.pastilles,
      interrupteur: g.interrupteur,
      valeurs: g.valeurs
        .map((valeur) => ({ valeur, libelle: valeur, nb: compter(valeur, g.cle) }))
        .filter((v) => v.nb > 0),
    })),
  ]

  return (
    <div className="container pt-6 pb-16 md:pt-10">
      <header className="mb-8 max-w-[46rem]">
        <p className="eyebrow">Dictionnaire moto</p>
        <h1 className="titre-section mt-3 max-w-[18ch]">
          Trouvez la moto qui vous va
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {motos.length} modèles passés en revue, classés par cylindrée, poids et gabarit —
          les critères qui comptent vraiment quand on choisit sa première machine.
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24">
          <Facettes facettes={facettes} />
        </aside>

        <div>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <Jetons libelles={{}} />
            <p className="mono-label text-muted-foreground">
              {retenues.length} modèle{retenues.length > 1 ? 's' : ''}
            </p>
          </div>

          {/*
            * Tri rendu côté serveur : des liens, pas un menu piloté par le
            * routeur. Un tri devient alors partageable et indexable, et il
            * fonctionne sans JavaScript — même raison que pour les facettes.
            */}
          <nav aria-label="Trier" className="mb-7 flex flex-wrap items-center gap-2">
            <span className="mono-label mr-1 text-muted-foreground">Trier</span>
            {[['', 'Par défaut'] as const, ...Object.entries(TRIS).map(
              ([cle, t]) => [cle, t.libelle] as const,
            )].map(([cle, libelle]) => {
              const suivant = new URLSearchParams()
              for (const [k, v] of Object.entries(params)) {
                if (k === 'tri' || k === 'page') continue
                for (const x of liste(v)) suivant.append(k, x)
              }
              if (cle) suivant.set('tri', cle)
              const q = suivant.toString()
              const actif = (typeof params.tri === 'string' ? params.tri : '') === cle
              return (
                <Link
                  aria-current={actif ? 'true' : undefined}
                  className={
                    'mono-label rounded-pilule border px-4 py-2 transition-colors ' +
                    (actif
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-primary hover:text-primary')
                  }
                  href={q ? `/dictionnaire-moto?${q}` : '/dictionnaire-moto'}
                  key={cle || 'defaut'}
                >
                  {libelle}
                </Link>
              )
            })}
          </nav>

          {visibles.length ? (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
                {/* Première rangée chargée sans attendre, comme en boutique. */}
                {visibles.map((moto, i) => (
                  <CarteMoto
                    caracteristiques={caracteristiquesDe}
                    key={moto.id}
                    marque={marqueDe}
                    moto={moto}
                    prioritaire={i < 4}
                  />
                ))}
              </div>
              <PaginationRayon page={page} total={totalPages} />
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              Aucun modèle ne correspond à ces critères. Retirez-en un pour élargir.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Les quatre-vingts fiches, chargées une fois pour toutes.
 *
 * La page lit `searchParams`, donc Next la rend à chaque visite : sans ce
 * cache, chaque affichage relancerait la requête complète.
 */
const chargerMotos = unstable_cache(
  async (): Promise<Post[]> => {
    const payload = await getPayload({ config: configPromise })

    const rayon = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      pagination: false,
      where: { title: { equals: MARQUEUR } },
    })
    if (!rayon.docs[0]) return []

    const r = await payload.find({
      collection: 'posts',
      depth: 1,
      limit: 300,
      pagination: false,
      sort: 'title',
      where: { categories: { in: [rayon.docs[0].id] } },
    })
    return r.docs
  },
  ['dictionnaire-motos'],
  { revalidate: DUREE_CACHE },
)

export const metadata: Metadata = {
  title: 'Dictionnaire moto | Les Bikeuses',
  description:
    'Tous les modèles passés en revue, classés par cylindrée, poids, gabarit et compatibilité permis A2. Trouvez la moto adaptée à votre taille et à votre budget.',
  openGraph: mergeOpenGraph({
    title: 'Dictionnaire moto | Les Bikeuses',
    description: 'Tous les modèles passés en revue, classés par cylindrée, poids, gabarit et compatibilité permis A2. Trouvez la moto adaptée à votre taille et à votre budget.',
  }),
}
