/**
 * Golge Ekipman Katalogu
 * 5 nadirlik seviyesi x 3 slot = 15 esya.
 * buyPrice 0 = satin alinamaz (craft/drop).
 */

import type { EquipmentDef } from '../shadows/ShadowEnhancementTypes';

// ─── SILAHLAR ───

const shadow_dagger: EquipmentDef = {
  id: 'shadow_dagger',
  name: 'Golge Hanceri',
  slot: 'weapon',
  rarity: 'common',
  requiredLevel: 1,
  stats: { bonusDamage: 3 },
  description: 'Karanliktan doveculmus basit bir hancer.',
  buyPrice: 50,
  sellPrice: 20,
} as const;

const dark_blade: EquipmentDef = {
  id: 'dark_blade',
  name: 'Karanlik Kilic',
  slot: 'weapon',
  rarity: 'uncommon',
  requiredLevel: 3,
  stats: { bonusDamage: 6, bonusDamagePercent: 0.05 },
  description: 'Golge enerjisiyle guclenmis keskin bir kilic.',
  buyPrice: 150,
  sellPrice: 60,
} as const;

const void_edge: EquipmentDef = {
  id: 'void_edge',
  name: 'Bosluk Agzi',
  slot: 'weapon',
  rarity: 'rare',
  requiredLevel: 5,
  stats: { bonusDamage: 10, bonusDamagePercent: 0.10, bonusAttackSpeed: -0.2 },
  description: 'Bosluktan koparilmis, gerceekligi buken bir kilic.',
  buyPrice: 0,
  sellPrice: 120,
} as const;

const abyssal_fang: EquipmentDef = {
  id: 'abyssal_fang',
  name: 'Ueurum Disi',
  slot: 'weapon',
  rarity: 'epic',
  requiredLevel: 8,
  stats: { bonusDamage: 18, bonusDamagePercent: 0.15, bonusAttackSpeed: -0.3 },
  description: 'Derin karanliktan gelen yikici bir silah.',
  buyPrice: 0,
  sellPrice: 250,
} as const;

const monarchs_claw: EquipmentDef = {
  id: 'monarchs_claw',
  name: 'Hukumdarin Pencesi',
  slot: 'weapon',
  rarity: 'legendary',
  requiredLevel: 12,
  stats: { bonusDamage: 30, bonusDamagePercent: 0.25, bonusAttackSpeed: -0.5 },
  description: 'Golge Hukumdarinin efsanevi silahi.',
  buyPrice: 0,
  sellPrice: 500,
} as const;

// ─── KALKANLAR ───

const shadow_buckler: EquipmentDef = {
  id: 'shadow_buckler',
  name: 'Golge Kalkancigi',
  slot: 'shield',
  rarity: 'common',
  requiredLevel: 1,
  stats: { bonusDefense: 5 },
  description: 'Hafif ama dayanikli kucuk bir kalkan.',
  buyPrice: 50,
  sellPrice: 20,
} as const;

const dark_ward: EquipmentDef = {
  id: 'dark_ward',
  name: 'Karanlik Muhafiz',
  slot: 'shield',
  rarity: 'uncommon',
  requiredLevel: 3,
  stats: { bonusDefense: 10, bonusBlockChance: 0.05 },
  description: 'Karanlik enerjiyle korunan bir kalkan.',
  buyPrice: 150,
  sellPrice: 60,
} as const;

const void_barrier: EquipmentDef = {
  id: 'void_barrier',
  name: 'Bosluk Bariyeri',
  slot: 'shield',
  rarity: 'rare',
  requiredLevel: 5,
  stats: { bonusDefense: 20, bonusBlockChance: 0.10 },
  description: 'Bosluk enerjisinden olusan gecilmez bir bariyer.',
  buyPrice: 0,
  sellPrice: 120,
} as const;

const abyssal_aegis: EquipmentDef = {
  id: 'abyssal_aegis',
  name: 'Ueurum Esgidi',
  slot: 'shield',
  rarity: 'epic',
  requiredLevel: 8,
  stats: { bonusDefense: 35, bonusBlockChance: 0.15 },
  description: 'Derin karanliktan gelen mutlak koruma.',
  buyPrice: 0,
  sellPrice: 250,
} as const;

const monarchs_guard: EquipmentDef = {
  id: 'monarchs_guard',
  name: 'Hukumdarin Muhafizi',
  slot: 'shield',
  rarity: 'legendary',
  requiredLevel: 12,
  stats: { bonusDefense: 50, bonusBlockChance: 0.25 },
  description: 'Golge Hukumdarinin yenilmez kalkani.',
  buyPrice: 0,
  sellPrice: 500,
} as const;

// ─── ZIRHLAR ───

const shadow_wraps: EquipmentDef = {
  id: 'shadow_wraps',
  name: 'Golge Sarilari',
  slot: 'armor',
  rarity: 'common',
  requiredLevel: 1,
  stats: { bonusHp: 10 },
  description: 'Golge enerjisinden dokunmus hafif oertueler.',
  buyPrice: 50,
  sellPrice: 20,
} as const;

const dark_plate: EquipmentDef = {
  id: 'dark_plate',
  name: 'Karanlik Levha',
  slot: 'armor',
  rarity: 'uncommon',
  requiredLevel: 3,
  stats: { bonusHp: 25, bonusHpPercent: 0.05 },
  description: 'Karanlik metalden doveculmus gueeclue bir zirh.',
  buyPrice: 150,
  sellPrice: 60,
} as const;

const void_carapace: EquipmentDef = {
  id: 'void_carapace',
  name: 'Bosluk Kabugu',
  slot: 'armor',
  rarity: 'rare',
  requiredLevel: 5,
  stats: { bonusHp: 50, bonusHpPercent: 0.10, bonusMoveSpeed: 0.5 },
  description: 'Bosluktan elde edilen cevik ve dayanikli kabuk.',
  buyPrice: 0,
  sellPrice: 120,
} as const;

const abyssal_shell: EquipmentDef = {
  id: 'abyssal_shell',
  name: 'Ueurum Kabukcugu',
  slot: 'armor',
  rarity: 'epic',
  requiredLevel: 8,
  stats: { bonusHp: 80, bonusHpPercent: 0.20, bonusMoveSpeed: 1.0 },
  description: 'Derin karanliktaki yaratiklarin kabugundan yapilmis.',
  buyPrice: 0,
  sellPrice: 250,
} as const;

const monarchs_mantle: EquipmentDef = {
  id: 'monarchs_mantle',
  name: 'Hukumdarin Pellerini',
  slot: 'armor',
  rarity: 'legendary',
  requiredLevel: 12,
  stats: { bonusHp: 120, bonusHpPercent: 0.35, bonusMoveSpeed: 1.5 },
  description: 'Golge Hukumdarinin efsanevi pellerini.',
  buyPrice: 0,
  sellPrice: 500,
} as const;

// ─── EXPORT ───

export const EQUIPMENT_DEFS: Readonly<Record<string, EquipmentDef>> = {
  shadow_dagger,
  dark_blade,
  void_edge,
  abyssal_fang,
  monarchs_claw,
  shadow_buckler,
  dark_ward,
  void_barrier,
  abyssal_aegis,
  monarchs_guard,
  shadow_wraps,
  dark_plate,
  void_carapace,
  abyssal_shell,
  monarchs_mantle,
} as const;

/** Ayni referans — isimlendirme kolayligi icin */
export const EQUIPMENT_MAP = EQUIPMENT_DEFS;
