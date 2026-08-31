import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Avi } from '@/payload-types'

import { CarteAvis } from '@/components/Avis/CarteAvis'
import { Etoiles } from '@/components/Avis/Etoiles'
import { Facettes, Jetons, type Facette } from '@/components/Boutique/Facettes'
import { PaginationRayon } from '@/components/Boutique/PaginationRayon'

const PAR_PAGE = 24
const DUREE_CACHE = 600

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const liste = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

/**
 * Synthèse de l'ensemble des avis.
 *
 * Calculée sur la totalité et non sur la page affichée : une moyenne qui
 * bougerait au fil de la pagination ne voudrait rien dire. La requête ne
 * dépend d'aucun filtre, elle est donc mise en cache.
 */
const chargerSynthese = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const r = await payload.find({
      collection: 'avis',
      depth: 0,
      limit: 2000,
      pagination: false,
      select: { note: true, rayon: true, texte: true },
    })

    const notes = r.docs.map((d) => d.note as number)
    const total = notes.length
    const moyenne = total ? notes.reduce((s, n) => s + n, 0) / total : 0

    const parNote = new Map<number, number>()
    const parRayon = new Map<string, number>()
    let commentes = 0
    for (const d of r.docs) {
      parNote.set(d.note as number, (parNote.get(d.note as number) ?? 0) + 1)
      if (d.rayon) parRayon.set(d.rayon, (parRayon.get(d.rayon) ?? 0) + 1)
      if (d.texte?.trim()) commentes++
    }

    return {
      total,
      commentes,
      moyenne,
      parNote: [5, 4, 3, 2, 1].map((n) => ({ note: n, nb: parNote.get(n) ?? 0 })),
      parRayon: [...parRayon.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([valeur, nb]) => ({ valeur, libelle: valeur, nb })),
    }
  },
  ['synthese-avis'],
  { revalidate: DUREE_CACHE },
)

export default async function AvisDesClients({ searchParams: sp }: Args) {
  const params = await sp
  const synthese = await chargerSynthese()

  const rayons = liste(params.rayon)
  const notes = liste(params.note)
  const commentes = liste(params.avec).includes('commentaire')
  const page = Math.max(1, Number(params.page) || 1)

  const payload = await getPayload({ config: configPromise })
  const avis = await payload.find({
    collection: 'avis',
    depth: 0,
    limit: PAR_PAGE,
    page,
    // Les avis mis en avant d'abord, le reste du plus récent au plus ancien.
    sort: ['-enAvant', '-publieLe'],
    where: {
      and: [
        ...(rayons.length ? [{ rayon: { in: rayons } }] : []),
        ...(notes.length ? [{ note: { in: notes.map(Number) } }] : []),
        ...(commentes ? [{ texte: { exists: true } }] : []),
      ],
    },
  })

  const facettes: Facette[] = [
    {
      cle: 'avec',
      titre: 'Affichage',
      interrupteur: true,
      valeurs: [{ valeur: 'commentaire', libelle: 'Avec commentaire', nb: synthese.commentes }],
    },
    {
      cle: 'note',
      titre: 'Note',
      valeurs: synthese.parNote
        .filter((n) => n.nb)
        .map((n) => ({ valeur: String(n.note), libelle: `${n.note} étoile${n.note > 1 ? 's' : ''}`, nb: n.nb })),
    },
    { cle: 'rayon', titre: 'Rayon', valeurs: synthese.parRayon },
  ]

  const libelles: Record<string, string> = { commentaire: 'Avec commentaire' }
  for (const n of synthese.parNote) libelles[String(n.note)] = `${n.note} étoile${n.note > 1 ? 's' : ''}`

  return (
    <div className="container pt-6 pb-16 md:pt-10">
      <header className="mb-9">
        <p className="eyebrow">La boutique</p>
        <h1 className="wonk mt-2 text-3xl leading-[1.03] font-medium md:text-5xl">
          Les avis de nos clientes
        </h1>

        <div className="mt-7 flex flex-wrap items-center gap-x-10 gap-y-6 rounded-panneau border border-border bg-card p-6">
          <div>
            <p className="wonk text-5xl leading-none font-medium tabular-nums">
              {synthese.moyenne.toFixed(1).replace('.', ',')}
            </p>
            <div className="mt-2">
              <Etoiles note={synthese.moyenne} taille="grande" />
            </div>
            <p className="mono-label mt-2 text-muted-foreground">
              {synthese.total} avis récoltés
            </p>
          </div>

          <div className="min-w-[220px] flex-1">
            {synthese.parNote.map(({ note, nb }) => (
              <div className="flex items-center gap-3 py-0.5 text-sm" key={note}>
                <span className="mono-label w-4 shrink-0 text-muted-foreground">{note}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-pilule bg-border">
                  <span
                    className="block h-full rounded-pilule bg-primary"
                    style={{ width: `${synthese.total ? (nb / synthese.total) * 100 : 0}%` }}
                  />
                </span>
                <span className="mono-label w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                  {synthese.total ? Math.round((nb / synthese.total) * 100) : 0} %
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 max-w-[65ch] text-sm text-muted-foreground">
          Chaque avis provient d’une commande passée sur la boutique. Ils sont repris tels quels,
          sans tri ni retouche — {synthese.commentes} d’entre eux sont accompagnés d’un commentaire.
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24">
          <Facettes facettes={facettes} />
        </aside>

        <div>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <Jetons libelles={libelles} />
            <p className="mono-label text-muted-foreground">
              {avis.totalDocs} avis affiché{avis.totalDocs > 1 ? 's' : ''}
            </p>
          </div>

          {avis.docs.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {avis.docs.map((a) => (
                  <CarteAvis avis={a as Avi} key={a.id} />
                ))}
              </div>
              <PaginationRayon page={avis.page ?? 1} total={avis.totalPages} />
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">
              Aucun avis ne correspond à ces filtres. Retirez-en un pour élargir.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { total, moyenne } = await chargerSynthese()

  return {
    title: 'Avis des clientes | Les Bikeuses',
    description: `${total} avis vérifiés sur l’équipement moto femme Les Bikeuses, pour une note moyenne de ${moyenne
      .toFixed(1)
      .replace('.', ',')} sur 5.`,
  }
}
