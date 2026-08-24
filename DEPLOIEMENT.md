# Déploiement — Préproduction Vercel + Supabase

Guide pas-à-pas pour mettre le site en **préproduction** sur Vercel, avec la
base et le stockage sur **Supabase**. La configuration est pensée pour que le
**passage en production** ne demande **aucune modification de code** — juste une
variable d'environnement à ajuster.

> Les identifiants (mots de passe, clés) ne doivent jamais être commités.
> Ils se saisissent uniquement dans Supabase et dans les variables Vercel.

---

## Vue d'ensemble

| Brique | Service | Rôle |
|---|---|---|
| Base de données | **Supabase** (PostgreSQL) | Contenu : pages, articles, produits… |
| Stockage médias | **Supabase Storage** (S3) | Images produits, médias |
| Hébergement | **Vercel** | Le site Next.js + le back-office Payload |

---

## Étape 1 — Supabase

1. Créer un projet Supabase (ou réutiliser le vôtre). Noter la **référence du
   projet** (`[REF_PROJET]`) et le **mot de passe** de la base.

2. **Chaîne de connexion** — bouton **« Connect »** :
   - ⚠️ La **connexion directe** (`db.[REF_PROJET].supabase.co`) est en **IPv6
     uniquement** → **inutilisable depuis Vercel** (IPv4). On ne l'utilise pas.
   - ✅ Utiliser le **Session pooler** (IPv4), qui gère aussi bien les
     **migrations** que le trafic du site. C'est la valeur à mettre dans
     `DATABASE_URL`. Format :
     `postgresql://postgres.[REF_PROJET]:[MDP]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
   - (Le *Transaction pooler*, port `6543`, est réservé à la très forte charge
     et peut casser les migrations Payload — on ne l'utilise pas ici.)

3. **Stockage** — *Storage* → créer un bucket (ex. `media`, en **public**).
   Puis *Project Settings → Storage → S3 Connection* : relever l'**endpoint**
   (`https://[REF_PROJET].supabase.co/storage/v1/s3`) et la **région**, et
   générer une paire de **clés S3** (access key / secret).

---

## Étape 2 — Le schéma de la base (automatique)

**Rien à faire manuellement.** Le schéma est géré par des **migrations
Payload** (dossier `src/migrations/`, déjà committées). Le script `build`
exécute `payload migrate` **avant** `next build` : à chaque déploiement Vercel,
les tables sont créées / mises à jour automatiquement sur Supabase.

> Quand on ajoutera des champs ou collections plus tard, on générera une
> nouvelle migration avec `pnpm payload migrate:create <nom>` (contre une base
> Postgres), on la committe, et elle s'appliquera au prochain déploiement.

---

## Étape 3 — Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le
   dépôt GitHub `striqagence/les-bikeuses`.

2. **Branche** : déployer la branche de préproduction
   (`claude/wordpress-woocommerce-git-import-pgkp1n` pour l'instant).
   Framework détecté : **Next.js** (laisser les réglages par défaut).

3. **Variables d'environnement** (Settings → Environment Variables) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | La connexion **Session pooler** (IPv4, port 5432) |
   | `PAYLOAD_SECRET` | Une valeur aléatoire (`openssl rand -base64 32`) |
   | `NEXT_PUBLIC_SERVER_URL` | L'URL de préprod (voir étape 4) |
   | `CRON_SECRET` | Une valeur aléatoire |
   | `PREVIEW_SECRET` | Une valeur aléatoire |
   | `S3_BUCKET` | `media` |
   | `S3_REGION` | La région Supabase (ex. `eu-west-3`) |
   | `S3_ENDPOINT` | `https://[REF_PROJET].supabase.co/storage/v1/s3` |
   | `S3_ACCESS_KEY_ID` | La clé S3 Supabase |
   | `S3_SECRET_ACCESS_KEY` | Le secret S3 Supabase |

4. **Déployer**. Vercel build et publie le site.

---

## Étape 4 — L'URL de préproduction

Au premier déploiement, Vercel attribue une URL du type
`les-bikeuses-xxxx.vercel.app`. Pour une adresse de préprod plus parlante :

- **Option simple** : renommer le projet Vercel en `preproduction-lesbikeuses`
  → l'URL devient `preproduction-lesbikeuses.vercel.app`.
- **Option sous-domaine** : ajouter un domaine
  `preprod.lesbikeuses.fr` (Settings → Domains) et pointer un CNAME chez votre
  hébergeur DNS.

Une fois l'URL connue, la renseigner dans `NEXT_PUBLIC_SERVER_URL` puis
**redéployer** (cette variable est intégrée au build).

---

## Étape 5 — Passage en production (plus tard)

Grâce à la configuration en place, **le code ne change pas**. Tout passe par
les variables d'environnement :

1. Ajouter le domaine définitif (`lesbikeuses.fr`) sur le projet Vercel de
   production.
2. Mettre `NEXT_PUBLIC_SERVER_URL=https://lesbikeuses.fr`.
3. Redéployer.

C'est la **seule** URL à « remplacer » — et c'est une variable, pas du code.
Les liens canoniques, le sitemap, le CORS et les images s'y adaptent
automatiquement (voir `src/utilities/getURL.ts`).

> Recommandation : garder **deux projets Vercel** (préprod et prod) branchés
> sur la même base de code mais avec **deux bases Supabase distinctes**, pour
> ne jamais tester sur les vraies données.

---

## Récapitulatif des variables

Voir `.env.example` pour la liste complète et commentée. En bref :

- **Base** : `DATABASE_URL`
- **Sécurité** : `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`
- **URL publique** : `NEXT_PUBLIC_SERVER_URL`
- **Stockage médias** : `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`,
  `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
