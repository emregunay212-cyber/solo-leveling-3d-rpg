/**
 * Dungeon sistemi tip tanimlari.
 * Dungeon rank'lari, oyuncu rank'lari ve odul yapisi burada tanimlanir.
 */

export type DungeonRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type PlayerRank = 'none' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface DungeonRewards {
  readonly xp: number;
  readonly gold: number;
  readonly items: readonly string[];
}
