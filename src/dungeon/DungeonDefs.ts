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
    enemyTypes: ['goblin', 'wolf', 'giantRat', 'bat', 'snake'],
    bossType: 'goblin_king',
    color: '#4ade80',
  },
  D: {
    rank: 'D',
    name: 'D-Rank Gate',
    enemyTypes: ['skeleton', 'orc', 'giantSpider', 'stoneGolem', 'zombie'],
    bossType: 'skeleton_lord',
    color: '#60a5fa',
  },
  C: {
    rank: 'C',
    name: 'C-Rank Gate',
    enemyTypes: ['darkKnight', 'naga', 'iceBear', 'werewolf', 'darkElf'],
    bossType: 'orc_warlord',
    color: '#a855f7',
  },
  B: {
    rank: 'B',
    name: 'B-Rank Gate',
    enemyTypes: ['demon', 'deathKnight', 'giantCentipede', 'fireImp', 'highOrc'],
    bossType: 'dark_archmage',
    color: '#f59e0b',
  },
  A: {
    rank: 'A',
    name: 'A-Rank Gate',
    enemyTypes: ['iceElfKnight', 'cerberus', 'lich', 'drakeWarrior'],
    bossType: 'demon_lord',
    color: '#ef4444',
  },
  S: {
    rank: 'S',
    name: 'S-Rank Gate',
    enemyTypes: ['antKing', 'dragon', 'archDemon', 'shadowKnight'],
    bossType: 'shadow_monarch',
    color: '#ec4899',
  },
};

/**
 * Alternatif boss tanimlari — her rank icin gelecekte rastgele secim yapilabilir.
 * Simdlik birincil boss'lar kullaniliyor, bunlar DUNGEON_BOSS_DEFS'te mevcut.
 */
export const DUNGEON_ALT_BOSSES: Readonly<Record<DungeonRank, readonly string[]>> = {
  E: ['goblin_king', 'giant_rat_queen'],
  D: ['skeleton_lord', 'spider_queen'],
  C: ['orc_warlord', 'werewolf_alpha'],
  B: ['dark_archmage', 'death_knight_lord'],
  A: ['demon_lord', 'baruka'],
  S: ['shadow_monarch', 'kamish'],
} as const;
