/**
 * Kombo Vurus VFX
 * 3'lu kombo zincirinde her vurus icin farkli efekt:
 * Vurus 1: tek ark, az kivilcim
 * Vurus 2: capraz ark, orta kivilcim, trail
 * Vurus 3 (finisher): X-slash + shockwave + cok kivilcim
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const WHITE = new Color3(0.9, 0.9, 1.0);
const PURPLE_LIGHT = new Color3(0.7, 0.5, 1.0);
const GOLD = new Color3(1.0, 0.85, 0.3);

/**
 * Normal vurus efekti (kritik degil).
 * @param comboIndex — 0, 1, 2 (hangi kombo vurusu)
 */
export function playComboHitVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  hitPos: Vector3,
  direction: Vector3,
  comboIndex: number,
): void {
  switch (comboIndex) {
    case 0:
      playHit1(vfx, scene, hitPos, direction);
      break;
    case 1:
      playHit2(vfx, scene, hitPos, direction);
      break;
    case 2:
      playHit3(vfx, scene, hitPos, direction);
      break;
    default:
      playHit1(vfx, scene, hitPos, direction);
  }
}

/** Kritik vurus overlay — normal vurus + ekstra efektler */
export function playCriticalHitVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  hitPos: Vector3,
  direction: Vector3,
): void {
  // Buyuk altin slash
  vfx.slashEffect.spawnArc(hitPos, direction, 1.5, GOLD, vfx.getSlashArcTexture(), 0.35);
  // Altin flash
  vfx.lightFlash.flash(hitPos.add(new Vector3(0, 1, 0)), GOLD, 3, 0.15, 6);
  // Kivilcimlar
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_crit_sparks', 80);
  const sparks = vfx.particlePool.acquire({
    ...sparkConfig,
    emitRate: 200,
    color1: new Color4(1.0, 0.9, 0.3, 1.0),
    color2: new Color4(1.0, 0.7, 0.1, 0.8),
    colorDead: new Color4(1.0, 0.3, 0.0, 0.0),
    minEmitPower: 3,
    maxEmitPower: 7,
  });
  sparks.emitter = hitPos.add(new Vector3(0, 1, 0));
  sparks.targetStopDuration = 0.08;
  sparks.start();
  setTimeout(() => vfx.particlePool.release(sparks), 800);

  vfx.screenShake.shake(0.06, 0.1);
}

/** Backstab overlay */
export function playBackstabHitVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  hitPos: Vector3,
  direction: Vector3,
): void {
  // Kirmizi slash
  const RED = new Color3(1.0, 0.2, 0.2);
  vfx.slashEffect.spawnArc(hitPos, direction, 1.3, RED, vfx.getSlashArcTexture(), 0.3);
  vfx.lightFlash.flash(hitPos.add(new Vector3(0, 1, 0)), RED, 2, 0.12, 5);
  // Kan kivilcimi
  const bloodConfig = vfx.createBloodConfig('vfx_backstab_blood', 50);
  const blood = vfx.particlePool.acquire(bloodConfig);
  blood.emitter = hitPos.add(new Vector3(0, 1, 0));
  blood.targetStopDuration = 0.1;
  blood.start();
  setTimeout(() => vfx.particlePool.release(blood), 1000);
}

// ─── DAHILI ───

function playHit1(vfx: SkillVFXManager, scene: Scene, pos: Vector3, dir: Vector3): void {
  vfx.slashEffect.spawnArc(pos, dir, 0.8, WHITE, vfx.getSlashArcTexture(), 0.25);
  // Az kivilcim
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_hit1_sparks', 30);
  const sparks = vfx.particlePool.acquire({
    ...sparkConfig,
    emitRate: 100,
    minEmitPower: 2,
    maxEmitPower: 4,
  });
  sparks.emitter = pos.add(new Vector3(0, 1, 0));
  sparks.targetStopDuration = 0.05;
  sparks.start();
  setTimeout(() => vfx.particlePool.release(sparks), 600);

  vfx.screenShake.shake(0.02, 0.08);
}

function playHit2(vfx: SkillVFXManager, scene: Scene, pos: Vector3, dir: Vector3): void {
  // Capraz cift ark
  vfx.slashEffect.spawnArc(pos, dir, 1.0, PURPLE_LIGHT, vfx.getSlashArcTexture(), 0.3);
  // Orta kivilcim
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_hit2_sparks', 50);
  const sparks = vfx.particlePool.acquire({
    ...sparkConfig,
    emitRate: 150,
    minEmitPower: 2,
    maxEmitPower: 5,
  });
  sparks.emitter = pos.add(new Vector3(0, 1, 0));
  sparks.targetStopDuration = 0.06;
  sparks.start();
  setTimeout(() => vfx.particlePool.release(sparks), 700);

  vfx.lightFlash.flash(pos.add(new Vector3(0, 1, 0)), PURPLE_LIGHT, 1, 0.1, 4);
  vfx.screenShake.shake(0.03, 0.1);
}

function playHit3(vfx: SkillVFXManager, scene: Scene, pos: Vector3, dir: Vector3): void {
  // X-slash (finisher)
  vfx.slashEffect.spawnCross(pos, 1.3, PURPLE_LIGHT, vfx.getSlashArcTexture());
  // Shockwave
  vfx.shockwave.spawn(pos, 2, 0.3, PURPLE_LIGHT, 0.06);
  // Cok kivilcim
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_hit3_sparks', 80);
  const sparks = vfx.particlePool.acquire({
    ...sparkConfig,
    emitRate: 300,
    minEmitPower: 3,
    maxEmitPower: 7,
  });
  sparks.emitter = pos.add(new Vector3(0, 1, 0));
  sparks.targetStopDuration = 0.08;
  sparks.start();
  setTimeout(() => vfx.particlePool.release(sparks), 800);

  vfx.lightFlash.flash(pos.add(new Vector3(0, 1, 0)), PURPLE_LIGHT, 2.5, 0.15, 6);
  vfx.screenShake.shake(0.06, 0.15);
}
