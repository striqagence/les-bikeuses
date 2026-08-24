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
