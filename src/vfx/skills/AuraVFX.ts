/**
 * F — Hukumdar Aurasi (Monarch's Aura / Sovereign Aura) VFX
 * En karmasik efekt: pillar + crack ring + golge firtinasi + light + shake + decal
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';
import type { ChargeLevel } from '../../skills/ChargeSystem';
import { CINEMATIC_SEQUENCES } from '../effects/CinematicCamera';
import { SLOW_MOTION } from '../../config/GameConfig';

const DARK_PURPLE  = new Color3(0.36, 0.05, 0.57);
const MAGENTA      = new Color3(1.0, 0.0, 0.27);
const PURPLE_ENERGY = new Color3(0.69, 0.43, 1.0);

export function playAuraVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  maxRadius: number,
  chargeLevel: ChargeLevel = 'tap',
): void {
  const isMax = chargeLevel === 'max';
  const scaledRadius = isMax ? maxRadius * 1.75 : maxRadius;

  // MAX: Sinematik kamera + slow-mo
  if (isMax) {
    vfx.slowMotion.trigger(SLOW_MOTION.ultimateScale, SLOW_MOTION.ultimateDuration);
    vfx.cinematicCamera.play(CINEMATIC_SEQUENCES.F_CINEMATIC);
  }
  // ─── 1. Buyuk buyu cemberi (hemen) ───
  vfx.groundDecal.spawn(
    center, scaledRadius, 3.5,
    vfx.getMagicCircleTexture(),
    DARK_PURPLE, 0.6, true,
  );
  vfx.groundDecal.spawn(
    center, scaledRadius * 0.7, 3.5,
    vfx.getMagicCircleTexture(),
    PURPLE_ENERGY, -0.8, true,
  );

  // ─── 2. Golge sutunlari (200ms) ───
  setTimeout(() => {
    const pillarCount = isMax ? 8 : 6;
    const pillars: { mesh: Mesh; mat: StandardMaterial }[] = [];

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const dist = scaledRadius * 0.6;
      const px = center.x + Math.cos(angle) * dist;
      const pz = center.z + Math.sin(angle) * dist;

      const pillar = MeshBuilder.CreateCylinder(`vfx_aura_pillar_${i}`, {
        height: 0.1, diameter: 0.4, tessellation: 12,
      }, scene);
      pillar.position.set(px, center.y, pz);
      pillar.isPickable = false;

      const mat = new StandardMaterial(`vfx_aura_pm_${i}`, scene);
      mat.emissiveColor = DARK_PURPLE;
      mat.diffuseColor = Color3.Black();
      mat.alpha = 0.5;
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      pillar.material = mat;
      vfx.glowLayer.addIncludedOnlyMesh(pillar);

      pillars.push({ mesh: pillar, mat });
    }

    // Sutun yuksekligi animasyonu
    const pillarStart = Date.now();
    const pillarInterval = setInterval(() => {
      const elapsed = (Date.now() - pillarStart) / 1000;

      for (let i = 0; i < pillars.length; i++) {
        const p = pillars[i];
        const delay = i * 0.1; // stagger
        const t = Math.max(0, elapsed - delay);

        if (t < 1.0) {
          // Yukselen
          const h = t * 10;
          p.mesh.scaling.y = h;
          p.mesh.position.y = center.y + h * 0.05;
        } else if (t < 2.5) {
          // Sabit + pulse
          const pulse = 10 + Math.sin(t * 8) * 0.5;
          p.mesh.scaling.y = pulse;
        } else if (t < 3.5) {
          // Soluyor
          const fadeT = (t - 2.5) / 1.0;
          p.mat.alpha = 0.5 * (1 - fadeT);
          p.mesh.scaling.y = 10 * (1 - fadeT);
        } else {
          p.mesh.dispose();
          p.mat.dispose();
        }
      }

      if (elapsed > 4) {
        clearInterval(pillarInterval);
        for (const p of pillars) {
          if (!p.mesh.isDisposed()) p.mesh.dispose();
          if (!p.mat.isFrozen) p.mat.dispose();
        }
      }
    }, 16);
  }, 200);

  // ─── 3. Golge firtinasi partikulleri (400ms) ───
  setTimeout(() => {
    const stormConfig = vfx.createPurpleSparkConfig('vfx_aura_storm', isMax ? 1200 : 800);
    const storm = vfx.particlePool.acquire({
      ...stormConfig,
      emitRate: isMax ? 600 : 400,
      minEmitPower: isMax ? 4 : 3,
      maxEmitPower: isMax ? 12 : 8,
      minLifeTime: 0.5,
      maxLifeTime: 1.5,
      minSize: 0.05,
      maxSize: isMax ? 0.3 : 0.2,
      color1: new Color4(0.36, 0.05, 0.57, 0.8),
      color2: new Color4(0.69, 0.43, 1.0, 0.6),
      colorDead: new Color4(0.1, 0.0, 0.2, 0.0),
      gravity: new Vector3(0, 1, 0),
    });
    const emitter = vfx.createSphereEmitter(scaledRadius * 0.4, 1);
    storm.particleEmitterType = emitter;
    storm.emitter = center.add(new Vector3(0, 0.5, 0));
    storm.start();

    // Duman alti
    const smokeConfig = vfx.createSmokeConfig('vfx_aura_smoke', isMax ? 180 : 100);
    const smoke = vfx.particlePool.acquire({
      ...smokeConfig,
      emitRate: isMax ? 80 : 50,
      minEmitPower: 0.5,
      maxEmitPower: isMax ? 3 : 2,
      color1: new Color4(0.15, 0.0, 0.3, 0.3),
      color2: new Color4(0.1, 0.0, 0.15, 0.15),
      colorDead: new Color4(0.0, 0.0, 0.0, 0.0),
    });
    const smokeEmitter = vfx.createSphereEmitter(scaledRadius * 0.3, 1);
    smoke.particleEmitterType = smokeEmitter;
    smoke.emitter = center;
    smoke.start();

    setTimeout(() => {
      storm.stop();
      smoke.stop();
    }, 2000);

    setTimeout(() => {
      vfx.particlePool.release(storm);
      vfx.particlePool.release(smoke);
    }, 3500);
  }, 400);

  // ─── 4. PEAK — 1000ms ───
  setTimeout(() => {
    // Sok dalgasi
    vfx.shockwave.spawn(center, scaledRadius, 0.5, MAGENTA, 0.15);

    // Guclu isik flash
    vfx.lightFlash.flash(center.add(new Vector3(0, 1, 0)), DARK_PURPLE, 6, 0.4, 15);
    // Yan isiklar
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const lx = center.x + Math.cos(angle) * scaledRadius * 0.5;
      const lz = center.z + Math.sin(angle) * scaledRadius * 0.5;
      vfx.lightFlash.flash(new Vector3(lx, center.y + 0.5, lz), MAGENTA, 2, 0.3, 6);
    }

    // Guclu screen shake
    vfx.screenShake.shake(0.18, 0.8);
  }, 1000);

  // ─── 5. Golge eli efekti (600ms) — basit silindirler ───
  setTimeout(() => {
    const handCount = 5;
    const hands: { mesh: Mesh; mat: StandardMaterial }[] = [];

    for (let i = 0; i < handCount; i++) {
      const angle = (i / handCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = scaledRadius * 0.3 + Math.random() * scaledRadius * 0.4;
      const hx = center.x + Math.cos(angle) * dist;
      const hz = center.z + Math.sin(angle) * dist;

      const hand = MeshBuilder.CreateCylinder(`vfx_aura_hand_${i}`, {
        height: 0.1, diameterTop: 0.08, diameterBottom: 0.3, tessellation: 8,
      }, scene);
      hand.position.set(hx, center.y - 0.5, hz);
      hand.isPickable = false;

      const mat = new StandardMaterial(`vfx_aura_hm_${i}`, scene);
      mat.emissiveColor = DARK_PURPLE;
      mat.diffuseColor = Color3.Black();
      mat.alpha = 0.6;
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      hand.material = mat;

      hands.push({ mesh: hand, mat });
    }

    const handStart = Date.now();
    const targetHeights = hands.map(() => 1.5 + Math.random() * 1.5);

    const handInterval = setInterval(() => {
      const elapsed = (Date.now() - handStart) / 1000;

      for (let i = 0; i < hands.length; i++) {
        const h = hands[i];
        const delay = i * 0.15;
        const t = Math.max(0, elapsed - delay);
        const targetH = targetHeights[i];

        if (t < 0.6) {
          // Yukseliyor
          const rise = (t / 0.6) * targetH;
          h.mesh.scaling.y = rise * 10;
          h.mesh.position.y = center.y + rise * 0.5;
        } else if (t < 1.5) {
          // Hafif sallanma
          h.mesh.scaling.y = targetH * 10 + Math.sin(t * 12) * 0.5;
        } else if (t < 2.5) {
          // Geri cekiliyor
          const retract = 1 - (t - 1.5) / 1.0;
          h.mesh.scaling.y = targetH * 10 * retract;
          h.mat.alpha = 0.6 * retract;
        } else {
          h.mesh.dispose();
          h.mat.dispose();
        }
      }

      if (elapsed > 3) {
        clearInterval(handInterval);
        for (const h of hands) {
          if (!h.mesh.isDisposed()) h.mesh.dispose();
          if (!h.mat.isFrozen) h.mat.dispose();
        }
      }
    }, 16);
  }, 600);
}
