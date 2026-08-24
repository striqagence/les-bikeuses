import * as migration_20260824_092635_initial from './20260824_092635_initial';

export const migrations = [
  {
    up: migration_20260824_092635_initial.up,
    down: migration_20260824_092635_initial.down,
    name: '20260824_092635_initial'
  },
];
