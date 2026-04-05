import { describe, it, expect } from 'vitest';
import { PLAYER, CAMERA, COMBAT, COMBO, DAMAGE_NUMBERS, ENEMY_AI, ENEMY_VISUAL, LEVEL_SYSTEM, SCENE, ENGINE, UI } from './GameConfig';

describe('GameConfig', () => {
  it('PLAYER sabitleri pozitif olmali', () => {
    expect(PLAYER.walkSpeed).toBeGreaterThan(0);
    expect(PLAYER.sprintSpeed).toBeGreaterThan(PLAYER.walkSpeed);
    expect(PLAYER.height).toBeGreaterThan(0);
    expect(PLAYER.radius).toBeGreaterThan(0);
    expect(PLAYER.blockSpeedMultiplier).toBeGreaterThan(0);
    expect(PLAYER.blockSpeedMultiplier).toBeLessThan(1);
  });

  it('COMBAT sabitleri gecerli aralikta olmali', () => {
    expect(COMBAT.attackRange).toBeGreaterThan(0);
    expect(COMBAT.critChance).toBeGreaterThan(0);
    expect(COMBAT.critChance).toBeLessThan(1);
    expect(COMBAT.critMultiplier).toBeGreaterThan(1);
    expect(COMBAT.backstabMultiplier).toBeGreaterThan(1);
    expect(COMBAT.damageVarianceMin).toBeGreaterThan(0);
    expect(COMBAT.damageVarianceMin).toBeLessThan(1);
  });

  it('COMBO her hit icin gecerli degerler icermeli', () => {
    expect(COMBO.hits).toHaveLength(3);
    for (const hit of COMBO.hits) {
      expect(hit.damageMultiplier).toBeGreaterThan(0);
      expect(hit.duration).toBeGreaterThan(0);
    }
    // Finisher en yuksek hasar carpani olmali
    expect(COMBO.hits[2].damageMultiplier).toBeGreaterThan(COMBO.hits[0].damageMultiplier);
  });

  it('DAMAGE_NUMBERS tum tipler tanimli olmali', () => {
    const requiredTypes = ['normal', 'critical', 'player_hurt', 'parry', 'block', 'backstab'] as const;
    for (const type of requiredTypes) {
      expect(DAMAGE_NUMBERS.types[type]).toBeDefined();
      expect(DAMAGE_NUMBERS.types[type].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(DAMAGE_NUMBERS.types[type].fontSize).toBeGreaterThan(0);
      expect(DAMAGE_NUMBERS.types[type].scale).toBeGreaterThan(0);
    }
  });

  it('ENEMY_AI algilama menzili saldiri menzilinden buyuk olmali', () => {
    expect(ENEMY_AI.detectionRange).toBeGreaterThan(ENEMY_AI.attackRange);
    expect(ENEMY_AI.leashRange).toBeGreaterThan(ENEMY_AI.detectionRange);
    expect(ENEMY_AI.chaseSpeed).toBeGreaterThan(ENEMY_AI.patrolSpeed);
  });

  it('LEVEL_SYSTEM stat sinirlari mantikli olmali', () => {
    expect(LEVEL_SYSTEM.maxLevel).toBeGreaterThan(0);
    expect(LEVEL_SYSTEM.statCap).toBeGreaterThan(0);
    expect(LEVEL_SYSTEM.statPointsPerLevel).toBeGreaterThan(0);
    expect(LEVEL_SYSTEM.deathPenaltyPercent).toBeGreaterThan(0);
    expect(LEVEL_SYSTEM.deathPenaltyPercent).toBeLessThan(1);
  });

  it('SCENE spawn tanimlari bos olmamali', () => {
    for (const [type, positions] of Object.entries(SCENE.spawns)) {
      expect(positions.length).toBeGreaterThan(0);
    }
  });
});
