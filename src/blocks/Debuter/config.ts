import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

// Bloc « Débuter la moto » : bande sombre (bitume) qui découpe la page en deux.
// Les étapes sont numérotées automatiquement — ici l'ordre porte du sens,
// on ne choisit pas sa première moto avant de savoir quel permis viser.
export const Debuter: Block = {
  slug: 'debuter',
  interfaceName: 'DebuterBlock',
  labels: {
    singular: 'Débuter la moto',
    plural: 'Débuter la moto',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Sur-titre',
      defaultValue: 'Débuter la moto',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Titre',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'titleAccent',
          type: 'text',
          label: 'Fin du titre, en accent',
          admin: {
            width: '50%',
            description: 'Affichée en italique orange, à la suite du titre.',
          },
        },
      ],
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Chapô',
    },
    linkGroup({
      appearances: false,
      overrides: {
        maxRows: 1,
        label: 'Lien',
      },
    }),
    {
      name: 'etapes',
      type: 'array',
      label: 'Étapes',
      labels: {
        singular: 'Étape',
        plural: 'Étapes',
      },
      minRows: 2,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Numérotées automatiquement (01, 02, 03…) dans cet ordre.',
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
      ],
    },
  ],
}
