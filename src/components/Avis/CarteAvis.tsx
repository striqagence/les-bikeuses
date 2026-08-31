import Link from 'next/link'
import React from 'react'

import type { Avi } from '@/payload-types'

import { Etoiles } from './Etoiles'

const DATE = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

/**
 * Un avis client.
 *
 * Les avis sans commentaire sont majoritaires : la carte se réduit alors à la
 * note et au produit, sans laisser un cadre vide.
 */
export const CarteAvis: React.FC<{ avis: Avi; lienProduit?: boolean }> = ({
  avis,
  lienProduit = true,
}) => {
  const texte = avis.texte?.trim()

  return (
    <article className="flex break-inside-avoid flex-col gap-3 rounded-panneau border border-border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Etoiles note={avis.note} />
          <p className="mt-1.5 text-sm font-medium">{avis.auteur}</p>
        </div>
        {avis.verifie && (
          <span className="mono-label shrink-0 rounded-pilule bg-accent px-2.5 py-1 text-primary">
            Achat vérifié
          </span>
        )}
      </header>

      {texte && <p className="text-[0.9375rem] whitespace-pre-line">{texte}</p>}

      <footer className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
        {avis.produitNom &&
          (lienProduit && avis.produitSlug ? (
            <Link className="underline-offset-2 hover:text-primary hover:underline" href={`/produit/${avis.produitSlug}`}>
              {avis.produitNom}
            </Link>
          ) : (
            <span>{avis.produitNom}</span>
          ))}
        <time dateTime={avis.publieLe}>{DATE.format(new Date(avis.publieLe))}</time>
      </footer>
    </article>
  )
}
