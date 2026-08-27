'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'

export type Facette = {
  /** Clé du paramètre d'URL : `marque`, `taille`, `homologation`… */
  cle: string
  titre: string
  valeurs: { valeur: string; libelle: string; nb: number }[]
  /** Rendu en pastilles plutôt qu'en cases à cocher. */
  pastilles?: boolean
}

/**
 * Filtres du catalogue.
 *
 * L'état vit dans l'URL et non dans le composant : un filtrage est partageable,
 * indexable, et survit au rechargement. Chaque option est un lien — donc
 * utilisable sans JavaScript et ouvrable dans un nouvel onglet.
 */
export const Facettes: React.FC<{ facettes: Facette[] }> = ({ facettes }) => {
  const chemin = usePathname()
  const params = useSearchParams()

  const utiles = facettes.filter((f) => f.valeurs.length > 1)
  if (!utiles.length) return null

  /** URL avec la valeur ajoutée ou retirée, la pagination remise à zéro. */
  const lien = (cle: string, valeur: string) => {
    const suivant = new URLSearchParams(params.toString())
    const actuelles = suivant.getAll(cle)
    suivant.delete(cle)
    for (const v of actuelles) if (v !== valeur) suivant.append(cle, v)
    if (!actuelles.includes(valeur)) suivant.append(cle, valeur)
    suivant.delete('page')
    const q = suivant.toString()
    return q ? `${chemin}?${q}` : chemin
  }

  const actif = (cle: string, valeur: string) => params.getAll(cle).includes(valeur)

  return (
    <div>
      {utiles.map((f) => (
        <section className="border-t border-border py-4 first:border-t-0 first:pt-0" key={f.cle}>
          <h2 className="mono-label mb-3.5 text-primary">{f.titre}</h2>

          {f.pastilles ? (
            <div className="flex flex-wrap gap-1.5">
              {f.valeurs.map((v) => (
                <Link
                  className={cn(
                    'min-w-[42px] rounded-[10px] border px-2.5 py-1.5 text-center font-mono text-[0.6875rem] transition-colors',
                    actif(f.cle, v.valeur)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary hover:text-primary',
                  )}
                  href={lien(f.cle, v.valeur)}
                  key={v.valeur}
                  scroll={false}
                >
                  {v.libelle}
                </Link>
              ))}
            </div>
          ) : (
            <ul className="flex list-none flex-col p-0">
              {f.valeurs.map((v) => (
                <li key={v.valeur}>
                  <Link
                    className={cn(
                      'flex items-center gap-2.5 py-1 text-[0.9375rem] transition-colors hover:text-primary',
                      actif(f.cle, v.valeur) && 'text-primary',
                    )}
                    href={lien(f.cle, v.valeur)}
                    scroll={false}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-[15px] shrink-0 place-items-center rounded-[4px] border',
                        actif(f.cle, v.valeur)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border',
                      )}
                    >
                      {actif(f.cle, v.valeur) && (
                        <svg className="size-2.5 fill-none stroke-current stroke-[3]" viewBox="0 0 24 24">
                          <path d="m4 12 6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1">{v.libelle}</span>
                    <span className="mono-label tabular-nums text-muted-foreground">{v.nb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

/** Filtres actifs, retirables d'un clic. */
export const Jetons: React.FC<{ libelles: Record<string, string> }> = ({ libelles }) => {
  const chemin = usePathname()
  const params = useSearchParams()

  const actifs: { cle: string; valeur: string }[] = []
  for (const [cle, valeur] of params.entries()) {
    if (cle === 'page' || cle === 'tri') continue
    actifs.push({ cle, valeur })
  }
  if (!actifs.length) return null

  const sans = (cle: string, valeur: string) => {
    const suivant = new URLSearchParams(params.toString())
    const restantes = suivant.getAll(cle).filter((v) => v !== valeur)
    suivant.delete(cle)
    for (const v of restantes) suivant.append(cle, v)
    suivant.delete('page')
    const q = suivant.toString()
    return q ? `${chemin}?${q}` : chemin
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {actifs.map(({ cle, valeur }) => (
        <Link
          className="mono-label inline-flex items-center gap-2 rounded-pilule bg-accent py-1.5 pr-2 pl-3 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          href={sans(cle, valeur)}
          key={`${cle}-${valeur}`}
          scroll={false}
        >
          {libelles[valeur] ?? valeur}
          <span aria-hidden="true" className="text-[0.85em]">
            ×
          </span>
        </Link>
      ))}
    </div>
  )
}
