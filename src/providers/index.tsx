import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { PanierProvider } from './Panier'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <PanierProvider>{children}</PanierProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
