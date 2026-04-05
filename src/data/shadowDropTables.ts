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
] as const;

// ─── SEYTAN / DEMON (lv12) — boss only ───
const demonDrops: readonly DropEntry[] = [
  { itemId: 'book_shadow_burst_up',     itemType: 'skillbook', chance: 0.05, minLevel: 8 },
  { itemId: 'book_sovereign_aura_up',   itemType: 'skillbook', chance: 0.03, minLevel: 12 },
] as const;

// ─── EXPORT ───

export const SHADOW_DROP_TABLES: Readonly<Record<string, readonly DropEntry[]>> = {
  goblin: goblinDrops,
  wolf: wolfDrops,
  skeleton: skeletonDrops,
  orc: orcDrops,
  darkKnight: darkKnightDrops,
  demon: demonDrops,
} as const;
