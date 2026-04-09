/**
 * R — Golge Patlamasi (Shadow Explosion) VFX
 * Katmanlar: Charge decal + patlama particles + shockwave + dome + light flash + screen shake
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';
import type { ChargeLevel } from '../../skills/ChargeSystem';
import { CINEMATIC_SEQUENCES } from '../effects/CinematicCamera';
import { SLOW_MOTION } from '../../config/GameConfig';

const MAGENTA       = new Color3(1.0, 0.13, 0.47);
const PURPLE        = new Color3(0.48, 0.18, 0.75);
const PURPLE_LIGHT  = new Color3(1.0, 0.42, 0.62);
const RED_HOT       = new Color3(1.0, 0.3, 0.1);

export function playBurstVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  maxRadius: number,
  chargeLevel: ChargeLevel = 'tap',
): void {
  const isMax  = chargeLevel === 'max';
  const isLv1  = chargeLevel === 'lv1';
  const scaledRadius = isMax ? maxRadius * 1.6 : isLv1 ? maxRadius * 1.25 : maxRadius;

  // MAX: slow-mo + sinematik
  if (isMax) {
    vfx.slowMotion.trigger(SLOW_MOTION.dashMaxScale, SLOW_MOTION.dashMaxDuration);
    vfx.cinematicCamera.play(CINEMATIC_SEQUENCES.Q_MAX_ARRIVAL);
  }
  // ─── 1. Charge zemin cemberi ───
  vfx.groundDecal.spawn(
    center, scaledRadius * 0.8, 1.2,
    vfx.getMagicCircleTexture(),
    isMax ? RED_HOT : MAGENTA, isMax ? 1.0 : 0.8, true,
  );
  if (isMax) {
    // Dis cember
    vfx.groundDecal.spawn(
      center, scaledRadius * 1.1, 1.2,
      vfx.getMagicCircleTexture(),
      MAGENTA, 0.5, true,
    );
  }

  // ─── 2. Charge partikulleri (merkeze cekme) ───
  const chargeConfig = vfx.createPurpleSparkConfig('vfx_burst_charge', isMax ? 300 : 150);
  const charge = vfx.particlePool.acquire({
    ...chargeConfig,
    emitRate: isMax ? 250 : 120,
    minEmitPower: isMax ? -8 : -5,
    maxEmitPower: isMax ? -3 : -2,
    minLifeTime: 0.3,
    maxLifeTime: 0.6,
    minSize: 0.05,
    maxSize: isMax ? 0.2 : 0.12,
    color1: new Color4(1.0, 0.2, 0.5, 1.0),
    color2: new Color4(isMax ? 1.0 : 0.7, isMax ? 0.3 : 0.1, isMax ? 0.1 : 0.9, 1.0),
    colorDead: new Color4(0.2, 0.0, 0.3, 0.0),
  });
  const sphereEmitter = vfx.createSphereEmitter(scaledRadius * 0.6, 1);
  charge.particleEmitterType = sphereEmitter;
  charge.emitter = center.add(new Vector3(0, 0.5, 0));
  charge.start();

  const chargeDelay = isMax ? 500 : isLv1 ? 380 : 300;

  // ─── 3. Patlama ───
  setTimeout(() => {
    charge.stop();

    // Patlama partikulleri (disa dogru)
    const burstConfig = vfx.createPurpleSparkConfig('vfx_burst_explode', isMax ? 800 : 500);
    const burst = vfx.particlePool.acquire({
      ...burstConfig,
      emitRate: isMax ? 3500 : 2000,
      minEmitPower: isMax ? 12 : 8,
      maxEmitPower: isMax ? 25 : 18,
      minLifeTime: 0.3,
      maxLifeTime: 0.8,
      minSize: 0.08,
      maxSize: isMax ? 0.4 : 0.25,
      color1: isMax ? new Color4(1.0, 0.3, 0.1, 1.0) : new Color4(1.0, 0.1, 0.4, 1.0),
      color2: new Color4(0.7, 0.2, 1.0, 1.0),
      colorDead: new Color4(0.1, 0.0, 0.2, 0.0),
    });
    const burstEmitter = vfx.createSphereEmitter(0.5, 0);
    burst.particleEmitterType = burstEmitter;
    burst.emitter = center.add(new Vector3(0, 0.5, 0));
    burst.targetStopDuration = 0.15;
    burst.start();

    // Duman
    const smokeConfig = vfx.createSmokeConfig('vfx_burst_smoke', isMax ? 150 : 80);
    const smoke = vfx.particlePool.acquire({
      ...smokeConfig,
      emitRate: isMax ? 100 : 60,
      minEmitPower: isMax ? 2 : 1,
      maxEmitPower: isMax ? 5 : 3,
      color1: isMax ? new Color4(0.4, 0.15, 0.1, 0.5) : new Color4(0.3, 0.1, 0.4, 0.4),
      color2: new Color4(0.15, 0.05, 0.2, 0.2),
      colorDead: new Color4(0.0, 0.0, 0.0, 0.0),
    });
    smoke.emitter = center.add(new Vector3(0, 0.3, 0));
    smoke.start();

    // Shockwave
    vfx.shockwave.spawn(center, scaledRadius, 0.4, isMax ? RED_HOT : PURPLE_LIGHT, isMax ? 0.18 : 0.12);
    if (isMax) {
      // Ikinci shockwave dalgasi
      setTimeout(() => vfx.shockwave.spawn(center, scaledRadius * 0.6, 0.35, MAGENTA, 0.1), 150);
    }

    // Dome
    const dome = MeshBuilder.CreateCylinder('vfx_burst_dome', {
      height: 0.1, diameter: 1, tessellation: isMax ? 48 : 32,
    }, scene);
    dome.position.set(center.x, center.y + 0.1, center.z);
    dome.isPickable = false;
    const domeMat = new StandardMaterial('vfx_burst_dome_m', scene);
    domeMat.emissiveColor = isMax ? RED_HOT : MAGENTA;
    domeMat.diffuseColor = Color3.Black();
    domeMat.alpha = isMax ? 0.6 : 0.4;
    domeMat.backFaceCulling = false;
    domeMat.disableLighting = true;
    dome.material = domeMat;
    vfx.glowLayer.addIncludedOnlyMesh(dome);

    // Light flash
    vfx.lightFlash.flash(center.add(new Vector3(0, 1, 0)), isMax ? RED_HOT : MAGENTA, isMax ? 8 : 5, isMax ? 0.5 : 0.3, 12);
    if (isMax) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const lp = new Vector3(center.x + Math.cos(a) * scaledRadius * 0.5, center.y + 0.5, center.z + Math.sin(a) * scaledRadius * 0.5);
        vfx.lightFlash.flash(lp, MAGENTA, 3, 0.3, 5);
      }
    }

    // Screen shake
    vfx.screenShake.shake(isMax ? 0.22 : 0.12, isMax ? 0.6 : 0.4);

    // Dome animasyonu
    const domeDur = isMax ? 0.8 : 0.6;
    const domeStart = Date.now();
    const domeInterval = setInterval(() => {
      const elapsed = (Date.now() - domeStart) / 1000;
      const t = Math.min(1, elapsed / domeDur);
      dome.scaling.x = 1 + t * scaledRadius * 2;
      dome.scaling.z = 1 + t * scaledRadius * 2;
      dome.scaling.y = 1 + t * (isMax ? 8 : 5);
      domeMat.alpha = (isMax ? 0.6 : 0.4) * (1 - t);
      if (t >= 1) {
        clearInterval(domeInterval);
        dome.dispose();
        domeMat.dispose();
      }
    }, 16);

    // Particle temizlik
    setTimeout(() => {
      burst.stop();
      smoke.stop();
    }, 200);
    setTimeout(() => {
      vfx.particlePool.release(burst);
      vfx.particlePool.release(smoke);
      vfx.particlePool.release(charge);
    }, 1500);
  }, chargeDelay);
}
