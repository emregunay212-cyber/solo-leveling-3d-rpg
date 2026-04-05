import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CombatSystem } from './CombatSystem';
import { DamageNumbers } from './DamageNumbers';
import { LevelSystem } from '../progression/LevelSystem';
import { COMBAT } from '../config/GameConfig';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

export interface DamageContext {
  playerPos: Vector3;
  playerRotY: number;
  playerIsBlocking: boolean;
  playerIsAttacking: boolean;
  enemyMeshPos: Vector3;
}

export type DamageResult =
  | { type: 'parry'; damage: 0 }
  | { type: 'block'; damage: number }
  | { type: 'backstab'; damage: number }
  | { type: 'normal'; damage: number };

/**
 * Hasar hesaplama mantigi.
 * Pasif savunma, blok, parry, backstab kontrollerini yapar.
 */
export class DamageCalculator {
  private shieldReductionGetter: (() => number) | null = null;

  constructor(
    private readonly levelSystem: LevelSystem,
    private readonly damageNumbers: DamageNumbers,
  ) {}

  /** SkillSystem'den shield azaltma oranini al */
  public setShieldReductionGetter(getter: () => number): void {
    this.shieldReductionGetter = getter;
  }

  /**
   * Dusman → oyuncu hasar hesapla.
   * Pasif savunma, backstab, blok/parry kontrolu yapar.
   * Hasar sayisini spawn eder, sonucu doner.
   */
  public calculateIncomingDamage(
    rawDamage: number,
    isBackstab: boolean,
    ctx: DamageContext,
  ): DamageResult {
    const numPos = ctx.playerPos.add(new Vector3(0, 1.5, 0));

    // Pasif savunma: VIT bazli hasar azaltma (her zaman aktif)
    const passiveReduction = this.levelSystem.getDamageReduction();
    let damage = Math.round(rawDamage * (1 - passiveReduction));

    // Skill shield buff (E skilli aktifse ek hasar azaltma)
    const shieldReduction = this.shieldReductionGetter ? this.shieldReductionGetter() : 0;
    if (shieldReduction > 0) {
      damage = Math.round(damage * (1 - shieldReduction));
    }

    // Backstab: blok/parry gecersiz
    if (isBackstab) {
      damage = Math.round(damage * COMBAT.backstabMultiplier);
      this.damageNumbers.spawn(numPos, damage, 'backstab');
      return { type: 'backstab', damage };
    }

    if (ctx.playerIsBlocking) {
      // Blok/Parry sadece oyuncu dusmana bakiyorsa gecerli
      const playerFacingEnemy = CombatSystem.isFacing(
        ctx.playerPos,
        ctx.playerRotY,
        ctx.enemyMeshPos,
      );

      if (playerFacingEnemy) {
        // Parry kontrolu
        let parryChance = this.levelSystem.getParryChance();
        if (ctx.playerIsAttacking) {
          parryChance *= COMBAT.parryPenaltyWhileAttacking;
        }

        if (Math.random() < parryChance) {
          this.damageNumbers.spawn(numPos, 0, 'parry');
          return { type: 'parry', damage: 0 };
        }

        // Block
        const blockReduction = this.levelSystem.getBlockReduction();
        const blockedDamage = Math.max(1, Math.round(damage * (1 - blockReduction)));
        this.damageNumbers.spawn(numPos, blockedDamage, 'block');
        return { type: 'block', damage: blockedDamage };
      }

      // Oyuncu dusmana bakmiyor → blok gecersiz
      this.damageNumbers.spawn(numPos, damage, 'player_hurt');
      return { type: 'normal', damage };
    }

    // Normal hasar
    this.damageNumbers.spawn(numPos, damage, 'player_hurt');
    return { type: 'normal', damage };
  }
}
