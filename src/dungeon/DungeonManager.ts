/**
 * Dungeon durumu yoneticisi.
 * Dusman takibi, boss tetikleme, tamamlanma algilama ve odul hesaplama.
 */

import { DUNGEON } from '../config/GameConfig';
import { DUNGEON_RANK_DEFS } from './DungeonDefs';
import { DUNGEON_BOSS_DEFS } from '../data/dungeonBosses';
import { ENEMY_DEFS } from '../data/enemies';
import { eventBus } from '../core/EventBus';
import type { DungeonRank, DungeonRewards } from './types';
import type { Enemy, EnemyDef } from '../enemies/Enemy';

/** Dungeon'daki dusman tipi ve sayisi bilgisi */
export interface DungeonEnemyEntry {
  readonly typeKey: string;
  readonly def: EnemyDef;
  readonly count: number;
}

/** Boss bilgisi */
export interface DungeonBossEntry {
  readonly typeKey: string;
  readonly def: EnemyDef;
}

/**
 * Dungeon run'i icin tum state'i yonetir.
 * Dusman olumu takibi, boss spawn kosulu, odul hesaplama, olum cezasi.
 */
export class DungeonManager {
  private readonly rank: DungeonRank;
  private enemies: Enemy[] = [];
  private boss: Enemy | null = null;
  private bossSpawned = false;
  private completed = false;
  private dungeonXp = 0;
  private dungeonGold = 0;
  private dungeonItems: string[] = [];

  constructor(rank: DungeonRank) {
    this.rank = rank;
  }

  /** Bu rank icin dusman tiplerini stat carpaniyla olceklendir */
  getEnemyDefs(): DungeonEnemyEntry[] {
    const rankDef = DUNGEON_RANK_DEFS[this.rank];
    const multiplier = DUNGEON.statMultiplier[this.rank];
    const totalEnemies = DUNGEON.enemyCount[this.rank];
    const types = rankDef.enemyTypes;
    const perType = Math.ceil(totalEnemies / types.length);

    const entries: DungeonEnemyEntry[] = [];

    for (const typeKey of types) {
      const baseDef = ENEMY_DEFS[typeKey];
      if (!baseDef) continue;

      const scaledDef: EnemyDef = {
        ...baseDef,
        hp: Math.round(baseDef.hp * multiplier),
        damage: Math.round(baseDef.damage * multiplier),
        defense: Math.round((baseDef.defense ?? 0) * multiplier),
        xpReward: Math.round(baseDef.xpReward * DUNGEON.rewards.xpMultiplier[this.rank]),
        goldReward: Math.round(baseDef.goldReward * DUNGEON.rewards.goldMultiplier[this.rank]),
      };

      entries.push({ typeKey, def: scaledDef, count: perType });
    }

    return entries;
  }

  /** Bu rank icin boss tanimini dondur (olceklenmis) */
  getBossDef(): DungeonBossEntry | null {
    const rankDef = DUNGEON_RANK_DEFS[this.rank];
    const bossDef = DUNGEON_BOSS_DEFS[rankDef.bossType];
    if (!bossDef) return null;

    const multiplier = DUNGEON.statMultiplier[this.rank];
    return {
      typeKey: rankDef.bossType,
      def: {
        ...bossDef,
        hp: Math.round(bossDef.hp * multiplier * DUNGEON.bossHpMultiplier),
        damage: Math.round(bossDef.damage * multiplier * DUNGEON.bossDamageMultiplier),
        defense: Math.round((bossDef.defense ?? 0) * multiplier * 2),
      },
    };
  }

  /** DungeonScene tarafindan dusman spawn sonrasi cagrilir */
  registerEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  registerBoss(boss: Enemy): void {
    this.boss = boss;
    this.bossSpawned = true;
  }

  // ─── Odul Takibi ───

  addXp(amount: number): void { this.dungeonXp += amount; }
  addGold(amount: number): void { this.dungeonGold += amount; }
  addItem(itemId: string): void { this.dungeonItems = [...this.dungeonItems, itemId]; }

  // ─── Boss / Tamamlanma Kontrolleri ───

  /** Normal dusmanlar oldu mu? Boss spawn edilmeli mi? */
  checkBossCondition(): boolean {
    if (this.bossSpawned) return false;
    if (this.enemies.length === 0) return false;

    const alive = this.enemies.filter(e => e.isAlive()).length;
    if (alive === 0) {
      eventBus.emit('dungeon:waveCleared', { remaining: 0 });
      return true;
    }
    return false;
  }

  /** Boss oldu mu? Dungeon tamamlandi mi? */
  checkCompletion(): boolean {
    if (this.completed) return false;
    if (this.bossSpawned && this.boss && !this.boss.isAlive()) {
      this.completed = true;
      return true;
    }
    return false;
  }

  getRemainingEnemies(): number {
    return this.enemies.filter(e => e.isAlive()).length;
  }

  isBossPhase(): boolean { return this.bossSpawned; }
  isCompleted(): boolean { return this.completed; }
  getRank(): DungeonRank { return this.rank; }

  /** Dungeon odullerini hesapla */
  getRewards(): DungeonRewards {
    return {
      xp: this.dungeonXp,
      gold: this.dungeonGold,
      items: [...this.dungeonItems],
    };
  }

  /** Dungeon ici olum cezasi — XP ve item kaybi */
  applyDeathPenalty(): { xpLost: number; itemsLost: string[] } {
    const xpLost = Math.round(this.dungeonXp * DUNGEON.deathPenalty.xpLossPercent);
    this.dungeonXp = Math.max(0, this.dungeonXp - xpLost);

    const itemsLost: string[] = [];
    // Sondan basa iterasyon — splice guvenli
    for (let i = this.dungeonItems.length - 1; i >= 0; i--) {
      if (Math.random() < DUNGEON.deathPenalty.itemLossChance) {
        itemsLost.push(...this.dungeonItems.splice(i, 1));
      }
    }

    return { xpLost, itemsLost };
  }

  /** Sehir respawn = tum dungeon odulleri kaybolur */
  applyCityRespawnPenalty(): void {
    this.dungeonXp = 0;
    this.dungeonGold = 0;
    this.dungeonItems = [];
  }
}
