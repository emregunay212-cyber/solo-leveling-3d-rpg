import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { Ray } from '@babylonjs/core/Culling/ray';
import { EnemyAI } from './EnemyAI';
import type { Damageable } from '../combat/CombatSystem';
import { ENEMY_VISUAL, SHADOW } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';
import type { GameContext } from '../core/GameContext';

export interface EnemyDef {
  name: string;
  hp: number;
  damage: number;
  xpReward: number;
  goldReward: number;
  color: Color3;
  scale: number;
  level: number;
  isBoss: boolean;
  shadowSkillIds: readonly string[];
}

/**
 * Enemy entity with AI, HP bar, physics, and loot
 */
export class Enemy implements Damageable {
  private static nextId = 0;

  public mesh: Mesh;
  public hp: number;
  public maxHp: number;
  public position: Vector3;
  public velocity = Vector3.Zero();
  public def: EnemyDef;
  public ai: EnemyAI;
  public typeKey = '';

  private scene: Scene;
  private id: number;
  private mat: StandardMaterial;
  private hpBarBg: Mesh;
  private hpBarFill: Mesh;
  private fillMat: StandardMaterial;
  private aggregate: PhysicsAggregate;
  private hitFlashTimer = 0;
  private deathTimer = 0;
  private isDead = false;
  private extracted = false;

  // Threat sistemi — golge askeri hasar verince dusmanin dikkatini ceker
  private threatPos: Vector3 | null = null;
  private threatTimer = 0;

  // Callbacks
  private onDeath: ((enemy: Enemy) => void) | null = null;
  private onAttack: ((damage: number, isBackstab: boolean) => void) | null = null;
  private onAttackThreat: ((damage: number, threatPos: Vector3) => void) | null = null;

  constructor(scene: Scene, spawnPos: Vector3, def: EnemyDef) {
    this.scene = scene;
    this.def = def;
    this.id = Enemy.nextId++;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.position = spawnPos.clone();

    // Create mesh
    this.mesh = MeshBuilder.CreateCapsule(`enemy_${this.id}`, {
      height: ENEMY_VISUAL.bodyHeightMultiplier * def.scale,
      radius: ENEMY_VISUAL.bodyRadiusMultiplier * def.scale,
    }, scene);
    this.mesh.position = spawnPos.clone();
    this.mesh.position.y += ENEMY_VISUAL.meshYOffsetMultiplier * def.scale;

    this.mat = new StandardMaterial(`enemyMat_${this.id}`, scene);
    this.mat.diffuseColor = def.color.clone();
    this.mat.specularColor = def.color.scale(0.5);
    this.mesh.material = this.mat;

    // Physics
    this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.CAPSULE, {
      mass: 0, restitution: 0,
    }, scene);

    // HP bar
    this.hpBarBg = MeshBuilder.CreatePlane(`ehpBg_${this.id}`, { width: ENEMY_VISUAL.hpBarWidth, height: ENEMY_VISUAL.hpBarHeight }, scene);
    this.hpBarBg.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.hpBarBg.isPickable = false;
    const bgMat = new StandardMaterial(`ehpBgMat_${this.id}`, scene);
    bgMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    bgMat.emissiveColor = new Color3(0.08, 0.08, 0.08);
    bgMat.disableLighting = true;
    bgMat.backFaceCulling = false;
    this.hpBarBg.material = bgMat;

    this.hpBarFill = MeshBuilder.CreatePlane(`ehpFill_${this.id}`, { width: 0.95, height: 0.07 }, scene);
    this.hpBarFill.parent = this.hpBarBg;
    this.hpBarFill.position.set(0, 0, -0.001);
    this.hpBarFill.isPickable = false;
    this.fillMat = new StandardMaterial(`ehpFillMat_${this.id}`, scene);
    this.fillMat.diffuseColor = new Color3(0.8, 0.1, 0.1);
    this.fillMat.emissiveColor = new Color3(0.4, 0.05, 0.05);
    this.fillMat.disableLighting = true;
    this.fillMat.backFaceCulling = false;
    this.hpBarFill.material = this.fillMat;

    // Name label above HP bar would go here (Phase later)

