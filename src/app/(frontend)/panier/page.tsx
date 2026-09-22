import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { VuePanier } from '@/components/Boutique/VuePanier'

export default function Panier() {
  return (
    <div className="container pt-8 pb-20 md:pt-12">
      <header className="mb-8">
        <p className="eyebrow">Boutique</p>
        <h1 className="titre-section mt-3 max-w-[18ch]">Votre panier</h1>
      </header>
      <VuePanier />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Votre panier | Les Bikeuses',
  robots: { index: false, follow: true },
  openGraph: mergeOpenGraph({
    title: 'Votre panier | Les Bikeuses',
  }),
}
