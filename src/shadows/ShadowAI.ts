import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { SHADOW } from '../config/GameConfig';
import type { Enemy } from '../enemies/Enemy';

export enum ShadowState {
  FOLLOW,
  CHASE,
  ATTACK,
  RETURN,
  DEAD,
}

/**
 * Golge asker AI — oyuncuyu takip et, yakin dusmana saldir.
 */
export class ShadowAI {
  public state = ShadowState.FOLLOW;

  private attackTimer = 0;
  private currentTarget: Enemy | null = null;

  public velocity = Vector3.Zero();
  private static readonly SEPARATION_RADIUS = 1.5;
  private static readonly SEPARATION_FORCE = 3.0;

  private readonly cfgAttackCooldown: number;
  private readonly cfgChaseSpeed: number;
  private readonly cfgPatrolSpeed: number;

  constructor(
    attackCooldown?: number,
    chaseSpeed?: number,
    patrolSpeed?: number,
  ) {
    this.cfgAttackCooldown = attackCooldown ?? SHADOW.attackCooldown;
    this.cfgChaseSpeed = chaseSpeed ?? SHADOW.chaseSpeed;
    this.cfgPatrolSpeed = patrolSpeed ?? SHADOW.patrolSpeed;
  }

  update(
    dt: number,
    selfPos: Vector3,
    playerPos: Vector3,
    enemies: Enemy[],
    otherShadowPositions: Vector3[] = [],
  ): void {
    if (this.state === ShadowState.DEAD) return;
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    const toPlayer = playerPos.subtract(selfPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    switch (this.state) {
      case ShadowState.FOLLOW:
        this.updateFollow(distToPlayer, toPlayer, selfPos, enemies);
        break;
      case ShadowState.CHASE:
        this.updateChase(dt, selfPos, playerPos, distToPlayer);
        break;
      case ShadowState.ATTACK:
        this.updateAttack(dt, selfPos, distToPlayer);
        break;
      case ShadowState.RETURN:
        this.updateReturn(toPlayer, distToPlayer);
        break;
    }

    // Diger golgelerden ayrilma kuvveti (ic ice durmayi onler)
    this.applySeparation(selfPos, otherShadowPositions);
  }

  /** Yakin golgeleri iterek ic ice gecmeyi onler */
  private applySeparation(selfPos: Vector3, others: Vector3[]): void {
    for (const otherPos of others) {
      const diff = selfPos.subtract(otherPos);
      diff.y = 0;
      const dist = diff.length();
      if (dist < ShadowAI.SEPARATION_RADIUS && dist > 0.01) {
        const push = diff.normalize().scale(
          ShadowAI.SEPARATION_FORCE * (1 - dist / ShadowAI.SEPARATION_RADIUS),
        );
        this.velocity.x += push.x;
        this.velocity.z += push.z;
      }
    }
  }

  private updateFollow(
    distToPlayer: number,
    toPlayer: Vector3,
    selfPos: Vector3,
    enemies: Enemy[],
  ): void {
    // Dusman ara
    const nearestEnemy = this.findNearestEnemy(selfPos, enemies);
    if (nearestEnemy) {
      this.currentTarget = nearestEnemy;
      this.state = ShadowState.CHASE;
      return;
    }

    // Oyuncuyu takip et
    if (distToPlayer > SHADOW.followDistance) {
      const dir = toPlayer.normalize();
      this.velocity.x = dir.x * this.cfgPatrolSpeed;
      this.velocity.z = dir.z * this.cfgPatrolSpeed;
    } else {
      this.velocity.setAll(0);
    }
  }

  private updateChase(dt: number, selfPos: Vector3, playerPos: Vector3, distToPlayer: number): void {
    // Oyuncudan cok uzaklastiysa geri don
    if (distToPlayer > SHADOW.leashRange) {
      this.currentTarget = null;
      this.state = ShadowState.RETURN;
      this.velocity.setAll(0);
      return;
    }

    if (!this.currentTarget || !this.currentTarget.isAlive()) {
      this.currentTarget = null;
      this.state = ShadowState.FOLLOW;
      this.velocity.setAll(0);
      return;
    }

    const toTarget = this.currentTarget.mesh.position.subtract(selfPos);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist < SHADOW.attackRange) {
      this.state = ShadowState.ATTACK;
      this.velocity.setAll(0);
      return;
    }

    const dir = toTarget.normalize();
    this.velocity.x = dir.x * this.cfgChaseSpeed;
    this.velocity.z = dir.z * this.cfgChaseSpeed;
  }

  private updateAttack(dt: number, selfPos: Vector3, distToPlayer: number): void {
    if (distToPlayer > SHADOW.leashRange) {
      this.currentTarget = null;
      this.state = ShadowState.RETURN;
      return;
    }

    if (!this.currentTarget || !this.currentTarget.isAlive()) {
      this.currentTarget = null;
      this.state = ShadowState.FOLLOW;
      return;
    }

    const toTarget = this.currentTarget.mesh.position.subtract(selfPos);
    toTarget.y = 0;

    if (toTarget.length() > SHADOW.attackRange * 1.5) {
      this.state = ShadowState.CHASE;
      return;
    }

    this.velocity.setAll(0);
    // attackTimer ShadowSoldier tarafindan kontrol edilir (shouldAttack + resetAttackTimer)
  }

  private updateReturn(toPlayer: Vector3, distToPlayer: number): void {
    if (distToPlayer < SHADOW.followDistance) {
      this.state = ShadowState.FOLLOW;
      this.velocity.setAll(0);
      return;
    }

    const dir = toPlayer.normalize();
    this.velocity.x = dir.x * this.cfgChaseSpeed;
    this.velocity.z = dir.z * this.cfgChaseSpeed;
  }

  private findNearestEnemy(selfPos: Vector3, enemies: Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist: number = SHADOW.chaseRange;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;
      const dist = enemy.mesh.position.subtract(selfPos).length();
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  public getCurrentTarget(): Enemy | null {
    return this.currentTarget;
  }

  /** Oyuncu tarafindan zorla hedef atama (Ctrl+cift tik) */
  public forceTarget(enemy: Enemy): void {
    if (!enemy.isAlive()) return;
    this.currentTarget = enemy;
    this.state = ShadowState.CHASE;
  }

  public shouldAttack(): boolean {
    return this.state === ShadowState.ATTACK && this.attackTimer <= 0;
  }

  public resetAttackTimer(): void {
    this.attackTimer = this.cfgAttackCooldown;
  }

  public onDeath(): void {
    this.state = ShadowState.DEAD;
    this.velocity.setAll(0);
  }

}
