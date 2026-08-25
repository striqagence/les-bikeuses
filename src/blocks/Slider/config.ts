import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

// Slider de mise en avant, placé sous le menu.
//
// Deux réglages existent parce qu'aucun cadrage automatique ne convient à
// toutes les photos : `positionImage` décide quelle partie reste visible au
// recadrage, `coteCarton` de quel côté poser le texte. Sans eux, le carton
// finit par masquer le sujet.
export const Slider: Block = {
  slug: 'slider',
  interfaceName: 'SliderBlock',
  labels: {
    singular: 'Slider',
    plural: 'Sliders',
  },
  fields: [
    {
      name: 'slides',
      type: 'array',
      label: 'Diapositives',
      labels: { singular: 'Diapositive', plural: 'Diapositives' },
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'Photo',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Paysage large, 1600 × 900 minimum.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'positionImage',
              type: 'select',
              label: 'Cadrage',
              defaultValue: 'center',
              options: [
                { label: 'Centré', value: 'center' },
                { label: 'Vers la gauche', value: 'left' },
                { label: 'Vers la droite', value: 'right' },
                { label: 'Vers le haut', value: 'top' },
                { label: 'Vers le bas', value: 'bottom' },
              ],
              admin: {
                width: '50%',
                description: 'Quelle partie de la photo rester visible au recadrage.',
              },
            },
            {
              name: 'coteCarton',
              type: 'select',
              label: 'Côté du texte',
              defaultValue: 'gauche',
              options: [
                { label: 'À gauche', value: 'gauche' },
                { label: 'À droite', value: 'droite' },
              ],
              admin: {
                width: '50%',
                description: 'À poser du côté le plus dégagé de la photo.',
              },
            },
          ],
        },
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Sur-titre',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'titre',
              type: 'text',
              label: 'Titre',
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'titreAccent',
              type: 'text',
              label: 'Fin du titre, en accent',
              admin: {
                width: '50%',
                description: 'Affichée en orange, à la suite du titre.',
              },
            },
          ],
        },
        {
          name: 'texte',
          type: 'textarea',
          label: 'Texte',
        },
        linkGroup({
          appearances: false,
          overrides: { maxRows: 1, label: 'Bouton' },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'defilementAuto',
          type: 'checkbox',
          label: 'Défilement automatique',
          defaultValue: true,
          admin: { width: '50%' },
        },
        {
          name: 'delai',
          type: 'number',
          label: 'Délai (secondes)',
          defaultValue: 6,
          min: 3,
          max: 20,
          admin: {
            width: '50%',
            condition: (_, siblingData) => Boolean(siblingData?.defilementAuto),
          },
        },
      ],
    },
  ],
}
