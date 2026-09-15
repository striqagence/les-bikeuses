'use client'

import React, { useCallback, useState } from 'react'

import type { Product } from '@/payload-types'

import { SelecteurVariante, type Choix } from './SelecteurVariante'
import { prixFr } from './CarteProduit'

/**
 * Bloc d'achat de la fiche produit.
 *
 * Réunit le choix de la déclinaison et l'appel à l'action, parce que le second
 * dépend du premier : le prix affiché et la disponibilité changent selon la
 * taille retenue.
 *
 * Le panier n'existe pas encore — le bouton mène donc à l'ancienne boutique,
 * où la commande est réellement possible. Quand il existera, seul ce composant
 * changera.
 */
export const AchatProduit: React.FC<{
  produit: Product
}> = ({ produit }) => {
  const variantes = produit.variantes ?? []
  const [choix, setChoix] = useState<Choix>({ variante: null, prix: produit.price ?? null })

  // `useCallback` : sans lui, l'effet du sélecteur se redéclencherait à chaque
  // rendu et le composant tournerait en boucle.
  const surChoix = useCallback((c: Choix) => setChoix(c), [])

  const prix = prixFr(choix.prix ?? produit.price)
  const choisiEtEpuise = Boolean(choix.variante && !choix.variante.disponible)

  return (
    <>
      {prix && (
        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-mono text-3xl tabular-nums">{prix}</span>
          <span className="mono-label text-muted-foreground">TTC</span>
        </div>
      )}

      {produit.shortDescription && (
        <p className="mt-5 max-w-[52ch] text-muted-foreground">{produit.shortDescription}</p>
      )}

      {variantes.length > 0 ? (
        <SelecteurVariante
          onChoix={surChoix}
          prixProduit={produit.price}
          variantes={variantes}
        />
      ) : (
        !!produit.tailles?.length && (
          <div className="mt-7">
            <h2 className="mono-label mb-3">Tailles disponibles</h2>
            <ul className="flex list-none flex-wrap gap-1.5 p-0">
              {produit.tailles.map((t) => (
                <li
                  className="min-w-[42px] rounded-[10px] border border-border px-2.5 py-1.5 text-center font-mono text-[0.6875rem]"
                  key={t}
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {/* Pas de panier tant que la boutique n'est pas ouverte : le bouton mène
          là où la commande est réellement possible. */}
      {produit.sourceUrl && (
        <a
          className="mt-7 inline-flex items-center gap-2.5 rounded-pilule bg-primary px-7 py-4 font-bold text-primary-foreground transition-colors hover:bg-brand-bright"
          href={produit.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {choisiEtEpuise ? 'Voir les disponibilités' : 'Commander sur lesbikeuses.fr'}
          <span aria-hidden="true">→</span>
        </a>
      )}

      <p className="mt-4 rounded-xl border border-primary/25 bg-accent px-4 py-3 text-sm">
        <strong>La boutique n’est pas encore ouverte ici.</strong> La commande se fait sur
        lesbikeuses.fr, où le catalogue est en ligne.
      </p>
    </>
  )
}
