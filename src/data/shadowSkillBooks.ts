/**
 * Golge Yetenek Kitaplari Katalogu
 * Golgelerin ogrenebilecegi 7 yetenek kitabi.
 */

import type { ShadowSkillDef } from '../shadows/ShadowEnhancementTypes';

const book_frenzy: ShadowSkillDef = {
  id: 'book_frenzy',
  name: 'Cinnet Kitabi',
  type: 'passive',
  trigger: 'onKill',
  description: 'Oldurmeden sonra 5 saniye boyunca %20 bonus hasar.',
  cooldown: 0,
  requiredLevel: 1,
  effect: {
    damageMultiplier: 1.20,
    durationSeconds: 5,
  },
  buyPrice: 200,
  sellPrice: 80,
} as const;

const book_lifesteal: ShadowSkillDef = {
  id: 'book_lifesteal',
  name: 'Can Hirsizi Kitabi',
  type: 'passive',
  trigger: 'onAttack',
  description: 'Her saldirida verdigi hasarin %5 kadar can calar.',
  cooldown: 0,
  requiredLevel: 3,
  effect: {
    healPercent: 0.05,
  },
  buyPrice: 300,
  sellPrice: 120,
} as const;

const book_shadow_cleave: ShadowSkillDef = {
  id: 'book_shadow_cleave',
  name: 'Golge Yarik Kitabi',
  type: 'passive',
  trigger: 'onAttack',
  description: '8 saniye bekleme sonrasi 3 birim AoE saldiri, 1.5x hasar.',
  cooldown: 8,
  requiredLevel: 5,
  effect: {
    aoeRadius: 3,
    damageMultiplier: 1.5,
  },
  buyPrice: 0,
  sellPrice: 150,
} as const;

const book_iron_will: ShadowSkillDef = {
  id: 'book_iron_will',
  name: 'Demir Irade Kitabi',
  type: 'passive',
  trigger: 'onTakeDamage',
  description: 'Hasar alindiginda bloklama sansi %15 artar.',
  cooldown: 0,
  requiredLevel: 4,
  effect: {
    statBuff: { bonusBlockChance: 0.15 },
    durationSeconds: 0,
  },
  buyPrice: 250,
  sellPrice: 100,
} as const;

const book_dark_regen: ShadowSkillDef = {
  id: 'book_dark_regen',
  name: 'Karanlik Yenilenme Kitabi',
  type: 'passive',
  trigger: 'periodic',
  description: 'Her 5 saniyede max HP\'nin %3 kadar iyilesir.',
  cooldown: 5,
  requiredLevel: 1,
  effect: {
    healPercent: 0.03,
  },
  buyPrice: 150,
  sellPrice: 60,
} as const;

const book_taunt: ShadowSkillDef = {
  id: 'book_taunt',
  name: 'Tahrik Kitabi',
  type: 'active',
  trigger: 'manual',
  description: '5 saniye boyunca yakin dusmanlari kendine ceeker.',
  cooldown: 12,
  requiredLevel: 6,
  effect: {
    forceTaunt: true,
    durationSeconds: 5,
  },
  buyPrice: 0,
  sellPrice: 150,
} as const;

const book_shadow_step: ShadowSkillDef = {
  id: 'book_shadow_step',
  name: 'Golge Adim Kitabi',
  type: 'passive',
  trigger: 'periodic',
  description: 'Her 10 saniyede dusmanin arkasina isinlanir.',
  cooldown: 10,
  requiredLevel: 8,
  effect: {
    teleportBehind: true,
  },
  buyPrice: 0,
  sellPrice: 200,
} as const;

// ─── EXPORT ───

export const SKILL_BOOK_DEFS: Readonly<Record<string, ShadowSkillDef>> = {
  book_frenzy,
  book_lifesteal,
  book_shadow_cleave,
  book_iron_will,
  book_dark_regen,
  book_taunt,
  book_shadow_step,
} as const;
