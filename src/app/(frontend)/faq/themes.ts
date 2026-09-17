/**
 * Regroupement des questions par thème.
 *
 * Les intitulés sont rapprochés par mots-clés plutôt que par une liste figée :
 * la FAQ se modifie depuis le back-office, et une correspondance question par
 * question se serait périmée à la première reformulation.
 *
 * Le dernier thème n'a pas de motif : il recueille tout ce qui n'entre nulle
 * part. Une question mal classée reste visible — c'est une question perdue qui
 * serait grave, pas une question rangée au mauvais endroit.
 */
export type Theme = { cle: string; titre: string; motif?: RegExp }

export const THEMES: Theme[] = [
  {
    cle: 'confiance',
    titre: 'Commander en confiance',
    motif: /fiable|frauduleux|bancaire|s[ée]curis|paiement|avis v[ée]rifi/i,
  },
  {
    cle: 'tailles',
    titre: 'Tailles, retours et échanges',
    motif: /taille|retour|renvoy|[ée]change|occasion|neuf/i,
  },
  {
    cle: 'communaute',
    titre: 'La communauté',
    motif: /communaut|femme|homme|identit[ée]|peur|ose|d[ée]buter/i,
  },
  { cle: 'pratique', titre: 'Questions pratiques' },
]
