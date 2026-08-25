'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ChevronDown, Heart, Menu, Search, User, X } from 'lucide-react'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [condense, setCondense] = useState(false)
  const [tiroirOuvert, setTiroirOuvert] = useState(false)
  const pathname = usePathname()

  const navItems = data?.navItems || []

  // Bannière condensée au défilement. Hystérésis entre 80 et 40 px : sans
  // elle, l'en-tête clignote quand on s'arrête pile sur le seuil.
  useEffect(() => {
    const onScroll = () => {
      setCondense((etat) => {
        if (!etat && window.scrollY > 80) return true
        if (etat && window.scrollY < 40) return false
        return etat
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setTiroirOuvert(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = tiroirOuvert ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTiroirOuvert(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [tiroirOuvert])

  return (
    <>
      {data?.annonce?.actif && data.annonce.texte && (
        <Annonce texte={data.annonce.texte} url={data.annonce.url} />
      )}

      <header className="sticky top-0 z-[60] border-b border-border bg-background">
        <div
          className={cn(
            'container grid items-center gap-4 transition-[padding] duration-300',
            condense
              ? 'grid-cols-[auto_1fr_auto] py-2.5'
              : 'grid-cols-[auto_1fr_auto] py-3 md:grid-cols-[1fr_auto_1fr] md:pt-9 md:pb-7',
          )}
        >
          <div className="flex items-center gap-1">
            <button
              aria-label="Ouvrir le menu"
              className="rounded-pilule p-2.5 transition-colors hover:bg-accent hover:text-primary lg:hidden"
              onClick={() => setTiroirOuvert(true)}
              type="button"
            >
              <Menu className="size-[22px]" />
            </button>
            <Utilitaire href="/search" icone={<Search className="size-[18px]" />} masque={condense}>
              Rechercher
            </Utilitaire>
          </div>

          <div
            className={cn(
              'flex min-w-0 items-center gap-3',
              condense ? 'justify-self-start' : 'md:flex-col md:justify-self-center',
            )}
          >
            <Link aria-label="Les Bikeuses — accueil" href="/">
              <Logo
                className={cn(
                  'transition-[height] duration-300',
                  condense ? 'h-[26px]' : 'h-[34px] md:h-[52px]',
                )}
              />
            </Link>
            {data?.baseline && (
              <span
                className={cn(
                  'mono-label overflow-hidden text-muted-foreground transition-all duration-300',
                  condense ? 'max-h-0 opacity-0' : 'hidden max-h-8 md:block',
                )}
                style={{ letterSpacing: '0.22em' }}
              >
                {data.baseline}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-1">
            <Utilitaire href="/search" icone={<Heart className="size-[18px]" />} masque={condense}>
              Favoris
            </Utilitaire>
            <Utilitaire href="/admin" icone={<User className="size-[18px]" />} masque={condense}>
              Mon compte
            </Utilitaire>
          </div>
        </div>

        {/* Barre de navigation — masquée sous lg, remplacée par le tiroir */}
        <div className={cn('hidden lg:block', !condense && 'border-t border-border')}>
          <nav aria-label="Navigation principale" className="container flex justify-center gap-1">
            {navItems.map(({ link, accent, sousItems }, i) => (
              <EntreeNav accent={accent} key={i} link={link} sousItems={sousItems} />
            ))}
          </nav>
        </div>
      </header>

      <Tiroir
        fermer={() => setTiroirOuvert(false)}
        navItems={navItems}
        ouvert={tiroirOuvert}
      />
    </>
  )
}

/* ---------- Bandeau d'annonce ---------- */

const Annonce: React.FC<{ texte: string; url?: string | null }> = ({ texte, url }) => {
  // Les **doubles astérisques** passent en orange : un fragment mis en avant
  // sans imposer un éditeur riche pour une seule ligne de texte.
  const morceaux = texte.split(/\*\*(.+?)\*\*/g)
  const contenu = (
    <span className="mono-label">
      {morceaux.map((m, i) =>
        i % 2 === 1 ? (
          <b className="font-medium text-brand-bright" key={i}>
            {m}
          </b>
        ) : (
          <React.Fragment key={i}>{m}</React.Fragment>
        ),
      )}
    </span>
  )

  const classe = 'block bg-bitume px-4 py-2 text-center text-sur-bitume'

  return url ? (
    <Link className={classe} href={url}>
      {contenu}
    </Link>
  ) : (
    <div className={classe}>{contenu}</div>
  )
}

/* ---------- Utilitaires (recherche, favoris, compte) ---------- */

const Utilitaire: React.FC<{
  href: string
  icone: React.ReactNode
  masque?: boolean
  children: React.ReactNode
}> = ({ href, icone, masque, children }) => (
  <Link
    className="inline-flex items-center gap-2 rounded-pilule px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
    href={href}
  >
    {icone}
    <span className={cn('text-[0.8125rem] font-semibold', masque ? 'hidden' : 'hidden xl:inline')}>
      {children}
    </span>
  </Link>
)

/* ---------- Entrée de navigation + méga-menu ---------- */

type NavItem = NonNullable<Header['navItems']>[number]

const EntreeNav: React.FC<{
  link: NavItem['link']
  accent?: boolean | null
  sousItems?: NavItem['sousItems']
}> = ({ link, accent, sousItems }) => {
  const aSousMenu = Boolean(sousItems?.length)

  if (accent) {
    return (
      <CMSLink
        {...link}
        className="mono-label my-2 self-center rounded-pilule border-[1.5px] border-primary px-3.5 py-1.5 font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      />
    )
  }

  return (
    <div className="group relative my-2 flex items-center">
      <CMSLink
        {...link}
        className="inline-flex items-center gap-1.5 rounded-pilule px-3 py-2.5 text-[0.8125rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase transition-colors group-hover:bg-accent group-hover:text-primary group-focus-within:bg-accent group-focus-within:text-primary xl:px-4"
      >
        {aSousMenu && (
          <ChevronDown className="size-2.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
        )}
      </CMSLink>

      {aSousMenu && (
        <div className="invisible absolute top-full left-1/2 mt-1.5 grid min-w-max -translate-x-1/2 translate-y-[-6px] grid-flow-col grid-rows-[repeat(5,auto)] gap-x-10 gap-y-0.5 rounded-panneau border border-border border-t-2 border-t-primary bg-card p-6 opacity-0 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.35)] transition-[opacity,transform,visibility] duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {sousItems?.map((sous, i) => (
            <CMSLink
              {...sous.link}
              className="-mx-2.5 flex items-baseline justify-between gap-8 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-accent hover:text-primary"
              key={i}
            >
              {sous.meta && (
                <span className="mono-label shrink-0 text-muted-foreground">{sous.meta}</span>
              )}
            </CMSLink>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Tiroir mobile ---------- */

const Tiroir: React.FC<{
  ouvert: boolean
  fermer: () => void
  navItems: NavItem[]
}> = ({ ouvert, fermer, navItems }) => {
  const [deplie, setDeplie] = useState<number | null>(null)

  return (
    <div
      aria-hidden={!ouvert}
      className={cn(
        'fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-background transition-transform duration-300 lg:hidden',
        ouvert ? 'translate-x-0' : '-translate-x-full',
      )}
      inert={!ouvert}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-8">
        <Link aria-label="Les Bikeuses — accueil" href="/" onClick={fermer}>
          <Logo className="h-[30px]" />
        </Link>
        <button
          aria-label="Fermer le menu"
          className="rounded-pilule p-2 transition-colors hover:bg-accent hover:text-primary"
          onClick={fermer}
          type="button"
        >
          <X className="size-[22px]" />
        </button>
      </div>

      <div className="px-4 pb-8 md:px-8">
        {navItems.map(({ link, sousItems }, i) => {
          const aSousMenu = Boolean(sousItems?.length)
          const ouvertIci = deplie === i

          return (
            <div className="border-b border-border" key={i}>
              {aSousMenu ? (
                <button
                  aria-expanded={ouvertIci}
                  className={cn(
                    'flex w-full items-center justify-between py-4 text-left text-base font-bold tracking-[0.06em] uppercase',
                    ouvertIci && 'text-primary',
                  )}
                  onClick={() => setDeplie(ouvertIci ? null : i)}
                  type="button"
                >
                  {link?.label}
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', ouvertIci && 'rotate-180')}
                  />
                </button>
              ) : (
                <CMSLink
                  {...link}
                  className="block py-4 text-base font-bold tracking-[0.06em] uppercase"
                  onClick={fermer}
                />
              )}

              {aSousMenu && ouvertIci && (
                <div className="pb-3.5">
                  {sousItems?.map((sous, j) => (
                    <CMSLink
                      {...sous.link}
                      className="mb-1 flex justify-between rounded-xl bg-secondary px-3.5 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                      key={j}
                    >
                      {sous.meta && <span className="mono-label">{sous.meta}</span>}
                    </CMSLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
