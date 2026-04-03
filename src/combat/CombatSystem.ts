import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Ray } from '@babylonjs/core/Culling/ray';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

export interface Damageable {
  mesh: Mesh;
  takeDamage(amount: number, isCritical: boolean, attackerPos: Vector3): void;
  isAlive(): boolean;
}

export class CombatSystem {
  private scene: Scene;
  private targets: Damageable[] = [];

  // Attack settings - Metin2 style (generous range and angle)
  private readonly ATTACK_RANGE = 4.0;
  private readonly ATTACK_ANGLE = Math.PI * 0.75; // 135 degree cone - very wide
  private readonly CRIT_CHANCE = 0.15;

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

      // Angle check (cone attack)
      const dirNorm = attackDir.normalize();
      const toTargetNorm = toTarget.normalize();
      const dot = Vector3.Dot(dirNorm, toTargetNorm);
      if (dot < Math.cos(this.ATTACK_ANGLE)) continue;

      // Calculate damage
      const isCritical = Math.random() < this.CRIT_CHANCE;
      const critMultiplier = isCritical ? 2.0 : 1.0;
      const variance = 0.85 + Math.random() * 0.3; // 85%-115% variance
      const damage = Math.round(baseDamage * critMultiplier * variance);

      // Apply damage
      target.takeDamage(damage, isCritical, attackerPos);
      hits.push({ target, damage, isCritical });
    }

    return hits;
  }
}
