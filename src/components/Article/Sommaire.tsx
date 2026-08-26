'use client'

import React, { useEffect, useState } from 'react'

import type { EntreeSommaire } from '@/utilities/sommaire'

import { cn } from '@/utilities/ui'

/**
 * Sommaire collant. Le balisage est rendu côté serveur par le parent : ce
 * composant n'ajoute que le suivi de la section en cours, si bien que le
 * sommaire reste lisible et cliquable sans JavaScript.
 */
export const Sommaire: React.FC<{ entrees: EntreeSommaire[] }> = ({ entrees }) => {
  const [actif, setActif] = useState<string | null>(null)

  useEffect(() => {
    const cibles = entrees
      .map(({ id }) => document.getElementById(id))
      .filter((e): e is HTMLElement => Boolean(e))

    if (!cibles.length) return

    const visibles = new Set<string>()

    // `rootMargin` haut négatif : le basculement se fait quand le titre atteint
    // le tiers supérieur de l'écran, pas quand il en effleure le bas.
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) visibles.add(e.target.id)
          else visibles.delete(e.target.id)
        }
        const premier = cibles.find((c) => visibles.has(c.id))
        if (premier) setActif(premier.id)
      },
      { rootMargin: '-33% 0px -55% 0px' },
    )

    cibles.forEach((c) => observateur.observe(c))
    return () => observateur.disconnect()
  }, [entrees])

  if (entrees.length < 2) return null

  return (
    <nav
      aria-label="Sommaire"
      className="lg:sticky lg:top-24 max-lg:rounded-panneau max-lg:border max-lg:border-border max-lg:p-5"
    >
      <h2 className="mono-label mb-4 text-primary">Sommaire</h2>
      <ol className="flex list-none flex-col p-0">
        {entrees.map(({ id, texte, niveau, numero }) => (
          <li key={id}>
            <a
              aria-current={actif === id}
              className={cn(
                'grid grid-cols-[1.9rem_1fr] gap-1.5 border-l-2 border-border py-1.5 pl-3.5 text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground',
                niveau === 3 && 'pl-8 text-[0.8125rem]',
                actif === id && 'border-primary text-primary',
              )}
              href={`#${id}`}
            >
              <span className="mono-label pt-0.5">
                {numero ? String(numero).padStart(2, '0') : ''}
              </span>
              <span>{texte}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
