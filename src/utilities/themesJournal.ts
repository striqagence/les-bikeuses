/**
 * Thèmes éditoriaux du journal.
 *
 * Liste tenue à la main, et non lue depuis les catégories : les articles en
 * portent quarante-deux, qui mélangent trois axes sans rapport — des rubriques
 * de rédaction (Équipement, Technique, Style), mais aussi des cylindrées
 * (125cc, 250cc-600cc), des fourchettes de poids (130kg-190kg) et des marques
 * de moto (Kawasaki, Triumph…), héritées de la taxonomie du dictionnaire.
 * Ouvrir le filtre sur les quarante-deux donnerait une liste illisible où le
 * lecteur ne saurait pas ce qu'il choisit.
 *
 * Même parti pris que `RAYONS` pour la boutique, et pour la même raison : le
 * site décide de ce qui est une entrée de navigation, la base se contente de
 * ranger.
 */
export type Theme = { libelle: string; slug: string }

export const THEMES: Theme[] = [
  { libelle: 'Motos', slug: 'motos' },
  { libelle: 'Équipement', slug: 'equipement' },
  { libelle: 'Technique', slug: 'technique' },
  { libelle: 'Style', slug: 'style' },
  { libelle: 'Permis moto', slug: 'permis-moto' },
  { libelle: 'Lieux', slug: 'lieux' },
  { libelle: 'Divers', slug: 'divers' },
]

export const estTheme = (slug: string | undefined): slug is string =>
  Boolean(slug) && THEMES.some((t) => t.slug === slug)
