'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * Pagination du catalogue.
 *
 * Chaque page est un lien qui conserve les filtres actifs : sans cela,
 * changer de page réinitialiserait la sélection. Des liens, et non des
 * boutons pilotés par le routeur, pour rester ouvrables dans un nouvel onglet
 * et indexables.
 */
export const PaginationRayon: React.FC<{ page: number; total: number }> = ({ page, total }) => {
  const chemin = usePathname()
  const params = useSearchParams()

  if (total <= 1) return null

  const lien = (n: number) => {
    const suivant = new URLSearchParams(params.toString())
    if (n <= 1) suivant.delete('page')
    else suivant.set('page', String(n))
    const q = suivant.toString()
    return q ? `${chemin}?${q}` : chemin
  }

  // Fenêtre resserrée autour de la page courante : au-delà d'une dizaine de
  // rayons, aligner toutes les pages déborde sur mobile.
  const pages = new Set<number>([1, total, page, page - 1, page + 1])
  const affichees = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <Lien actif={false} desactive={page <= 1} href={lien(page - 1)}>
        Précédent
      </Lien>

      {affichees.map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && affichees[i - 1] !== n - 1 && (
            <span aria-hidden="true" className="mono-label px-1 text-muted-foreground">
              …
            </span>
          )}
          <Lien actif={n === page} href={lien(n)}>
            {n}
          </Lien>
        </React.Fragment>
      ))}

      <Lien actif={false} desactive={page >= total} href={lien(page + 1)}>
        Suivant
      </Lien>
    </nav>
  )
}

const Lien: React.FC<{
  href: string
  actif: boolean
  desactive?: boolean
  children: React.ReactNode
}> = ({ href, actif, desactive, children }) => {
  const classe = cn(
    'mono-label rounded-pilule border px-3.5 py-2 transition-colors',
    actif
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border hover:border-primary hover:text-primary',
    desactive && 'pointer-events-none opacity-40',
  )

  // Un lien désactivé sort du parcours clavier plutôt que d'y rester inerte.
  return desactive ? (
    <span aria-disabled="true" className={classe}>
      {children}
    </span>
  ) : (
    <Link className={classe} href={href} scroll={false}>
      {children}
    </Link>
  )
}
