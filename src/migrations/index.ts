import * as migration_20260824_092635_initial from './20260824_092635_initial';
import * as migration_20260824_115956_ajout_blocs_da from './20260824_115956_ajout_blocs_da';
import * as migration_20260825_111621_entete_et_slider from './20260825_111621_entete_et_slider';
import * as migration_20260825_142134_pied_de_page from './20260825_142134_pied_de_page';
import * as migration_20260826_125509_essentiel_article from './20260826_125509_essentiel_article';
import * as migration_20260827_120740_carrousels_produits from './20260827_120740_carrousels_produits';
import * as migration_20260827_131338_catalogue from './20260827_131338_catalogue';
import * as migration_20260831_090000_navigation_interne from './20260831_090000_navigation_interne';
import * as migration_20260831_140000_pages_ressources from './20260831_140000_pages_ressources';
import * as migration_20260831_150000_avis_clients from './20260831_150000_avis_clients';
import * as migration_20260831_150100_fonds_decran from './20260831_150100_fonds_decran';
import * as migration_20260831_150200_avis_et_fonds from './20260831_150200_avis_et_fonds';
import * as migration_20260831_160000_rayon_des_avis from './20260831_160000_rayon_des_avis';
import * as migration_20260902_090000_dimensions_des_medias from './20260902_090000_dimensions_des_medias';
import * as migration_20260903_065158_alleger_declinaisons from './20260903_065158_alleger_declinaisons';

export const migrations = [
  {
    up: migration_20260824_092635_initial.up,
    down: migration_20260824_092635_initial.down,
    name: '20260824_092635_initial',
  },
  {
    up: migration_20260824_115956_ajout_blocs_da.up,
    down: migration_20260824_115956_ajout_blocs_da.down,
    name: '20260824_115956_ajout_blocs_da',
  },
  {
    up: migration_20260825_111621_entete_et_slider.up,
    down: migration_20260825_111621_entete_et_slider.down,
    name: '20260825_111621_entete_et_slider',
  },
  {
    up: migration_20260825_142134_pied_de_page.up,
    down: migration_20260825_142134_pied_de_page.down,
    name: '20260825_142134_pied_de_page',
  },
  {
    up: migration_20260826_125509_essentiel_article.up,
    down: migration_20260826_125509_essentiel_article.down,
    name: '20260826_125509_essentiel_article',
  },
  {
    up: migration_20260827_120740_carrousels_produits.up,
    down: migration_20260827_120740_carrousels_produits.down,
    name: '20260827_120740_carrousels_produits',
  },
  {
    up: migration_20260827_131338_catalogue.up,
    down: migration_20260827_131338_catalogue.down,
    name: '20260827_131338_catalogue',
  },
  {
    up: migration_20260831_090000_navigation_interne.up,
    down: migration_20260831_090000_navigation_interne.down,
    name: '20260831_090000_navigation_interne',
  },
  {
    up: migration_20260831_140000_pages_ressources.up,
    down: migration_20260831_140000_pages_ressources.down,
    name: '20260831_140000_pages_ressources',
  },
  {
    up: migration_20260831_150000_avis_clients.up,
    down: migration_20260831_150000_avis_clients.down,
    name: '20260831_150000_avis_clients',
  },
  {
    up: migration_20260831_150100_fonds_decran.up,
    down: migration_20260831_150100_fonds_decran.down,
    name: '20260831_150100_fonds_decran',
  },
  {
    up: migration_20260831_150200_avis_et_fonds.up,
    down: migration_20260831_150200_avis_et_fonds.down,
    name: '20260831_150200_avis_et_fonds',
  },
  {
    up: migration_20260831_160000_rayon_des_avis.up,
    down: migration_20260831_160000_rayon_des_avis.down,
    name: '20260831_160000_rayon_des_avis',
  },
  {
    up: migration_20260902_090000_dimensions_des_medias.up,
    down: migration_20260902_090000_dimensions_des_medias.down,
    name: '20260902_090000_dimensions_des_medias',
  },
  {
    up: migration_20260903_065158_alleger_declinaisons.up,
    down: migration_20260903_065158_alleger_declinaisons.down,
    name: '20260903_065158_alleger_declinaisons',
  },
];
