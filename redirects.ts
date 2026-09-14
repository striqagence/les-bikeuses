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

  // Trois pages de l'ancien site que le dictionnaire et le catalogue
  // couvrent déjà, mieux : elles sont renvoyées sur l'équivalent filtré
  // plutôt que recopiées. Deux pages qui disent la même chose se
  // cannibalisent dans les résultats de recherche.
  //
  // Temporaires, comme les soldes : si l'une d'elles justifie un jour une
  // page à part entière, il suffira de changer la destination.
  const remplacees = [
    {
      // « Motos faciles à conduire » : le dictionnaire filtre déjà sur le
      // gabarit et la compatibilité permis A2, sur quatre-vingts modèles.
      source: '/dictionnaire-moto/motos-faciles-a-conduire',
      destination: '/dictionnaire-moto?gabarit=Petit+gabarit',
      permanent: false,
    },
    {
      // « Catégories de moto » : c'est la facette « type » du dictionnaire.
      source: '/dictionnaire-moto/categories-moto',
      destination: '/dictionnaire-moto',
      permanent: false,
    },
    {
      // « Road trip » : les vingt-neuf références citées sont au catalogue,
      // pour l'essentiel en bagagerie.
      source: '/road-trip',
      destination: '/rubrique/bagagerie',
      permanent: false,
    },
  ]

  return [internetExplorerRedirect, ...soldes, anciensArticles, ...remplacees]
}
