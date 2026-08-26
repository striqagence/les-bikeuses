'use client'

import React, { useEffect, useState } from 'react'

/**
 * Jauge de lecture, collée sous l'en-tête.
 *
 * `scaleX` plutôt qu'une largeur : la transformation est composée par le GPU,
 * là où animer `width` force un recalcul de mise en page à chaque pixel de
 * défilement.
 */
export const ProgressionLecture: React.FC = () => {
  const [part, setPart] = useState(0)

  useEffect(() => {
    const calculer = () => {
      const hauteur = document.documentElement.scrollHeight - window.innerHeight
      setPart(hauteur > 0 ? Math.min(1, window.scrollY / hauteur) : 0)
    }
    calculer()
    window.addEventListener('scroll', calculer, { passive: true })
    window.addEventListener('resize', calculer)
    return () => {
      window.removeEventListener('scroll', calculer)
      window.removeEventListener('resize', calculer)
    }
  }, [])

  return (
    <div aria-hidden="true" className="sticky top-0 z-50 h-0.5 w-full">
      <div
        className="h-full origin-left bg-primary"
        style={{ transform: `scaleX(${part})` }}
      />
    </div>
  )
}
