'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import type { PanierResolu } from '@/app/(frontend)/next/panier/route'

import { prixFr } from './CarteProduit'
import { usePanier } from '@/providers/Panier'

const MOTIFS: Record<string, string> = {
  introuvable: 'Cet article n’est plus au catalogue.',
  epuise: 'Épuisé pour le moment.',
  'stock-insuffisant': 'Quantité ramenée au stock disponible.',
}

/**
 * Le panier.
 *
 * Les montants viennent du serveur, jamais du navigateur : à chaque
 * modification le panier est renvoyé pour recalcul. C'est un aller-retour de
 * plus, mais la seule façon d'afficher un total dont on réponde.
 */
export const VuePanier: React.FC = () => {
  const { lignes, pret, changerQuantite, retirer, vider } = usePanier()
  const [resolu, setResolu] = useState<PanierResolu | null>(null)
  const [chargement, setChargement] = useState(false)

  const recalculer = useCallback(async () => {
    if (!lignes.length) {
      setResolu({ lignes: [], sousTotal: 0, nbArticles: 0, problemes: 0 })
      return
    }
    setChargement(true)
    try {
      const r = await fetch('/next/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lignes }),
      })
      if (r.ok) setResolu(await r.json())
    } finally {
      setChargement(false)
    }
  }, [lignes])

  useEffect(() => {
    if (pret) void recalculer()
  }, [pret, recalculer])

  if (!pret || (!resolu && chargement)) {
    return <p className="mono-label py-16 text-center text-muted-foreground">Chargement…</p>
  }

  if (!resolu?.lignes.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">Votre panier est vide.</p>
        <Link
          className="mono-label mt-6 inline-flex rounded-pilule bg-primary px-5 py-3 text-primary-foreground transition-opacity hover:opacity-90"
          href="/rubrique/blousons-moto"
        >
          Parcourir la boutique →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <ul className="list-none p-0">
        {resolu.lignes.map((l, i) => (
          <li className="border-t border-border py-5 first:border-t-0 first:pt-0" key={`${l.produit}-${l.variante}`}>
            <div className="flex gap-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-[14px] border border-border bg-card">
                {l.image && (
                  // Vignette de panier : l'optimiseur n'apporte rien sur 80 px,
                  // et le panier ne doit pas dépendre d'une passe d'optimisation.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-contain" src={l.image} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {l.marque && <p className="mono-label text-muted-foreground">{l.marque}</p>}
                <p className="font-semibold">
                  {l.slug ? (
                    <Link className="hover:text-primary" href={`/produit/${l.slug}`}>
                      {l.titre}
                    </Link>
                  ) : (
                    l.titre
                  )}
                </p>
                {(l.taille || l.declinaison) && (
                  <p className="mono-label mt-1 text-muted-foreground">
                    {[l.declinaison, l.taille].filter(Boolean).join(' · ')}
                  </p>
                )}
                {l.probleme && (
                  <p className="mono-label mt-2 text-primary">{MOTIFS[l.probleme]}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="mono-label flex items-center gap-2">
                    Quantité
                    <input
                      className="w-16 rounded-[10px] border border-border bg-transparent px-2 py-1.5 text-center font-mono tabular-nums"
                      min={1}
                      max={l.quantiteMax ?? undefined}
                      onChange={(e) => changerQuantite(i, Number(e.target.value))}
                      type="number"
                      value={l.quantite}
                    />
                  </label>
                  <button
                    className="mono-label text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                    onClick={() => retirer(i)}
                    type="button"
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-mono tabular-nums">{prixFr(l.total) ?? '—'}</p>
            </div>
          </li>
        ))}
      </ul>

      <aside className="rounded-panneau border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="mono-label text-primary">Récapitulatif</h2>
        <dl className="mt-4 flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Sous-total</dt>
          <dd className="font-mono text-xl tabular-nums">{prixFr(resolu.sousTotal)}</dd>
        </dl>
        <p className="mt-2 text-sm text-muted-foreground">
          Frais de port calculés à l’étape suivante.
        </p>

        <p className="mono-label mt-5 rounded-xl border border-primary/25 bg-accent px-3.5 py-3 leading-relaxed">
          Le paiement n’est pas encore ouvert sur ce site. Votre sélection est conservée ; la
          commande se fait pour l’instant sur lesbikeuses.fr.
        </p>

        <button
          className="mono-label mt-5 text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          onClick={vider}
          type="button"
        >
          Vider le panier
        </button>
      </aside>
    </div>
  )
}
