import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Sur-titre',
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
        description: 'Ex. « Équipement moto femme · sélection 2026 ». Affiché en mono, en orange.',
      },
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
        description: 'Visuel principal du héros.',
      },
      relationTo: 'media',
      required: true,
    },
    {
      name: 'mediaSecondary',
      type: 'array',
      label: 'Visuels secondaires',
      labels: {
        singular: 'Visuel',
        plural: 'Visuels',
      },
      maxRows: 2,
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
        initCollapsed: true,
        description: 'Deux visuels au format portrait, sous le visuel principal.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Image',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Preuves',
      labels: {
        singular: 'Preuve',
        plural: 'Preuves',
      },
      maxRows: 3,
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
        initCollapsed: true,
        description: 'Ex. « 340+ » / « Pièces testées ». Affichées sous les boutons.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Chiffre',
              required: true,
              admin: { width: '40%' },
            },
            {
              name: 'label',
              type: 'text',
              label: 'Légende',
              required: true,
              admin: { width: '60%' },
            },
          ],
        },
      ],
    },
    {
      name: 'marquee',
      type: 'array',
      label: 'Bandeau défilant',
      labels: {
        singular: 'Mention',
        plural: 'Mentions',
      },
      maxRows: 8,
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
        initCollapsed: true,
        description: 'Bande sombre défilante sous le héros. Laisser vide pour la masquer.',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Mention',
          required: true,
        },
      ],
    },
  ],
  label: false,
}
