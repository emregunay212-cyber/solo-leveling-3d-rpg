/**
 * E — Golge Kalkani (Shadow Shield) VFX
 * Charge seviyeleri desteklenir.
 * tap: Donen halkalar + zemin cemberi + partikuller
 * max: Fresnel kure + patlama ozelligi
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';
import type { ChargeLevel } from '../../skills/ChargeSystem';
import { ShieldSphereEffect } from '../effects/ShieldSphereEffect';

const PURPLE       = new Color3(0.48, 0.18, 0.75);
const PURPLE_BRIGHT = new Color3(0.6, 0.25, 1.0);

interface ShieldInstance {
  meshes: Mesh[];
  mats: StandardMaterial[];
  particles: ParticleSystem | null;
  interval: ReturnType<typeof setInterval>;
  disposed: boolean;
  shieldSphere: ShieldSphereEffect | null;
}

export function playShieldVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  targetGetter: () => Vector3,
  duration: number,
  chargeLevel: ChargeLevel = 'tap',
): () => void {
  const instance: ShieldInstance = {
    meshes: [],
    mats: [],
    particles: null,
    interval: 0 as unknown as ReturnType<typeof setInterval>,
    disposed: false,
    shieldSphere: null,
  };

  const isMax = chargeLevel === 'max';

  // ─── 1. Bel halkasi ───
  const ring1 = MeshBuilder.CreateTorus('vfx_shield_ring1', {
    diameter: isMax ? 3.0 : 2.6, thickness: isMax ? 0.08 : 0.06, tessellation: 48,
  }, scene);
  ring1.isPickable = false;
  const ring1Mat = makeMat('vfx_shield_r1m', PURPLE_BRIGHT, isMax ? 0.7 : 0.6, scene);
  ring1.material = ring1Mat;

  // ─── 2. Omuz halkasi ───
  const ring2 = MeshBuilder.CreateTorus('vfx_shield_ring2', {
    diameter: isMax ? 2.2 : 1.8, thickness: isMax ? 0.06 : 0.04, tessellation: 32,
  }, scene);
  ring2.isPickable = false;
  const ring2Mat = makeMat('vfx_shield_r2m', PURPLE, isMax ? 0.5 : 0.4, scene);
  ring2.material = ring2Mat;

  // ─── 3. Bel diski ───
  const disk = MeshBuilder.CreateDisc('vfx_shield_disk', {
    radius: isMax ? 1.5 : 1.3, tessellation: 32,
  }, scene);
  disk.rotation.x = Math.PI / 2;
  disk.isPickable = false;
  const diskMat = makeMat('vfx_shield_dm', PURPLE, isMax ? 0.25 : 0.2, scene);
  disk.material = diskMat;

  instance.meshes = [ring1, ring2, disk];
  instance.mats = [ring1Mat, ring2Mat, diskMat];

  for (const m of instance.meshes) {
    vfx.glowLayer.addIncludedOnlyMesh(m);
  }

  // MAX: Fresnel kure efekti
  if (isMax) {
    const sphere = new ShieldSphereEffect(scene, vfx.glowLayer);
    sphere.create(targetGetter(), 1.4, PURPLE_BRIGHT);
    instance.shieldSphere = sphere;
  }

  // ─── 4. Zemin buyu cemberi ───
  vfx.groundDecal.spawn(
    targetGetter(), isMax ? 2.0 : 1.5, duration,
    vfx.getMagicCircleTexture(), PURPLE, 1.0, true,
  );

  // ─── 5. Partikuller ───
  const sparkBase = vfx.createPurpleSparkConfig('vfx_shield_sparks', isMax ? 200 : 150);
  const sparks = vfx.particlePool.acquire({
    ...sparkBase,
    emitRate: isMax ? 80 : 60,
    minLifeTime: 0.8,
    maxLifeTime: 1.5,
    minEmitPower: 0.5,
    maxEmitPower: isMax ? 2.0 : 1.5,
    gravity: new Vector3(0, 0.5, 0),
  });
  const emitter = vfx.createSphereEmitter(isMax ? 1.6 : 1.3, 0);
  sparks.particleEmitterType = emitter;
  sparks.emitter = targetGetter() as unknown as Vector3;
  sparks.start();
  instance.particles = sparks;

  // ─── 6. Isik ───
  vfx.lightFlash.flash(
    targetGetter().add(new Vector3(0, 1, 0)),
    PURPLE, isMax ? 2.0 : 1.5, duration, 6,
  );

  // ─── 7. Screen shake (aktivasyon) ───
  vfx.screenShake.shake(isMax ? 0.06 : 0.03, 0.2);

  // ─── 8. Animasyon dongusu ───
  const startTime = Date.now();

  instance.interval = setInterval(() => {
    if (instance.disposed) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const t = elapsed / duration;
    if (t >= 1) { cleanup(); return; }

    const pos = targetGetter();

    ring1.position.set(pos.x, pos.y + 0.5, pos.z);
    ring1.rotation.y += 0.025;
    ring1.rotation.x = Math.sin(elapsed * 4) * 0.08;

    ring2.position.set(pos.x, pos.y + 1.2, pos.z);
    ring2.rotation.y -= 0.04;

    disk.position.set(pos.x, pos.y + 0.5, pos.z);
    const pulse = 1 + Math.sin(elapsed * 10) * 0.04;
    disk.scaling.setAll(pulse);

    sparks.emitter = pos as unknown as Vector3;

    if (instance.shieldSphere) {
      instance.shieldSphere.update(1 / 60, pos);
    }

    // Son 1 saniyede fade
    const remaining = (1 - t) * duration;
    if (remaining < 1) {
      ring1Mat.alpha = 0.6 * remaining;
      ring2Mat.alpha = 0.4 * remaining;
      diskMat.alpha = 0.2 * remaining;
    }
  }, 16);

  function cleanup(): void {
    if (instance.disposed) return;
    instance.disposed = true;
    clearInterval(instance.interval);
    for (const m of instance.meshes) m.dispose();
    for (const mat of instance.mats) mat.dispose();
    instance.shieldSphere?.dispose();
    if (instance.particles) {
      instance.particles.stop();
      setTimeout(() => {
        if (instance.particles) vfx.particlePool.release(instance.particles);
      }, 1500);
    }
  }

  return cleanup;
}

/** Kalkan kirilininca patlama efekti */
export function playShieldBurstVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  position: Vector3,
): void {
  vfx.shockwave.spawn(position.add(new Vector3(0, 0.5, 0)), 5.0, 0.25, PURPLE_BRIGHT);
  vfx.screenShake.shake(0.15, 0.3);
  vfx.lightFlash.flash(position.add(new Vector3(0, 1, 0)), PURPLE_BRIGHT, 6, 0.2, 6);

  // Patlama partikuller
  const cfg = vfx.createPurpleSparkConfig('shield_burst', 300);
  const sparks = vfx.particlePool.acquire({
    ...cfg,
    emitRate: 0,
    manualEmitCount: 300,
    minEmitPower: 5,
    maxEmitPower: 12,
    color1: new Color4(0.8, 0.4, 1.0, 1.0),
    color2: new Color4(1.0, 1.0, 1.0, 0.8),
  });
  sparks.emitter = position as unknown as Vector3;
  sparks.start();
  setTimeout(() => {
    sparks.stop();
    setTimeout(() => vfx.particlePool.release(sparks), 1000);
  }, 80);
}

function makeMat(name: string, color: Color3, alpha: number, scene: Scene): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  mat.emissiveColor = color;
  mat.diffuseColor = Color3.Black();
  mat.alpha = alpha;
  mat.backFaceCulling = false;
  mat.disableLighting = true;
  return mat;
}
