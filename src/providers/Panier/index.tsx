'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Le panier, tenu dans le navigateur.
 *
 * Il ne conserve que des identifiants et des quantités : aucun prix, aucun
 * libellé. Tout ce qui touche à l'argent est recalculé par le serveur à
 * l'affichage — un panier trafiqué dans le stockage local ne peut donc rien
 * obtenir d'autre qu'un total juste.
 *
 * La persistance passe par `localStorage` : une cliente qui ferme l'onglet et
 * revient le lendemain retrouve sa sélection, sans qu'il faille lui créer un
 * compte pour autant.
 */
export type Ligne = {
  produit: number
  /** Identifiant WooCommerce de la déclinaison, seul repère stable. */
  variante: number | null
  quantite: number
}

type Contexte = {
  lignes: Ligne[]
  nbArticles: number
  pret: boolean
  ajouter: (ligne: Ligne) => void
  changerQuantite: (index: number, quantite: number) => void
  retirer: (index: number) => void
  vider: () => void
}

const CLE = 'lesbikeuses:panier'
const PanierContext = createContext<Contexte | null>(null)

const lireStockage = (): Ligne[] => {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const lu = JSON.parse(brut)
    if (!Array.isArray(lu)) return []
    return lu.filter(
      (l): l is Ligne =>
        typeof l?.produit === 'number' && typeof l?.quantite === 'number' && l.quantite > 0,
    )
  } catch {
    // Navigation privée, stockage plein, JSON abîmé : on repart d'un panier
    // vide plutôt que de faire tomber la page.
    return []
  }
}

export const PanierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lignes, setLignes] = useState<Ligne[]>([])
  // Le rendu serveur ne connaît pas le stockage local : sans ce drapeau,
  // l'indicateur du menu afficherait un panier vide puis se corrigerait,
  // provoquant un écart d'hydratation.
  const [pret, setPret] = useState(false)

  useEffect(() => {
    setLignes(lireStockage())
    setPret(true)
  }, [])

  useEffect(() => {
    if (!pret) return
    try {
      localStorage.setItem(CLE, JSON.stringify(lignes))
    } catch {
      /* stockage indisponible : le panier ne survivra pas à la session */
    }
  }, [lignes, pret])

  const ajouter = useCallback((ligne: Ligne) => {
    setLignes((actuelles) => {
      const i = actuelles.findIndex(
        (l) => l.produit === ligne.produit && l.variante === ligne.variante,
      )
      if (i < 0) return [...actuelles, ligne]
      const suivantes = [...actuelles]
      suivantes[i] = { ...suivantes[i], quantite: suivantes[i].quantite + ligne.quantite }
      return suivantes
    })
  }, [])

  const changerQuantite = useCallback((index: number, quantite: number) => {
    setLignes((actuelles) =>
      quantite <= 0
        ? actuelles.filter((_, i) => i !== index)
        : actuelles.map((l, i) => (i === index ? { ...l, quantite } : l)),
    )
  }, [])

  const retirer = useCallback((index: number) => {
    setLignes((actuelles) => actuelles.filter((_, i) => i !== index))
  }, [])

  const vider = useCallback(() => setLignes([]), [])

  const valeur = useMemo<Contexte>(
    () => ({
      lignes,
      nbArticles: lignes.reduce((s, l) => s + l.quantite, 0),
      pret,
      ajouter,
      changerQuantite,
      retirer,
      vider,
    }),
    [lignes, pret, ajouter, changerQuantite, retirer, vider],
  )

  return <PanierContext.Provider value={valeur}>{children}</PanierContext.Provider>
}

export const usePanier = (): Contexte => {
  const c = useContext(PanierContext)
  if (!c) throw new Error('usePanier doit être utilisé dans un PanierProvider')
  return c
}
