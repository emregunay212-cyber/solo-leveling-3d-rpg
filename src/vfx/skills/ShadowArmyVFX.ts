/**
 * Sprint 10 — Golge Ordusu Savas VFX
 * Her golge saldirisi icin mor slash efekti.
 * Mod degisimi (G tusu) → pulse dalga.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

/** Golge vurusu — kucuk mor slash */
export function playShadowAttackVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  position: Vector3,
  isCritical = false,
): void {
  // Slash efekti
  const slashDir = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  vfx.slashEffect.spawnArc(
    position.add(new Vector3(0, 1, 0)),
    slashDir,
    isCritical ? 1.2 : 0.7,
    isCritical ? new Color3(0.8, 0.3, 1.0) : new Color3(0.5, 0.2, 0.8),
    null,
  );

  // Kivilcim
  if (isCritical) {
    const sparkCfg = vfx.createPurpleSparkConfig('shadow_crit', 50);
    const sparks = vfx.particlePool.acquire({
      ...sparkCfg,
      emitRate: 0,
      manualEmitCount: 50,
      minLifeTime: 0.2,
      maxLifeTime: 0.4,
      minEmitPower: 2,
      maxEmitPower: 4,
    });
    sparks.emitter = position.clone() as unknown as Vector3;
    sparks.start();
    setTimeout(() => {
      sparks.stop();
      setTimeout(() => vfx.particlePool.release(sparks), 600);
    }, 50);

    // Crit flash
    vfx.lightFlash.flash(position.add(new Vector3(0, 1, 0)), new Color3(0.8, 0.3, 1.0), 4, 0.12, 6);
  }
}

/** Mod degisimi pulse dalgasi (saldiri modu = kirmizi, savunma = mavi) */
export function playShadowModeChangedVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  position: Vector3,
  mode: 'attack' | 'defense',
): void {
  const color = mode === 'attack'
    ? new Color3(1.0, 0.1, 0.1)
    : new Color3(0.1, 0.4, 1.0);

  vfx.shockwave.spawn(
    position.add(new Vector3(0, 0.1, 0)),
    6, 0.4, color,
  );
  vfx.lightFlash.flash(
    position.add(new Vector3(0, 1, 0)),
    color, 3, 0.3, 6,
  );
}
