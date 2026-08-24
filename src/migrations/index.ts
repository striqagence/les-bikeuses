import * as migration_20260824_092635_initial from './20260824_092635_initial';
import * as migration_20260824_115956_ajout_blocs_da from './20260824_115956_ajout_blocs_da';

export const migrations = [
  {
    up: migration_20260824_092635_initial.up,
    down: migration_20260824_092635_initial.down,
    name: '20260824_092635_initial',
  },
  {
    up: migration_20260824_115956_ajout_blocs_da.up,
    down: migration_20260824_115956_ajout_blocs_da.down,
    name: '20260824_115956_ajout_blocs_da'
  },
];
