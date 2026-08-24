import type { RequiredDataFromCollectionSlug } from 'payload'
import type { Media } from '@/payload-types'

type HomeArgs = {
  heroImage: Media
  metaImage: Media
  gantsImage: Media
  casqueImage: Media
}

// Page d'accueil Les Bikeuses, montée sur la DA « fiche d'équipement ».
// Ordre des sections : héros → parcours → index du catalogue → débuter la moto
// → journal. Le contenu est éditable dans l'admin une fois le seed passé.
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
      eyebrow: 'Équipement moto femme · sélection 2026',
      media: heroImage.id,
      mediaSecondary: [{ image: gantsImage.id }, { image: casqueImage.id }],
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
                  text: 'Le style ne se négocie pas. ',
                  version: 1,
                },
                {
                  // format: 2 = italique → rendu <em>, donc en orange (cf. .heros-titre em)
                  type: 'text',
                  detail: 0,
                  format: 2,
                  mode: 'normal',
                  style: '',
                  text: 'La protection non plus.',
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
                  text: 'Blousons, gants, bottes et casques choisis un par un pour les morphologies féminines — homologation vérifiée, coupe vérifiée, avis de motardes à l’appui.',
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
            label: 'Voir la sélection',
            url: '/posts',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'Je débute la moto',
            url: '/posts',
          },
        },
      ],
      stats: [
        { value: '340+', label: 'Pièces testées' },
        { value: '100 %', label: 'Homologué CE' },
        { value: 'XS–4XL', label: 'Guide morpho' },
      ],
      marquee: [
        { text: 'Homologation CE vérifiée' },
        { text: 'Guide des tailles morpho' },
        { text: 'Testé par des motardes' },
        { text: 'Coques épaules & coudes incluses' },
        { text: 'Livraison 48 h' },
        { text: 'Retour gratuit 30 jours' },
      ],
    },
    layout: [
      {
        blockType: 'parcours',
        eyebrow: 'Par où commencer',
        title: 'Trois entrées, selon là où vous en êtes',
        intro:
          'Plutôt qu’un catalogue à parcourir, on vous emmène directement vers ce qui correspond à votre situation.',
        entrees: [
          {
            title: 'Je passe mon permis',
            text: 'Le kit minimum obligatoire, ce qu’il faut acheter tout de suite et ce qui peut attendre. Budget de départ : 400 à 600 €.',
            link: { type: 'custom', label: 'L’équipement de base', url: '/posts' },
          },
          {
            title: 'J’équipe ma saison',
            text: 'Été ventilé, mi-saison, hiver étanche : la bonne pièce pour les kilomètres que vous faites vraiment.',
            link: { type: 'custom', label: 'Choisir par saison', url: '/posts' },
          },
          {
            title: 'Je cherche ma taille',
            text: 'Poitrine, hanches, longueur de bras : le guide morpho pour arrêter de commander en trois tailles à la fois.',
            link: { type: 'custom', label: 'Le guide morpho', url: '/posts' },
          },
        ],
      },
      {
        blockType: 'indexCategories',
        eyebrow: 'L’index',
        title: 'Tout le catalogue, rayon par rayon',
        items: [
          { label: 'Blousons moto', meta: '84 réf.', link: { type: 'custom', url: '/posts' } },
          { label: 'Casques', meta: '61 réf.', link: { type: 'custom', url: '/posts' } },
          { label: 'Gants', meta: '57 réf.', link: { type: 'custom', url: '/posts' } },
          { label: 'Pantalons & jeans', meta: '42 réf.', link: { type: 'custom', url: '/posts' } },
          { label: 'Bottes', meta: '38 réf.', link: { type: 'custom', url: '/posts' } },
          { label: 'Baskets moto', meta: '29 réf.', link: { type: 'custom', url: '/posts' } },
          {
            label: 'Accessoires & bagagerie',
            meta: '73 réf.',
            link: { type: 'custom', url: '/posts' },
          },
          {
            label: 'Vêtements & lifestyle',
            meta: '46 réf.',
            link: { type: 'custom', url: '/posts' },
          },
          {
            label: 'Antivols & sécurité',
            meta: '24 réf.',
            link: { type: 'custom', url: '/posts' },
          },
          {
            label: 'Bons plans du moment',
            meta: 'Mise à jour quotidienne',
            link: { type: 'custom', url: '/posts' },
          },
        ],
      },
      {
        blockType: 'debuter',
        eyebrow: 'Débuter la moto',
        title: 'Commencer la moto quand on est une femme,',
        titleAccent: 'ce n’est pas compliqué.',
        intro:
          'C’est juste mal expliqué. On reprend depuis le début : le permis, la première machine, l’équipement qui protège vraiment, et les réflexes des premiers kilomètres.',
        links: [
          {
            link: { type: 'custom', label: 'Ouvrir le guide complet', url: '/posts' },
          },
        ],
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
        eyebrow: 'Le journal',
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
      title: 'Les Bikeuses — équipement moto pour femmes',
      description:
        'Blousons, gants, bottes et casques moto choisis pour les morphologies féminines. Homologation vérifiée, guide des tailles morpho, conseils pour débuter.',
      image: metaImage.id,
    },
  }
}
