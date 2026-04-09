/**
 * Sprint 6 — Golge Alani Kubbe Efekti (S-Rank Ultimate)
 * Buyuk yari-kure + zemin donusumu + ambient darken.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

export class DomainEffect {
  private scene: Scene;
  private dome: Mesh | null = null;
  private domeMat: StandardMaterial | null = null;
  private particles: ParticleSystem | null = null;
  private ambientLight: HemisphericLight | null = null;
  private originalAmbientIntensity = 0.5;
  private active = false;
  private pulseTime = 0;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Kubbe genislemesi baslar.
   * @param center    Alan merkezi
   * @param radius    Kubbe yarıcapi (18 birim S-Rank icin)
   * @param duration  Aktif kalma suresi
   */
  public expand(center: Vector3, radius: number, duration: number): void {
    this.collapse();
    this.active = true;
    this.pulseTime = 0;

    // Kubbe mesh (yari kure)
    this.dome = MeshBuilder.CreateSphere('domain_dome', {
      diameter: radius * 2,
      segments: 24,
      arc: 0.5,     // Yari kure
      slice: 1,
    }, this.scene);
    this.dome.position.copyFrom(center);
    this.dome.isPickable = false;

    this.domeMat = new StandardMaterial('domain_dome_mat', this.scene);
    this.domeMat.emissiveColor = new Color3(0.12, 0.02, 0.22);
    this.domeMat.diffuseColor = Color3.Black();
    this.domeMat.alpha = 0.0;
    this.domeMat.backFaceCulling = false;
    this.domeMat.disableLighting = true;
    this.dome.material = this.domeMat;

    // Genisleme animasyonu
    this.dome.scaling.setAll(0.01);
    let t = 0;
    const expandInterval = setInterval(() => {
      t += 0.016;
      if (t >= 0.5 || !this.dome) {
        clearInterval(expandInterval);
        return;
      }
      const s = t / 0.5;
      this.dome.scaling.setAll(s);
      if (this.domeMat) this.domeMat.alpha = 0.35 * s;
    }, 16);

    // Ambient karatma
    const lights = this.scene.lights;
    for (const light of lights) {
      if (light instanceof HemisphericLight) {
        this.ambientLight = light;
        this.originalAmbientIntensity = light.intensity;
        let lt = 0;
        const darkInterval = setInterval(() => {
          lt += 0.016;
          if (lt >= 0.8 || !this.ambientLight) {
            clearInterval(darkInterval);
            return;
          }
          const s = lt / 0.8;
          this.ambientLight.intensity = this.originalAmbientIntensity * (1 - s * 0.6);
        }, 16);
        break;
      }
    }

    // Partikul firtinasi
    this.particles = new ParticleSystem('domain_particles', 800, this.scene);
    this.particles.emitter = center.clone() as unknown as Vector3;
    this.particles.createSphereEmitter(radius * 0.8, 0.5);
    this.particles.color1 = new Color4(0.4, 0.1, 0.7, 0.8);
    this.particles.color2 = new Color4(0.1, 0.0, 0.3, 0.4);
    this.particles.colorDead = new Color4(0, 0, 0, 0);
    this.particles.minSize = 0.05;
    this.particles.maxSize = 0.2;
    this.particles.minLifeTime = 1.0;
    this.particles.maxLifeTime = 3.0;
    this.particles.emitRate = 200;
    this.particles.minEmitPower = 0.5;
    this.particles.maxEmitPower = 2.0;
    this.particles.gravity = new Vector3(0, 0.2, 0);
    this.particles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.particles.start();

    // Otomatik coz (duration sonrasi)
    setTimeout(() => this.collapse(), duration * 1000);
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    if (!this.active) return;
    this.pulseTime += dt;

    // Kubbe pulse
    if (this.domeMat) {
      this.domeMat.alpha = 0.32 + Math.sin(this.pulseTime * 1.5) * 0.05;
    }
  }

  /** Kubbe cozulmesi (3 saniye). */
  public collapse(): void {
    if (!this.active) return;
    this.active = false;

    if (this.particles) {
      this.particles.stop();
    }

    // Ambient iyilesme
    if (this.ambientLight) {
      const targetIntensity = this.originalAmbientIntensity;
      const light = this.ambientLight;
      let t = 0;
      const restoreInterval = setInterval(() => {
        t += 0.016;
        if (t >= 1.5) {
          clearInterval(restoreInterval);
          light.intensity = targetIntensity;
          return;
        }
        const s = t / 1.5;
        light.intensity = light.intensity + (targetIntensity - light.intensity) * s * 0.1;
      }, 16);
      this.ambientLight = null;
    }

    // Kubbe shrink
    if (this.dome) {
      const dome = this.dome;
      const domeMat = this.domeMat;
      let t = 0;
      const collapseInterval = setInterval(() => {
        t += 0.016;
        if (t >= 1.5) {
          clearInterval(collapseInterval);
          dome.dispose();
          domeMat?.dispose();
          return;
        }
        const s = 1 - t / 1.5;
        dome.scaling.setAll(s);
        if (domeMat) domeMat.alpha = 0.35 * s;
      }, 16);
      this.dome = null;
      this.domeMat = null;
    }

    // Particulleri bekle sonra temizle
    setTimeout(() => {
      this.particles?.dispose();
      this.particles = null;
    }, 2000);
  }

  public dispose(): void {
    this.active = false;
    if (this.ambientLight) {
      this.ambientLight.intensity = this.originalAmbientIntensity;
      this.ambientLight = null;
    }
    this.particles?.stop();
    this.particles?.dispose();
    this.dome?.dispose();
    this.domeMat?.dispose();
    this.particles = null;
    this.dome = null;
    this.domeMat = null;
  }
}
