import { cn } from '@/utilities/ui'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

// Logo Les Bikeuses.
// Rendu via un masque CSS : le logo prend la couleur du texte courant
// (currentColor via `bg-current`), il s'adapte donc automatiquement au
// thème — encre sur fond clair, blanc sur fond sombre / footer noir.
export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span
      role="img"
      aria-label="Les Bikeuses"
      className={cn('block h-[34px] w-auto bg-current', className)}
      style={{
        aspectRatio: '566.929 / 198.425',
        WebkitMaskImage: 'url(/logo-bikeuses-blanc.svg)',
        maskImage: 'url(/logo-bikeuses-blanc.svg)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'left center',
        maskPosition: 'left center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  )
}
