import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * Avis clients repris de WooCommerce.
 *
 * Ils vivent dans une collection plutôt que dans le corps d'une page : ce sont
 * 370 enregistrements, filtrables et paginés, et le même fonds servira à
 * afficher les avis sous chaque fiche produit.
 *
 * Rien n'est saisissable ici : un avis est la parole d'une cliente, pas du
 * contenu éditorial. La collection est en lecture seule côté admin, hormis la
 * mise en avant, et l'import fait foi.
 */
export const Avis: CollectionConfig = {
  slug: 'avis',
  labels: { singular: 'Avis client', plural: 'Avis clients' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'auteur',
    defaultColumns: ['auteur', 'note', 'produitNom', 'publieLe'],
    group: 'Catalogue',
    description:
      'Repris de l’ancienne boutique. Modifier un avis reviendrait à réécrire la parole d’une cliente : seule la mise en avant est éditable.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'wooId',
          label: 'Identifiant WooCommerce',
          type: 'number',
          index: true,
          unique: true,
          required: true,
          admin: { width: '34%', readOnly: true },
        },
        {
          name: 'auteur',
          label: 'Autrice',
          type: 'text',
          required: true,
          admin: { width: '33%', readOnly: true },
        },
        {
          name: 'note',
          label: 'Note sur 5',
          type: 'number',
          required: true,
          index: true,
          min: 1,
          max: 5,
          admin: { width: '33%', readOnly: true },
        },
      ],
    },
    {
      name: 'texte',
      label: 'Avis',
      type: 'textarea',
      admin: {
        readOnly: true,
        description: 'Vide pour une note laissée sans commentaire — la majorité des avis.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'publieLe',
          label: 'Publié le',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', readOnly: true, date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'verifie',
          label: 'Achat vérifié',
          type: 'checkbox',
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'produitNom',
          label: 'Produit concerné',
          type: 'text',
          admin: { width: '50%', readOnly: true },
        },
        {
          // Le slug plutôt qu'une relation : bon nombre d'avis portent sur des
          // références retirées du catalogue, et une relation vers un produit
          // absent bloquerait l'import.
          name: 'produitSlug',
          label: 'Slug du produit',
          type: 'text',
          index: true,
          admin: {
            width: '50%',
            readOnly: true,
            description: 'Le lien n’est posé que si la fiche existe encore ici.',
          },
        },
      ],
    },
    {
      name: 'rayon',
      label: 'Rayon',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description: 'Déduit du produit : sert de filtre sur la page des avis.',
      },
    },
    {
      name: 'enAvant',
      label: 'Mettre en avant',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Remonte l’avis en tête de la page « Avis des clients ».' },
    },
  ],
}
