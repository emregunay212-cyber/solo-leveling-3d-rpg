/**
 * Golge Gelistirme Sistemi - Tip Tanimlari
 * Yetenek kitaplari, rutbe ve envanter tipleri.
 * Ekipman sistemi kaldirildi — golgeler oyuncu statlarindan yuzde kopyalar.
 */

// ─── YETENEK KITAPLARI ───

export type ShadowSkillType = 'passive' | 'active';

export type ShadowSkillTrigger =
  | 'onAttack'
  | 'onTakeDamage'
  | 'onKill'
  | 'periodic'
  | 'manual';

/** Stat buff tipleri — ekipman bagimsiz, skill efektleri icin */
export interface SkillStatBuff {
  readonly bonusDamagePercent?: number;
  readonly bonusDefense?: number;
  readonly bonusBlockChance?: number;
  readonly bonusAttackSpeed?: number;
  readonly bonusMoveSpeed?: number;
}

export interface ShadowSkillEffect {
  readonly damageMultiplier?: number;
  readonly healPercent?: number;
  readonly aoeRadius?: number;
  readonly durationSeconds?: number;
  readonly statBuff?: Partial<SkillStatBuff>;
  readonly forceTaunt?: boolean;
  readonly teleportBehind?: boolean;
}

export interface ShadowSkillDef {
  readonly id: string;
  readonly name: string;
  readonly type: ShadowSkillType;
  readonly trigger: ShadowSkillTrigger;
  readonly description: string;
  readonly cooldown: number;
  readonly requiredLevel: number;
  readonly effect: ShadowSkillEffect;
  readonly buyPrice: number;
  readonly sellPrice: number;
}

// ─── RUTBE SISTEMI ───

export type ShadowRank = 'soldier' | 'knight' | 'elite' | 'commander';

export interface ShadowRankDef {
  readonly rank: ShadowRank;
  readonly name: string;
  readonly requiredKills: number;
  readonly statPercent: number;
}

// ─── GOLGE PROFILI (kalici kimlik) ───

export interface ShadowProfile {
  readonly uid: number;
  readonly enemyDefId: string;
  readonly nickname: string;
  readonly rank: ShadowRank;
  readonly kills: number;
  readonly isBoss: boolean;
  readonly shadowSkillIds: readonly string[];
  readonly hpPercent: number;
}

// ─── OYUNCU STATLARI (golge stat hesaplamasi icin) ───

export interface PlayerStats {
  readonly str: number;
  readonly vit: number;
  readonly agi: number;
  readonly int: number;
}

// ─── HESAPLANMIS NIHAI STATLAR ───

export interface ShadowFinalStats {
  readonly maxHp: number;
  readonly damage: number;
  readonly defense: number;
  readonly blockChance: number;
  readonly attackCooldown: number;
  readonly chaseSpeed: number;
  readonly patrolSpeed: number;
}

// ─── ENVANTER ───

export interface InventoryItem {
  readonly id: string;
  readonly type: 'skillbook';
  readonly count: number;
}

// ─── DROP TABLOSU ───

export interface DropEntry {
  readonly itemId: string;
  readonly itemType: 'skillbook';
  readonly chance: number;   // 0-1 arasi olasilik
  readonly minLevel: number;
}
