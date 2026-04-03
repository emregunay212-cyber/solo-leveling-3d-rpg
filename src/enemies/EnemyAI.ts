import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Enemy } from './Enemy';

export enum AIState {
  IDLE,
  PATROL,
  CHASE,
  ATTACK,
  RETURN, // going back to spawn point
  DEAD,
}

/**
 * Metin2-style enemy AI state machine:
 * IDLE -> detect player -> CHASE -> in range -> ATTACK -> player escapes -> RETURN -> IDLE
 */
export class EnemyAI {
  public state = AIState.IDLE;

  // Detection
  private readonly DETECTION_RANGE = 10;
  private readonly ATTACK_RANGE = 2.5;
  private readonly LEASH_RANGE = 20; // max distance from spawn before returning
  private readonly CHASE_SPEED = 3.5;
  private readonly PATROL_SPEED = 1.5;

  // Attack
  private readonly ATTACK_COOLDOWN = 1.8; // slower attacks
  private attackTimer = 0;

  // Patrol
  private patrolTarget: Vector3 | null = null;
  private patrolWaitTimer = 0;
  private readonly PATROL_RADIUS = 5;
  private readonly PATROL_WAIT_MIN = 2;
  private readonly PATROL_WAIT_MAX = 5;

  // Idle timer
  private idleTimer = 0;

  private spawnPos: Vector3;
  private enemy: Enemy;

  constructor(enemy: Enemy, spawnPos: Vector3) {
    this.enemy = enemy;
    this.spawnPos = spawnPos.clone();
    this.idleTimer = Math.random() * 3; // stagger initial patrol
  }

  public update(dt: number, playerPos: Vector3, playerAlive: boolean): void {
    if (this.state === AIState.DEAD) return;

    this.attackTimer = Math.max(0, this.attackTimer - dt);

    const toPlayer = playerPos.subtract(this.enemy.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    const toSpawn = this.spawnPos.subtract(this.enemy.position);
    toSpawn.y = 0;
    const distToSpawn = toSpawn.length();

    switch (this.state) {
      case AIState.IDLE:
        this.updateIdle(dt, distToPlayer, playerAlive);
        break;
      case AIState.PATROL:
        this.updatePatrol(dt, distToPlayer, playerAlive);
        break;
      case AIState.CHASE:
        this.updateChase(dt, toPlayer, distToPlayer, distToSpawn, playerAlive);
        break;
      case AIState.ATTACK:
        this.updateAttack(dt, toPlayer, distToPlayer, playerAlive);
        break;
      case AIState.RETURN:
        this.updateReturn(dt, toSpawn, distToSpawn, distToPlayer, playerAlive);
        break;
    }
  }

  private updateIdle(dt: number, distToPlayer: number, playerAlive: boolean): void {
    // Wait, then start patrolling
    this.idleTimer -= dt;
    if (this.idleTimer <= 0) {
      this.state = AIState.PATROL;
      this.pickPatrolTarget();
    }

    // Detect player
    if (playerAlive && distToPlayer < this.DETECTION_RANGE) {
      this.state = AIState.CHASE;
    }
  }

  private updatePatrol(dt: number, distToPlayer: number, playerAlive: boolean): void {
    // Detect player
    if (playerAlive && distToPlayer < this.DETECTION_RANGE) {
      this.state = AIState.CHASE;
      return;
    }

    if (this.patrolWaitTimer > 0) {
      this.patrolWaitTimer -= dt;
      this.enemy.velocity.setAll(0);
      return;
    }

    if (!this.patrolTarget) {
      this.pickPatrolTarget();
      return;
    }

    // Move toward patrol target
    const toTarget = this.patrolTarget.subtract(this.enemy.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist < 0.5) {
      // Reached patrol point, wait then pick new one
      this.patrolWaitTimer = this.PATROL_WAIT_MIN + Math.random() * (this.PATROL_WAIT_MAX - this.PATROL_WAIT_MIN);
      this.patrolTarget = null;
      this.enemy.velocity.setAll(0);
      return;
    }

    const dir = toTarget.normalize();
    this.enemy.velocity.x = dir.x * this.PATROL_SPEED;
    this.enemy.velocity.z = dir.z * this.PATROL_SPEED;
    this.enemy.faceDirection(dir);
  }

  private updateChase(dt: number, toPlayer: Vector3, distToPlayer: number, distToSpawn: number, playerAlive: boolean): void {
    // Leash check - too far from spawn, go back
    if (distToSpawn > this.LEASH_RANGE) {
      this.state = AIState.RETURN;
      this.enemy.velocity.setAll(0);
      return;
    }

    // Player dead or too far
    if (!playerAlive || distToPlayer > this.LEASH_RANGE) {
      this.state = AIState.RETURN;
      this.enemy.velocity.setAll(0);
      return;
    }

    // In attack range
    if (distToPlayer < this.ATTACK_RANGE) {
      this.state = AIState.ATTACK;
      this.enemy.velocity.setAll(0);
      return;
    }

    // Chase player
    const dir = toPlayer.normalize();
    this.enemy.velocity.x = dir.x * this.CHASE_SPEED;
    this.enemy.velocity.z = dir.z * this.CHASE_SPEED;
    this.enemy.faceDirection(dir);
  }

  private updateAttack(dt: number, toPlayer: Vector3, distToPlayer: number, playerAlive: boolean): void {
    // Player escaped or died
    if (!playerAlive || distToPlayer > this.ATTACK_RANGE * 1.5) {
      this.state = AIState.CHASE;
      return;
    }

    // Face player
    const dir = toPlayer.normalize();
    this.enemy.faceDirection(dir);
    this.enemy.velocity.setAll(0);

    // Attack on cooldown
    if (this.attackTimer <= 0) {
      this.enemy.onAttackPlayer(this.enemy.def.damage);
      this.attackTimer = this.ATTACK_COOLDOWN;
    }
  }

  private updateReturn(dt: number, toSpawn: Vector3, distToSpawn: number, distToPlayer: number, playerAlive: boolean): void {
    // Player came close again while returning
    if (playerAlive && distToPlayer < this.DETECTION_RANGE * 0.7) {
      this.state = AIState.CHASE;
      return;
    }

    // Reached spawn
    if (distToSpawn < 1) {
      this.state = AIState.IDLE;
      this.idleTimer = 1 + Math.random() * 2;
      this.enemy.velocity.setAll(0);
      // Heal when returning to spawn
      this.enemy.heal(this.enemy.maxHp);
      return;
    }

    // Walk back to spawn
    const dir = toSpawn.normalize();
    this.enemy.velocity.x = dir.x * this.PATROL_SPEED;
    this.enemy.velocity.z = dir.z * this.PATROL_SPEED;
    this.enemy.faceDirection(dir);
  }

  private pickPatrolTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * this.PATROL_RADIUS;
    this.patrolTarget = new Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      0,
      this.spawnPos.z + Math.sin(angle) * dist
    );
  }

  public onDeath(): void {
    this.state = AIState.DEAD;
    this.enemy.velocity.setAll(0);
  }
}
