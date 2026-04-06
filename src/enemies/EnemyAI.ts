import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CombatSystem } from '../combat/CombatSystem';
import { ENEMY_AI } from '../config/GameConfig';
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

  // Detection — EnemyDef'ten okunur, yoksa global default
  private readonly DETECTION_RANGE: number;
  private readonly ATTACK_RANGE: number;
  private leashRange: number;
  private readonly CHASE_SPEED: number;
  private readonly PATROL_SPEED: number;

  // Attack
  private readonly ATTACK_COOLDOWN: number;
  private attackTimer = 0;

  // Patrol
  private patrolTarget: Vector3 | null = null;
  private patrolWaitTimer = 0;
  private readonly PATROL_RADIUS: number;
  private readonly PATROL_WAIT_MIN = ENEMY_AI.patrolWaitMin;
  private readonly PATROL_WAIT_MAX = ENEMY_AI.patrolWaitMax;

  // Idle timer
  private idleTimer = 0;

  private spawnPos: Vector3;
  private enemy: Enemy;
  private playerRotY = 0;

  constructor(enemy: Enemy, spawnPos: Vector3) {
    this.enemy = enemy;

    // Davranis parametreleri: EnemyDef'te tanimli ise onu kullan, yoksa global default
    const def = enemy.def;
    this.DETECTION_RANGE = def.detectionRange ?? ENEMY_AI.detectionRange;
    this.ATTACK_RANGE = def.attackRange ?? ENEMY_AI.attackRange;
    this.leashRange = ENEMY_AI.leashRange;
    this.CHASE_SPEED = def.moveSpeed ?? ENEMY_AI.chaseSpeed;
    this.PATROL_SPEED = def.patrolSpeed ?? ENEMY_AI.patrolSpeed;
    this.ATTACK_COOLDOWN = def.attackSpeed ?? ENEMY_AI.attackCooldown;
    this.PATROL_RADIUS = def.patrolRadius ?? ENEMY_AI.patrolRadius;
    this.spawnPos = spawnPos.clone();
    this.idleTimer = Math.random() * 3; // stagger initial patrol
  }

  private lastPlayerPos = Vector3.Zero();

  public update(dt: number, playerPos: Vector3, playerAlive: boolean, playerRotY: number = 0): void {
    this.playerRotY = playerRotY;
    this.lastPlayerPos.copyFrom(playerPos);
    if (this.state === AIState.DEAD) return;

    this.attackTimer = Math.max(0, this.attackTimer - dt);

    // Tehdit varsa (golge askeri hasar verdiyse) → threat pozisyonuna yonel
    // Yoksa oyuncuya yonel
    const threatPos = this.enemy.getThreatPos();
    const effectiveTarget = (threatPos && this.enemy.hasThreat()) ? threatPos : playerPos;

    const toTarget = effectiveTarget.subtract(this.enemy.position);
    toTarget.y = 0;
    const distToTarget = toTarget.length();

    const toSpawn = this.spawnPos.subtract(this.enemy.position);
    toSpawn.y = 0;
    const distToSpawn = toSpawn.length();

    // Oyuncuya mesafe (leash ve algilama icin)
    const toPlayer = playerPos.subtract(this.enemy.position);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    switch (this.state) {
      case AIState.IDLE:
        this.updateIdle(dt, distToTarget, distToPlayer, playerAlive);
        break;
      case AIState.PATROL:
        this.updatePatrol(dt, distToTarget, distToPlayer, playerAlive);
        break;
      case AIState.CHASE:
        this.updateChase(dt, toTarget, distToTarget, distToSpawn, playerAlive);
        break;
      case AIState.ATTACK:
        this.updateAttack(dt, toTarget, distToTarget, playerAlive);
        break;
      case AIState.RETURN:
        this.updateReturn(dt, toSpawn, distToSpawn, distToPlayer, playerAlive);
        break;
    }
  }

  private updateIdle(dt: number, distToTarget: number, distToPlayer: number, playerAlive: boolean): void {
    // Wait, then start patrolling
    this.idleTimer -= dt;
    if (this.idleTimer <= 0) {
      this.state = AIState.PATROL;
      this.pickPatrolTarget();
    }

    // Detect player or threat (golge askeri)
    if ((playerAlive && distToPlayer < this.DETECTION_RANGE) || distToTarget < this.DETECTION_RANGE) {
      this.state = AIState.CHASE;
    }
  }

  private updatePatrol(dt: number, distToTarget: number, distToPlayer: number, playerAlive: boolean): void {
    // Detect player or threat
    if ((playerAlive && distToPlayer < this.DETECTION_RANGE) || distToTarget < this.DETECTION_RANGE) {
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

    if (dist < ENEMY_AI.patrolTargetThreshold) {
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
    if (distToSpawn > this.leashRange) {
      this.state = AIState.RETURN;
      this.enemy.velocity.setAll(0);
      return;
    }

    // Player dead or too far
    if (!playerAlive || distToPlayer > this.leashRange) {
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

  private updateAttack(dt: number, toTarget: Vector3, distToTarget: number, playerAlive: boolean): void {
    // Target escaped
    if (distToTarget > this.ATTACK_RANGE * ENEMY_AI.attackRangeEscapeMultiplier) {
      this.state = AIState.CHASE;
      return;
    }

    // Face target
    const dir = toTarget.normalize();
    this.enemy.faceDirection(dir);
    this.enemy.velocity.setAll(0);

    // Attack on cooldown
    if (this.attackTimer <= 0) {
      const hasThreat = this.enemy.hasThreat();

      if (hasThreat) {
        // Golge askerine saldir
        this.enemy.onAttackThreatTarget(this.enemy.def.damage);
        this.attackTimer = this.ATTACK_COOLDOWN;
      } else if (playerAlive) {
        // Oyuncuya saldir
        // Zaten faceDirection ile hedefe donuldugu icin, saldiri menzilindeyse
        // dogrudan saldir. Cok yakin mesafede isFacing yanlis sonuc veriyor.
        const playerPos = this.lastPlayerPos;
        const canAttack = distToTarget < this.ATTACK_RANGE * 0.8
          || CombatSystem.isFacing(this.enemy.position, this.enemy.getRotationY(), playerPos);
        if (canAttack) {
          const isBackstab = CombatSystem.isTargetBehind(
            this.enemy.position,
            playerPos,
            this.playerRotY,
          );
          this.enemy.onAttackPlayer(this.enemy.def.damage, isBackstab);
          this.attackTimer = this.ATTACK_COOLDOWN;
        }
      }
    }
  }

  private updateReturn(dt: number, toSpawn: Vector3, distToSpawn: number, distToPlayer: number, playerAlive: boolean): void {
    // Player came close again while returning
    if (playerAlive && distToPlayer < this.DETECTION_RANGE * ENEMY_AI.detectionReturnMultiplier) {
      this.state = AIState.CHASE;
      return;
    }

    // Reached spawn
    if (distToSpawn < ENEMY_AI.spawnReturnThreshold) {
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

  /** Leash mesafesini degistir (boss icin cok yuksek yap) */
  public setLeashRange(range: number): void { this.leashRange = range; }

  public onDeath(): void {
    this.state = AIState.DEAD;
    this.enemy.velocity.setAll(0);
  }
}
