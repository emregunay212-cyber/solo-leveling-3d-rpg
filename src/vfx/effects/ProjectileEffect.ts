/**
 * Sprint 6 — Projectile Efekti
 * Ucan mermi: core kure + trailing particles + PointLight.
 * Alev Patlamasi (Flameburst) icin kullanilir.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

export interface ProjectileParams {
  start: Vector3;
  direction: Vector3;
  speed: number;
  maxRange: number;
  /** Gorsel yaricap */
  visualRadius: number;
  /** Isik rengi */
  lightColor: Color3;
  /** Particle rengi */
  particleColor1: Color4;
  particleColor2: Color4;
  /** Hedef noktaya ya da max menzile ulasinca cagrilir */
  onHit: (pos: Vector3) => void;
  onMaxRange: (pos: Vector3) => void;
}

export class ProjectileEffect {
  private scene: Scene;
  private core: Mesh | null = null;
  private coreMat: StandardMaterial | null = null;
  private light: PointLight | null = null;
  private particles: ParticleSystem | null = null;

  private direction = Vector3.Zero();
  private speed = 0;
  private traveledDistance = 0;
  private maxRange = 0;
  private active = false;
  private onHit: ((pos: Vector3) => void) | null = null;
  private onMaxRange: ((pos: Vector3) => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public launch(params: ProjectileParams): void {
    this.cleanup();

    this.direction = params.direction.normalize();
    this.speed = params.speed;
    this.maxRange = params.maxRange;
    this.traveledDistance = 0;
    this.active = true;
    this.onHit = params.onHit;
    this.onMaxRange = params.onMaxRange;

    // Core kure
    this.core = MeshBuilder.CreateSphere('projectile_core', {
      diameter: params.visualRadius * 2,
      segments: 8,
    }, this.scene);
    this.core.position.copyFrom(params.start);
    this.core.isPickable = false;

    this.coreMat = new StandardMaterial('projectile_mat', this.scene);
    this.coreMat.emissiveColor = new Color3(
      params.lightColor.r,
      params.lightColor.g,
      params.lightColor.b,
    );
    this.coreMat.disableLighting = true;
    this.core.material = this.coreMat;

    // Point light
    this.light = new PointLight('projectile_light', params.start.clone(), this.scene);
    this.light.diffuse = params.lightColor;
    this.light.intensity = 3.0;
    this.light.range = 6;

    // Trailing particles
    this.particles = new ParticleSystem('projectile_particles', 80, this.scene);
    this.particles.emitter = this.core;
    this.particles.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    this.particles.maxEmitBox = new Vector3(0.1, 0.1, 0.1);
    this.particles.color1 = params.particleColor1;
    this.particles.color2 = params.particleColor2;
    this.particles.colorDead = new Color4(0, 0, 0, 0);
    this.particles.minSize = 0.05;
    this.particles.maxSize = 0.25;
    this.particles.minLifeTime = 0.15;
    this.particles.maxLifeTime = 0.4;
    this.particles.emitRate = 60;
    this.particles.minEmitPower = 0.2;
    this.particles.maxEmitPower = 0.8;
    this.particles.gravity = new Vector3(0, 0.3, 0);
    this.particles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.particles.start();
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    if (!this.active || !this.core) return;

    const move = this.direction.scale(this.speed * dt);
    this.core.position.addInPlace(move);
    this.traveledDistance += this.speed * dt;

    if (this.light) {
      this.light.position.copyFrom(this.core.position);
    }

    if (this.traveledDistance >= this.maxRange) {
      const hitPos = this.core.position.clone();
      this.cleanup();
      if (this.onMaxRange) this.onMaxRange(hitPos);
    }
  }

  /** Mermi bir hedefe carpti — dis koddan cagir. */
  public triggerHit(): void {
    if (!this.active || !this.core) return;
    const hitPos = this.core.position.clone();
    this.cleanup();
    if (this.onHit) this.onHit(hitPos);
  }

  public getPosition(): Vector3 | null {
    return this.core?.position.clone() ?? null;
  }

  public isActive(): boolean {
    return this.active;
  }

  private cleanup(): void {
    this.active = false;
    if (this.particles) {
      this.particles.stop();
      this.particles.dispose();
      this.particles = null;
    }
    if (this.light) {
      this.light.dispose();
      this.light = null;
    }
    if (this.core) {
      this.core.dispose();
      this.core = null;
    }
    if (this.coreMat) {
      this.coreMat.dispose();
      this.coreMat = null;
    }
  }

  public dispose(): void {
    this.cleanup();
  }
}
