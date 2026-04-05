/**
 * Dungeon rank tanimlari.
 * Her rank icin hangi dusmanlar cikar, boss tipleri, stat carpanlari ve UI renkleri.
 */

import type { DungeonRank } from './types';

export interface DungeonRankDef {
  readonly rank: DungeonRank;
  readonly name: string;
  readonly enemyTypes: readonly string[];
  readonly bossType: string;
  readonly color: string;
}

/**
 * Her dungeon rank'i icin sabit tanimlar.
 * enemyTypes: ENEMY_DEFS'teki key'ler
 * bossType: dungeonBosses'taki key'ler
 * color: UI'da rank gosterimi icin hex renk
 */
export const DUNGEON_RANK_DEFS: Record<DungeonRank, DungeonRankDef> = {
  E: {
    rank: 'E',
    name: 'E-Rank Gate',
    enemyTypes: ['goblin', 'wolf'],
    bossType: 'goblin_king',
    color: '#4ade80',
  },
  D: {
    rank: 'D',
    name: 'D-Rank Gate',
    enemyTypes: ['skeleton', 'wolf', 'orc'],
    bossType: 'skeleton_lord',
    color: '#60a5fa',
  },
  C: {
    rank: 'C',
    name: 'C-Rank Gate',
    enemyTypes: ['orc', 'skeleton', 'darkKnight'],
    bossType: 'orc_warlord',
    color: '#a855f7',
  },
  B: {
    rank: 'B',
    name: 'B-Rank Gate',
    enemyTypes: ['darkKnight', 'demon', 'orc'],
    bossType: 'dark_archmage',
    color: '#f59e0b',
  },
  A: {
    rank: 'A',
    name: 'A-Rank Gate',
    enemyTypes: ['demon', 'darkKnight'],
    bossType: 'demon_lord',
    color: '#ef4444',
  },
  S: {
    rank: 'S',
    name: 'S-Rank Gate',
    enemyTypes: ['demon', 'darkKnight', 'orc', 'skeleton'],
    bossType: 'shadow_monarch',
    color: '#ec4899',
  },
};
