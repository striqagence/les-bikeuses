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


  /*
   * ── Plan de reprise de lesbikeuses.fr ────────────────────────────────
   *
   * Relevé fait le 22/09/2026 sur les six plans de site de l'ancien
   * WordPress : 840 adresses indexées. 224 tombent déjà juste — les articles
   * vivent à la racine des deux côtés — et 577 changent de forme.
   *
   * Des règles, et non 577 lignes : le catalogue entier tient en une, les
   * rayons imbriqués en une autre. Une table n'est écrite que là où la
   * correspondance ne se déduit pas de l'adresse.
   *
   * 301 quand le déplacement est définitif : c'est ce qui transmet l'autorité
   * acquise par l'ancienne adresse. 302 quand une vraie page pourrait
   * apparaître ici un jour — un 301 resterait dans le cache des navigateurs
   * bien après que la page existe.
   */

  // Catalogue : 477 fiches plus la boutique. `/product/` → `/produit/`.
  const catalogue = [
    { source: '/product/:slug', destination: '/produit/:slug', permanent: true },
    { source: '/shop', destination: '/rubrique/blousons-moto', permanent: false },
  ]

  /*
   * Rayons : l'ancien site les imbriquait sous leur parent — `/rubrique/
   * marques/vulcanet/` — quand ce site les range à plat. Soixante-trois
   * adresses sur soixante-cinq se résolvent ainsi ; les deux autres portent
   * un slug que nous n'avons pas, et tombent dans la table ci-dessous.
   */
  const rayonsImbriques = {
    source: '/rubrique/:parent/:slug',
    destination: '/rubrique/:slug',
    permanent: true,
  }

  /*
   * Slugs que la reprise a changés, au singulier ou au pluriel. Sans ces
   * trois lignes, trois rayons indexés tombent en 404 — et ce sont des pages
   * de catégorie, celles qui portent le plus de liens entrants.
   */
  const slugsChanges = [
    ['/rubrique/blouson-moto', '/rubrique/blousons-moto'],
    ['/rubrique/pantalons-jeans', '/rubrique/pantalon-jeans'],
    ['/rubrique/sous-vetement-moto', '/rubrique/sous-vetements-moto'],
    ['/rubrique/marques', '/marques'],
    ['/rubrique/marques/spconnect', '/marques'],
    ['/rubrique/marques/100-pourcent', '/marques'],
    ['/blog', '/posts'],
  ].map(([source, destination]) => ({ source, destination, permanent: true }))

  /*
   * Catégories d'articles et de motos. L'ancien site les servait sous `/c/`.
   * Les rubriques de rédaction rejoignent le filtre du journal ; les entrées
   * sous `/c/motos/` rejoignent le dictionnaire, filtré sur la marque ou sur
   * la caractéristique correspondante — atterrir sur le dictionnaire entier
   * perdrait l'intention de la visite.
   */
  const categories: [string, string][] = [
    ['/c/a-la-une', '/posts'],
    ['/c/divers', '/posts?theme=divers'],
    ['/c/equipement', '/posts?theme=equipement'],
    ['/c/hebergements', '/posts'],
    ['/c/lieux', '/posts?theme=lieux'],
    ['/c/motos', '/posts?theme=motos'],
    ['/c/motos/125cc', '/dictionnaire-moto?cylindree=125cc'],
    ['/c/motos/130-190-poids', '/dictionnaire-moto?poids=130kg+-+190kg'],
    ['/c/motos/190-225-poids', '/dictionnaire-moto?poids=190kg+-+225kg'],
    ['/c/motos/250-600-cylindre', '/dictionnaire-moto?cylindree=250cc+-+600cc'],
    ['/c/motos/600-plus', '/dictionnaire-moto?cylindree=Plus+de+600cc'],
    ['/c/motos/aprilia', '/dictionnaire-moto?marque=Aprilia'],
    ['/c/motos/bmw', '/dictionnaire-moto?marque=BMW'],
    ['/c/motos/brixton', '/dictionnaire-moto?marque=Brixton'],
    ['/c/motos/bullit', '/dictionnaire-moto?marque=Bullit'],
    ['/c/motos/custom-retro', '/dictionnaire-moto?type=Custom+R%C3%A9tro'],
    ['/c/motos/ducati', '/dictionnaire-moto?marque=Ducati'],
    ['/c/motos/fb-mondial', '/dictionnaire-moto?marque=FB+Mondial'],
    ['/c/motos/harley-davidson', '/dictionnaire-moto?marque=Harley-Davidson'],
    ['/c/motos/honda', '/dictionnaire-moto?marque=Honda'],
    ['/c/motos/hyosung', '/dictionnaire-moto?marque=Hyosung'],
    ['/c/motos/indian', '/dictionnaire-moto?marque=Indian'],
    ['/c/motos/kawasaki', '/dictionnaire-moto?marque=Kawasaki'],
    ['/c/motos/ktm', '/dictionnaire-moto?marque=KTM'],
    ['/c/motos/lexmoto', '/dictionnaire-moto?marque=Lexmoto'],
    ['/c/motos/permis-a2', '/dictionnaire-moto?permis=Compatible+permis+A2'],
    ['/c/motos/petit-gabarit', '/dictionnaire-moto?gabarit=Petit+gabarit'],
    ['/c/motos/poids-225-plus', '/dictionnaire-moto?poids=Plus+de+225kg'],
    ['/c/motos/roadsters', '/dictionnaire-moto?type=Roadsters'],
    ['/c/motos/routiere-gt', '/dictionnaire-moto?type=Routi%C3%A8re+et+GT'],
    ['/c/motos/royal-enfield', '/dictionnaire-moto?marque=Royal+Enfield'],
    ['/c/motos/scooter', '/dictionnaire-moto?type=Scooter'],
    ['/c/motos/sportive', '/dictionnaire-moto?type=Sportive'],
    ['/c/motos/suzuki', '/dictionnaire-moto?marque=Suzuki'],
    ['/c/motos/trail', '/dictionnaire-moto?type=Trail'],
    ['/c/motos/triumph', '/dictionnaire-moto?marque=Triumph'],
    ['/c/motos/vespa', '/dictionnaire-moto?marque=Vespa'],
    ['/c/motos/yamaha', '/dictionnaire-moto?marque=Yamaha'],
    ['/c/motos/zontes', '/dictionnaire-moto?marque=Zontes'],
    ['/c/permis-moto', '/posts?theme=permis-moto'],
    ['/c/style', '/posts?theme=style'],
    ['/c/technique', '/posts?theme=technique'],
  ]

  /*
   * Étiquettes d'avis. Elles n'ont pas d'équivalent : ce site range les avis
   * par rayon, pas par étiquette. La page des avis est le plus proche.
   */
  const etiquettesAvis = {
    source: '/cr_tag/:slug',
    destination: '/avis-des-clients',
    permanent: false,
  }

  /*
   * Pages de boutique WooCommerce. Le panier existe ici ; le paiement, le
   * compte client et la liste de souhaits n'existent pas encore. Temporaires
   * à ce titre : ces pages sont au programme.
   */
  const boutiqueWoo = [
    ['/cart', '/panier'],
    ['/checkout', '/panier'],
    ['/my-account', '/panier'],
    ['/liste-de-souhaits', '/panier'],
    ['/payment-confirmation', '/panier'],
    ['/payment-failed', '/panier'],
    ['/promotion-expiree', '/'],
    ['/nouveaute-2', '/'],
    ['/left-sidebar', '/'],
  ].map(([source, destination]) => ({ source, destination, permanent: false }))

  /*
   * Pages de contenu que la reprise n'a pas importées : deux quiz et une
   * page de recommandations. Renvoyées vers le plus proche en attendant une
   * décision — les reprendre demande de rejouer leur logique, pas seulement
   * leur texte.
   */
  const nonReprises = [
    ['/quiz-quelle-bikeuse-etes-vous', '/posts?theme=style'],
    ['/quiz-trouvez-votre-moto-ideale', '/dictionnaire-moto'],
    ['/mes-recommandations', '/posts'],
  ].map(([source, destination]) => ({ source, destination, permanent: false }))

  return [
    internetExplorerRedirect,
    ...soldes,
    anciensArticles,
    ...remplacees,
    ...catalogue,
    ...slugsChanges,
    ...categories.map(([source, destination]) => ({ source, destination, permanent: true })),
    rayonsImbriques,
    etiquettesAvis,
    ...boutiqueWoo,
    ...nonReprises,
  ]
}
