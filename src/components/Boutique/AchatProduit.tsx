'use client'

import React, { useCallback, useState } from 'react'

import type { Product } from '@/payload-types'

import Link from 'next/link'

import { SelecteurVariante, type Choix } from './SelecteurVariante'
import { prixCatalogue } from './CarteProduit'
import { usePanier } from '@/providers/Panier'

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

  const { ajouter } = usePanier()
  const [ajoute, setAjoute] = useState(false)

  // Une fiche sans déclinaison se vend telle quelle ; sinon il faut choisir.
  const choixRequis = variantes.length > 0
  const prete = !choixRequis || Boolean(choix.variante?.disponible)

  const mettreAuPanier = useCallback(() => {
    ajouter({
      produit: produit.id,
      variante: choix.variante?.wooId ?? null,
      quantite: 1,
    })
    setAjoute(true)
    window.setTimeout(() => setAjoute(false), 2500)
  }, [ajouter, produit.id, choix.variante])

  const prix = prixCatalogue(choix.prix ?? produit.price)
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

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button
          className="mono-label inline-flex items-center gap-2.5 rounded-pilule bg-primary px-7 py-4 text-primary-foreground transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!prete}
          onClick={mettreAuPanier}
          type="button"
        >
          {choisiEtEpuise
            ? 'Épuisé'
            : choixRequis && !choix.variante
              ? 'Choisissez une taille'
              : 'Ajouter au panier'}
        </button>

        {ajoute && (
          <Link className="mono-label text-primary underline-offset-2 hover:underline" href="/panier">
            Ajouté — voir le panier →
          </Link>
        )}
      </div>

      {/* Le paiement n'est pas ouvert : on le dit plutôt que de laisser la
          cliente le découvrir au bout du tunnel. */}
      <p className="mt-4 rounded-xl border border-primary/25 bg-accent px-4 py-3 text-sm">
        <strong>Le paiement n’est pas encore ouvert ici.</strong> Vous pouvez constituer votre
        panier ; la commande se fait pour l’instant sur{' '}
        {produit.sourceUrl ? (
          <a
            className="underline underline-offset-2"
            href={produit.sourceUrl}
            rel="noopener noreferrer"
          >
            lesbikeuses.fr
          </a>
        ) : (
          'lesbikeuses.fr'
        )}
        .
      </p>
    </>
  )
}
