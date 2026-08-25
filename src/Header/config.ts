import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'En-tête',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'annonce',
      type: 'group',
      label: 'Bandeau d’annonce',
      admin: {
        description: 'La bande sombre tout en haut du site.',
      },
      fields: [
        {
          name: 'actif',
          type: 'checkbox',
          label: 'Afficher le bandeau',
          defaultValue: true,
        },
        {
          name: 'texte',
          type: 'text',
          label: 'Texte',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.actif),
            description: 'Encadrer un fragment de **doubles astérisques** pour le mettre en orange.',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Lien (facultatif)',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.actif),
          },
        },
      ],
    },
    {
      name: 'baseline',
      type: 'text',
      label: 'Baseline',
      defaultValue: 'LE site pour les femmes à moto',
      admin: {
        description: 'Affichée sous le logo dans la bannière. Disparaît quand l’en-tête se condense.',
      },
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Navigation',
      labels: { singular: 'Entrée', plural: 'Entrées' },
      maxRows: 8,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
        {
          name: 'accent',
          type: 'checkbox',
          label: 'Mettre en avant (pilule orange)',
          defaultValue: false,
          admin: {
            description: 'Réservé à une entrée, deux au plus — sinon plus rien ne ressort.',
          },
        },
        {
          name: 'sousItems',
          type: 'array',
          label: 'Sous-menu',
          labels: { singular: 'Sous-entrée', plural: 'Sous-entrées' },
          maxRows: 10,
          admin: {
            initCollapsed: true,
            description: 'Laisser vide pour une entrée simple, sans déroulant.',
          },
          fields: [
            link({ appearances: false }),
            {
              name: 'meta',
              type: 'text',
              label: 'Mention',
              admin: {
                description: 'Ex. « 112 réf. ». Affichée en mono, alignée à droite.',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
