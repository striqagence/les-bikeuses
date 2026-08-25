import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'fr_FR',
  description:
    'Équipement moto pour femmes : blousons, gants, bottes, casques et accessoires, choisis pour les morphologies féminines.',
  images: [
    {
      // TODO: remplacer par un visuel Les Bikeuses (1200×630).
      url: `${getServerSideURL()}/website-template-OG.webp`,
    },
  ],
  siteName: 'Les Bikeuses',
  title: 'Les Bikeuses — LE site pour les femmes à moto',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
