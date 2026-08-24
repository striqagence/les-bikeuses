import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

// Bloc « Le journal » : une à la une + brèves, au lieu de huit articles
// alignés sans hiérarchie. Le premier article de la liste devient la une.
export const Journal: Block = {
  slug: 'journal',
  interfaceName: 'JournalBlock',
  labels: {
    singular: 'Journal',
    plural: 'Journal',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Sur-titre',
      defaultValue: 'Le journal',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titre',
      required: true,
    },
    linkGroup({
      appearances: false,
      overrides: {
        maxRows: 1,
        label: 'Lien « tous les articles »',
      },
    }),
    {
      name: 'populateBy',
      type: 'select',
      label: 'Choix des articles',
      defaultValue: 'collection',
      options: [
        { label: 'Les plus récents', value: 'collection' },
        { label: 'Sélection manuelle', value: 'selection' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      label: 'Limiter à ces catégories',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Nombre d’articles',
      defaultValue: 5,
      min: 2,
      max: 9,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        step: 1,
        description: 'Le premier est mis à la une, les suivants passent en brèves.',
      },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      label: 'Articles',
      relationTo: ['posts'],
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
        description: 'Le premier est mis à la une, les suivants passent en brèves.',
      },
    },
  ],
}
