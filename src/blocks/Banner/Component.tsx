import type { BannerBlock as BannerBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
} & BannerBlockProps

export const BannerBlock: React.FC<Props> = ({ className, content, style }) => {
  return (
    // Encadré inséré dans le fil du texte — le format « bon à savoir ».
    // Carte à filet gauche, distincte de l'aplat pêche de « L'essentiel »,
    // qui coiffe l'article : deux fonctions, deux traitements.
    <div className={cn('my-9 w-full', className)}>
      <div
        className={cn('border border-l-[3px] bg-card px-6 py-5', {
          'border-border border-l-primary': style === 'info',
          'border-error border-l-error bg-error/20': style === 'error',
          'border-success border-l-success bg-success/20': style === 'success',
          'border-warning border-l-warning bg-warning/20': style === 'warning',
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </div>
  )
}
