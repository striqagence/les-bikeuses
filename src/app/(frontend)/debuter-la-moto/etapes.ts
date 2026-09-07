/**
 * Parcours de la débutante, en quatre temps.
 *
 * L'ancienne page alignait une douzaine d'encarts sans ordre apparent :
 * un guide, deux quiz, un groupe Facebook, des packs, puis huit guides
 * d'achat. Or les questions d'une débutante arrivent dans un ordre, et
 * toujours le même — est-ce que j'en suis capable, comment j'obtiens le
 * permis, quelle machine, quel équipement. La page suit cet ordre.
 *
 * La sélection est tenue à la main : c'est un parcours, pas une liste
 * automatique. Un article retiré du site disparaît simplement de l'étape,
 * sans casser la page.
 */
export type Etape = {
  numero: string
  titre: string
  question: string
  chapeau: string
  slugs: string[]
  /** Destination du site vers laquelle l'étape débouche. */
  suite?: { libelle: string; url: string; detail: string }
}

export const ETAPES: Etape[] = [
  {
    numero: '01',
    titre: 'Avant de se lancer',
    question: 'Est-ce que c’est pour moi ?',
    chapeau:
      'La première marche n’est pas administrative, elle est dans la tête. Trois lectures pour la franchir.',
    slugs: [
      'avez-vous-peur-de-commencer-la-moto',
      'motarde-pourquoi-passer-son-permis-moto',
      'une-bikeuse-debutante-nous-livre-sa-vision-de-la-moto',
    ],
  },
  {
    numero: '02',
    titre: 'Passer le permis',
    question: 'Par où je commence ?',
    chapeau:
      'Quel permis viser selon votre âge et vos projets, comment s’inscrire, et ce qui se joue vraiment le jour de l’examen.',
    slugs: [
      'permis-moto-quel-permis-puis-je-passer',
      'comment-sinscrire-au-permis-moto',
      'comment-reussir-son-permis-moto',
      'gerer-son-stress-a-lexamen-du-permis-moto',
      'femme-reussir-son-examen-circulation-du-permis-moto',
      'moto-permis-a2-comment-ca-marche',
      'inscrivez-vous-a-la-passerelle-pour-obtenir-votre-permis-a',
    ],
  },
  {
    numero: '03',
    titre: 'Choisir sa machine',
    question: 'Laquelle je peux tenir ?',
    chapeau:
      'La bonne moto n’est pas la plus belle : c’est celle dont vous touchez le sol et que vous relevez seule.',
    slugs: [
      'permis-a2-quelle-moto-femme-choisir',
      'quelles-sont-les-meilleures-motos-125-cc-pour-debuter',
      'trouver-une-moto-pour-un-petit-gabarit',
      'comment-manoeuvrer-une-moto-quand-on-est-un-petit-gabarit',
      'quelles-questions-poser-a-son-concessionnaire-pour-acheter-sa-premiere-moto',
    ],
    suite: {
      libelle: 'Le dictionnaire moto',
      url: '/dictionnaire-moto',
      detail:
        'Des modèles passés en revue et filtrables par cylindrée, poids, hauteur de selle — et par compatibilité permis A2.',
    },
  },
  {
    numero: '04',
    titre: 'S’équiper',
    question: 'Qu’est-ce qui me protège vraiment ?',
    chapeau:
      'Les homologations, les matières, ce qu’il faut vérifier sur une étiquette. De quoi ne pas payer cher un équipement qui ne tiendra pas.',
    slugs: [
      'equipements-moto-pour-femmes-que-choisir-quand-on-debute',
      'quelle-homologation-pour-mon-blouson-de-moto',
      'quelles-sont-les-caracteristiques-dun-blouson-moto-de-qualite',
      'casque-de-moto-pour-femme-comment-choisir',
      'gants-de-moto-bien-choisir-quand-on-debute',
      'bottes-de-moto-pour-femme-comment-choisir',
      'choisir-un-blouson-moto-femme-pour-le-printemps-et-lete',
      'quel-intercom-moto-choisir',
    ],
    suite: {
      libelle: 'La boutique',
      url: '/rubrique/blousons-moto',
      detail:
        'Blousons, gants, casques et bottes coupés pour des morphologies féminines, avec leur niveau d’homologation.',
    },
  },
]
