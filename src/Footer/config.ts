import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Pied de page',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'aPropos',
      type: 'group',
      label: 'À propos',
      fields: [
        {
          name: 'titre',
          type: 'text',
          label: 'Titre',
          defaultValue: 'À propos',
        },
        {
          name: 'texte',
          type: 'textarea',
          label: 'Texte',
          admin: {
            description:
              'Encadrer un fragment de **doubles astérisques** pour le mettre en orange.',
          },
        },
      ],
    },
    {
      name: 'colonnes',
      type: 'array',
      label: 'Colonnes de liens',
      labels: { singular: 'Colonne', plural: 'Colonnes' },
      maxRows: 3,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'titre',
          type: 'text',
          label: 'Titre',
          required: true,
        },
        {
          name: 'items',
          type: 'array',
          label: 'Liens',
          labels: { singular: 'Lien', plural: 'Liens' },
          maxRows: 8,
          admin: { initCollapsed: true },
          fields: [link({ appearances: false })],
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Nous contacter',
      fields: [
        {
          name: 'titre',
          type: 'text',
          label: 'Titre',
          defaultValue: 'Nous contacter',
        },
        {
          name: 'mention',
          type: 'text',
          label: 'Mention',
          admin: { description: 'Ex. « Notre service client vous répond 5J/7 ».' },
        },
        {
          type: 'row',
          fields: [
            { name: 'telephone', type: 'text', label: 'Téléphone', admin: { width: '50%' } },
            { name: 'email', type: 'email', label: 'E-mail', admin: { width: '50%' } },
          ],
        },
        {
          name: 'horaires',
          type: 'text',
          label: 'Horaires',
        },
      ],
    },
    {
      name: 'paiements',
      type: 'array',
      label: 'Moyens de paiement',
      labels: { singular: 'Moyen', plural: 'Moyens' },
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description:
          'Laisser vide tant que la boutique n’ouvre pas : afficher Visa ou PayPal sur un site qui ne vend pas laisse croire qu’on peut y payer.',
      },
      fields: [{ name: 'label', type: 'text', label: 'Nom', required: true }],
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Barre du bas (mentions légales)',
      labels: { singular: 'Lien', plural: 'Liens' },
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [link({ appearances: false })],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
