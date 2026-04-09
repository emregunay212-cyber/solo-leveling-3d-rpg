/**
 * Kan Ofkesi (Blood Rage) VFX — A-Rank Buff Boss Skill
 * Kirmizi aura + buhar + nabiz efekti
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const BLOOD_RED = new Color3(1.0, 0.0, 0.0);
const DARK_RED = new Color3(0.8, 0.0, 0.0);

export function playBloodRageVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  targetGetter: () => Vector3,
  duration: number,
): () => void {
  let disposed = false;

  // Zemin kan damar cemberi
  vfx.groundDecal.spawn(targetGetter(), 2.0, duration, null, BLOOD_RED, 0.3, true);

  // Kirmizi buhar partikulleri (yukari yukselen)
  const steamConfig = vfx.createBloodConfig('vfx_blood_steam', 150);
  const steam = vfx.particlePool.acquire({
    ...steamConfig,
    emitRate: 60,
    minEmitPower: 1,
    maxEmitPower: 3,
    minLifeTime: 0.5,
    maxLifeTime: 1.2,
    minSize: 0.08,
    maxSize: 0.2,
    color1: new Color4(1.0, 0.1, 0.1, 0.6),
    color2: new Color4(0.8, 0.0, 0.0, 0.4),
    colorDead: new Color4(0.3, 0.0, 0.0, 0.0),
    gravity: new Vector3(0, 2, 0),
  });
  const emitter = vfx.createSphereEmitter(0.5, 0);
  steam.particleEmitterType = emitter;
  steam.emitter = targetGetter();
  steam.start();

  // Aktivasyon: flash + shake
  vfx.lightFlash.flash(targetGetter().add(new Vector3(0, 1, 0)), BLOOD_RED, 3, 0.3, 8);
  vfx.screenShake.shake(0.06, 0.2);

  // Nabiz efekti: ritmik light pulse
  let pulseCount = 0;
  const maxPulses = Math.floor(duration / 0.8);
  const pulseInterval = setInterval(() => {
    if (disposed || pulseCount >= maxPulses) {
      clearInterval(pulseInterval);
      return;
    }
    const pos = targetGetter();
    vfx.lightFlash.flash(pos.add(new Vector3(0, 1, 0)), DARK_RED, 1.5, 0.15, 5);
    vfx.screenShake.shake(0.02, 0.08);
    // Particle emitter pozisyon guncelle
    steam.emitter = pos;
    pulseCount++;
  }, 800);

  function cleanup(): void {
    if (disposed) return;
    disposed = true;
    clearInterval(pulseInterval);
    steam.stop();
    setTimeout(() => vfx.particlePool.release(steam), 1500);
  }

  setTimeout(cleanup, duration * 1000);
  return cleanup;
}
