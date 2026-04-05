/**
 * Golge Drop Tablolari
 * Dusman turune gore esya ve yetenek kitabi dusurme olasiliklari.
 * chance: 0-1 arasi olasilik, minLevel: dusmanin minimum seviyesi.
 */

import type { DropEntry } from '../shadows/ShadowEnhancementTypes';

// ─── GOBLIN (lv1) — common agirlikli ───
const goblinDrops: readonly DropEntry[] = [
  { itemId: 'shadow_dagger',   itemType: 'equipment',  chance: 0.12, minLevel: 1 },
  { itemId: 'shadow_buckler',  itemType: 'equipment',  chance: 0.12, minLevel: 1 },
  { itemId: 'shadow_wraps',    itemType: 'equipment',  chance: 0.12, minLevel: 1 },
  { itemId: 'book_dark_regen', itemType: 'skillbook',  chance: 0.04, minLevel: 1 },
  { itemId: 'book_frenzy',     itemType: 'skillbook',  chance: 0.03, minLevel: 1 },
] as const;

// ─── KURT / WOLF (lv3) — common + uncommon ───
const wolfDrops: readonly DropEntry[] = [
  { itemId: 'shadow_dagger',   itemType: 'equipment',  chance: 0.08, minLevel: 1 },
  { itemId: 'dark_blade',      itemType: 'equipment',  chance: 0.08, minLevel: 3 },
  { itemId: 'shadow_buckler',  itemType: 'equipment',  chance: 0.06, minLevel: 1 },
  { itemId: 'dark_ward',       itemType: 'equipment',  chance: 0.06, minLevel: 3 },
  { itemId: 'shadow_wraps',    itemType: 'equipment',  chance: 0.06, minLevel: 1 },
  { itemId: 'dark_plate',      itemType: 'equipment',  chance: 0.06, minLevel: 3 },
  { itemId: 'book_lifesteal',  itemType: 'skillbook',  chance: 0.04, minLevel: 3 },
  { itemId: 'book_dark_regen', itemType: 'skillbook',  chance: 0.03, minLevel: 1 },
] as const;

// ─── ISKELET / SKELETON (lv4) — uncommon agirlikli ───
const skeletonDrops: readonly DropEntry[] = [
  { itemId: 'dark_blade',      itemType: 'equipment',  chance: 0.10, minLevel: 3 },
  { itemId: 'dark_ward',       itemType: 'equipment',  chance: 0.10, minLevel: 3 },
  { itemId: 'dark_plate',      itemType: 'equipment',  chance: 0.10, minLevel: 3 },
  { itemId: 'book_iron_will',  itemType: 'skillbook',  chance: 0.05, minLevel: 4 },
  { itemId: 'book_frenzy',     itemType: 'skillbook',  chance: 0.03, minLevel: 1 },
] as const;

// ─── ORK / ORC (lv5) — uncommon + rare ───
const orcDrops: readonly DropEntry[] = [
  { itemId: 'dark_blade',          itemType: 'equipment',  chance: 0.06, minLevel: 3 },
  { itemId: 'dark_ward',           itemType: 'equipment',  chance: 0.06, minLevel: 3 },
  { itemId: 'dark_plate',          itemType: 'equipment',  chance: 0.06, minLevel: 3 },
  { itemId: 'void_edge',           itemType: 'equipment',  chance: 0.04, minLevel: 5 },
  { itemId: 'void_barrier',        itemType: 'equipment',  chance: 0.04, minLevel: 5 },
  { itemId: 'void_carapace',       itemType: 'equipment',  chance: 0.04, minLevel: 5 },
  { itemId: 'book_shadow_cleave',  itemType: 'skillbook',  chance: 0.04, minLevel: 5 },
  { itemId: 'book_lifesteal',      itemType: 'skillbook',  chance: 0.03, minLevel: 3 },
] as const;

// ─── KARA SOVALYE / DARK KNIGHT (lv8) — rare + epic ───
const darkKnightDrops: readonly DropEntry[] = [
  { itemId: 'void_edge',           itemType: 'equipment',  chance: 0.06, minLevel: 5 },
  { itemId: 'void_barrier',        itemType: 'equipment',  chance: 0.06, minLevel: 5 },
  { itemId: 'void_carapace',       itemType: 'equipment',  chance: 0.06, minLevel: 5 },
  { itemId: 'abyssal_fang',        itemType: 'equipment',  chance: 0.03, minLevel: 8 },
  { itemId: 'abyssal_aegis',       itemType: 'equipment',  chance: 0.03, minLevel: 8 },
  { itemId: 'abyssal_shell',       itemType: 'equipment',  chance: 0.03, minLevel: 8 },
  { itemId: 'book_taunt',          itemType: 'skillbook',  chance: 0.04, minLevel: 6 },
  { itemId: 'book_shadow_cleave',  itemType: 'skillbook',  chance: 0.03, minLevel: 5 },
] as const;

// ─── SEYTAN / DEMON (lv12) — epic + legendary ───
const demonDrops: readonly DropEntry[] = [
  { itemId: 'abyssal_fang',        itemType: 'equipment',  chance: 0.05, minLevel: 8 },
  { itemId: 'abyssal_aegis',       itemType: 'equipment',  chance: 0.05, minLevel: 8 },
  { itemId: 'abyssal_shell',       itemType: 'equipment',  chance: 0.05, minLevel: 8 },
  { itemId: 'monarchs_claw',       itemType: 'equipment',  chance: 0.01, minLevel: 12 },
  { itemId: 'monarchs_guard',      itemType: 'equipment',  chance: 0.01, minLevel: 12 },
  { itemId: 'monarchs_mantle',     itemType: 'equipment',  chance: 0.01, minLevel: 12 },
  { itemId: 'book_shadow_step',    itemType: 'skillbook',  chance: 0.04, minLevel: 8 },
  { itemId: 'book_taunt',          itemType: 'skillbook',  chance: 0.03, minLevel: 6 },
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
