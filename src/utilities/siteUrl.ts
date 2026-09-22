/**
 * Adresse publique du site, pour les plans de site et les métadonnées.
 *
 * Reprise telle quelle des routes existantes, qui la recalculaient chacune de
 * leur côté : trois copies d'une même cascade finissent par diverger, et une
 * adresse fausse dans un plan de site ne se voit pas à l'œil nu.
 */
export const siteUrl = (): string =>
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://les-bikeuses.vercel.app')
