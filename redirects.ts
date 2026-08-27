import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // L'onglet Soldes a été retiré du menu, mais l'ancien site expose
  // /soldes-2/ (et /soldes/), indexés et partagés. On les renvoie vers
  // l'accueil plutôt que de servir un 404.
  //
  // Redirections temporaires : le jour où une vraie page Soldes existera sur
  // ce site, il suffira de changer la destination. Un 301 resterait, lui,
  // dans le cache des navigateurs.
  const soldes = ['/soldes', '/soldes-2'].map((source) => ({
    source,
    destination: '/',
    permanent: false,
  }))

  // Les articles vivaient sous /posts/<slug> jusqu'au 2026-08-27, et l'ancien
  // site les expose déjà à la racine. On rattrape l'ancien schéma interne.
  //
  // `:slug` ne prend qu'un segment : /posts (la liste) et /posts/page/2 (la
  // pagination) ne sont donc pas concernés. `page` est exclu explicitement.
  const anciensArticles = {
    source: '/posts/:slug((?!page$)[^/]+)',
    destination: '/:slug',
    permanent: false,
  }

  return [internetExplorerRedirect, ...soldes, anciensArticles]
}
