import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Commandes.
 *
 * Les lignes recopient le produit au moment de l'achat — titre, taille,
 * référence, prix — plutôt que de s'y référer seulement. Une commande est un
 * engagement daté : si le prix change demain ou si la référence quitte le
 * catalogue, ce qui a été vendu ne doit pas bouger pour autant. Le lien vers
 * la fiche est conservé en plus, pour la navigation, jamais comme source des
 * montants.
 *
 * Lecture et écriture réservées au back-office : une commande contient une
 * adresse et un téléphone. Le suivi côté cliente passera par un lien signé,
 * pas par une exposition de la collection.
 */
export const Commandes: CollectionConfig = {
  slug: 'commandes',
  labels: { singular: 'Commande', plural: 'Commandes' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'numero',
    defaultColumns: ['numero', 'statut', 'client', 'total', 'createdAt'],
    group: 'Boutique',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'numero',
          label: 'Numéro',
          type: 'text',
          unique: true,
          index: true,
          admin: { width: '50%', readOnly: true, description: 'Attribué à la création.' },
        },
        {
          name: 'statut',
          type: 'select',
          required: true,
          defaultValue: 'brouillon',
          index: true,
          options: [
            { label: 'Brouillon', value: 'brouillon' },
            { label: 'En attente de paiement', value: 'attente-paiement' },
            { label: 'Payée', value: 'payee' },
            { label: 'En préparation', value: 'preparation' },
            { label: 'Expédiée', value: 'expediee' },
            { label: 'Livrée', value: 'livree' },
            { label: 'Annulée', value: 'annulee' },
            { label: 'Remboursée', value: 'remboursee' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'client',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
            { name: 'telephone', label: 'Téléphone', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'prenom', label: 'Prénom', type: 'text', admin: { width: '50%' } },
            { name: 'nom', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'livraison',
      label: 'Adresse de livraison',
      type: 'group',
      fields: [
        { name: 'adresse', type: 'text' },
        { name: 'complement', label: 'Complément', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'codePostal', label: 'Code postal', type: 'text', admin: { width: '34%' } },
            { name: 'ville', type: 'text', admin: { width: '33%' } },
            { name: 'pays', type: 'text', defaultValue: 'France', admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      name: 'lignes',
      type: 'array',
      labels: { singular: 'Ligne', plural: 'Lignes' },
      admin: {
        description:
          'Recopiées à l’achat : une commande ne bouge pas si le catalogue change.',
      },
      fields: [
        {
          name: 'produit',
          type: 'relationship',
          relationTo: 'products',
          admin: { description: 'Pour la navigation seulement — les montants viennent d’ici.' },
        },
        {
          type: 'row',
          fields: [
            { name: 'titre', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'reference', label: 'Référence', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'taille', type: 'text', admin: { width: '25%' } },
            { name: 'declinaison', label: 'Coloris', type: 'text', admin: { width: '25%' } },
            {
              name: 'prixUnitaire',
              label: 'Prix unitaire (€)',
              type: 'number',
              required: true,
              min: 0,
              admin: { width: '25%' },
            },
            {
              name: 'quantite',
              label: 'Quantité',
              type: 'number',
              required: true,
              min: 1,
              defaultValue: 1,
              admin: { width: '25%' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sousTotal',
          label: 'Sous-total (€)',
          type: 'number',
          min: 0,
          admin: { width: '34%', readOnly: true },
        },
        {
          name: 'fraisPort',
          label: 'Frais de port (€)',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { width: '33%' },
        },
        {
          name: 'total',
          label: 'Total (€)',
          type: 'number',
          min: 0,
          admin: { width: '33%', readOnly: true },
        },
      ],
    },
    {
      name: 'paiement',
      type: 'group',
      admin: { description: 'Renseigné par le prestataire une fois le paiement branché.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'fournisseur',
              label: 'Prestataire',
              type: 'text',
              admin: { width: '50%', readOnly: true },
            },
            {
              name: 'reference',
              label: 'Référence de transaction',
              type: 'text',
              admin: { width: '50%', readOnly: true },
            },
          ],
        },
      ],
    },
    {
      name: 'notes',
      label: 'Notes internes',
      type: 'textarea',
      admin: { description: 'Non visible par la cliente.' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Les totaux se recalculent à chaque enregistrement : saisis à la main,
        // ils finiraient par mentir.
        const lignes = (data?.lignes ?? []) as { prixUnitaire?: number; quantite?: number }[]
        const sousTotal = lignes.reduce(
          (s, l) => s + (l.prixUnitaire ?? 0) * (l.quantite ?? 0),
          0,
        )
        return {
          ...data,
          sousTotal,
          total: sousTotal + (data?.fraisPort ?? 0),
        }
      },
    ],
  },
}
