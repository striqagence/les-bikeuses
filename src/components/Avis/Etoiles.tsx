import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * Note en étoiles.
 *
 * Le chiffre reste lisible pour un lecteur d'écran : les étoiles sont
 * décoratives, la valeur est portée par le texte de remplacement.
 */
export const Etoiles: React.FC<{ note: number; taille?: 'petite' | 'grande' }> = ({
  note,
  taille = 'petite',
}) => (
  <span
    aria-label={`${note.toString().replace('.', ',')} sur 5`}
    className={cn('inline-flex items-center gap-0.5', taille === 'grande' ? 'gap-1' : 'gap-0.5')}
    role="img"
  >
    {[1, 2, 3, 4, 5].map((rang) => (
      <svg
        aria-hidden="true"
        className={cn(
          taille === 'grande' ? 'size-5' : 'size-3.5',
          rang <= Math.round(note) ? 'fill-primary' : 'fill-border',
        )}
        key={rang}
        viewBox="0 0 24 24"
      >
        <path d="M12 2.2l2.9 6.26 6.6.8-4.9 4.6 1.3 6.94L12 17.5l-5.9 3.3 1.3-6.94-4.9-4.6 6.6-.8z" />
      </svg>
    ))}
  </span>
)
