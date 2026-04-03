import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { PhysicsShapeType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { Damageable } from '../combat/CombatSystem';

/**
 * Test dummy enemy - stands still, can be hit, shows HP bar
 * Used for testing combat before real AI enemies are added
 */
export class TestDummy implements Damageable {
  private static nextId = 0;

  public mesh: Mesh;
  public hp: number;
  public maxHp: number;

  private scene: Scene;
  private hpBarBg: Mesh;
  private hpBarFill: Mesh;
  private hitFlashTimer = 0;
  private originalColor: Color3;
  private mat: StandardMaterial;
  private fillMat!: StandardMaterial;
  private aggregate: PhysicsAggregate;
  private id: number;

  constructor(scene: Scene, position: Vector3, hp: number = 200) {
    this.scene = scene;
    this.maxHp = hp;
    this.hp = hp;
    this.id = TestDummy.nextId++;

    // Body - red capsule
    this.mesh = MeshBuilder.CreateCapsule(`dummy_${this.id}`, {
      height: 1.8,
      radius: 0.35,
    }, scene);
    this.mesh.position = position.clone();
    this.mesh.position.y += 0.9;

    this.originalColor = new Color3(0.6, 0.1, 0.1);
    this.mat = new StandardMaterial(`dummyMat_${this.id}`, scene);
    this.mat.diffuseColor = this.originalColor.clone();
    this.mat.specularColor = new Color3(0.3, 0.1, 0.1);
    this.mesh.material = this.mat;

    // Physics body (static)
    this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.CAPSULE, {
      mass: 0,
      restitution: 0,
    }, scene);

    // HP bar background
    this.hpBarBg = MeshBuilder.CreatePlane(`hpBg_${this.id}`, { width: 1.2, height: 0.12 }, scene);
    this.hpBarBg.position = position.clone();
    this.hpBarBg.position.y += 2.2;
    this.hpBarBg.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.hpBarBg.isPickable = false;
    // removed renderingGroupId
    const bgMat = new StandardMaterial(`hpBgMat_${this.id}`, scene);
    bgMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    bgMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
    bgMat.disableLighting = true;
    bgMat.backFaceCulling = false;
    this.hpBarBg.material = bgMat;

    // HP bar fill - child of bg so billboard works together
    this.hpBarFill = MeshBuilder.CreatePlane(`hpFill_${this.id}`, { width: 1.15, height: 0.08 }, scene);
    this.hpBarFill.parent = this.hpBarBg;
    this.hpBarFill.position.set(0, 0, -0.001); // tiny offset in local space
    this.hpBarFill.isPickable = false;
    // removed renderingGroupId
    this.fillMat = new StandardMaterial(`hpFillMat_${this.id}`, scene);
    this.fillMat.diffuseColor = new Color3(0.1, 0.8, 0.1);
    this.fillMat.emissiveColor = new Color3(0.05, 0.4, 0.05);
    this.fillMat.disableLighting = true;
    this.fillMat.backFaceCulling = false;
    this.hpBarFill.material = this.fillMat;
  }

  public takeDamage(amount: number, isCritical: boolean, attackerPos: Vector3): void {
    this.hp = Math.max(0, this.hp - amount);

    // Flash white on hit
    this.hitFlashTimer = 0.1;
    this.mat.diffuseColor = new Color3(1, 1, 1);
    this.mat.emissiveColor = new Color3(0.5, 0.5, 0.5);

    // Knockback
    if (isCritical) {
      const knockDir = this.mesh.position.subtract(attackerPos);
      knockDir.y = 0;
      knockDir.normalize();
      this.mesh.position.addInPlace(knockDir.scale(0.3));
    }

    // Update HP bar
    this.updateHpBar();

    // Death
    if (this.hp <= 0) {
      this.onDeath();
    }
  }

  private updateHpBar(): void {
    const ratio = this.hp / this.maxHp;
    this.hpBarFill.scaling.x = Math.max(0.01, ratio);

    // Color: green -> yellow -> red
    if (ratio > 0.5) {
      this.fillMat.diffuseColor = new Color3(0.1, 0.8, 0.1);
      this.fillMat.emissiveColor = new Color3(0.05, 0.4, 0.05);
    } else if (ratio > 0.25) {
      this.fillMat.diffuseColor = new Color3(0.8, 0.8, 0.1);
      this.fillMat.emissiveColor = new Color3(0.4, 0.4, 0.05);
    } else {
      this.fillMat.diffuseColor = new Color3(0.8, 0.1, 0.1);
      this.fillMat.emissiveColor = new Color3(0.4, 0.05, 0.05);
    }
  }

  private onDeath(): void {
    // Shrink and fade
    this.mat.alpha = 0.3;
    this.mesh.scaling.setAll(0.5);
    this.hpBarBg.isVisible = false;
    this.hpBarFill.isVisible = false;
  }

  public isAlive(): boolean {
    return this.hp > 0;
  }

  public update(dt: number): void {
    // Hit flash recovery
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.mat.diffuseColor = this.originalColor.clone();
        this.mat.emissiveColor = new Color3(0, 0, 0);
      }
    }

    // HP bar follows mesh (fill is child of bg, so only update bg)
    this.hpBarBg.position.x = this.mesh.position.x;
    this.hpBarBg.position.y = this.mesh.position.y + 1.3;
    this.hpBarBg.position.z = this.mesh.position.z;
  }

  public respawn(): void {
    this.hp = this.maxHp;
    this.mat.alpha = 1;
    this.mat.diffuseColor = this.originalColor.clone();
    this.mesh.scaling.setAll(1);
    this.hpBarBg.isVisible = true;
    this.hpBarFill.isVisible = true;
    this.updateHpBar();
  }

  public dispose(): void {
    this.mesh.dispose();
    this.hpBarBg.dispose();
    this.hpBarFill.dispose();
    this.aggregate.dispose();
  }
}
