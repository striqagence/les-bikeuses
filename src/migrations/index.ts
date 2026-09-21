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
import * as migration_20260907_170000_debuter_la_moto from './20260907_170000_debuter_la_moto';
import * as migration_20260914_090000_liens_internes from './20260914_090000_liens_internes';
import * as migration_20260914_110000_liens_du_heros from './20260914_110000_liens_du_heros';
import * as migration_20260914_140000_sous_rayons from './20260914_140000_sous_rayons';
import * as migration_20260914_160000_apprendre_la_moto from './20260914_160000_apprendre_la_moto';
import * as migration_20260914_180000_marques_et_programme from './20260914_180000_marques_et_programme';
import * as migration_20260914_200000_images_des_articles from './20260914_200000_images_des_articles';
import * as migration_20260914_220000_images_oubliees from './20260914_220000_images_oubliees';
import * as migration_20260915_090000_articles_a_carrousels from './20260915_090000_articles_a_carrousels';
import * as migration_20260915_102919_variantes_produits from './20260915_102919_variantes_produits';
import * as migration_20260915_110000_titres_manquants from './20260915_110000_titres_manquants';
import * as migration_20260915_112707_commandes from './20260915_112707_commandes';
import * as migration_20260915_120000_variantes from './20260915_120000_variantes';
import * as migration_20260915_140000_titres_et_rayons from './20260915_140000_titres_et_rayons';
import * as migration_20260916_063404_retrait_preuves from './20260916_063404_retrait_preuves';
import * as migration_20260917_090000_retrait_contact from './20260917_090000_retrait_contact';
import * as migration_20260917_140000_visuels_accueil from './20260917_140000_visuels_accueil';
import * as migration_20260918_090000_formulaire_contact from './20260918_090000_formulaire_contact';
import * as migration_20260918_110000_titre_contact from './20260918_110000_titre_contact';
import * as migration_20260921_090000_themes_du_journal from './20260921_090000_themes_du_journal';
import * as migration_20260921_120000_emojis_en_images from './20260921_120000_emojis_en_images';
import * as migration_20260921_150000_widget_articles_lies from './20260921_150000_widget_articles_lies';
import * as migration_20260921_170000_resumes_pollues from './20260921_170000_resumes_pollues';
import * as migration_20260921_183000_resumes_restants from './20260921_183000_resumes_restants';
import * as migration_20260921_200000_meme_onglet from './20260921_200000_meme_onglet';

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
  {
    up: migration_20260907_170000_debuter_la_moto.up,
    down: migration_20260907_170000_debuter_la_moto.down,
    name: '20260907_170000_debuter_la_moto',
  },
  {
    up: migration_20260914_090000_liens_internes.up,
    down: migration_20260914_090000_liens_internes.down,
    name: '20260914_090000_liens_internes',
  },
  {
    up: migration_20260914_110000_liens_du_heros.up,
    down: migration_20260914_110000_liens_du_heros.down,
    name: '20260914_110000_liens_du_heros',
  },
  {
    up: migration_20260914_140000_sous_rayons.up,
    down: migration_20260914_140000_sous_rayons.down,
    name: '20260914_140000_sous_rayons',
  },
  {
    up: migration_20260914_160000_apprendre_la_moto.up,
    down: migration_20260914_160000_apprendre_la_moto.down,
    name: '20260914_160000_apprendre_la_moto',
  },
  {
    up: migration_20260914_180000_marques_et_programme.up,
    down: migration_20260914_180000_marques_et_programme.down,
    name: '20260914_180000_marques_et_programme',
  },
  {
    up: migration_20260914_200000_images_des_articles.up,
    down: migration_20260914_200000_images_des_articles.down,
    name: '20260914_200000_images_des_articles',
  },
  {
    up: migration_20260914_220000_images_oubliees.up,
    down: migration_20260914_220000_images_oubliees.down,
    name: '20260914_220000_images_oubliees',
  },
  {
    up: migration_20260915_090000_articles_a_carrousels.up,
    down: migration_20260915_090000_articles_a_carrousels.down,
    name: '20260915_090000_articles_a_carrousels',
  },
  {
    up: migration_20260915_102919_variantes_produits.up,
    down: migration_20260915_102919_variantes_produits.down,
    name: '20260915_102919_variantes_produits',
  },
  {
    up: migration_20260915_110000_titres_manquants.up,
    down: migration_20260915_110000_titres_manquants.down,
    name: '20260915_110000_titres_manquants',
  },
  {
    up: migration_20260915_112707_commandes.up,
    down: migration_20260915_112707_commandes.down,
    name: '20260915_112707_commandes',
  },
  {
    up: migration_20260915_120000_variantes.up,
    down: migration_20260915_120000_variantes.down,
    name: '20260915_120000_variantes',
  },
  {
    up: migration_20260915_140000_titres_et_rayons.up,
    down: migration_20260915_140000_titres_et_rayons.down,
    name: '20260915_140000_titres_et_rayons',
  },
  {
    up: migration_20260916_063404_retrait_preuves.up,
    down: migration_20260916_063404_retrait_preuves.down,
    name: '20260916_063404_retrait_preuves'
  },
  {
    up: migration_20260917_090000_retrait_contact.up,
    down: migration_20260917_090000_retrait_contact.down,
    name: '20260917_090000_retrait_contact',
  },
  {
    up: migration_20260917_140000_visuels_accueil.up,
    down: migration_20260917_140000_visuels_accueil.down,
    name: '20260917_140000_visuels_accueil',
  },
  {
    up: migration_20260918_090000_formulaire_contact.up,
    down: migration_20260918_090000_formulaire_contact.down,
    name: '20260918_090000_formulaire_contact',
  },
  {
    up: migration_20260918_110000_titre_contact.up,
    down: migration_20260918_110000_titre_contact.down,
    name: '20260918_110000_titre_contact',
  },
  {
    up: migration_20260921_090000_themes_du_journal.up,
    down: migration_20260921_090000_themes_du_journal.down,
    name: '20260921_090000_themes_du_journal',
  },
  {
    up: migration_20260921_120000_emojis_en_images.up,
    down: migration_20260921_120000_emojis_en_images.down,
    name: '20260921_120000_emojis_en_images',
  },
  {
    up: migration_20260921_150000_widget_articles_lies.up,
    down: migration_20260921_150000_widget_articles_lies.down,
    name: '20260921_150000_widget_articles_lies',
  },
  {
    up: migration_20260921_170000_resumes_pollues.up,
    down: migration_20260921_170000_resumes_pollues.down,
    name: '20260921_170000_resumes_pollues',
  },
  {
    up: migration_20260921_183000_resumes_restants.up,
    down: migration_20260921_183000_resumes_restants.down,
    name: '20260921_183000_resumes_restants',
  },
  {
    up: migration_20260921_200000_meme_onglet.up,
    down: migration_20260921_200000_meme_onglet.down,
    name: '20260921_200000_meme_onglet',
  },
];
