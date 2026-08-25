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

  return [internetExplorerRedirect, ...soldes]
}
