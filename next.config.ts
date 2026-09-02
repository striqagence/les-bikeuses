import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // 75 est le défaut de Next et le bon compromis. La configuration forçait
    // 100 : chaque image pesait deux à trois fois plus pour un gain invisible.
    qualities: [75],
    // Les variantes optimisées sont conservées un mois. Le défaut est d'une
    // minute : passé ce délai chaque visiteur relançait l'optimisation, et
    // c'est ce même en-tête que reçoit le navigateur — il rechargeait donc
    // toutes les images à chaque navigation.
    //
    // Sans risque : `getMediaUrl` suffixe chaque URL de la date de mise à
    // jour du média, remplacer un visuel change donc la clé de cache.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // La plus grande vignette de la boutique fait 620 px, le héros occupe la
    // pleine largeur. Au-delà de 1920 px on ne sert plus que du poids : les
    // deux paliers supérieurs du défaut (2048 et 3840) sont retirés.
    deviceSizes: [360, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 200, 300, 400],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  // Le bucket Supabase est privé : les médias transitent donc par le proxy
  // Payload `/api/media/file/...`, qui réveille une fonction et interroge la
  // base à chaque image. Sans cache, une page d'accueil à huit visuels réclame
  // huit connexions — de quoi saturer le pooler à elle seule.
  //
  // Payload suffixe déjà chaque URL de `?<updatedAt>` : la clé de cache change
  // dès qu'un média est remplacé, un `s-maxage` long est donc sans risque.
  // `max-age=0` garde le navigateur en revalidation, seul le CDN met en cache.
  headers: async () => [
    {
      source: '/api/media/file/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
        },
      ],
    },
  ],
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
