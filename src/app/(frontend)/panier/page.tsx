import type { Metadata } from 'next'
import React from 'react'

import { VuePanier } from '@/components/Boutique/VuePanier'

export default function Panier() {
  return (
    <div className="container pt-8 pb-20 md:pt-12">
      <header className="mb-8">
        <p className="eyebrow">Boutique</p>
        <h1 className="wonk mt-2 text-3xl leading-[1.03] font-medium md:text-5xl">Votre panier</h1>
      </header>
      <VuePanier />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Votre panier | Les Bikeuses',
  robots: { index: false, follow: true },
}
