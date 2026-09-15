'use client'

import React, { useMemo, useState } from 'react'

import type { Product } from '@/payload-types'

import { cn } from '@/utilities/ui'

type Variante = NonNullable<Product['variantes']>[number]

export type Choix = { variante: Variante | null; prix: number | null }

/**
 * Choix de la déclinaison sur la fiche produit.
 *
 * Une référence se vend par combinaison — souvent une taille, parfois une
 * taille et un coloris. Les deux axes sont donc présentés séparément, et les
 * combinaisons épuisées restent visibles mais barrées : masquer une taille
 * laisse croire qu'elle n'existe pas, alors qu'elle peut revenir.
 */
export const SelecteurVariante: React.FC<{
  variantes: Variante[]
  prixProduit?: number | null
  onChoix?: (choix: Choix) => void
}> = ({ variantes, prixProduit, onChoix }) => {
  const axes = useMemo(() => {
    const tailles = [...new Set(variantes.map((v) => v.taille).filter(Boolean) as string[])]
    const coloris = [...new Set(variantes.map((v) => v.declinaison).filter(Boolean) as string[])]
    return { tailles, coloris }
  }, [variantes])

  const [taille, setTaille] = useState<string | null>(null)
  const [coloris, setColoris] = useState<string | null>(
    axes.coloris.length === 1 ? axes.coloris[0] : null,
  )

  /** Combinaison retenue, quand les deux axes sont tranchés. */
  const choisie = useMemo(() => {
    const correspond = (v: Variante) =>
      (!axes.tailles.length || v.taille === taille) &&
      (!axes.coloris.length || v.declinaison === coloris)
    return variantes.find(correspond) ?? null
  }, [variantes, taille, coloris, axes])

  const prix = choisie?.prix ?? prixProduit ?? null

  React.useEffect(() => {
    onChoix?.({ variante: choisie, prix })
  }, [choisie, prix, onChoix])

  /** Une valeur est proposable si au moins une combinaison la rend disponible. */
  const proposable = (axe: 'taille' | 'declinaison', valeur: string) =>
    variantes.some((v) => {
      if (v[axe] !== valeur) return false
      if (axe === 'taille' && coloris && axes.coloris.length > 1) return v.declinaison === coloris && v.disponible
      if (axe === 'declinaison' && taille) return v.taille === taille && v.disponible
      return v.disponible
    })

  if (!variantes.length) return null

  return (
    <div className="mt-7 flex flex-col gap-6">
      {axes.coloris.length > 1 && (
        <Axe
          choisi={coloris}
          libelle="Coloris"
          onChoisir={setColoris}
          proposable={(v) => proposable('declinaison', v)}
          valeurs={axes.coloris}
        />
      )}

      {axes.tailles.length > 0 && (
        <Axe
          choisi={taille}
          libelle="Taille"
          onChoisir={setTaille}
          proposable={(v) => proposable('taille', v)}
          valeurs={axes.tailles}
        />
      )}

      <p aria-live="polite" className="mono-label text-muted-foreground">
        {!choisie
          ? 'Choisissez une déclinaison'
          : choisie.disponible
            ? typeof choisie.stock === 'number' && choisie.stock <= 3
              ? `Plus que ${choisie.stock} en stock`
              : 'En stock'
            : 'Épuisé pour le moment'}
        {choisie?.reference && <span className="ml-2 opacity-60">réf. {choisie.reference}</span>}
      </p>
    </div>
  )
}

const Axe: React.FC<{
  libelle: string
  valeurs: string[]
  choisi: string | null
  proposable: (v: string) => boolean
  onChoisir: (v: string) => void
}> = ({ libelle, valeurs, choisi, proposable, onChoisir }) => (
  <fieldset className="border-0 p-0">
    <legend className="mono-label mb-3 p-0">{libelle}</legend>
    <div className="flex flex-wrap gap-1.5">
      {valeurs.map((v) => {
        const dispo = proposable(v)
        const actif = choisi === v
        return (
          <button
            aria-pressed={actif}
            className={cn(
              'min-w-[46px] rounded-[10px] border px-3 py-2 text-center font-mono text-[0.6875rem] transition-colors',
              actif
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary hover:text-primary',
              // Épuisé : visible mais barré. Le retirer laisserait croire que
              // la taille n'existe pas, alors qu'elle peut revenir.
              !dispo && !actif && 'text-muted-foreground line-through opacity-50',
            )}
            key={v}
            onClick={() => onChoisir(v)}
            type="button"
          >
            {v}
          </button>
        )
      })}
    </div>
  </fieldset>
)
