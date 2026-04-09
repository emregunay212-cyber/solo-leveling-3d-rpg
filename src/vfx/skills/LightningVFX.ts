/**
 * Yildirim Zinciri (Lightning Chain) VFX — B-Rank AoE Boss Skill
 * Yildirim flash + kivilcimlar + strobe isik
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const WHITE = new Color3(1.0, 1.0, 1.0);
const LIGHT_BLUE = new Color3(0.4, 0.7, 1.0);
const DARK_BLUE = new Color3(0.0, 0.27, 1.0);

export function playLightningVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  radius: number,
): void {
  // Yildirim cizgisi (basit silindir — jagged efekt yok ama parlak)
  const bolt = MeshBuilder.CreateCylinder('vfx_lightning_bolt', {
    height: 8, diameter: 0.15, tessellation: 6,
  }, scene);
  bolt.position.set(center.x, center.y + 4, center.z);
  bolt.isPickable = false;

  const boltMat = new StandardMaterial('vfx_lightning_bm', scene);
  boltMat.emissiveColor = WHITE;
  boltMat.diffuseColor = Color3.Black();
  boltMat.alpha = 0.9;
  boltMat.disableLighting = true;
  boltMat.backFaceCulling = false;
  bolt.material = boltMat;
  vfx.glowLayer.addIncludedOnlyMesh(bolt);

  // Dis glow bolt
  const boltGlow = MeshBuilder.CreateCylinder('vfx_lightning_glow', {
    height: 8, diameter: 0.5, tessellation: 6,
  }, scene);
  boltGlow.position.set(center.x, center.y + 4, center.z);
  boltGlow.isPickable = false;
  const boltGlowMat = new StandardMaterial('vfx_lightning_gm', scene);
  boltGlowMat.emissiveColor = LIGHT_BLUE;
  boltGlowMat.diffuseColor = Color3.Black();
  boltGlowMat.alpha = 0.3;
  boltGlowMat.disableLighting = true;
  boltGlowMat.backFaceCulling = false;
  boltGlow.material = boltGlowMat;

  // Kivilcim partikulleri
  const sparkConfig = vfx.createLightningConfig('vfx_lightning_sparks', 200);
  const sparks = vfx.particlePool.acquire(sparkConfig);
  const emitter = vfx.createSphereEmitter(0.5, 0);
  sparks.particleEmitterType = emitter;
  sparks.emitter = center.add(new Vector3(0, 0.3, 0));
  sparks.start();

  // Zemin yanigi
  vfx.groundDecal.spawn(center, 1.0, 2.0, null, LIGHT_BLUE, 0, false);

  // Strobe isik efekti (3x flash)
  vfx.lightFlash.flash(center.add(new Vector3(0, 2, 0)), WHITE, 8, 0.1, 15);
  setTimeout(() => vfx.lightFlash.flash(center.add(new Vector3(0, 2, 0)), LIGHT_BLUE, 5, 0.1, 12), 100);
  setTimeout(() => vfx.lightFlash.flash(center.add(new Vector3(0, 2, 0)), WHITE, 6, 0.1, 15), 180);

  // Shockwave
  vfx.shockwave.spawn(center, radius * 0.7, 0.25, LIGHT_BLUE, 0.06);

  // Screen shake (kisa titresim)
  vfx.screenShake.shake(0.06, 0.15);

  // Bolt fade
  const startTime = Date.now();
  const fadeInterval = setInterval(() => {
    const t = Math.min(1, (Date.now() - startTime) / 300);
    boltMat.alpha = 0.9 * (1 - t);
    boltGlowMat.alpha = 0.3 * (1 - t);
    // Hafif random genislik (titresim)
    const jitter = 1 + (Math.random() - 0.5) * 0.3;
    bolt.scaling.x = jitter;
    bolt.scaling.z = jitter;
    if (t >= 1) {
      clearInterval(fadeInterval);
      bolt.dispose(); boltMat.dispose();
      boltGlow.dispose(); boltGlowMat.dispose();
    }
  }, 16);

  setTimeout(() => sparks.stop(), 300);
  setTimeout(() => vfx.particlePool.release(sparks), 800);
}
