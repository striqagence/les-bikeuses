# Les Bikeuses — code du site WordPress / WooCommerce

Dépôt Git du **code custom** du site *Les Bikeuses*, basé sur le thème
**Flatsome** avec un **thème enfant** (`flatsome-child`).

L'objectif : pouvoir **versionner et personnaliser le design** proprement,
sans toucher au thème parent (qui est mis à jour par son éditeur) ni au reste
de l'installation WordPress.

## Ce qui est versionné (et ce qui ne l'est pas)

| Suivi dans Git ✅ | Volontairement exclu ❌ |
|---|---|
| Le thème enfant `flatsome-child` (CSS, PHP, templates) | Le cœur de WordPress |
| | Le thème parent `flatsome` (commercial, mis à jour par l'éditeur) |
| | Les plugins tiers |
| | Les médias `wp-content/uploads` (photos, images produits…) |
| | La base de données |
| | Les secrets (`wp-config.php`, `.env`) |

> ⚠️ **Important — où vit ton design actuel ?**
> Sur Flatsome, une grande partie de la personnalisation est stockée **en base
> de données**, pas dans les fichiers du thème :
> - le contenu construit avec **UX Builder** ;
> - le **Custom CSS** de *Flatsome → Advanced → Custom CSS* et du Customizer.
>
> Ce code-là n'est donc pas dans ce dépôt. En revanche, le thème enfant est le
> bon endroit pour **écrire les nouvelles personnalisations** — c'est la
> méthode propre et pérenne. Pour rapatrier ton Custom CSS existant dans Git,
> il suffit de copier son contenu dans
> `wp-content/themes/flatsome-child/style.css`.

## Structure du dépôt

```
.
├── .gitignore
├── README.md
└── wp-content/
    └── themes/
        └── flatsome-child/
            ├── functions.php
            ├── style.css
            └── screenshot.png
```

## Déployer les modifications sur le site

Le thème enfant se trouve, sur le serveur, dans :
`wp-content/themes/flatsome-child/`

Deux options pour mettre à jour le site après une modification :

1. **Via FTP/SFTP** — téléverser les fichiers modifiés du dossier
   `flatsome-child` dans le dossier correspondant du serveur.
2. **Via Git sur le serveur** (si l'hébergeur le permet) — cloner ce dépôt puis
   faire un `git pull` directement dans le dossier du thème enfant.

> Toujours tester une modification sur un environnement de préproduction avant
> la production quand c'est possible.

## Workflow de personnalisation

1. On décrit la modification de design souhaitée.
2. Les changements sont faits dans `flatsome-child` (CSS et/ou PHP).
3. On commit et on pousse sur la branche de travail.
4. On déploie sur le site (FTP ou Git) et on vérifie le rendu.
