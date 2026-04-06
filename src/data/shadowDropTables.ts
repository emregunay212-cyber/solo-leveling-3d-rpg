/**
 * Golge Drop Tablolari
 * Dusman turune gore yetenek kitabi dusurme olasiliklari.
 * Ekipman drop'lari kaldirildi — sadece oyuncu yetenek kitaplari duser.
 * chance: 0-1 arasi olasilik, minLevel: dusmanin minimum seviyesi.
 */

import type { DropEntry } from '../shadows/ShadowEnhancementTypes';

// ─── GOBLIN (lv1) — dusuk seviye kitaplar ───
const goblinDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_blade_up', itemType: 'skillbook', chance: 0.06, minLevel: 1 },
  { itemId: 'book_dark_regen',      itemType: 'skillbook', chance: 0.04, minLevel: 1 },
] as const;

// ─── KURT / WOLF (lv3) ───
const wolfDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_blade_up', itemType: 'skillbook', chance: 0.05, minLevel: 1 },
  { itemId: 'book_dark_regen',      itemType: 'skillbook', chance: 0.03, minLevel: 1 },
] as const;

// ─── ISKELET / SKELETON (lv4) ───
const skeletonDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.05, minLevel: 4 },
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.04, minLevel: 4 },
] as const;

// ─── ORK / ORC (lv5) ───
const orcDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.04, minLevel: 5 },
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.03, minLevel: 5 },
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.03, minLevel: 5 },
] as const;

// ─── KARA SOVALYE / DARK KNIGHT (lv8) — orta-yuksek ───
const darkKnightDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.04, minLevel: 8 },
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.03, minLevel: 4 },
  { itemId: 'skill_lightning_chain', itemType: 'skillbook', chance: 0.02, minLevel: 10 },
  { itemId: 'skill_flame_burst',     itemType: 'skillbook', chance: 0.02, minLevel: 10 },
] as const;

// ─── SEYTAN / DEMON (lv12) — boss only ───
const demonDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',     itemType: 'skillbook', chance: 0.05, minLevel: 8 },
  { itemId: 'book_sovereign_aura_up',   itemType: 'skillbook', chance: 0.03, minLevel: 12 },
  { itemId: 'skill_blood_rage',         itemType: 'skillbook', chance: 0.02, minLevel: 15 },
  { itemId: 'skill_ice_prison',         itemType: 'skillbook', chance: 0.01, minLevel: 20 },
  { itemId: 'skill_shadow_domain',      itemType: 'skillbook', chance: 0.005, minLevel: 30 },
  { itemId: 'skill_void_strike',        itemType: 'skillbook', chance: 0.005, minLevel: 30 },
] as const;

// ─── E-RANK YENI DUSMANLAR ───

const giantRatDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_blade_up', itemType: 'skillbook', chance: 0.05, minLevel: 1 },
] as const;

const batDrops: readonly DropEntry[] = [
  { itemId: 'book_dark_regen', itemType: 'skillbook', chance: 0.04, minLevel: 1 },
] as const;

const snakeDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_blade_up', itemType: 'skillbook', chance: 0.05, minLevel: 1 },
  { itemId: 'book_dark_regen',      itemType: 'skillbook', chance: 0.03, minLevel: 1 },
] as const;

// ─── D-RANK YENI DUSMANLAR ───

const giantSpiderDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.05, minLevel: 5 },
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.04, minLevel: 5 },
] as const;

const stoneGolemDrops: readonly DropEntry[] = [
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.05, minLevel: 5 },
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.04, minLevel: 5 },
] as const;

const zombieDrops: readonly DropEntry[] = [
  { itemId: 'book_dark_regen',       itemType: 'skillbook', chance: 0.05, minLevel: 4 },
  { itemId: 'book_shadow_shield_up', itemType: 'skillbook', chance: 0.03, minLevel: 4 },
] as const;

// ─── C-RANK YENI DUSMANLAR ───

const nagaDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.04, minLevel: 10 },
  { itemId: 'skill_lightning_chain', itemType: 'skillbook', chance: 0.02, minLevel: 12 },
] as const;

const iceBearDrops: readonly DropEntry[] = [
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.04, minLevel: 10 },
  { itemId: 'skill_ice_prison',      itemType: 'skillbook', chance: 0.02, minLevel: 14 },
] as const;

const werewolfDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.04, minLevel: 10 },
  { itemId: 'skill_blood_rage',      itemType: 'skillbook', chance: 0.02, minLevel: 15 },
] as const;

const darkElfDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.04, minLevel: 10 },
  { itemId: 'skill_flame_burst',     itemType: 'skillbook', chance: 0.02, minLevel: 13 },
] as const;

// ─── B-RANK YENI DUSMANLAR ───

