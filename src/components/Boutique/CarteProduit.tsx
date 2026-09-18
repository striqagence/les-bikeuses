import Link from 'next/link'
import React from 'react'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

export const prixFr = (n?: number | null): string | null =>
  typeof n === 'number'
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : null

/**
 * Carte produit du catalogue.
 *
 * Rien dans une boîte : l'image est posée à même le fond de page, le texte
 * dessous. La carte cernée et surélevée au survol enfermait chaque produit
 * dans un panneau, et la grille se lisait comme un tableau de vignettes plutôt
 * que comme un étal. L'image reste en `contain` et non `cover` — les visuels
 * produits sont détourés sur fond blanc, un recadrage couperait les manches.
 *
 * La carte entière est cliquable, mais ne contient qu'un seul lien : celui du
 * titre, étiré sur toute la surface par un pseudo-élément. Envelopper la carte
 * dans un lien, ou en ajouter un sur l'image, doublerait chaque produit dans
 * la liste des liens de la page — un lecteur d'écran annoncerait deux fois le
 * même article, et la navigation au clavier demanderait deux tabulations par
 * carte.
 */
export const CarteProduit: React.FC<{
  produit: Product
  className?: string
  /**
   * Charge le visuel sans attendre.
   *
   * À réserver à la première rangée : le reste de la grille est en chargement
   * différé, mais l'appliquer aussi aux cartes visibles d'emblée laissait des
   * cadres vides le temps que le navigateur veuille bien les demander — c'est
   * ce qui donnait l'impression d'une page lente.
   */
  prioritaire?: boolean
}> = ({ produit, className, prioritaire = false }) => {
  const image = produit.gallery?.[0]?.image
  const prix = prixFr(produit.price)
  const nbTailles = produit.tailles?.length ?? 0

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-3.5',
        // Le focus clavier se voit sur la carte, le lien étant invisible.
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-4 focus-within:ring-offset-background',
        className,
      )}
    >
      <div className="aspect-square overflow-hidden rounded-panneau bg-secondary">
        {image && typeof image === 'object' ? (
          <Media
            className="h-full"
            imgClassName="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.05]"
            priority={prioritaire}
            resource={image}
            size="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 300px"
            variante="small"
          />
        ) : (
          <div className="mono-label grid h-full place-items-center text-muted-foreground">
            Sans visuel
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {produit.marque && <p className="mono-label text-muted-foreground">{produit.marque}</p>}
        <h3 className="text-[0.9375rem] leading-snug transition-colors group-hover:text-primary">
          <Link
            className="outline-none after:absolute after:inset-0 after:content-['']"
            href={`/produit/${produit.slug}`}
          >
            {produit.title}
          </Link>
        </h3>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
          {prix && <span className="font-mono text-base tabular-nums">{prix}</span>}
          <span className="mono-label text-muted-foreground">
            {nbTailles ? `${nbTailles} tailles` : 'Taille unique'}
          </span>
        </div>

        {/* Pastille décorative et non second lien : la carte entière est déjà
            cliquable par le titre étiré. En faire un vrai lien doublerait
            chaque produit dans la liste des liens de la page. `aria-hidden`
            l'écarte donc de la restitution vocale — elle reste cliquable,
            puisque le lien du titre passe dessous. */}
        <span
          aria-hidden="true"
          className="mono-label mt-3 inline-flex items-center justify-center gap-2 self-start rounded-pilule border border-border px-4 py-2 transition-colors group-hover:border-primary group-hover:text-primary"
        >
          Voir la fiche
          <span className="text-[0.85em]">→</span>
        </span>
      </div>
    </article>
  )
}
