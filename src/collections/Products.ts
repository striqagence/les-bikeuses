import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

// Collection « Produits » — catalogue vitrine (sans panier ni paiement).
// La partie e-commerce (stock, commandes, paiement) sera ajoutée plus tard.
export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produit',
    plural: 'Produits',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'reference', 'price', 'category', 'updatedAt'],
    group: 'Catalogue',
  },
  fields: [
    {
      name: 'title',
      label: 'Nom du produit',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'wooId',
          label: 'Identifiant WooCommerce',
          type: 'number',
          index: true,
          admin: {
            width: '50%',
            readOnly: true,
            description:
              'Renseigné à l’import. Sert à retrouver le produit référencé par les carrousels des articles.',
          },
        },
        {
          name: 'sourceUrl',
          label: 'Fiche sur lesbikeuses.fr',
          type: 'text',
          admin: {
            width: '50%',
            readOnly: true,
            description:
              'Tant que la boutique n’est pas ouverte ici, les carrousels renvoient vers cette adresse.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'reference',
          label: 'Référence (SKU)',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'price',
          label: 'Prix indicatif (€)',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Prix affiché à titre indicatif. La vente en ligne sera activée plus tard.',
          },
        },
      ],
    },
    {
      name: 'marque',
      label: 'Marque',
      type: 'text',
      index: true,
      admin: {
        description: 'Reprise de WooCommerce à l’import. Sert de facette dans le catalogue.',
      },
    },
    {
      name: 'tailles',
      label: 'Tailles disponibles',
      type: 'text',
      hasMany: true,
      index: true,
      admin: {
        description: 'Reprises de WooCommerce à l’import.',
      },
    },
    {
      type: 'collapsible',
      label: 'Caractéristiques techniques',
      admin: {
        initCollapsed: true,
        description:
          'Absentes de WooCommerce : à saisir ici. Une caractéristique laissée vide ne crée pas de facette dans le catalogue.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'homologation',
              label: 'Homologation',
              type: 'select',
              index: true,
              options: [
                { label: 'CE niveau AA', value: 'ce-aa' },
                { label: 'CE niveau A', value: 'ce-a' },
                { label: 'CE niveau B', value: 'ce-b' },
                { label: 'CE (gants) KP', value: 'ce-kp' },
                { label: 'ECE 22.06 (casques)', value: 'ece-2206' },
                { label: 'Non homologué', value: 'aucune' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'saison',
              label: 'Saison',
              type: 'select',
              index: true,
              options: [
                { label: 'Été', value: 'ete' },
                { label: 'Mi-saison', value: 'mi-saison' },
                { label: 'Hiver', value: 'hiver' },
                { label: 'Toutes saisons', value: 'toutes-saisons' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'matiere',
              label: 'Matière',
              type: 'text',
              admin: { width: '50%', description: 'Ex. « Cuir de chèvre », « Textile ».' },
            },
            {
              name: 'protections',
              label: 'Protections',
              type: 'text',
              admin: { width: '50%', description: 'Ex. « Épaules et coudes ».' },
            },
          ],
        },
      ],
    },
    {
      name: 'shortDescription',
      label: 'Accroche',
      type: 'textarea',
      admin: {
        description: 'Courte phrase de présentation affichée sur les listes de produits.',
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richText',
    },
    {
      name: 'gallery',
      label: 'Galerie d’images',
      type: 'array',
      labels: {
        singular: 'Image',
        plural: 'Images',
      },
      fields: [
        {
          name: 'image',
          label: 'Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'category',
      label: 'Catégorie',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      label: 'Mettre en avant',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
