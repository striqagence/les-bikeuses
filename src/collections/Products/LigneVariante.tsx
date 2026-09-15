'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Intitulé d'une déclinaison dans la liste du back-office.
 *
 * Sans cela, les lignes s'affichent « Déclinaison 01, 02, 03… » : illisible
 * dès qu'une référence en compte huit.
 */
export const LigneVariante: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{
    taille?: string
    declinaison?: string
    disponible?: boolean
    stock?: number | null
  }>()

  const intitule = [data?.taille, data?.declinaison].filter(Boolean).join(' · ')
  const etat =
    typeof data?.stock === 'number'
      ? `${data.stock} en stock`
      : data?.disponible
        ? 'disponible'
        : 'épuisé'

  return <span>{intitule || `Déclinaison ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`} — {etat}</span>
}
