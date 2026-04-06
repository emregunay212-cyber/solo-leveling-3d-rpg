import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { EnemyDef } from '../enemies/Enemy';

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  goblin: {
    name: 'Goblin',
    hp: 80,
    damage: 4,
    defense: 1,
    attackSpeed: 1.0,        // cok hizli vuruyor
    moveSpeed: 4.5,          // hizli kosuyor
    attackRange: 2.0,        // kisa menzil
    detectionRange: 8,       // dusuk algilama
    patrolSpeed: 2.0,
    patrolRadius: 4,
    xpReward: 30,
    goldReward: 10,
    color: new Color3(0.2, 0.5, 0.15),
    scale: 0.8,
    level: 1,
    isBoss: false,
    shadowSkillIds: ['enemy_fast_attack'],
  },
  wolf: {
    name: 'Kurt',
    hp: 120,
    damage: 6,
    defense: 2,
    attackSpeed: 1.2,        // hizli
    moveSpeed: 5.0,          // en hizli canavar
    attackRange: 2.5,
    detectionRange: 15,      // en genis algilama — avci
    patrolSpeed: 2.5,
    patrolRadius: 8,         // genis dolasma
    xpReward: 50,
    goldReward: 15,
    color: new Color3(0.4, 0.35, 0.3),
    scale: 0.85,
    level: 3,
    isBoss: false,
    shadowSkillIds: ['enemy_pack_bonus'],
  },
  orc: {
    name: 'Ork',
    hp: 200,
    damage: 10,
    defense: 5,
    attackSpeed: 2.5,        // en yavas — agir vuruslar
    moveSpeed: 3.0,          // yavas tank
    attackRange: 2.0,        // kisa menzil
    detectionRange: 8,
    patrolSpeed: 1.0,        // cok yavas dolasma
    patrolRadius: 3,         // dar alan
    xpReward: 80,
    goldReward: 25,
    color: new Color3(0.3, 0.45, 0.2),
    scale: 1.1,
    level: 5,
    isBoss: false,
    shadowSkillIds: ['enemy_heavy_strike', 'enemy_tough_skin'],
  },
  skeleton: {
    name: 'Iskelet',
    hp: 150,
    damage: 8,
    defense: 3,
    attackSpeed: 2.2,        // yavas
    moveSpeed: 2.5,          // yavas hareket
    attackRange: 3.0,        // uzun menzil — kemik kollar
    detectionRange: 10,
    patrolSpeed: 1.2,
    patrolRadius: 6,
    xpReward: 60,
    goldReward: 20,
    color: new Color3(0.75, 0.72, 0.65),
    scale: 1.0,
    level: 4,
    isBoss: false,
    shadowSkillIds: ['enemy_poison_strike'],
  },
  darkKnight: {
    name: 'Kara Sovalye',
    hp: 350,
    damage: 15,
    defense: 10,
    attackSpeed: 1.5,        // orta-hizli
    moveSpeed: 3.5,          // dengeli
    attackRange: 3.5,        // uzun kilic menzili
    detectionRange: 12,
    patrolSpeed: 1.5,
    patrolRadius: 5,
    xpReward: 120,
    goldReward: 40,
    color: new Color3(0.15, 0.1, 0.2),
    scale: 1.2,
    level: 8,
    isBoss: true,
    shadowSkillIds: ['enemy_shield_block', 'enemy_shadow_cleave'],
  },
  demon: {
    name: 'Seytan',
    hp: 500,
    damage: 20,
    defense: 15,
    attackSpeed: 1.3,        // hizli — tehlikeli
    moveSpeed: 4.0,          // hizli
    attackRange: 4.0,        // en uzun menzil
    detectionRange: 14,      // genis algilama
    patrolSpeed: 1.8,
    patrolRadius: 7,
    xpReward: 200,
    goldReward: 60,
    color: new Color3(0.6, 0.1, 0.05),
    scale: 1.3,
    level: 12,
    isBoss: true,
    shadowSkillIds: ['enemy_lifesteal', 'enemy_hellfire'],
  },
};
