import type { Block } from 'payload'

import { link } from '@/fields/link'

// Bloc « Par où commencer » : trois entrées parallèles vers les parcours du site
// (débuter, équiper sa saison, trouver sa taille). Les entrées sont repérées
// par une lettre — ce ne sont pas des étapes, l'ordre ne porte pas de sens.
export const Parcours: Block = {
  slug: 'parcours',
  interfaceName: 'ParcoursBlock',
  labels: {
    singular: 'Parcours',
    plural: 'Parcours',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Sur-titre',
      defaultValue: 'Par où commencer',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Chapô',
      admin: {
        description: 'Court texte affiché à droite du titre.',
      },
    },
    {
      name: 'entrees',
      type: 'array',
      label: 'Entrées',
      labels: {
        singular: 'Entrée',
        plural: 'Entrées',
      },
      minRows: 2,
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'Chaque entrée est repérée automatiquement par une lettre (A, B, C…).',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          required: true,
        },
        {
          name: 'text',
          type: 'textarea',
          label: 'Texte',
        },
        link({ appearances: false }),
      ],
    },
  ],
}
