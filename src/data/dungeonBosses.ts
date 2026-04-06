/**
 * Dungeon boss tanimlari.
 * Her dungeon rank'i icin bir boss — EnemyDef arayuzunu kullanir.
 * Boss'lar normal dusmanlardan cok daha guclu ve yuksek odul verir.
 */

import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { EnemyDef } from '../enemies/Enemy';

/** Tum dusman yeteneklerinin listesi (shadow_monarch ve kamish hepsini kullanir) */
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
  'enemy_web_slow',
  'enemy_swarm',
  'enemy_frost_bite',
  'enemy_frenzy',
  'enemy_dark_magic',
  'enemy_fire_breath',
  'enemy_summon_minion',
  'enemy_triple_strike',
  'enemy_shadow_clone',
  'enemy_drain_life',
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
    defense: 5,
    attackSpeed: 0.8,        // cok hizli vuruyor
    moveSpeed: 5.0,          // cok hizli
    attackRange: 2.5,
    detectionRange: 12,
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
    defense: 10,
    attackSpeed: 2.0,        // yavas ama olumcul
    moveSpeed: 2.0,          // cok yavas
    attackRange: 4.0,        // uzun menzil
    detectionRange: 14,
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
    defense: 20,
    attackSpeed: 3.0,        // en yavas — yikici darbeler
    moveSpeed: 2.5,          // agir tank
    attackRange: 2.5,
    detectionRange: 10,
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
    defense: 30,
    attackSpeed: 1.0,        // hizli buyucu
    moveSpeed: 3.0,
    attackRange: 5.0,        // uzun menzil — buyu
    detectionRange: 16,      // genis algilama
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
    defense: 50,
    attackSpeed: 1.2,        // hizli
    moveSpeed: 4.5,          // hizli
    attackRange: 4.5,        // genis menzil
    detectionRange: 18,
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
    defense: 80,
    attackSpeed: 0.8,        // en hizli boss
    moveSpeed: 5.5,          // en hizli boss
    attackRange: 5.0,        // en genis menzil
    detectionRange: 20,      // tum arena
    xpReward: 15000,
    goldReward: 10000,
    color: new Color3(0.05, 0.02, 0.08),
    scale: 2.5,
    level: 80,
    isBoss: true,
    shadowSkillIds: ALL_ENEMY_SKILLS,
  },

  // ─── YENI BOSSLAR ───

  giant_rat_queen: {
    name: 'Dev Fare Kralicesi',
    hp: 300,
    damage: 8,
    defense: 2,
    attackSpeed: 0.6,
    moveSpeed: 5.5,
    attackRange: 2.0,
    detectionRange: 10,
    xpReward: 200,
    goldReward: 80,
    color: new Color3(0.5, 0.3, 0.2),
    scale: 1.2,
    level: 4,
    isBoss: true,
    shadowSkillIds: ['enemy_swarm', 'enemy_fast_attack'],
  },

  spider_queen: {
    name: 'Orumcek Kralicesi',
    hp: 1200,
    damage: 25,
    defense: 12,
    attackSpeed: 1.2,
    moveSpeed: 3.5,
    attackRange: 4.0,
    detectionRange: 14,
    xpReward: 800,
    goldReward: 350,
    color: new Color3(0.25, 0.15, 0.1),
    scale: 1.8,
    level: 12,
    isBoss: true,
    shadowSkillIds: ['enemy_web_slow', 'enemy_poison_strike', 'enemy_fast_attack'],
  },

  werewolf_alpha: {
    name: 'Kurtadam Alfasi',
    hp: 2000,
    damage: 40,
    defense: 15,
    attackSpeed: 0.8,
    moveSpeed: 6.0,
    attackRange: 3.0,
    detectionRange: 18,
    xpReward: 1500,
    goldReward: 600,
    color: new Color3(0.3, 0.2, 0.15),
    scale: 1.6,
    level: 20,
    isBoss: true,
    shadowSkillIds: ['enemy_frenzy', 'enemy_fast_attack', 'enemy_pack_bonus'],
  },

  death_knight_lord: {
    name: 'Olum Lordu',
    hp: 4000,
    damage: 60,
    defense: 35,
    attackSpeed: 1.4,
    moveSpeed: 3.0,
    attackRange: 4.0,
    detectionRange: 15,
    xpReward: 4000,
    goldReward: 1800,
    color: new Color3(0.1, 0.03, 0.15),
    scale: 1.8,
    level: 35,
    isBoss: true,
    shadowSkillIds: ['enemy_shield_block', 'enemy_shadow_cleave', 'enemy_dark_magic', 'enemy_lifesteal'],
  },

  baruka: {
    name: 'Buz Elfi Krali Baruka',
    hp: 8000,
    damage: 90,
    defense: 55,
    attackSpeed: 1.0,
    moveSpeed: 4.0,
    attackRange: 5.0,
    detectionRange: 20,
    xpReward: 8000,
    goldReward: 4000,
    color: new Color3(0.4, 0.6, 0.9),
    scale: 1.9,
    level: 55,
    isBoss: true,
    shadowSkillIds: ['enemy_frost_bite', 'enemy_dark_magic', 'enemy_shield_block', 'enemy_shadow_cleave'],
  },

  kamish: {
    name: 'Ejderha Kamish',
    hp: 20000,
    damage: 180,
    defense: 100,
    attackSpeed: 0.7,
    moveSpeed: 5.0,
    attackRange: 6.0,
    detectionRange: 25,
    xpReward: 20000,
    goldReward: 15000,
    color: new Color3(0.8, 0.65, 0.1),
    scale: 3.0,
    level: 90,
    isBoss: true,
    shadowSkillIds: ALL_ENEMY_SKILLS,
  },
};
