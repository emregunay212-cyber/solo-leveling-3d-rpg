/**
 * Buz Hapishanesi (Ice Prison) VFX — A-Rank Buff Boss Skill
 * Buz kristalleri + kar taneleri + sis + zemin buzlanma
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const ICE_BLUE = new Color3(0.53, 0.87, 1.0);
const ICE_WHITE = new Color3(0.8, 0.95, 1.0);

export function playIcePrisonVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  center: Vector3,
  duration: number,
): () => void {
  const meshes: Mesh[] = [];
  const mats: StandardMaterial[] = [];
  let disposed = false;

  // Zemin buzlanma
  vfx.groundDecal.spawn(center, 3.0, duration, null, ICE_BLUE, 0, true);

  // Buz kristalleri (6 adet cone)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 1.2 + Math.random() * 0.8;
    const cx = center.x + Math.cos(angle) * dist;
    const cz = center.z + Math.sin(angle) * dist;
    const height = 1.0 + Math.random() * 1.5;

    const crystal = MeshBuilder.CreateCylinder(`vfx_ice_crystal_${i}`, {
      height, diameterTop: 0, diameterBottom: 0.3 + Math.random() * 0.3,
      tessellation: 6,
    }, scene);
    crystal.position.set(cx, center.y, cz);
    crystal.rotation.x = (Math.random() - 0.5) * 0.3;
    crystal.rotation.z = (Math.random() - 0.5) * 0.3;
    crystal.scaling.y = 0.01;
    crystal.isPickable = false;

    const mat = new StandardMaterial(`vfx_ice_cm_${i}`, scene);
    mat.emissiveColor = ICE_BLUE;
    mat.diffuseColor = ICE_WHITE;
    mat.alpha = 0.7;
    mat.backFaceCulling = false;
    crystal.material = mat;
    vfx.glowLayer.addIncludedOnlyMesh(crystal);

    meshes.push(crystal);
    mats.push(mat);
  }

  // Buz partikulleri (kar taneleri)
  const iceConfig = vfx.createIceConfig('vfx_ice_snow', 200);
  const snow = vfx.particlePool.acquire({
    ...iceConfig,
    emitRate: 60,
    gravity: new Vector3(0, -0.3, 0),
  });
  const emitter = vfx.createSphereEmitter(2.5, 1);
  snow.particleEmitterType = emitter;
  snow.emitter = center.add(new Vector3(0, 3, 0));
  snow.start();

  // Sis
  const mistConfig = vfx.createSmokeConfig('vfx_ice_mist', 80);
  const mist = vfx.particlePool.acquire({
    ...mistConfig,
    emitRate: 30,
    color1: new Color4(0.8, 0.9, 1.0, 0.25),
    color2: new Color4(0.6, 0.8, 1.0, 0.15),
    colorDead: new Color4(1.0, 1.0, 1.0, 0.0),
    gravity: new Vector3(0, 0.1, 0),
    minSize: 0.5,
    maxSize: 1.5,
  });
  mist.emitter = center.add(new Vector3(0, 0.3, 0));
  const mistEmitter = vfx.createSphereEmitter(2.0, 1);
  mist.particleEmitterType = mistEmitter;
  mist.start();

  // Light
  vfx.lightFlash.flash(center.add(new Vector3(0, 1, 0)), ICE_BLUE, 2, duration, 8);

  // Shake (aktivasyon)
  vfx.screenShake.shake(0.04, 0.2);

  // Kristal buyume animasyonu
  const growStart = Date.now();
  const targetHeights = meshes.map(() => 0.5 + Math.random() * 0.5);
  const growInterval = setInterval(() => {
    if (disposed) { clearInterval(growInterval); return; }
    const elapsed = (Date.now() - growStart) / 1000;

    for (let i = 0; i < meshes.length; i++) {
      const delay = i * 0.1;
      const t = Math.max(0, elapsed - delay);
      if (t < 0.5) {
        meshes[i].scaling.y = (t / 0.5) * targetHeights[i] * 10;
      }
    }
    if (elapsed > 0.8) clearInterval(growInterval);
  }, 16);

  function cleanup(): void {
    if (disposed) return;
    disposed = true;
    clearInterval(growInterval);

    // Kristaller soluyor
    const fadeStart = Date.now();
    const fadeInterval = setInterval(() => {
      const t = Math.min(1, (Date.now() - fadeStart) / 800);
      for (const mat of mats) mat.alpha = 0.7 * (1 - t);
      if (t >= 1) {
        clearInterval(fadeInterval);
        for (const m of meshes) m.dispose();
        for (const mat of mats) mat.dispose();
      }
    }, 16);

    snow.stop();
    mist.stop();
    setTimeout(() => {
      vfx.particlePool.release(snow);
      vfx.particlePool.release(mist);
    }, 2500);
  }

  // Otomatik temizlik suresi
  setTimeout(cleanup, duration * 1000);
  return cleanup;
}
