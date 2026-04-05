/**
 * Golge Yetenek Tanimlari
 * A) Dusman-icerik yetenekler: golge askerleri otomatik kullanir
 * B) Oyuncu yetenek kitaplari: dusmanlardan duser, oyuncunun Q/E/R/F'ini guclendirir
 */

import type { ShadowSkillDef } from '../shadows/ShadowEnhancementTypes';

// ─── A) DUSMAN-ICERIK YETENEKLER (golge askerleri icin) ───

const enemy_fast_attack: ShadowSkillDef = {
  id: 'enemy_fast_attack',
  name: 'Hizli Saldiri',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Saldiri hizi %30 artar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusAttackSpeed: 0.6 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_pack_bonus: ShadowSkillDef = {
  id: 'enemy_pack_bonus',
  name: 'Suru Gucu',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Yakin golge varsa +%15 hasar',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.15 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_poison_strike: ShadowSkillDef = {
  id: 'enemy_poison_strike',
  name: 'Zehirli Darbe',
  type: 'passive',
  trigger: 'onAttack',
  description: '3sn boyunca %2 maxHP hasar',
  cooldown: 5,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.0, durationSeconds: 3, healPercent: -0.02 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_heavy_strike: ShadowSkillDef = {
  id: 'enemy_heavy_strike',
  name: 'Agir Darbe',
  type: 'passive',
  trigger: 'onAttack',
  description: '+%40 hasar ama yavas',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.4 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_tough_skin: ShadowSkillDef = {
  id: 'enemy_tough_skin',
  name: 'Sert Deri',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: '+10 savunma',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusDefense: 10 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_shield_block: ShadowSkillDef = {
  id: 'enemy_shield_block',
  name: 'Kalkan Blogu',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: '%20 sans ile hasari yariya indir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusBlockChance: 0.20 } },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_shadow_cleave: ShadowSkillDef = {
  id: 'enemy_shadow_cleave',
  name: 'Golge Bicak',
  type: 'passive',
  trigger: 'onAttack',
  description: 'AoE 3m saldiri',
  cooldown: 8,
  requiredLevel: 0,
  effect: { aoeRadius: 3, damageMultiplier: 1.5 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_lifesteal: ShadowSkillDef = {
  id: 'enemy_lifesteal',
  name: 'Can Emme',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Verilen hasarin %8i kadar iyiles',
  cooldown: 0,
  requiredLevel: 0,
  effect: { healPercent: 0.08 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

const enemy_hellfire: ShadowSkillDef = {
  id: 'enemy_hellfire',
  name: 'Cehennem Atesi',
  type: 'passive',
  trigger: 'periodic',
  description: 'AoE ates hasari',
  cooldown: 6,
  requiredLevel: 0,
  effect: { aoeRadius: 4, damageMultiplier: 2.0 },
  buyPrice: 0,
  sellPrice: 0,
} as const;

// ─── B) OYUNCU YETENEK KITAPLARI (drop olarak duser) ───

const book_shadow_blade_up: ShadowSkillDef = {
  id: 'book_shadow_blade_up',
  name: 'Golge Bicagi+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Q yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.2 },
  buyPrice: 200,
  sellPrice: 80,
} as const;

const book_shadow_shield_up: ShadowSkillDef = {
  id: 'book_shadow_shield_up',
  name: 'Golge Kalkani+',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: 'E yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusDefense: 15 } },
  buyPrice: 300,
  sellPrice: 120,
} as const;

const book_shadow_burst_up: ShadowSkillDef = {
  id: 'book_shadow_burst_up',
  name: 'Golge Patlama+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'R yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.3 },
  buyPrice: 0,
  sellPrice: 150,
} as const;

const book_sovereign_aura_up: ShadowSkillDef = {
  id: 'book_sovereign_aura_up',
  name: 'Hukumdar Aurasi+',
  type: 'passive',
  trigger: 'onAttack',
  description: 'F yetenegini guclendirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { damageMultiplier: 1.5 },
  buyPrice: 0,
  sellPrice: 200,
} as const;

const book_dark_regen: ShadowSkillDef = {
  id: 'book_dark_regen',
  name: 'Karanlik Yenilenme',
  type: 'passive',
  trigger: 'periodic',
  description: 'Oyuncu HP yenilenmesini arttirir',
  cooldown: 5,
  requiredLevel: 0,
  effect: { healPercent: 0.03 },
  buyPrice: 150,
  sellPrice: 60,
} as const;

const book_iron_will: ShadowSkillDef = {
  id: 'book_iron_will',
  name: 'Demir Irade',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: 'Hasar azaltmayi arttirir',
  cooldown: 0,
  requiredLevel: 0,
  effect: { statBuff: { bonusBlockChance: 0.15 } },
  buyPrice: 250,
  sellPrice: 100,
} as const;

// ─── KITAP → SKILL ESLESMESI ───

/** Hangi kitap hangi oyuncu yetenegini guclendirir */
export const BOOK_TO_SKILL_MAP: Readonly<Record<string, string>> = {
  'book_shadow_blade_up': 'shadowBlade',
  'book_shadow_shield_up': 'shadowShield',
  'book_shadow_burst_up': 'shadowBurst',
  'book_sovereign_aura_up': 'sovereignAura',
  'book_dark_regen': 'passive_hp_regen',
  'book_iron_will': 'passive_damage_reduce',
} as const;

/** Passive kitaplar — Q/E/R/F degilse passive buff olarak kullanilir */
export const PASSIVE_BOOK_IDS = new Set(['book_dark_regen', 'book_iron_will']);

/** Skill ID → skill display bilgisi (UI icin) */
export const SKILL_KEY_LABELS: Readonly<Record<string, string>> = {
  'shadowBlade': 'Q',
  'shadowShield': 'E',
  'shadowBurst': 'R',
  'sovereignAura': 'F',
} as const;

// ─── EXPORT ───

/** Dusman-icerik yetenekler — golge askerlerinin otomatik kullandigi */
export const ENEMY_SKILL_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  enemy_fast_attack,
  enemy_pack_bonus,
  enemy_poison_strike,
  enemy_heavy_strike,
  enemy_tough_skin,
  enemy_shield_block,
  enemy_shadow_cleave,
  enemy_lifesteal,
  enemy_hellfire,
} as const;

/** Oyuncu yetenek kitaplari — dusmanlardan duser, oyuncunun Q/E/R/F'ini guclendirir */
export const PLAYER_SKILL_BOOK_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  book_shadow_blade_up,
  book_shadow_shield_up,
  book_shadow_burst_up,
  book_sovereign_aura_up,
  book_dark_regen,
  book_iron_will,
} as const;

/**
 * Tum skill tanimlari — hem dusman hem oyuncu.
 * ShadowSkillRunner ve diger sistemler tarafindan kullanilir.
 */
export const SKILL_BOOK_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  ...ENEMY_SKILL_DEFS,
  ...PLAYER_SKILL_BOOK_DEFS,
} as const;
