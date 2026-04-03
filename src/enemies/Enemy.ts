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

export interface EnemyDef {
  name: string;
  hp: number;
  damage: number;
  xpReward: number;
  goldReward: number;
  color: Color3;
  scale: number;
  level: number;
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

  // Callbacks
  private onDeath: ((enemy: Enemy) => void) | null = null;
  private onAttack: ((damage: number) => void) | null = null;

  constructor(scene: Scene, spawnPos: Vector3, def: EnemyDef) {
    this.scene = scene;
    this.def = def;
    this.id = Enemy.nextId++;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.position = spawnPos.clone();

    // Create mesh
    this.mesh = MeshBuilder.CreateCapsule(`enemy_${this.id}`, {
      height: 1.8 * def.scale,
      radius: 0.35 * def.scale,
    }, scene);
    this.mesh.position = spawnPos.clone();
    this.mesh.position.y += 0.9 * def.scale;

    this.mat = new StandardMaterial(`enemyMat_${this.id}`, scene);
    this.mat.diffuseColor = def.color.clone();
    this.mat.specularColor = def.color.scale(0.5);
    this.mesh.material = this.mat;

    // Physics
    this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.CAPSULE, {
      mass: 0, restitution: 0,
    }, scene);

    // HP bar
    this.hpBarBg = MeshBuilder.CreatePlane(`ehpBg_${this.id}`, { width: 1.0, height: 0.1 }, scene);
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
  public setOnAttackPlayer(cb: (damage: number) => void): void { this.onAttack = cb; }

  public update(dt: number, playerPos: Vector3, playerAlive: boolean): void {
    if (this.isDead) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.mesh.isVisible = false;
        this.hpBarBg.isVisible = false;
      }
      return;
    }

    // AI update
    this.ai.update(dt, playerPos, playerAlive);

    // Apply velocity (simple movement, no physics engine for enemies)
    if (this.velocity.lengthSquared() > 0.01) {
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
    }

    // Ground snap via raycast
    const floorY = this.getFloorY();
    this.position.y = floorY;

    // Sync mesh
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y + 0.9 * this.def.scale;
    this.mesh.position.z = this.position.z;

    // HP bar position
    this.hpBarBg.position.x = this.mesh.position.x;
    this.hpBarBg.position.y = this.mesh.position.y + 1.2 * this.def.scale;
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

    // Flash white
    this.hitFlashTimer = 0.1;
    this.mat.diffuseColor = new Color3(1, 1, 1);
    this.mat.emissiveColor = new Color3(0.5, 0.5, 0.5);

    // Knockback on crit
    if (isCritical) {
      const knockDir = this.position.subtract(attackerPos);
      knockDir.y = 0;
      knockDir.normalize();
      this.position.addInPlace(knockDir.scale(0.4));
    }

    // Update HP bar
    const ratio = Math.max(0.01, this.hp / this.maxHp);
    this.hpBarFill.scaling.x = ratio;
    if (ratio > 0.5) {
      this.fillMat.diffuseColor = new Color3(0.8, 0.1, 0.1);
    } else if (ratio > 0.25) {
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
    this.mat.alpha = 0.4;
    this.mesh.scaling.scaleInPlace(0.6);
    this.hpBarBg.isVisible = false;
    this.deathTimer = 3; // visible for 3 seconds before disappearing
    if (this.onDeath) this.onDeath(this);
  }

  public onAttackPlayer(damage: number): void {
    if (this.onAttack) this.onAttack(damage);
  }

  public faceDirection(dir: Vector3): void {
    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
  }

  public heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const ratio = this.hp / this.maxHp;
    this.hpBarFill.scaling.x = Math.max(0.01, ratio);
  }

  public isAlive(): boolean { return !this.isDead; }

  public canRespawn(): boolean { return this.isDead && this.deathTimer <= 0; }

  public respawn(pos: Vector3): void {
    this.isDead = false;
    this.hp = this.maxHp;
    this.position = pos.clone();
    this.mesh.position = pos.clone();
    this.mesh.position.y += 0.9 * this.def.scale;
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
