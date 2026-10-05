import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { DM_Mono, Manrope } from 'next/font/google'
import React from 'react'

// Duo typographique Les Bikeuses :
// Manrope (titres, texte, UI) × DM Mono (données techniques).
// La Fraunces tenait les titres ; deux familles se partageaient la page selon
// la hauteur du titre, ce qui se lisait comme deux sites cousus ensemble.
const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})
// Niveaux CE, matières, tailles, prix, références, dates.
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
})

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'
import Script from 'next/script'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const identifiantCookieYes = process.env.NEXT_PUBLIC_COOKIEYES_ID

  return (
    <html
      className={cn(manrope.variable, dmMono.variable)}
      lang="fr"
      suppressHydrationWarning
    >
      <head>
        {/*
          * Bandeau de consentement, avant tout le reste.
          *
          * `beforeInteractive` n'est pas un détail de performance : une CMP
          * qui se charge après les traqueurs ne bloque plus rien, elle les
          * constate. Elle doit passer en premier pour tenir son rôle.
          *
          * Piloté par une variable d'environnement, et non codé en dur :
          * l'identifiant n'est pas public et il diffère entre le site de
          * recette et la production. Tant qu'elle est vide, rien n'est
          * chargé — le site reste exactement ce qu'il est aujourd'hui.
          *
          * Le Consent Mode de Google s'active depuis le tableau de bord
          * CookieYes, pas ici : deux implémentations concurrentes du même
          * signal se contredisent, et c'est la plus bavarde qui gagne.
          */}
        {identifiantCookieYes && (
          <Script
            id="cookieyes"
            src={`https://cdn-cookieyes.com/client_data/${identifiantCookieYes}/script.js`}
            strategy="beforeInteractive"
          />
        )}

        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@lesbikeuses',
  },
}
