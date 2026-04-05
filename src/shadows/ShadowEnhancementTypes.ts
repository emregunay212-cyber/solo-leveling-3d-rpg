/**
 * Golge Gelistirme Sistemi - Tip Tanimlari
 * Ekipman, yetenek kitaplari, rutbe ve envanter tipleri.
 */

// ─── EKIPMAN ───

export type EquipmentSlot = 'weapon' | 'shield' | 'armor';

export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EquipmentStats {
  readonly bonusDamage?: number;
  readonly bonusDamagePercent?: number;
  readonly bonusDefense?: number;
  readonly bonusBlockChance?: number;
  readonly bonusHp?: number;
  readonly bonusHpPercent?: number;
  readonly bonusAttackSpeed?: number;
  readonly bonusMoveSpeed?: number;
}

export interface EquipmentDef {
  readonly id: string;
  readonly name: string;
  readonly slot: EquipmentSlot;
  readonly rarity: EquipmentRarity;
  readonly requiredLevel: number;
  readonly stats: EquipmentStats;
  readonly description: string;
  readonly buyPrice: number;      // 0 = satin alinamaz
  readonly sellPrice: number;
}

// ─── YETENEK KITAPLARI ───

export type ShadowSkillType = 'passive' | 'active';

export type ShadowSkillTrigger =
  | 'onAttack'
  | 'onTakeDamage'
  | 'onKill'
  | 'periodic'
  | 'manual';

export interface ShadowSkillEffect {
  readonly damageMultiplier?: number;
  readonly healPercent?: number;
  readonly aoeRadius?: number;
  readonly durationSeconds?: number;
  readonly statBuff?: Partial<EquipmentStats>;
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
  readonly bonusHpPercent: number;
  readonly bonusDamagePercent: number;
  readonly bonusSpeedPercent: number;
  readonly bonusCooldownReduction: number;
}

// ─── GOLGE PROFILI (kalici kimlik) ───

export interface ShadowEquipment {
  readonly weapon: string | null;
  readonly shield: string | null;
  readonly armor: string | null;
}

export interface ShadowProfile {
  readonly uid: number;
  readonly enemyDefId: string;
  readonly nickname: string;
  readonly rank: ShadowRank;
  readonly kills: number;
  readonly equipment: ShadowEquipment;
  readonly learnedSkillIds: readonly string[];
  readonly hpPercent: number;
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
  readonly type: 'equipment' | 'skillbook';
  readonly count: number;
}

// ─── DROP TABLOSU ───

export interface DropEntry {
  readonly itemId: string;
  readonly itemType: 'equipment' | 'skillbook';
  readonly chance: number;   // 0-1 arasi olasilik
  readonly minLevel: number;
}
