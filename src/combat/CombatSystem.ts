import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Ray } from '@babylonjs/core/Culling/ray';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { COMBAT } from '../config/GameConfig';

export interface Damageable {
  mesh: Mesh;
  takeDamage(amount: number, isCritical: boolean, attackerPos: Vector3): void;
  isAlive(): boolean;
}

export class CombatSystem {
  private scene: Scene;
  private targets: Damageable[] = [];

  // Attack settings (from GameConfig)
  private readonly ATTACK_RANGE = COMBAT.attackRange;
  private readonly ATTACK_ANGLE = COMBAT.attackAngle;
  private readonly CRIT_CHANCE = COMBAT.critChance;

  // Direction check angles (from GameConfig)
  private static readonly FACING_HALF_ANGLE = COMBAT.facingHalfAngle;
  private static readonly BEHIND_DOT_THRESHOLD = COMBAT.behindDotThreshold;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public registerTarget(target: Damageable): void {
    this.targets.push(target);
  }

  public getTargets(): Damageable[] {
    return this.targets;
  }

  public unregisterTarget(target: Damageable): void {
    const idx = this.targets.indexOf(target);
    if (idx >= 0) this.targets.splice(idx, 1);
  }

  /**
   * Check if an entity at entityPos with rotation entityRotY is facing targetPos
   * within halfAngle (default 60° each side = 120° total forward arc)
   */
  public static isFacing(
    entityPos: Vector3,
    entityRotY: number,
    targetPos: Vector3,
    halfAngle: number = CombatSystem.FACING_HALF_ANGLE
  ): boolean {
    const forward = new Vector3(Math.sin(entityRotY), 0, Math.cos(entityRotY));
    const toTarget = targetPos.subtract(entityPos);
    toTarget.y = 0;
    if (toTarget.lengthSquared() < 0.001) return true; // same position
    const dot = Vector3.Dot(forward, toTarget.normalize());
    return dot > Math.cos(halfAngle);
  }

  /**
   * Check if attacker is behind the target (outside target's rear arc)
   * Returns true if attacker is in the target's blind spot
   */
  public static isTargetBehind(
    attackerPos: Vector3,
    targetPos: Vector3,
    targetRotY: number
  ): boolean {
    const forward = new Vector3(Math.sin(targetRotY), 0, Math.cos(targetRotY));
    const toAttacker = attackerPos.subtract(targetPos);
    toAttacker.y = 0;
    if (toAttacker.lengthSquared() < 0.001) return false;
    const dot = Vector3.Dot(forward, toAttacker.normalize());
    return dot < CombatSystem.BEHIND_DOT_THRESHOLD;
  }

  /**
   * Perform a melee attack from attackerPos facing attackDir
   * Returns array of hit targets with damage info
   */
  public meleeAttack(
    attackerPos: Vector3,
    attackDir: Vector3,
    baseDamage: number
  ): { target: Damageable; damage: number; isCritical: boolean }[] {
    const hits: { target: Damageable; damage: number; isCritical: boolean }[] = [];

    for (const target of this.targets) {
      if (!target.isAlive()) continue;

      const targetPos = target.mesh.position;
      const toTarget = targetPos.subtract(attackerPos);
      toTarget.y = 0; // horizontal only
      const dist = toTarget.length();

      // Range check
      if (dist > this.ATTACK_RANGE) continue;

      // Angle check (90° cone - must be facing target)
      const dirNorm = attackDir.normalize();
      const toTargetNorm = toTarget.normalize();
      const dot = Vector3.Dot(dirNorm, toTargetNorm);
      if (dot < Math.cos(this.ATTACK_ANGLE)) continue;

      // Calculate damage
      const isCritical = Math.random() < this.CRIT_CHANCE;
      const critMultiplier = isCritical ? COMBAT.critMultiplier : 1.0;
      const variance = COMBAT.damageVarianceMin + Math.random() * COMBAT.damageVarianceRange;
      const damage = Math.round(baseDamage * critMultiplier * variance);

      // Apply damage
      target.takeDamage(damage, isCritical, attackerPos);
      hits.push({ target, damage, isCritical });
    }

    return hits;
  }

  /**
   * 360° AoE attack — 4. combo finisher ve skill AoE'leri icin
   */
  public aoeAttack(
    center: Vector3,
    radius: number,
    baseDamage: number,
  ): { target: Damageable; damage: number; isCritical: boolean }[] {
    const hits: { target: Damageable; damage: number; isCritical: boolean }[] = [];

    for (const target of this.targets) {
      if (!target.isAlive()) continue;
      const toTarget = target.mesh.position.subtract(center);
      toTarget.y = 0;
      if (toTarget.length() > radius) continue;

      const isCritical = Math.random() < this.CRIT_CHANCE;
      const critMultiplier = isCritical ? COMBAT.critMultiplier : 1.0;
      const variance = COMBAT.damageVarianceMin + Math.random() * COMBAT.damageVarianceRange;
      const damage = Math.round(baseDamage * critMultiplier * variance);

      target.takeDamage(damage, isCritical, center);
      hits.push({ target, damage, isCritical });
    }

    return hits;
  }
}
