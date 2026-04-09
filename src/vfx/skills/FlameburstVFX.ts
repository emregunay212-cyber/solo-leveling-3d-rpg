/**
 * Alev Patlamasi (Flame Burst) VFX — B-Rank AoE Boss Skill
 * Ates topu + zemin patlamasi + alevler
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const ORANGE = new Color3(1.0, 0.4, 0.0);
const YELLOW_CORE = new Color3(1.0, 0.8, 0.0);

export function playFlameburstVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  radius: number,
): void {
  // Zemin ates cemberi
  vfx.groundDecal.spawn(center, radius * 0.8, 3.0, null, ORANGE, 0.3, true);

  // Ates partikulleri
  const fireConfig = vfx.createFireConfig('vfx_flame_burst', 500);
  const fire = vfx.particlePool.acquire({
    ...fireConfig,
    emitRate: 800,
    minEmitPower: 5,
    maxEmitPower: 15,
    minSize: 0.1,
    maxSize: 0.4,
  });
  const emitter = vfx.createSphereEmitter(0.5, 0);
  fire.particleEmitterType = emitter;
  fire.emitter = center.add(new Vector3(0, 0.3, 0));
  fire.targetStopDuration = 0.2;
  fire.start();

  // Kivilcim (ember)
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_flame_ember', 200);
  const embers = vfx.particlePool.acquire({
    ...sparkConfig,
    emitRate: 300,
    minEmitPower: 3,
    maxEmitPower: 10,
    color1: new Color4(1.0, 0.7, 0.1, 1.0),
    color2: new Color4(1.0, 0.3, 0.0, 0.8),
    colorDead: new Color4(0.3, 0.0, 0.0, 0.0),
    gravity: new Vector3(0, -4, 0),
  });
  embers.emitter = center.add(new Vector3(0, 0.5, 0));
  const emberEmitter = vfx.createSphereEmitter(radius * 0.3, 1);
  embers.particleEmitterType = emberEmitter;
  embers.start();

  // Shockwave
  vfx.shockwave.spawn(center, radius, 0.4, ORANGE, 0.1);

  // Light flash
  vfx.lightFlash.flash(center.add(new Vector3(0, 1, 0)), YELLOW_CORE, 5, 0.3, 12);

  // Screen shake
  vfx.screenShake.shake(0.1, 0.3);

  setTimeout(() => { fire.stop(); embers.stop(); }, 250);
  setTimeout(() => {
    vfx.particlePool.release(fire);
    vfx.particlePool.release(embers);
  }, 1500);
}
