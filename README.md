# Les Bikeuses — site Payload + Next.js

Nouveau site **Les Bikeuses**, reconstruit en **headless** :

- **Back-office & API : [Payload 3](https://payloadcms.com)** (intégré à Next.js)
- **Front : [Next.js 16](https://nextjs.org)** (App Router, React 19)
- **Base de données : PostgreSQL** hébergée sur **[Supabase](https://supabase.com)**

> Migration depuis l'ancien site WordPress/WooCommerce (thème Flatsome).
> On démarre volontairement sur un périmètre simple — **vitrine + blog +
> catalogue produits** — la partie **e-commerce** (panier, commandes, paiement)
> sera ajoutée dans un second temps.

## Ce que contient le site aujourd'hui

| Fonctionnalité | Statut |
|---|---|
| Pages vitrine (constructeur de blocs) | ✅ inclus (template) |
| Blog / actualités (collection *Posts*) | ✅ inclus (template) |
| **Catalogue produits** (collection *Produits*) | ✅ ajouté (catalogue seul, sans vente) |
| Médias, catégories, SEO, redirections, formulaires, recherche | ✅ inclus (template) |
| Prévisualisation en direct (live preview) & brouillons | ✅ inclus (template) |
| Panier / commandes / paiement | ⏳ à venir (phase e-commerce) |

La collection **Produits** (`src/collections/Products.ts`) contient : nom,
référence (SKU), prix indicatif, accroche, description, galerie d'images,
catégories et mise en avant. Le prix est **indicatif** pour l'instant — la
vente en ligne sera branchée plus tard.

## Prérequis

- **Node.js ≥ 20.9** (testé avec Node 22)
- **pnpm** (`corepack enable` puis `pnpm`)
- Un projet **Supabase** (pour la base PostgreSQL)

## Démarrage

1. **Installer les dépendances**
   ```bash
   pnpm install --ignore-workspace
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   ```
   Puis remplir `.env` — voir la section Supabase ci-dessous.

3. **Lancer le serveur de développement**
   ```bash
   pnpm dev
   ```
   - Front : http://localhost:3000
   - Back-office : http://localhost:3000/admin

Au premier lancement, le back-office propose de créer le premier compte
administrateur, puis d'insérer des données de démonstration (bouton « seed »).

## Connexion à Supabase

Dans le tableau de bord Supabase : **Project Settings → Database →
Connection string**. Deux formats sont possibles (détaillés dans
`.env.example`) :

- **Connexion directe** (port `5432`) — recommandée en local et pour les
  migrations Payload.
- **Connexion via le pooler** (port `6543`) — à utiliser en production
  serverless (ex. Vercel).

Renseigner cette chaîne dans `DATABASE_URL`, et générer les secrets
(`PAYLOAD_SECRET`, etc.) avec par exemple `openssl rand -base64 32`.

> ⚠️ Le fichier `.env` contient des secrets : il est ignoré par Git et ne doit
> **jamais** être commité.

## Base de données & migrations

L'adaptateur PostgreSQL de Payload crée/maintient automatiquement le schéma en
développement. Pour la production, on utilisera les migrations :

```bash
pnpm payload migrate:create   # générer une migration
pnpm payload migrate          # appliquer les migrations
```

## Scripts utiles

| Commande | Rôle |
|---|---|
| `pnpm dev` | Serveur de développement (front + admin) |
| `pnpm build` | Build de production |
| `pnpm start` | Lancer le build de production |
| `pnpm generate:types` | Régénérer `src/payload-types.ts` |
| `pnpm lint` | Analyse ESLint |

## Structure du projet

```
src/
├── app/
│   ├── (frontend)/     ← le site public (Next.js)
│   └── (payload)/      ← le back-office Payload (/admin)
├── collections/        ← Pages, Posts, Products, Media, Categories, Users
├── blocks/             ← blocs du constructeur de pages
├── heros/              ← en-têtes de pages
├── Header/ Footer/     ← navigation globale
├── plugins/            ← SEO, redirections, recherche, formulaires…
└── payload.config.ts   ← configuration centrale de Payload
```

## Déploiement

Cible recommandée : **Vercel** (Next.js + Payload), avec la base **Supabase**.
Penser à définir les variables d'environnement (`DATABASE_URL` via le pooler,
`PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `CRON_SECRET`, `PREVIEW_SECRET`)
dans le projet Vercel.

## Prochaines étapes

- [ ] Brancher une base Supabase réelle et faire tourner le site
- [ ] Habillage graphique aux couleurs de « Les Bikeuses »
- [ ] Importer les produits depuis l'ancien WooCommerce (export CSV → Produits)
- [ ] Phase e-commerce : panier, commandes, paiement (Stripe)
