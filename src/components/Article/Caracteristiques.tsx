import React from 'react'

import type { Spec } from '@/utilities/specsMoto'

/**
 * Fiche technique d'une moto du dictionnaire.
 *
 * Même composition que les caractéristiques d'une fiche produit : intitulé en
 * mono à gauche, valeur alignée à droite, une ligne par filet. Deux colonnes
 * dès qu'il y a la place — la mesure du corps d'article est étroite, mais ces
 * lignes sont courtes et les empiler sur une seule colonne allongeait la
 * fiche sans rien y gagner.
 */
export const Caracteristiques: React.FC<{ specs: Spec[] }> = ({ specs }) => (
  <dl className="mt-7 mb-10 grid grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-10">
    {specs.map(({ libelle, valeur }) => (
      <div
        className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
        key={libelle + valeur}
      >
        <dt className="mono-label m-0 text-muted-foreground">{libelle}</dt>
        <dd className="m-0 text-right text-sm font-semibold">{valeur}</dd>
      </div>
    ))}
  </dl>
)
