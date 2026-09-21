'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

import type { Theme } from '@/utilities/themesJournal'

import { cn } from '@/utilities/ui'

/**
 * Filtre du journal par thème.
 *
 * L'état vit dans l'URL et non dans le composant, comme pour les filtres du
 * catalogue : un tri est alors partageable, indexable, et survit au
 * rechargement. Chaque thème est un lien — donc utilisable sans JavaScript et
 * ouvrable dans un nouvel onglet.
 */
export const FiltreThemes: React.FC<{
  themes: (Theme & { nb: number })[]
  total: number
}> = ({ themes, total }) => {
  const chemin = usePathname()
  const params = useSearchParams()
  const actif = params.get('theme')

  if (!themes.length) return null

  /** URL du thème, la pagination remise à zéro. Recliquer le thème actif le retire. */
  const lien = (slug: string | null) => {
    const suivant = new URLSearchParams(params.toString())
    if (slug && slug !== actif) suivant.set('theme', slug)
    else suivant.delete('theme')
    suivant.delete('page')
    const q = suivant.toString()
    return q ? `${chemin}?${q}` : chemin
  }

  return (
    <nav aria-label="Filtrer par thème" className="flex flex-wrap items-center gap-2">
      <Pastille actif={!actif} href={lien(null)} nb={total}>
        Tous les articles
      </Pastille>

      {themes.map((t) => (
        <Pastille actif={actif === t.slug} href={lien(t.slug)} key={t.slug} nb={t.nb}>
          {t.libelle}
        </Pastille>
      ))}
    </nav>
  )
}

const Pastille: React.FC<{
  href: string
  actif: boolean
  nb: number
  children: React.ReactNode
}> = ({ href, actif, nb, children }) => (
  <Link
    aria-current={actif ? 'true' : undefined}
    className={cn(
      'mono-label inline-flex items-center gap-2.5 rounded-pilule border px-4 py-2.5 transition-colors',
      actif
        ? 'border-foreground bg-foreground text-background'
        : 'border-border hover:border-primary hover:text-primary',
    )}
    href={href}
    scroll={false}
  >
    {children}
    <span className={cn('tabular-nums', actif ? 'opacity-60' : 'text-muted-foreground')}>{nb}</span>
  </Link>
)
