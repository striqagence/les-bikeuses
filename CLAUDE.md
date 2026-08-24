# Contexte projet — Les Bikeuses

Site e-commerce **Les Bikeuses** (équipement moto **pour femmes / motardes**),
reconstruit en **headless** depuis un ancien WordPress/WooCommerce (thème
Flatsome).

## Stack

- **Payload 3** (back-office + API) intégré à **Next.js 16** (App Router, React 19)
- **PostgreSQL** hébergé sur **Supabase**
- **Stockage médias** : Supabase Storage (compatible S3), via `@payloadcms/storage-s3`
- **Hébergement** : Vercel — prod live : https://les-bikeuses.vercel.app
- Gestionnaire de paquets : **pnpm** (`pnpm install --ignore-workspace`)

## Périmètre actuel

Vitrine + **blog** (collection `posts`) + **catalogue produits** (collection
`products`, sans panier/paiement pour l'instant). L'e-commerce (panier,
commandes, paiement) viendra plus tard.

## Commandes utiles

```bash
pnpm install --ignore-workspace   # installer
pnpm dev                          # dev local (front + /admin)
pnpm build                        # build prod (lance `payload migrate` puis `next build`)
pnpm generate:types               # régénérer src/payload-types.ts
pnpm payload migrate:create <nom> # créer une migration après un changement de schéma
```

> ⚠️ Après toute modification de collection/champ Payload, générer une migration
> (`pnpm payload migrate:create`) contre une base Postgres et la committer : le
> build Vercel applique les migrations automatiquement (`src/migrations/`).

## Base de données (Supabase)

- La **connexion directe** Supabase est en **IPv6 uniquement** → inutilisable
  depuis Vercel. Utiliser le **Session pooler** (IPv4, port 5432) pour
  `DATABASE_URL`.
- Variables d'environnement : voir `.env.example`. Guide complet :
  `DEPLOIEMENT.md`.
- Le schéma est géré par migrations Payload (`src/migrations/`).

## Direction artistique (validée)

Concept **« fiche d'équipement »** : l'équipement moto se lit comme une fiche
technique (niveau CE, matière, saison, plage de tailles), et la DA fait de
cette rigueur son parti pris. Tokens dans `src/app/(frontend)/globals.css`
(thème clair et sombre).

- **Accent orange**, en deux valeurs à ne pas confondre :
  - `--primary` `#C43D10` (clair) / `#FF8A4C` (sombre) — texte, filets, liens.
    Contraste 5.2:1 sur papier, seul niveau sûr pour les labels mono à 11 px.
  - `--brand-bright` `#EE5B16` / `#FF9E6B` — aplats et fonds sombres
    **uniquement** (3.6:1 sur papier, insuffisant pour du petit texte).
- **Neutres froids** (papier `#F7F6F4`, encre asphalte `#16151A`) :
  volontairement pas de papier crème, l'orange doit rester la seule source de
  chaleur de la page.
- `--radius: 0` — angles vifs assumés, y compris sur les composants shadcn.
- Typo : **Fraunces** (titres, axes `SOFT`/`WONK`) × **Manrope** (texte/UI) ×
  **DM Mono** (données techniques : niveaux CE, matières, tailles, prix,
  dates), via `next/font` (`src/app/(frontend)/layout.tsx`).
- Primitives réutilisables (globals.css) : `mono-label` (déclarée en
  `@utility` pour rester applicable via `@apply`), `.eyebrow`, `.wonk`,
  `.route` (filet « marquage au sol »), `.heros-titre`.
- Logo officiel dans `public/logo-bikeuses.svg` (adaptatif, `currentColor`) et
  `public/logo-bikeuses-blanc.svg` ; composant `src/components/Logo/Logo.tsx`.

Maquette de référence de la page d'accueil :
https://claude.ai/code/artifact/daafa86f-80a5-4bd0-bf45-82fb6b9dfb45

## Structure

```
src/
├── app/(frontend)/     ← site public + globals.css (thème/couleurs/polices)
├── app/(payload)/      ← back-office /admin
├── collections/        ← Pages, Posts, Products, Media, Categories, Users
├── blocks/ heros/      ← blocs du constructeur de pages / en-têtes
├── Header/ Footer/     ← navigation globale (logo)
├── plugins/            ← SEO, redirections, recherche, formulaires, stockage S3
├── migrations/         ← migrations de base (appliquées au build)
└── payload.config.ts   ← config centrale Payload
```

## Prochaines étapes possibles

- [x] Restyler le héros aux couleurs de la DA — `heros/HighImpact` est passé en
      grille éditoriale deux colonnes (sur-titre, visuels secondaires, preuves
      chiffrées, bandeau défilant).
- [x] Blocs de la page d'accueil : `Parcours`, `IndexCategories`, `Debuter`,
      `Journal` (`src/blocks/`), disponibles dans le constructeur de Pages.
- [ ] **Saisir le contenu de la home** dans l'admin : les blocs existent, la
      page d'accueil n'est pas encore montée avec. Le seed
      (`src/endpoints/seed`) génère toujours l'ancienne home.
- [ ] Restyler les cartes produit (bandeau de specs en mono : niveau CE,
      matière, saison, plage de tailles).
- [ ] Renseigner les variables S3 Supabase pour la persistance des médias.
- [ ] Importer les produits depuis l'ancien WooCommerce (export CSV → Produits).
- [ ] Phase e-commerce : panier, commandes, paiement (Stripe).

## Conventions

- Développement sur `main` (branche déployée par Vercel).
- Après un changement de schéma Payload → migration + commit.
- Ne jamais committer de secrets (`.env` est ignoré).
