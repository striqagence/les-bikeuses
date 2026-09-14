/**
 * Les domaines de la conduite, une fois le permis en poche.
 *
 * Volontairement sans numéros, contrairement à « Débuter la moto » : là-bas
 * les étapes se suivent — on passe le permis avant de choisir sa machine —
 * ici non. On n'apprend pas le freinage d'urgence avant le virage, et
 * l'entretien n'attend pas la maîtrise. Numéroter aurait laissé croire à un
 * ordre qui n'existe pas.
 *
 * La page d'origine consacrait aussi douze articles au permis, qui font
 * doublon avec « Débuter la moto ». Un renvoi remplace la redite : deux
 * pages-carrefour qui se recopient se cannibalisent, dans la navigation
 * comme dans les résultats de recherche.
 */
export type Domaine = {
  cle: string
  titre: string
  chapeau: string
  slugs: string[]
  suite?: { eyebrow: string; titre: string; detail: string; url: string; action?: string }
}

export const DOMAINES: Domaine[] = [
  {
    cle: 'manier',
    titre: 'Manier la moto',
    chapeau:
      'Le virage, le freinage, le passage des rapports — et la force qu’il faut pour tenir la machine à l’arrêt comme en mouvement.',
    slugs: [
      'comment-prendre-un-virage-a-moto',
      'comment-freiner-en-urgence-a-moto',
      'comment-passer-les-vitesses-facilement-sur-une-moto',
      'comment-manoeuvrer-une-moto-quand-on-est-un-petit-gabarit',
      'comment-se-muscler-pour-mieux-conduire-sa-moto',
      'comment-se-muscler-les-bras-pour-bien-conduire-sa-moto',
    ],
  },
  {
    cle: 'temps',
    titre: 'Rouler par tous les temps',
    chapeau:
      'La pluie, le froid, la neige, le gravillon : ce qui change dans la conduite, et ce qu’il faut porter pour que le trajet reste tenable.',
    slugs: [
      'rouler-a-moto-en-hiver',
      'comment-rouler-a-moto-sur-une-route-mouillee',
      'comment-rouler-a-moto-quand-il-neige',
      'comment-garder-une-bonne-adherence-sur-une-route-en-mauvais-etat',
      'comment-shabiller-en-hiver-pour-rouler-a-moto',
      'comment-sequiper-pour-rouler-a-moto-quand-il-pleut',
      'bien-choisir-ses-vetements-de-pluie-moto-femme',
    ],
  },
  {
    cle: 'normes',
    titre: 'Connaître les normes',
    chapeau:
      'CE, EPI, niveaux AA et KP : ce que les étiquettes veulent dire, et ce qu’elles engagent réellement en cas de chute.',
    slugs: [
      'quelle-homologation-pour-mon-blouson-de-moto',
      'gants-de-moto-femme-homologues-faire-son-choix',
      'quelle-norme-pour-mes-gants-de-moto-femme',
      'quelle-homologation-pour-les-bottes-de-moto',
      'une-bikeuse-nous-parle-de-la-securite-a-moto',
    ],
  },
  {
    cle: 'entretien',
    titre: 'Entretenir sa machine',
    chapeau:
      'La moto au sortir de l’hiver, le cuir qui sèche, la visière qu’on raye en la nettoyant mal. L’entretien tient une monture — et un équipement — bien plus longtemps.',
    slugs: [
      'moto-apres-lhiver-verifications-a-faire-avant-de-rouler',
      'comment-laver-et-entretenir-sa-moto',
      'comment-entretenir-les-cuirs-de-moto',
      'comment-entretenir-mon-casque-moto',
      'comment-nettoyer-ma-visiere-de-casque-de-moto',
    ],
    suite: {
      eyebrow: 'Pour aller plus loin',
      titre: 'Produits d’entretien',
      detail: 'Nettoyants, imperméabilisants et soins du cuir, dans le rayon accessoires.',
      url: '/rubrique/entretien-moto',
      action: 'Voir le rayon',
    },
  },
]
