import type { Block } from 'payload'

import { link } from '@/fields/link'

// Bloc « L'index » : le catalogue en liste typographique plutôt qu'en grille de
// tuiles. Une liste hiérarchise (on lit du haut vers le bas), dix tuiles
// identiques ne hiérarchisent rien.
export const IndexCategories: Block = {
  slug: 'indexCategories',
  interfaceName: 'IndexCategoriesBlock',
  labels: {
    singular: 'Index des catégories',
    plural: 'Index des catégories',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Sur-titre',
      defaultValue: "L'index",
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      label: 'Rayons',
      labels: {
        singular: 'Rayon',
        plural: 'Rayons',
      },
      minRows: 1,
      admin: {
        initCollapsed: true,
        description: 'Affichés sur deux colonnes, dans cet ordre.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              label: 'Nom du rayon',
              required: true,
              admin: { width: '60%' },
            },
            {
              name: 'meta',
              type: 'text',
              label: 'Mention',
              admin: {
                width: '40%',
                description: 'Ex. « 84 réf. ». Affichée en mono, alignée à droite.',
              },
            },
          ],
        },
        link({ appearances: false, disableLabel: true }),
      ],
    },
  ],
}
