import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
  gantsImage: Media
  casqueImage: Media
}

/**
 * Page d'accueil Les Bikeuses, montée sur la DA « fiche d'équipement ».
 *
 * Le contenu est repris de lesbikeuses.fr : titre du héros, texte « Débuter la
 * moto », pages ressources et rayons du catalogue (avec les compteurs réels
 * relevés le 2026-08-24 via l'API WooCommerce Store).
 *
 * Les liens pointent vers l'ancien site en absolu : le catalogue n'est pas
 * encore migré, des chemins internes seraient des 404. À repasser en relatif
 * quand les rayons existeront sur le nouveau site.
 */
const SITE = 'https://lesbikeuses.fr'

// Rayons dans l'ordre de la section « NOS CATÉGORIES » de la home actuelle.
// Compteurs réels ; à rafraîchir après la migration du catalogue.
const RAYONS: [nom: string, refs: number, slug: string][] = [
  ['Vêtements', 21, 'vetements'],
  ['Marques', 468, 'marques'],
  ['Bons plans', 35, 'bons-plans'],
  ['Blousons moto', 112, 'blouson-moto'],
  ['Bottes', 27, 'bottes'],
  ['Baskets', 11, 'baskets'],
  ['Gants', 83, 'gants'],
  ['Pantalons & jeans', 37, 'pantalons-jeans'],
  ['Casques', 82, 'casques'],
  ['Accessoires', 106, 'accessoires'],
  ['Sous-vêtements moto', 5, 'sous-vetement-moto'],
]

export const home: (args: HomeArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  heroImage,
  metaImage,
  gantsImage,
  casqueImage,
}) => {
  return {
    slug: 'home',
    _status: 'published',
    title: 'Accueil',
    hero: {
      type: 'highImpact',
      eyebrow: 'Équipement moto pour femmes',
      media: heroImage.id,
      mediaSecondary: [{ image: gantsImage.id }, { image: casqueImage.id }],
      // Le titre de l'ancienne home est une seule phrase de 95 caractères.
      // Coupée en titre + chapô, elle se lit dans le même ordre, mot pour mot,
      // sans écraser la grille typographique du héros.
      richText: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Façonnez votre style ',
                  version: 1,
                },
                {
                  // format: 2 = italique → <em>, donc en orange (cf. .heros-titre em)
                  type: 'text',
                  detail: 0,
                  format: 2,
                  mode: 'normal',
                  style: '',
                  text: 'en toute sécurité',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h1',
              version: 1,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'avec notre sélection d’équipements moto pour femme.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Découvrir la boutique',
            url: `${SITE}/shop/`,
            newTab: true,
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Débuter la moto',
            url: `${SITE}/debuter-la-moto/`,
            newTab: true,
          },
        },
      ],
      // Chiffres relevés sur le catalogue WooCommerce, pas des promesses
      // marketing : 477 produits, 35 marques, 11 rayons de tête.
      stats: [
        { value: '477', label: 'Produits au catalogue' },
        { value: '35', label: 'Marques distribuées' },
        { value: '5J/7', label: 'Service client' },
      ],
      marquee: [
        { text: 'Service client 5J/7' },
        { text: 'Lundi à vendredi · 9h–12h30 / 13h30–18h' },
        { text: 'contact@lesbikeuses.fr' },
        { text: '+33 6 16 76 32 90' },
        { text: 'Visa · Mastercard · PayPal · Stripe' },
      ],
    },
    layout: [
      {
        blockType: 'parcours',
        eyebrow: 'Les ressources',
        title: 'Tout ce qu’il faut savoir avant de s’équiper',
        intro:
          'Les guides du site, rassemblés en trois entrées selon ce que vous cherchez.',
        entrees: [
          {
            title: 'Débuter la moto',
            text: 'Débuter la moto quand on est une femme, ce n’est pas si compliqué. Nous sommes là pour vous aider : trouvez votre moto, vos équipements.',
            link: {
              type: 'custom',
              label: 'Ouvrir le guide',
              url: `${SITE}/debuter-la-moto/`,
              newTab: true,
            },
          },
          {
            title: 'Dictionnaire moto',
            text: 'Vous cherchez une moto 125 cc, une marque particulière ou juste une bécane adaptée à votre gabarit ? Notre dictionnaire moto a la réponse.',
            link: {
              type: 'custom',
              label: 'Consulter le dictionnaire',
              url: `${SITE}/dictionnaire-moto/`,
              newTab: true,
            },
          },
          {
            title: 'Foire aux questions',
            text: 'Une réponse à toutes vos questions sur les produits et les retours.',
            link: {
              type: 'custom',
              label: 'Voir la FAQ',
              url: `${SITE}/faq/`,
              newTab: true,
            },
          },
        ],
      },
      {
        blockType: 'indexCategories',
        eyebrow: 'Nos catégories',
        title: 'Tout le catalogue, rayon par rayon',
        items: RAYONS.map(([label, refs, slug]) => ({
          label,
          meta: `${refs} réf.`,
          link: { type: 'custom' as const, url: `${SITE}/rubrique/${slug}/`, newTab: true },
        })),
      },
      {
        blockType: 'debuter',
        eyebrow: 'Débuter la moto',
        title: 'Commencer la moto quand on est une femme,',
        titleAccent: 'ce n’est pas compliqué.',
        intro:
          'On est là pour vous aider. Toutes les ressources dont vous avez besoin pour commencer la moto se trouvent à cet endroit.',
        links: [
          {
            link: {
              type: 'custom',
              label: 'Débuter la moto',
              url: `${SITE}/debuter-la-moto/`,
              newTab: true,
            },
          },
        ],
        // Les quatre étapes ne figurent pas sur l'ancien site : elles viennent
        // de la maquette validée. À valider éditorialement ou à remplacer par
        // le sommaire réel du guide « Débuter la moto ».
        etapes: [
          {
            title: 'Choisir son permis',
            text: 'A1, A2, passerelle 125 : ce que chaque permis autorise, le coût réel et le temps à prévoir.',
          },
          {
            title: 'Trouver une première moto',
            text: 'Hauteur de selle, poids à l’arrêt, puissance bridée : les critères qui comptent quand on fait 1 m 60.',
          },
          {
            title: 'S’équiper sans se ruiner',
            text: 'Le minimum légal, le minimum sensé, et l’ordre dans lequel investir sur deux saisons.',
          },
          {
            title: 'Les 500 premiers kilomètres',
            text: 'Manœuvres à froid, circulation dense, passagère : les situations à apprivoiser en premier.',
          },
        ],
      },
      {
        blockType: 'journal',
        eyebrow: 'Derniers articles',
        title: 'Essais, conseils et routes à faire',
        populateBy: 'collection',
        limit: 5,
        links: [
          {
            link: { type: 'custom', label: 'Tous les articles', url: '/posts' },
          },
        ],
      },
    ],
    meta: {
      title: 'Les Bikeuses — LE site pour les femmes à moto',
      description:
        'Façonnez votre style en toute sécurité avec notre sélection d’équipements moto pour femme : blousons, gants, bottes, casques et accessoires.',
      image: metaImage.id,
    },
  }
}
