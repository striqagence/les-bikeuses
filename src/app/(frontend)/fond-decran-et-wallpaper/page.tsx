import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { Media } from '@/payload-types'

import { Media as Visuel } from '@/components/Media'

export const revalidate = 600

/**
 * Fonds d'écran à télécharger.
 *
 * La page tire sa galerie de la médiathèque : tout visuel marqué
 * « fond d'écran » y apparaît, sans passer par la mise en page. Ajouter un
 * fond revient donc à cocher une case sur un média.
 */
const chargerFonds = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const r = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 200,
      pagination: false,
      sort: 'createdAt',
      where: { fondDecran: { exists: true } },
    })

    const docs = r.docs as Media[]
    return {
      smartphone: docs.filter((m) => m.fondDecran === 'smartphone'),
      ordinateur: docs.filter((m) => m.fondDecran === 'ordinateur'),
    }
  },
  ['fonds-decran'],
  { revalidate: 600 },
)

export default async function FondsDecran() {
  const { smartphone, ordinateur } = await chargerFonds()

  return (
    <div className="container pt-6 pb-20 md:pt-10">
      <header className="max-w-[60ch]">
        <p className="eyebrow">Gratuit</p>
        <h1 className="wonk mt-2 text-3xl leading-[1.03] font-medium md:text-5xl">
          Fonds d’écran moto
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Nos photos de route, cadrées pour votre téléphone et votre ordinateur. À télécharger
          librement, sans compte ni inscription.
        </p>
      </header>

      <Galerie
        format="smartphone"
        fonds={smartphone}
        legende="Cadrés en vertical, pour un écran de téléphone."
        titre="Pour smartphone"
      />
      <Galerie
        format="ordinateur"
        fonds={ordinateur}
        legende="Cadrés en paysage, pour un fond de bureau."
        titre="Pour ordinateur"
      />
    </div>
  )
}

const Galerie: React.FC<{
  titre: string
  legende: string
  format: 'smartphone' | 'ordinateur'
  fonds: Media[]
}> = ({ titre, legende, format, fonds }) => {
  if (!fonds.length) return null

  const vertical = format === 'smartphone'

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-4">
        <div>
          <h2 className="wonk text-2xl font-medium">{titre}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{legende}</p>
        </div>
        <p className="mono-label text-muted-foreground">{fonds.length} visuels</p>
      </div>

      <ul
        className={
          vertical
            ? 'grid list-none grid-cols-2 gap-5 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            : 'grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {fonds.map((media) => (
          <li key={media.id}>
            <figure className="group relative overflow-hidden rounded-panneau border border-border bg-card">
              <Visuel
                className={vertical ? 'aspect-[9/16]' : 'aspect-[16/10]'}
                imgClassName="size-full object-cover"
                resource={media}
              />

              {/* Le téléchargement passe par l'original, jamais par la vignette. */}
              <figcaption className="absolute inset-x-0 bottom-0 flex justify-end bg-linear-to-t from-bitume/80 to-transparent p-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <a
                  className="mono-label rounded-pilule bg-background px-3 py-2 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  download
                  href={media.url ?? '#'}
                >
                  Télécharger
                </a>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}

export const metadata: Metadata = {
  title: 'Fonds d’écran moto gratuits | Les Bikeuses',
  description:
    'Des fonds d’écran moto à télécharger gratuitement, cadrés pour smartphone et pour ordinateur.',
}
