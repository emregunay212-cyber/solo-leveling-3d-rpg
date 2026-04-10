/**
 * Q — Fantom Saldiri (Phantom Strike) VFX
 * Goz ile takip edilemez hizda ardisik bicak darbeleri.
 * Katmanlar: slash arc'lar + mor sparklar + screen shake + (max: burst + slowmo)
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';
import type { ChargeLevel } from '../../skills/ChargeSystem';
import { SLOW_MOTION } from '../../config/GameConfig';

const SHADOW_PURPLE = new Color3(0.38, 0.08, 0.65);
const PHANTOM_BLUE  = new Color3(0.15, 0.05, 0.55);
const SLASH_BRIGHT  = new Color3(0.75, 0.35, 1.0);
const FINAL_RED     = new Color3(1.0, 0.2, 0.35);

/**
 * Her vuruş için bir slash arc efekti olusturur.
 * Vuruslar arasi ~80ms gecikme ile tetiklenir.
 */
function spawnSlashArc(
  scene: Scene,
  center: Vector3,
  direction: Vector3,
  hitIndex: number,
  totalHits: number,
  isFinal: boolean,
): void {
  // Her vurusu biraz farkli acida yap — sag/sol/ortazig zag
  const baseAngle = Math.atan2(direction.x, direction.z);
  const zigzag = (hitIndex % 2 === 0 ? 1 : -1) * (0.4 + hitIndex * 0.15);
  const angle = baseAngle + zigzag;

  const arcWidth = isFinal ? 2.0 : 1.2 + hitIndex * 0.05;
  const arcHeight = isFinal ? 0.15 : 0.08;

  const arc = MeshBuilder.CreatePlane(`phantom_slash_${hitIndex}`, {
    width: arcWidth,
    height: arcHeight,
  }, scene);

  const offset = new Vector3(Math.sin(angle), 0, Math.cos(angle)).scale(0.5);
  arc.position = center.add(offset);
  arc.position.y += 0.8 + (hitIndex % 3) * 0.3;
  arc.rotation.y = angle;
  arc.rotation.x = (Math.random() - 0.5) * 0.3;
  arc.isPickable = false;

  const mat = new StandardMaterial(`phantom_slash_mat_${hitIndex}`, scene);
  const color = isFinal ? FINAL_RED : SLASH_BRIGHT;
  mat.emissiveColor = color;
  mat.diffuseColor = Color3.Black();
  mat.alpha = isFinal ? 1.0 : 0.85;
  mat.backFaceCulling = false;
  mat.disableLighting = true;
  arc.material = mat;

  // Scale-up sonra fade-out
  const startTime = performance.now();
  const duration = isFinal ? 350 : 200;

  const obs = scene.onBeforeRenderObservable.add(() => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(1, elapsed / duration);

    // Hizli scale-up, yavas fade
    arc.scaling.x = 0.3 + t * 1.2;
    arc.scaling.y = 1.0 + t * 0.5;
    mat.alpha = (isFinal ? 1.0 : 0.85) * (1 - t * t);

    if (t >= 1) {
      scene.onBeforeRenderObservable.remove(obs);
      arc.dispose();
      mat.dispose();
    }
  });
}

/**
 * Küçük mor spark partikülleri — her vuruşta tetiklenir.
 */
function spawnHitSparks(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  isFinal: boolean,
): void {
  const baseCfg = vfx.createPurpleSparkConfig(`phantom_sparks_${Date.now()}`);
  const ps = vfx.particlePool.acquire({
    ...baseCfg,
    capacity: isFinal ? 60 : 20,
    emitRate: isFinal ? 200 : 80,
    minLifeTime: 0.1,
    maxLifeTime: isFinal ? 0.4 : 0.2,
    minSize: isFinal ? 0.08 : 0.04,
    maxSize: isFinal ? 0.15 : 0.08,
    color1: new Color4(0.75, 0.35, 1.0, 1.0),
    color2: new Color4(0.4, 0.1, 0.8, 0.8),
    colorDead: new Color4(0.2, 0.05, 0.4, 0.0),
  });

  ps.particleEmitterType = vfx.createSphereEmitter(0.5);
  ps.emitter = center.clone();
  ps.start();

  setTimeout(() => {
    ps.stop();
    setTimeout(() => vfx.particlePool.release(ps), 500);
  }, isFinal ? 250 : 100);
}

export function playPhantomStrikeVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  playerPos: Vector3,
  direction: Vector3,
  hitCount: number,
  chargeLevel: ChargeLevel = 'tap',
): void {
  const isMax = chargeLevel === 'max';
  const isLv1 = chargeLevel === 'lv1';
  const hitDelay = 80; // ms arasi

  // Zemin glow (kısa sureli)
  vfx.groundDecal.spawn(
    playerPos, 2.0, 0.6,
    vfx.getMagicCircleTexture(),
    SHADOW_PURPLE, 0.5, false,
  );

  // Her vuruş için ardışık efekt
  for (let i = 0; i < hitCount; i++) {
    const isFinal = i === hitCount - 1;
    const delay = i * hitDelay;

    setTimeout(() => {
      spawnSlashArc(scene, playerPos, direction, i, hitCount, isFinal);
      spawnHitSparks(vfx, scene, playerPos, isFinal);

      // Screen shake — her vuruşta hafif, son vuruşta güçlü
      if (isFinal) {
        vfx.screenShake.shake(isMax ? 0.4 : isLv1 ? 0.25 : 0.15, 0.2);
      } else if (i % 2 === 0) {
        vfx.screenShake.shake(0.05, 0.05);
      }
    }, delay);
  }

  // MAX: son vuruşta slow-mo + büyük AoE burst efekti
  if (isMax) {
    const finalDelay = (hitCount - 1) * hitDelay;
    setTimeout(() => {
      vfx.slowMotion.trigger(
        SLOW_MOTION.dashMaxScale ?? 0.15,
        SLOW_MOTION.dashMaxDuration ?? 0.8,
      );

      // Büyük patlama halkası
      const burstRing = MeshBuilder.CreateTorus('phantom_burst', {
        diameter: 0.5,
        thickness: 0.1,
        tessellation: 48,
      }, scene);
      burstRing.position = playerPos.clone();
      burstRing.position.y += 0.5;
      burstRing.isPickable = false;

      const burstMat = new StandardMaterial('phantom_burst_mat', scene);
      burstMat.emissiveColor = FINAL_RED;
      burstMat.diffuseColor = Color3.Black();
      burstMat.alpha = 0.9;
      burstMat.backFaceCulling = false;
      burstMat.disableLighting = true;
      burstRing.material = burstMat;

      const burstStart = performance.now();
      const obs = scene.onBeforeRenderObservable.add(() => {
        const t = Math.min(1, (performance.now() - burstStart) / 500);
        burstRing.scaling.setAll(1 + t * 8);
        burstMat.alpha = 0.9 * (1 - t);
        if (t >= 1) {
          scene.onBeforeRenderObservable.remove(obs);
          burstRing.dispose();
          burstMat.dispose();
        }
      });
    }, finalDelay);
  }

  // Hafif ışık flash
  vfx.lightFlash.flash(playerPos, isMax ? FINAL_RED : SLASH_BRIGHT, isMax ? 3.0 : 1.5, 0.3);
}