    // AI
    this.ai = new EnemyAI(this, spawnPos);
  }

  public setOnDeath(cb: (enemy: Enemy) => void): void { this.onDeath = cb; }
  public setOnAttackPlayer(cb: (damage: number, isBackstab: boolean) => void): void { this.onAttack = cb; }
  public setOnAttackThreat(cb: (damage: number, threatPos: Vector3) => void): void { this.onAttackThreat = cb; }

  public update(ctx: GameContext): void {
    const dt = ctx.deltaTime;
    if (this.isDead) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.mesh.isVisible = false;
        this.hpBarBg.isVisible = false;
      }
      return;
    }

    // AI update
    this.ai.update(dt, ctx.player.position, ctx.player.isAlive, ctx.player.rotationY);

    // Slow timer
    if (this.slowTimer > 0) this.slowTimer -= dt;

    // Threat timer
    if (this.threatTimer > 0) {
      this.threatTimer -= dt;
      if (this.threatTimer <= 0) this.threatPos = null;
    }

    // Apply velocity (slow efekti hesaba katilir)
    if (this.velocity.lengthSquared() > 0.01) {
      const slow = this.getSlowMultiplier();
      this.position.x += this.velocity.x * dt * slow;
      this.position.z += this.velocity.z * dt * slow;
    }

    // Ground snap via raycast
    const floorY = this.getFloorY();
    this.position.y = floorY;

    // Sync mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y + ENEMY_VISUAL.meshYOffsetMultiplier * this.def.scale;
    this.mesh.position.z = this.position.z;

    // HP bar position
    this.hpBarBg.position.x = this.mesh.position.x;
    this.hpBarBg.position.y = this.mesh.position.y + ENEMY_VISUAL.hpBarYOffsetMultiplier * this.def.scale;
    this.hpBarBg.position.z = this.mesh.position.z;

    // Hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.mat.diffuseColor = this.def.color.clone();
        this.mat.emissiveColor = Color3.Black();
      }
    }
  }

  public takeDamage(amount: number, isCritical: boolean, attackerPos: Vector3): void {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);

    // Threat: saldirganin pozisyonunu kaydet (golge askerler icin)
    this.threatPos = attackerPos.clone();
    this.threatTimer = SHADOW.threatDuration;

    // Flash white
    this.hitFlashTimer = ENEMY_VISUAL.hitFlashDuration;
    this.mat.diffuseColor = new Color3(1, 1, 1);
    this.mat.emissiveColor = new Color3(0.5, 0.5, 0.5);

    // Knockback on crit
    if (isCritical) {
      const knockDir = this.position.subtract(attackerPos);
      knockDir.y = 0;
      knockDir.normalize();
      this.position.addInPlace(knockDir.scale(ENEMY_VISUAL.knockbackDistance));
    }

    // Update HP bar
    const ratio = Math.max(0.01, this.hp / this.maxHp);
    this.hpBarFill.scaling.x = ratio;
    if (ratio > ENEMY_VISUAL.hpColorThresholds.yellow) {
      this.fillMat.diffuseColor = new Color3(0.8, 0.1, 0.1);
    } else if (ratio > ENEMY_VISUAL.hpColorThresholds.red) {
      this.fillMat.diffuseColor = new Color3(0.8, 0.6, 0.1);
    } else {
      this.fillMat.diffuseColor = new Color3(0.8, 0.1, 0.1);
      this.fillMat.emissiveColor = new Color3(0.5, 0.05, 0.05);
    }

    // Death
    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.ai.onDeath();
    this.mat.alpha = ENEMY_VISUAL.deathOpacity;
    this.mesh.scaling.scaleInPlace(ENEMY_VISUAL.deathScale);
    this.hpBarBg.isVisible = false;
    this.deathTimer = ENEMY_VISUAL.deathTimer;
    if (this.onDeath) this.onDeath(this);
    eventBus.emit('enemy:death', {
      enemy: this,
      xpReward: this.def.xpReward,
      goldReward: this.def.goldReward,
    });
  }

  public onAttackPlayer(damage: number, isBackstab: boolean = false): void {
    if (this.onAttack) this.onAttack(damage, isBackstab);
  }

  public onAttackThreatTarget(damage: number): void {
    if (this.threatPos && this.onAttackThreat) {
      this.onAttackThreat(damage, this.threatPos);
    }
  }

  public getRotationY(): number {
    return this.mesh.rotation.y;
  }

  public faceDirection(dir: Vector3): void {
    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
  }

  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const ratio = this.hp / this.maxHp;
    this.hpBarFill.scaling.x = Math.max(0.01, ratio);
  }

  // ─── Slow efekti (skill F icin) ───
  private slowMultiplier = 1;
  private slowTimer = 0;

  public applySlow(multiplier: number, duration: number): void {
    this.slowMultiplier = multiplier;
    this.slowTimer = duration;
  }

  public getSlowMultiplier(): number {
    return this.slowTimer > 0 ? this.slowMultiplier : 1;
  }

  /** Aktif tehdit pozisyonu (golge askeri hasar verdiyse) */
  public getThreatPos(): Vector3 | null {
    return this.threatPos;
  }

  public hasThreat(): boolean {
    return this.threatPos !== null && this.threatTimer > 0;
  }

  public isAlive(): boolean { return !this.isDead; }

  /** Ceset cikarilabilir mi? (olu + gorunur + henuz cikarilmamis) */
  public isExtractable(): boolean {
    return this.isDead && this.deathTimer > 0 && !this.extracted;
  }

  /** Cikarildiktan sonra tekrar cikarilmasini engelle */
  public markExtracted(): void {
    this.extracted = true;
    this.mesh.isVisible = false;
    this.hpBarBg.isVisible = false;
  }

  public canRespawn(): boolean { return this.isDead && this.deathTimer <= 0; }

  public respawn(pos: Vector3): void {
    this.isDead = false;
    this.extracted = false;
    this.hp = this.maxHp;
    this.position = pos.clone();
    this.mesh.position = pos.clone();
    this.mesh.position.y += ENEMY_VISUAL.meshYOffsetMultiplier * this.def.scale;
    this.mesh.isVisible = true;
    this.mesh.scaling.setAll(1);
    this.mat.alpha = 1;
    this.mat.diffuseColor = this.def.color.clone();
    this.hpBarBg.isVisible = true;
    this.hpBarFill.scaling.x = 1;
    this.ai = new EnemyAI(this, pos);
  }

  private getFloorY(): number {
    const origin = new Vector3(this.position.x, this.position.y + 1, this.position.z);
    const ray = new Ray(origin, Vector3.Down(), 50);
    const hit = this.scene.pickWithRay(ray, (m) => {
      return m !== this.mesh && m.isPickable && m.isEnabled() &&
        !m.name.startsWith('enemy_') && !m.name.startsWith('ehp') &&
        !m.name.startsWith('dmgNum') && !m.name.startsWith('clickRing') &&
        !m.name.startsWith('hpBg') && !m.name.startsWith('hpFill') &&
        !m.name.startsWith('playerBody');
    });
    return hit?.hit && hit.pickedPoint ? hit.pickedPoint.y : 0;
  }

  public dispose(): void {
    this.mesh.dispose();
    this.hpBarBg.dispose();
    this.hpBarFill.dispose();
    this.aggregate.dispose();
  }
}
