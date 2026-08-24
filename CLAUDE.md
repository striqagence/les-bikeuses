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

- Base chic **noir/blanc** + **magenta signature** (`#E01B69` clair /
  `#FF4D8B` sombre). Tokens de couleur dans
  `src/app/(frontend)/globals.css` (thème clair et sombre).
- Typo : **Fraunces** (titres) × **Manrope** (texte), via `next/font`
  (`src/app/(frontend)/layout.tsx`).
- Logo officiel dans `public/logo-bikeuses.svg` (adaptatif, `currentColor`) et
  `public/logo-bikeuses-blanc.svg` ; composant `src/components/Logo/Logo.tsx`.

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

- [ ] Page d'accueil de marque (hero « Façonnez votre style en toute sécurité »,
      mise en avant produits) — via contenu admin ou composant sur-mesure.
- [ ] Restyler hero + cartes produit aux couleurs de la direction artistique.
- [ ] Renseigner les variables S3 Supabase pour la persistance des médias.
- [ ] Importer les produits depuis l'ancien WooCommerce (export CSV → Produits).
- [ ] Phase e-commerce : panier, commandes, paiement (Stripe).

## Conventions

- Développement sur `main` (branche déployée par Vercel).
- Après un changement de schéma Payload → migration + commit.
- Ne jamais committer de secrets (`.env` est ignoré).
