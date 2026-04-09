/**
 * Sprint 6 — Kalkan Kure Efekti
 * E yeteneginin Fresnel benzeri glow kure gorseli.
 * ShaderMaterial yerine StandardMaterial + wireframe hile kullanilir (sadelik icin).
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { GlowLayer } from '@babylonjs/core/Layers/glowLayer';

export class ShieldSphereEffect {
  private scene: Scene;
  private glowLayer: GlowLayer | null;

  private outerSphere: Mesh | null = null;
  private innerSphere: Mesh | null = null;
  private outerMat: StandardMaterial | null = null;
  private innerMat: StandardMaterial | null = null;
  private particles: ParticleSystem | null = null;

  private pulseTime = 0;
  private active = false;

  constructor(scene: Scene, glowLayer: GlowLayer | null = null) {
    this.scene = scene;
    this.glowLayer = glowLayer;
  }

  public create(
    center: Vector3,
    radius: number,
    color: Color3 = new Color3(0.6, 0.25, 1.0),
  ): void {
    this.dispose();
    this.active = true;
    this.pulseTime = 0;

    // Dis kure (wireframe glow benzeri etki)
    this.outerSphere = MeshBuilder.CreateSphere('shield_outer', {
      diameter: radius * 2 + 0.1,
      segments: 16,
    }, this.scene);
    this.outerSphere.position.copyFrom(center);
    this.outerSphere.isPickable = false;

    this.outerMat = new StandardMaterial('shield_outer_mat', this.scene);
    this.outerMat.emissiveColor = color;
    this.outerMat.diffuseColor = Color3.Black();
    this.outerMat.alpha = 0.25;
    this.outerMat.wireframe = false;
    this.outerMat.backFaceCulling = false;
    this.outerMat.disableLighting = true;
    this.outerSphere.material = this.outerMat;

    // Ic kure (daha seffaf, ic yuzey)
    this.innerSphere = MeshBuilder.CreateSphere('shield_inner', {
      diameter: radius * 2 - 0.05,
      segments: 12,
    }, this.scene);
    this.innerSphere.position.copyFrom(center);
    this.innerSphere.isPickable = false;

    this.innerMat = new StandardMaterial('shield_inner_mat', this.scene);
    this.innerMat.emissiveColor = color.scale(0.4);
    this.innerMat.diffuseColor = Color3.Black();
    this.innerMat.alpha = 0.08;
    this.innerMat.backFaceCulling = false;
    this.innerMat.disableLighting = true;
    this.innerSphere.material = this.innerMat;

    if (this.glowLayer) {
      this.glowLayer.addIncludedOnlyMesh(this.outerSphere);
    }

    // Ambient particles (kure etrafinda donen)
    this.particles = new ParticleSystem('shield_particles', 80, this.scene);
    this.particles.emitter = center.clone() as unknown as Vector3;
    this.particles.createSphereEmitter(radius, 0);
    this.particles.color1 = new Color4(color.r, color.g, color.b, 0.8);
    this.particles.color2 = new Color4(color.r * 0.7, color.g * 0.7, color.b, 0.5);
    this.particles.colorDead = new Color4(0, 0, 0, 0);
    this.particles.minSize = 0.04;
    this.particles.maxSize = 0.12;
    this.particles.minLifeTime = 0.8;
    this.particles.maxLifeTime = 1.5;
    this.particles.emitRate = 40;
    this.particles.minEmitPower = 0.2;
    this.particles.maxEmitPower = 0.5;
    this.particles.gravity = new Vector3(0, 0.3, 0);
    this.particles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.particles.start();
  }

  /** Her frame cagir. */
  public update(dt: number, targetPos?: Vector3): void {
    if (!this.active) return;
    this.pulseTime += dt;

    const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.03;

    if (this.outerSphere) {
      this.outerSphere.scaling.setAll(pulse);
      if (targetPos) this.outerSphere.position.copyFrom(targetPos);
    }
    if (this.innerSphere) {
      this.innerSphere.scaling.setAll(pulse * 0.98);
      if (targetPos) this.innerSphere.position.copyFrom(targetPos);
    }
    if (this.particles && targetPos) {
      (this.particles.emitter as unknown as Vector3) = targetPos.clone();
    }

    // Alpha pulse
    if (this.outerMat) {
      this.outerMat.alpha = 0.22 + Math.sin(this.pulseTime * 4) * 0.05;
    }
  }

  /** Kalkan kirilininca patlama efekti. */
  public burst(color: Color3 = new Color3(0.6, 0.25, 1.0)): void {
    if (!this.outerSphere) return;
    const pos = this.outerSphere.position.clone();

    // Kure hizla buyur ve solar
    let t = 0;
    const startScale = this.outerSphere.scaling.x;
    const interval = setInterval(() => {
      t += 0.016;
      if (t >= 0.3 || !this.outerSphere) {
        clearInterval(interval);
        this.dispose();
        return;
      }
      const s = startScale + (3.5 - startScale) * (t / 0.3);
      if (this.outerSphere) this.outerSphere.scaling.setAll(s);
      if (this.outerMat) this.outerMat.alpha = 0.25 * (1 - t / 0.3);
      if (this.innerSphere) this.innerSphere.scaling.setAll(s * 0.98);
      if (this.innerMat) this.innerMat.alpha = 0.08 * (1 - t / 0.3);
    }, 16);
  }

  public dispose(): void {
    this.active = false;
    if (this.particles) {
      this.particles.stop();
      this.particles.dispose();
      this.particles = null;
    }
    if (this.glowLayer && this.outerSphere) {
      this.glowLayer.removeIncludedOnlyMesh(this.outerSphere);
    }
    this.outerSphere?.dispose();
    this.outerMat?.dispose();
    this.innerSphere?.dispose();
    this.innerMat?.dispose();
    this.outerSphere = null;
    this.outerMat = null;
    this.innerSphere = null;
    this.innerMat = null;
  }
}
