import type { Block } from 'payload'

/**
 * Carrousel de produits, tel qu'on en trouve dans les articles de
 * lesbikeuses.fr : une bande de fiches insérée entre deux sections.
 *
 * Les produits sont référencés, non recopiés : changer un prix ou une photo
 * dans le catalogue met à jour tous les articles qui les citent.
 */
export const CarrouselProduits: Block = {
  slug: 'carrouselProduits',
  interfaceName: 'CarrouselProduitsBlock',
  labels: {
    singular: 'Carrousel produits',
    plural: 'Carrousels produits',
  },
  fields: [
    {
      name: 'titre',
      type: 'text',
      label: 'Titre',
      admin: { description: 'Facultatif. Ex. « Notre sélection ».' },
    },
    {
      name: 'produits',
      type: 'relationship',
      label: 'Produits',
      relationTo: 'products',
      hasMany: true,
      required: true,
      admin: { description: 'Affichés dans cet ordre.' },
    },
  ],
}
