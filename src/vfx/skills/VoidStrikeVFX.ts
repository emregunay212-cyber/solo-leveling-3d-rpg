/**
 * Bosluk Darbesi (Void Strike) VFX — S-Rank Dash Boss Skill
 * Teleport + varis patlamasi + shockwave
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const VOID_WHITE = new Color3(1.0, 1.0, 1.0);
const VOID_BLACK = new Color3(0.0, 0.0, 0.0);
const PURPLE = new Color3(0.48, 0.18, 0.75);
const DEEP_BLUE = new Color3(0.2, 0.0, 1.0);

export function playVoidStrikeVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  startPos: Vector3,
  endPos: Vector3,
  direction: Vector3,
  distance: number,
): void {
  // ─── 1. Kalkis efekti ───
  // Beyaz flash (parlak)
  vfx.lightFlash.flash(startPos.add(new Vector3(0, 1, 0)), VOID_WHITE, 8, 0.15, 12);

  // Kalkis partikulleri (dagilan)
  const departConfig = vfx.createPurpleSparkConfig('vfx_void_depart', 200);
  const depart = vfx.particlePool.acquire({
    ...departConfig,
    emitRate: 500,
    minEmitPower: 3,
    maxEmitPower: 8,
    color1: new Color4(1.0, 1.0, 1.0, 1.0),
    color2: new Color4(0.5, 0.2, 1.0, 0.8),
    colorDead: new Color4(0.0, 0.0, 0.2, 0.0),
    minSize: 0.03,
    maxSize: 0.12,
  });
  const departEmitter = vfx.createSphereEmitter(0.5, 0);
  depart.particleEmitterType = departEmitter;
  depart.emitter = startPos.add(new Vector3(0, 0.5, 0));
  depart.targetStopDuration = 0.1;
  depart.start();

  // ─── 2. Trail partikulleri (yol boyunca) ───
  const trailConfig = vfx.createPurpleSparkConfig('vfx_void_trail', 150);
  const trail = vfx.particlePool.acquire({
    ...trailConfig,
    emitRate: 300,
    minEmitPower: 1,
    maxEmitPower: 3,
    color1: new Color4(0.2, 0.0, 1.0, 0.6),
    color2: new Color4(0.0, 0.0, 0.0, 0.3),
    colorDead: new Color4(0.0, 0.0, 0.0, 0.0),
    minLifeTime: 0.3,
    maxLifeTime: 0.6,
  });
  const midPos = startPos.add(direction.scale(distance / 2));
  const boxEmitter = vfx.createBoxEmitter(
    new Vector3(-distance / 2, -0.2, -0.3),
    new Vector3(distance / 2, 0.2, 0.3),
    new Vector3(-0.5, 0.5, -0.5),
    new Vector3(0.5, 1.5, 0.5),
  );
  trail.particleEmitterType = boxEmitter;
  trail.emitter = midPos;
  trail.start();

  setTimeout(() => trail.stop(), 200);

  // ─── 3. Varis efekti (200ms sonra) ───
  setTimeout(() => {
    // Buyuk shockwave
    vfx.shockwave.spawn(endPos, 3, 0.4, DEEP_BLUE, 0.15);

    // Varis patlama partikulleri
    const arriveConfig = vfx.createPurpleSparkConfig('vfx_void_arrive', 400);
    const arrive = vfx.particlePool.acquire({
      ...arriveConfig,
      emitRate: 1500,
      minEmitPower: 6,
      maxEmitPower: 15,
      color1: new Color4(1.0, 1.0, 1.0, 1.0),
      color2: new Color4(0.48, 0.18, 0.75, 0.8),
      colorDead: new Color4(0.0, 0.0, 0.2, 0.0),
      minSize: 0.05,
      maxSize: 0.2,
    });
    const arriveEmitter = vfx.createSphereEmitter(0.3, 0);
    arrive.particleEmitterType = arriveEmitter;
    arrive.emitter = endPos.add(new Vector3(0, 0.5, 0));
    arrive.targetStopDuration = 0.15;
    arrive.start();

    // Slash efekti varis noktasinda
    vfx.slashEffect.spawnCross(endPos, 1.5, PURPLE, vfx.getSlashArcTexture());

    // Isik flash (guclu beyaz)
    vfx.lightFlash.flash(endPos.add(new Vector3(0, 1, 0)), VOID_WHITE, 8, 0.25, 15);

    // Zemin izi
    vfx.groundDecal.spawn(endPos, 1.5, 2.0, null, DEEP_BLUE, 0, false);

    // Screen shake (guclu)
    vfx.screenShake.shake(0.15, 0.5);

    // Temizlik
    setTimeout(() => arrive.stop(), 200);
    setTimeout(() => {
      vfx.particlePool.release(arrive);
      vfx.particlePool.release(depart);
      vfx.particlePool.release(trail);
    }, 1500);
  }, 200);
}
