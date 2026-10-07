import React from 'react'
import Script from 'next/script'

/**
 * Chargeur AdSense, posé seulement là où des annonces s'affichent.
 *
 * Pas dans le gabarit racine : le catalogue et l'accueil n'en portent pas, et
 * c'est eux le chemin d'achat. Un script tiers chargé sur une page qui n'en a
 * pas l'usage coûte du temps de rendu pour rien.
 *
 * `afterInteractive` et non `beforeInteractive` : la publicité passe après le
 * contenu et après le bandeau de consentement, jamais avant.
 */
export const ChargeurPub: React.FC = () => {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client) return null

  return (
    <Script
      async
      crossOrigin="anonymous"
      id="adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="afterInteractive"
    />
  )
}
