/**
 * Dungeon boss tanimlari.
 * Her dungeon rank'i icin bir boss — EnemyDef arayuzunu kullanir.
 * Boss'lar normal dusmanlardan cok daha guclu ve yuksek odul verir.
 */

import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { EnemyDef } from '../enemies/Enemy';

/** Tum dusman yeteneklerinin listesi (shadow_monarch hepsini kullanir) */
const ALL_ENEMY_SKILLS: readonly string[] = [
  'enemy_fast_attack',
  'enemy_pack_bonus',
  'enemy_poison_strike',
  'enemy_shield_block',
  'enemy_heavy_strike',
  'enemy_tough_skin',
  'enemy_shadow_cleave',
  'enemy_hellfire',
  'enemy_lifesteal',
] as const;

/**
 * Dungeon boss tanimlari — rank sirali.
 * Key'ler DungeonRankDef.bossType ile eslesir.
 */
export const DUNGEON_BOSS_DEFS: Record<string, EnemyDef> = {
  goblin_king: {
    name: 'Goblin Kral',
    hp: 400,
    damage: 12,
    xpReward: 300,
    goldReward: 100,
    color: new Color3(0.15, 0.55, 0.1),
    scale: 1.4,
    level: 5,
    isBoss: true,
    shadowSkillIds: ['enemy_fast_attack', 'enemy_pack_bonus'],
  },

  skeleton_lord: {
    name: 'Iskelet Lord',
    hp: 800,
    damage: 20,
    xpReward: 600,
    goldReward: 200,
    color: new Color3(0.85, 0.82, 0.75),
    scale: 1.5,
    level: 10,
    isBoss: true,
    shadowSkillIds: ['enemy_poison_strike', 'enemy_shield_block'],
  },

  orc_warlord: {
    name: 'Ork Savaskani',
    hp: 1500,
    damage: 35,
    xpReward: 1200,
    goldReward: 500,
    color: new Color3(0.15, 0.35, 0.1),
    scale: 1.7,
    level: 20,
    isBoss: true,
    shadowSkillIds: ['enemy_heavy_strike', 'enemy_tough_skin', 'enemy_shadow_cleave'],
  },

  dark_archmage: {
    name: 'Karanlik Buyucu',
    hp: 3000,
    damage: 50,
    xpReward: 3000,
    goldReward: 1200,
    color: new Color3(0.3, 0.1, 0.4),
    scale: 1.6,
    level: 35,
    isBoss: true,
    shadowSkillIds: ['enemy_shield_block', 'enemy_hellfire', 'enemy_lifesteal'],
  },

  demon_lord: {
    name: 'Seytan Lord',
    hp: 6000,
    damage: 80,
    xpReward: 6000,
    goldReward: 3000,
    color: new Color3(0.7, 0.05, 0.05),
    scale: 2.0,
    level: 50,
    isBoss: true,
    shadowSkillIds: ['enemy_hellfire', 'enemy_lifesteal', 'enemy_shadow_cleave'],
  },

  shadow_monarch: {
    name: 'Golge Hukumdari',
    hp: 15000,
    damage: 150,
    xpReward: 15000,
    goldReward: 10000,
    color: new Color3(0.05, 0.02, 0.08),
    scale: 2.5,
    level: 80,
    isBoss: true,
    shadowSkillIds: ALL_ENEMY_SKILLS,
  },
};
