import * as migration_20260824_092635_initial from './20260824_092635_initial';
import * as migration_20260824_115956_ajout_blocs_da from './20260824_115956_ajout_blocs_da';
import * as migration_20260825_111621_entete_et_slider from './20260825_111621_entete_et_slider';
import * as migration_20260825_142134_pied_de_page from './20260825_142134_pied_de_page';

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
    name: '20260825_142134_pied_de_page'
  },
];
