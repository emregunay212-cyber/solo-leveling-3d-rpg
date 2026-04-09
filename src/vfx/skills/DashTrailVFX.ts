/**
 * Q — Golge Bicagi (Shadow Blade) VFX
 * Charge seviyeleri: tap (basit), lv1 (orta), max (epik)
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

const PURPLE_MAIN  = new Color3(0.48, 0.18, 0.75);
const PURPLE_DARK  = new Color3(0.29, 0.05, 0.47);
const PURPLE_LIGHT = new Color3(0.69, 0.43, 1.0);

export function playDashTrailVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  startPos: Vector3,
  direction: Vector3,
  distance: number,
  chargeLevel: ChargeLevel = 'tap',
  playerMesh?: Mesh,
): void {
  const endPos  = startPos.add(direction.scale(distance));
  const midPoint = startPos.add(direction.scale(distance / 2));
  const angle   = Math.atan2(direction.x, direction.z);

  // Charge seviyesine gore trail parametreleri
  const trailWidth = chargeLevel === 'max' ? 1.5 : chargeLevel === 'lv1' ? 1.0 : 0.8;
  const trailAlpha = chargeLevel === 'max' ? 0.85 : chargeLevel === 'lv1' ? 0.75 : 0.7;
  const particleCount = chargeLevel === 'max' ? 400 : chargeLevel === 'lv1' ? 250 : 150;

  // ─── 1. Trail mesh ───
  const trail = MeshBuilder.CreatePlane('vfx_dash_trail', {
    width: distance, height: trailWidth,
  }, scene);
  trail.position.set(midPoint.x, startPos.y + 0.05, midPoint.z);
  trail.rotation.x = Math.PI / 2;
  trail.rotation.z = -angle;
  trail.isPickable = false;

  const trailMat = new StandardMaterial('vfx_dash_trail_m', scene);
  trailMat.emissiveColor = PURPLE_MAIN;
  trailMat.diffuseColor = Color3.Black();
  trailMat.alpha = trailAlpha;
  trailMat.backFaceCulling = false;
  trailMat.disableLighting = true;
  trail.material = trailMat;

  // Glow katmani
  const glowTrail = MeshBuilder.CreatePlane('vfx_dash_glow', {
    width: distance * 1.15, height: trailWidth * 2,
  }, scene);
  glowTrail.position.set(midPoint.x, startPos.y + 0.03, midPoint.z);
  glowTrail.rotation.x = Math.PI / 2;
  glowTrail.rotation.z = -angle;
  glowTrail.isPickable = false;

  const glowMat = new StandardMaterial('vfx_dash_glow_m', scene);
  glowMat.emissiveColor = PURPLE_DARK;
  glowMat.diffuseColor = Color3.Black();
  glowMat.alpha = chargeLevel === 'max' ? 0.45 : 0.3;
  glowMat.backFaceCulling = false;
  glowMat.disableLighting = true;
  glowTrail.material = glowMat;

  vfx.glowLayer.addIncludedOnlyMesh(trail as Mesh);
  vfx.glowLayer.addIncludedOnlyMesh(glowTrail as Mesh);

  // MAX: Koyu ic katman
  if (chargeLevel === 'max') {
    const innerTrail = MeshBuilder.CreatePlane('vfx_dash_inner', {
      width: distance * 0.9, height: trailWidth * 0.6,
    }, scene);
    innerTrail.position.set(midPoint.x, startPos.y + 0.07, midPoint.z);
    innerTrail.rotation.x = Math.PI / 2;
    innerTrail.rotation.z = -angle;
    innerTrail.isPickable = false;

    const innerMat = new StandardMaterial('vfx_dash_inner_m', scene);
    innerMat.emissiveColor = new Color3(0.1, 0.0, 0.2);
    innerMat.diffuseColor = Color3.Black();
    innerMat.alpha = 0.9;
    innerMat.backFaceCulling = false;
    innerMat.disableLighting = true;
    innerTrail.material = innerMat;

    setTimeout(() => { innerMat.dispose(); innerTrail.dispose(); }, 400);
  }

  // ─── 2. Afterimage (lv1+) ───
  if (playerMesh && chargeLevel !== 'tap') {
    const count = chargeLevel === 'max' ? 3 : 1;
    vfx.afterimage.spawn(playerMesh, startPos, playerMesh.rotation, count, 0.06);
  }

  // ─── 3. Particles ───
  const sparkConfig = vfx.createPurpleSparkConfig('vfx_dash_sparks', particleCount);
  const sparks = vfx.particlePool.acquire({
    ...sparkConfig,
    minEmitPower: chargeLevel === 'max' ? 3 : 2,
    maxEmitPower: chargeLevel === 'max' ? 7 : 5,
  });
  const boxEmitter = vfx.createBoxEmitter(
    new Vector3(-distance / 2, -0.2, -0.3),
    new Vector3(distance / 2, 0.2, 0.3),
    new Vector3(-1, 1, -1),
    new Vector3(1, 3, 1),
  );
  sparks.particleEmitterType = boxEmitter;
  sparks.emitter = midPoint as unknown as Vector3;
  sparks.start();

  // ─── 4. Light flash ───
  vfx.lightFlash.flash(
    startPos.add(new Vector3(0, 1, 0)),
    PURPLE_MAIN,
    chargeLevel === 'max' ? 5 : 3,
    0.2, 8,
  );

  // ─── 5. Screen shake ───
  const shakeAmp = chargeLevel === 'max' ? 0.1 : chargeLevel === 'lv1' ? 0.06 : 0.04;
  vfx.screenShake.shake(shakeAmp, 0.15);

  // ─── 6. Varis efektleri ───
  setTimeout(() => {
    // Shockwave
    vfx.shockwave.spawn(
      endPos, chargeLevel === 'max' ? 3.0 : 1.5, 0.3,
      chargeLevel === 'max' ? new Color3(0.8, 0.3, 1.0) : PURPLE_LIGHT,
    );

    // Slash efekti
    vfx.slashEffect.spawnArc(endPos, direction, chargeLevel === 'max' ? 2.5 : 1.2, PURPLE_LIGHT, vfx.getSlashArcTexture());
    if (chargeLevel === 'max') {
      vfx.slashEffect.spawnCross(endPos, 1.8, PURPLE_MAIN, vfx.getSlashArcTexture());
    }

    // Varis isigi
    vfx.lightFlash.flash(
      endPos.add(new Vector3(0, 1, 0)),
      PURPLE_LIGHT,
      chargeLevel === 'max' ? 4 : 2,
      0.15, 6,
    );

    // MAX: Slow-mo + sinematik kamera
    if (chargeLevel === 'max') {
      vfx.slowMotion.trigger(SLOW_MOTION.dashMaxScale, SLOW_MOTION.dashMaxDuration);
      vfx.cinematicCamera.play(CINEMATIC_SEQUENCES.Q_MAX_ARRIVAL);

      // GPU patlama partikuller
      const burstCfg = vfx.createPurpleSparkConfig('vfx_dash_burst', 400);
      const burst = vfx.particlePool.acquire({
        ...burstCfg,
        emitRate: 0,
        manualEmitCount: 400,
        minEmitPower: 4,
        maxEmitPower: 10,
        color1: new Color4(0.8, 0.3, 1.0, 1.0),
        color2: new Color4(0.3, 0.0, 0.5, 0.8),
      });
      burst.emitter = endPos.clone() as unknown as Vector3;
      burst.start();
      setTimeout(() => {
        burst.stop();
        setTimeout(() => vfx.particlePool.release(burst), 800);
      }, 50);
    }
  }, chargeLevel === 'max' ? 250 : 200);

  // Temizlik
  setTimeout(() => sparks.stop(), chargeLevel === 'max' ? 450 : 350);
  setTimeout(() => vfx.particlePool.release(sparks), 900);

  // Trail fade
  const startTime = Date.now();
  const fadeDur = chargeLevel === 'max' ? 0.8 : 0.6;
  const fadeInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const t = Math.min(1, elapsed / fadeDur);
    trailMat.alpha = trailAlpha * (1 - t);
    glowMat.alpha = (chargeLevel === 'max' ? 0.45 : 0.3) * (1 - t);

    if (t >= 1) {
      clearInterval(fadeInterval);
      trail.dispose(); glowTrail.dispose();
      trailMat.dispose(); glowMat.dispose();
    }
  }, 16);
}
