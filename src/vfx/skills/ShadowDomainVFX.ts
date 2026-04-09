/**
 * Golge Alani (Shadow Domain) VFX — S-Rank Ultimate Boss Skill
 * Domain expansion: devasa golge kubbe + sutunlar + firtina + karanlik
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const NIGHT_PURPLE = new Color3(0.1, 0.0, 0.2);
const ENERGY_PURPLE = new Color3(0.48, 0.18, 0.75);
const ACCENT_RED = new Color3(1.0, 0.0, 0.4);

export function playShadowDomainVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  radius: number,
): void {
  // ─── 1. Uc katman buyu cemberi ───
  vfx.groundDecal.spawn(center, radius, 4.0, vfx.getMagicCircleTexture(), NIGHT_PURPLE, 0.4, true);
  vfx.groundDecal.spawn(center, radius * 0.7, 4.0, vfx.getMagicCircleTexture(), ENERGY_PURPLE, -0.6, true);
  vfx.groundDecal.spawn(center, radius * 0.4, 4.0, vfx.getMagicCircleTexture(), ACCENT_RED, 1.0, true);

  // ─── 2. Golge sutunlari (stagger) ───
  setTimeout(() => {
    const pillarCount = 8;
    const pillars: { mesh: Mesh; mat: StandardMaterial }[] = [];

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const dist = radius * 0.65;
      const px = center.x + Math.cos(angle) * dist;
      const pz = center.z + Math.sin(angle) * dist;

      const pillar = MeshBuilder.CreateCylinder(`vfx_domain_pillar_${i}`, {
        height: 0.1, diameter: 0.5, tessellation: 8,
      }, scene);
      pillar.position.set(px, center.y, pz);
      pillar.isPickable = false;

      const mat = new StandardMaterial(`vfx_domain_pm_${i}`, scene);
      mat.emissiveColor = NIGHT_PURPLE;
      mat.diffuseColor = Color3.Black();
      mat.alpha = 0.6;
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      pillar.material = mat;
      vfx.glowLayer.addIncludedOnlyMesh(pillar);

      pillars.push({ mesh: pillar, mat });
    }

    // Sutun animasyonu
    const pillarStart = Date.now();
    const pillarInterval = setInterval(() => {
      const elapsed = (Date.now() - pillarStart) / 1000;

      for (let i = 0; i < pillars.length; i++) {
        const p = pillars[i];
        const delay = i * 0.08;
        const t = Math.max(0, elapsed - delay);
        const maxH = 12 + Math.random() * 5;

        if (t < 0.8) {
          p.mesh.scaling.y = (t / 0.8) * maxH;
          p.mesh.position.y = center.y + (t / 0.8) * maxH * 0.05;
        } else if (t < 3.0) {
          p.mesh.scaling.y = maxH + Math.sin(t * 6) * 0.5;
        } else if (t < 4.0) {
          const fadeT = (t - 3.0) / 1.0;
          p.mat.alpha = 0.6 * (1 - fadeT);
        } else {
          p.mesh.dispose();
          p.mat.dispose();
        }
      }

      if (elapsed > 4.5) {
        clearInterval(pillarInterval);
        for (const p of pillars) {
          if (!p.mesh.isDisposed()) p.mesh.dispose();
          if (!p.mat.isFrozen) p.mat.dispose();
        }
      }
    }, 16);
  }, 200);

  // ─── 3. Golge firtinasi ───
  setTimeout(() => {
    const stormConfig = vfx.createPurpleSparkConfig('vfx_domain_storm', 1000);
    const storm = vfx.particlePool.acquire({
      ...stormConfig,
      emitRate: 500,
      minEmitPower: 4,
      maxEmitPower: 10,
      minLifeTime: 0.8,
      maxLifeTime: 2.0,
      minSize: 0.05,
      maxSize: 0.25,
      color1: new Color4(0.1, 0.0, 0.2, 0.7),
      color2: new Color4(0.48, 0.18, 0.75, 0.5),
      colorDead: new Color4(0.0, 0.0, 0.0, 0.0),
      gravity: new Vector3(0, 2, 0),
    });
    const emitter = vfx.createSphereEmitter(radius * 0.5, 1);
    storm.particleEmitterType = emitter;
    storm.emitter = center.add(new Vector3(0, 0.5, 0));
    storm.start();

    setTimeout(() => storm.stop(), 2500);
    setTimeout(() => vfx.particlePool.release(storm), 4000);
  }, 400);

  // ─── 4. PEAK — isik + shockwave + shake ───
  setTimeout(() => {
    vfx.shockwave.spawn(center, radius, 0.6, ACCENT_RED, 0.15);
    vfx.lightFlash.flash(center.add(new Vector3(0, 1, 0)), ENERGY_PURPLE, 8, 0.5, 20);

    // Yan isiklar
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lx = center.x + Math.cos(angle) * radius * 0.5;
      const lz = center.z + Math.sin(angle) * radius * 0.5;
      vfx.lightFlash.flash(new Vector3(lx, center.y + 0.5, lz), ACCENT_RED, 3, 0.4, 8);
    }

    vfx.screenShake.shake(0.2, 1.0);
  }, 800);

  // ─── 5. Surekli dusuk titresim ───
  let shakeCount = 0;
  const shakeInterval = setInterval(() => {
    if (shakeCount > 10) { clearInterval(shakeInterval); return; }
    vfx.screenShake.shake(0.025, 0.3);
    shakeCount++;
  }, 300);

  setTimeout(() => clearInterval(shakeInterval), 3500);
}
