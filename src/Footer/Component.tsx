import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

// Reprend la structure du pied de page de lesbikeuses.fr : à propos, colonnes
// de liens, coordonnées, puis une barre de mentions légales.
export async function Footer() {
  const footer = await getCachedGlobal('footer', 2)()

  const { aPropos, colonnes, contact, paiements, navItems } = footer || {}
  const annee = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-bitume text-sur-bitume">
      <div className="container grid gap-10 py-14 md:grid-cols-2 md:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col items-start gap-5">
          <Link aria-label="Les Bikeuses — accueil" href="/">
            <Logo className="h-[38px]" />
          </Link>
          {aPropos?.texte && (
            <p className="max-w-[34ch] text-sm text-taupe-nuit">
              <Accentue texte={aPropos.texte} />
            </p>
          )}
        </div>

        {colonnes?.map((colonne, i) => (
          <div key={colonne.id ?? i}>
            <TitreColonne>{colonne.titre}</TitreColonne>
            <ul className="flex flex-col gap-2.5">
              {colonne.items?.map((item, j) => (
                <li key={item.id ?? j}>
                  <CMSLink
                    {...item.link}
                    className="text-sm text-taupe-nuit transition-colors hover:text-brand-bright"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {contact && (contact.telephone || contact.email || contact.horaires) && (
          <div>
            <TitreColonne>{contact.titre || 'Nous contacter'}</TitreColonne>
            <div className="flex flex-col gap-2.5 text-sm text-taupe-nuit">
              {contact.mention && <p className="m-0">{contact.mention}</p>}
              {contact.telephone && (
                <a
                  className="font-semibold text-sur-bitume transition-colors hover:text-brand-bright"
                  href={`tel:${contact.telephone.replace(/\s/g, '')}`}
                >
                  {contact.telephone}
                </a>
              )}
              {contact.email && (
                <a
                  className="font-semibold text-sur-bitume transition-colors hover:text-brand-bright"
                  href={`mailto:${contact.email}`}
                >
                  {contact.email}
                </a>
              )}
              {contact.horaires && <p className="mono-label m-0 pt-1">{contact.horaires}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-trait-nuit py-6">
          <span className="mono-label text-taupe-nuit">© {annee} Les Bikeuses</span>

          {!!navItems?.length && (
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {navItems.map(({ link }, i) => (
                <CMSLink
                  className="mono-label text-taupe-nuit transition-colors hover:text-brand-bright"
                  key={i}
                  {...link}
                />
              ))}
            </nav>
          )}

          <div className="flex items-center gap-4">
            {!!paiements?.length && (
              <div className="flex flex-wrap gap-1.5">
                {paiements.map((p, i) => (
                  <span
                    className="mono-label rounded-pilule border border-trait-nuit px-2.5 py-1 text-taupe-nuit"
                    key={p.id ?? i}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            )}
            <ThemeSelector />
          </div>
        </div>
      </div>
    </footer>
  )
}

const TitreColonne: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mono-label mb-4 text-brand-bright">{children}</h2>
)

// Même convention que le bandeau d'annonce : **texte** passe en orange.
const Accentue: React.FC<{ texte: string }> = ({ texte }) => (
  <>
    {texte.split(/\*\*(.+?)\*\*/g).map((morceau, i) =>
      i % 2 === 1 ? (
        <strong className="font-semibold text-sur-bitume" key={i}>
          {morceau}
        </strong>
      ) : (
        <React.Fragment key={i}>{morceau}</React.Fragment>
      ),
    )}
  </>
)