const deathKnightDrops: readonly DropEntry[] = [
  { itemId: 'book_sovereign_aura_up', itemType: 'skillbook', chance: 0.04, minLevel: 20 },
  { itemId: 'skill_lightning_chain',  itemType: 'skillbook', chance: 0.03, minLevel: 20 },
  { itemId: 'skill_flame_burst',      itemType: 'skillbook', chance: 0.02, minLevel: 22 },
] as const;

const giantCentipedeDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',  itemType: 'skillbook', chance: 0.04, minLevel: 20 },
  { itemId: 'skill_blood_rage',      itemType: 'skillbook', chance: 0.02, minLevel: 24 },
] as const;

const fireImpDrops: readonly DropEntry[] = [
  { itemId: 'book_sovereign_aura_up', itemType: 'skillbook', chance: 0.03, minLevel: 20 },
  { itemId: 'skill_flame_burst',      itemType: 'skillbook', chance: 0.03, minLevel: 26 },
] as const;

const highOrcDrops: readonly DropEntry[] = [
  { itemId: 'book_iron_will',        itemType: 'skillbook', chance: 0.04, minLevel: 20 },
  { itemId: 'skill_lightning_chain', itemType: 'skillbook', chance: 0.02, minLevel: 25 },
] as const;

// ─── A-RANK YENI DUSMANLAR ───

const iceElfKnightDrops: readonly DropEntry[] = [
  { itemId: 'skill_ice_prison',       itemType: 'skillbook', chance: 0.03, minLevel: 35 },
  { itemId: 'skill_blood_rage',       itemType: 'skillbook', chance: 0.02, minLevel: 38 },
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.01, minLevel: 40 },
] as const;

const cerberusDrops: readonly DropEntry[] = [
  { itemId: 'skill_flame_burst',      itemType: 'skillbook', chance: 0.03, minLevel: 35 },
  { itemId: 'skill_blood_rage',       itemType: 'skillbook', chance: 0.02, minLevel: 42 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.01, minLevel: 40 },
] as const;

const lichDrops: readonly DropEntry[] = [
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.02, minLevel: 40 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.015, minLevel: 45 },
  { itemId: 'book_sovereign_aura_up', itemType: 'skillbook', chance: 0.03, minLevel: 35 },
] as const;

const drakeWarriorDrops: readonly DropEntry[] = [
  { itemId: 'skill_flame_burst',      itemType: 'skillbook', chance: 0.03, minLevel: 35 },
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.015, minLevel: 40 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.01, minLevel: 48 },
] as const;

// ─── S-RANK YENI DUSMANLAR ───

const antKingDrops: readonly DropEntry[] = [
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.03, minLevel: 60 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.025, minLevel: 60 },
  { itemId: 'skill_blood_rage',       itemType: 'skillbook', chance: 0.03, minLevel: 60 },
] as const;

const dragonDrops: readonly DropEntry[] = [
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.04, minLevel: 60 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.03, minLevel: 60 },
  { itemId: 'book_sovereign_aura_up', itemType: 'skillbook', chance: 0.05, minLevel: 60 },
] as const;

const archDemonDrops: readonly DropEntry[] = [
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.035, minLevel: 60 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.03, minLevel: 60 },
  { itemId: 'skill_blood_rage',       itemType: 'skillbook', chance: 0.03, minLevel: 60 },
] as const;

const shadowKnightDrops: readonly DropEntry[] = [
  { itemId: 'skill_shadow_domain',    itemType: 'skillbook', chance: 0.03, minLevel: 60 },
  { itemId: 'skill_void_strike',      itemType: 'skillbook', chance: 0.025, minLevel: 60 },
  { itemId: 'skill_ice_prison',       itemType: 'skillbook', chance: 0.03, minLevel: 60 },
] as const;

// ─── EXPORT ───

export const SHADOW_DROP_TABLES: Readonly<Record<string, readonly DropEntry[]>> = {
  goblin: goblinDrops,
  wolf: wolfDrops,
  skeleton: skeletonDrops,
  orc: orcDrops,
  darkKnight: darkKnightDrops,
  demon: demonDrops,
  // E-Rank
  giantRat: giantRatDrops,
  bat: batDrops,
  snake: snakeDrops,
  // D-Rank
  giantSpider: giantSpiderDrops,
  stoneGolem: stoneGolemDrops,
  zombie: zombieDrops,
  // C-Rank
  naga: nagaDrops,
  iceBear: iceBearDrops,
  werewolf: werewolfDrops,
  darkElf: darkElfDrops,
  // B-Rank
  deathKnight: deathKnightDrops,
  giantCentipede: giantCentipedeDrops,
  fireImp: fireImpDrops,
  highOrc: highOrcDrops,
  // A-Rank
  iceElfKnight: iceElfKnightDrops,
  cerberus: cerberusDrops,
  lich: lichDrops,
  drakeWarrior: drakeWarriorDrops,
  // S-Rank
  antKing: antKingDrops,
  dragon: dragonDrops,
  archDemon: archDemonDrops,
  shadowKnight: shadowKnightDrops,
} as const;
