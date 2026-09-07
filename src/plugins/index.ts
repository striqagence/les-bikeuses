import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Les Bikeuses` : 'Les Bikeuses'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

/**
 * Base des URL publiques du compartiment Supabase.
 *
 * Déduite du point d'accès S3 (`https://<projet>.supabase.co/storage/v1/s3`)
 * plutôt que d'une variable supplémentaire à tenir à jour.
 *
 * Vaut `null` si le format n'est pas celui attendu : on repasse alors par le
 * proxy Payload, plus lent mais toujours fonctionnel, au lieu de produire des
 * adresses mortes.
 */
const baseMediasPublique = ((): string | null => {
  const endpoint = process.env.S3_ENDPOINT ?? ''
  const bucket = process.env.S3_BUCKET ?? ''
  if (!endpoint || !bucket || !/\/storage\/v1\/s3\/?$/.test(endpoint)) return null

  return `${endpoint.replace(/\/s3\/?$/, '/object/public')}/${bucket}`
})()

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  // Stockage des médias sur Supabase Storage (compatible S3).
  // Activé uniquement si S3_BUCKET est défini — sinon, disque local (dev).
  // Indispensable en production sur Vercel (disque éphémère).
  ...(process.env.S3_BUCKET
    ? [
        s3Storage({
          collections: {
            media: baseMediasPublique
              ? {
                  // Le compartiment étant public, les visuels sont servis
                  // directement par le CDN Supabase. Auparavant chacun passait
                  // par `/api/media/file/...`, c'est-à-dire une fonction Vercel
                  // réveillée et une requête en base par image — le premier
                  // chargement d'un visuel coûtait deux à quatre secondes.
                  disablePayloadAccessControl: true,
                  generateFileURL: ({ filename, prefix }) =>
                    `${baseMediasPublique}/${[prefix, filename].filter(Boolean).join('/')}`,
                }
              : true,
          },
          bucket: process.env.S3_BUCKET,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || 'us-east-1',
            forcePathStyle: true, // requis pour Supabase Storage
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
          },
        }),
      ]
    : []),
]
