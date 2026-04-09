/**
 * Arise (Golge Cikarma) VFX
 * Dusman olum pozisyonunda mor portal + golge elleri + flash
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { SkillVFXManager } from '../SkillVFXManager';

const PORTAL_PURPLE = new Color3(0.48, 0.18, 0.75);
const DARK_PURPLE = new Color3(0.2, 0.0, 0.4);

/**
 * Arise efektini oynat.
 * @param deathPos — dusman olum pozisyonu
 * @param onComplete — efekt tamamlandiginda cagrilir (golge askerini goster)
 */
export function playAriseVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  deathPos: Vector3,
  onComplete?: () => void,
): void {
  // ─── 1. Zemin portali (genisleyen mor daire) ───
  vfx.groundDecal.spawn(
    deathPos, 1.5, 2.0,
    vfx.getMagicCircleTexture(),
    PORTAL_PURPLE, 1.5, true,
  );

  // ─── 2. Yukari cekme partikulleri (200ms) ───
  setTimeout(() => {
    const pullConfig = vfx.createPurpleSparkConfig('vfx_arise_pull', 200);
    const pull = vfx.particlePool.acquire({
      ...pullConfig,
      emitRate: 150,
      minEmitPower: 2,
      maxEmitPower: 5,
      gravity: new Vector3(0, 4, 0), // yukari cekme
      minLifeTime: 0.5,
      maxLifeTime: 1.0,
      color1: new Color4(0.48, 0.18, 0.75, 0.8),
      color2: new Color4(0.2, 0.0, 0.4, 0.5),
      colorDead: new Color4(0.0, 0.0, 0.0, 0.0),
    });
    const emitter = vfx.createSphereEmitter(1.0, 1);
    pull.particleEmitterType = emitter;
    pull.emitter = deathPos.add(new Vector3(0, 0.2, 0));
    pull.start();

    setTimeout(() => pull.stop(), 600);
    setTimeout(() => vfx.particlePool.release(pull), 1500);
  }, 200);

  // ─── 3. Golge elleri (500ms) ───
  setTimeout(() => {
    const handCount = 3;
    const hands: { mesh: Mesh; mat: StandardMaterial }[] = [];

    for (let i = 0; i < handCount; i++) {
      const angle = (i / handCount) * Math.PI * 2;
      const dist = 0.4;
      const hx = deathPos.x + Math.cos(angle) * dist;
      const hz = deathPos.z + Math.sin(angle) * dist;

      const hand = MeshBuilder.CreateCylinder(`vfx_arise_hand_${i}`, {
        height: 0.1, diameterTop: 0.06, diameterBottom: 0.2,
        tessellation: 6,
      }, scene);
      hand.position.set(hx, deathPos.y - 0.3, hz);
      hand.isPickable = false;

      const mat = new StandardMaterial(`vfx_arise_hm_${i}`, scene);
      mat.emissiveColor = DARK_PURPLE;
      mat.diffuseColor = Color3.Black();
      mat.alpha = 0.7;
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      hand.material = mat;

      hands.push({ mesh: hand, mat });
    }

    const handStart = Date.now();
    const handInterval = setInterval(() => {
      const elapsed = (Date.now() - handStart) / 1000;

      for (let i = 0; i < hands.length; i++) {
        const h = hands[i];
        const delay = i * 0.1;
        const t = Math.max(0, elapsed - delay);

        if (t < 0.4) {
          // Yukseliyor
          h.mesh.scaling.y = (t / 0.4) * 8;
          h.mesh.position.y = deathPos.y + t * 1.5;
        } else if (t < 0.8) {
          // Sabit
          h.mesh.scaling.y = 8;
        } else if (t < 1.2) {
          // Geri cekiliyor
          const retract = 1 - (t - 0.8) / 0.4;
          h.mesh.scaling.y = 8 * retract;
          h.mat.alpha = 0.7 * retract;
        } else {
          h.mesh.dispose();
          h.mat.dispose();
        }
      }

      if (elapsed > 1.5) {
        clearInterval(handInterval);
        for (const h of hands) {
          if (!h.mesh.isDisposed()) h.mesh.dispose();
          if (!h.mat.isFrozen) h.mat.dispose();
        }
      }
    }, 16);
  }, 500);

  // ─── 4. FLASH — golge belirir (800ms) ───
  setTimeout(() => {
    vfx.lightFlash.flash(deathPos.add(new Vector3(0, 1, 0)), PORTAL_PURPLE, 5, 0.25, 10);
    vfx.screenShake.shake(0.05, 0.15);

    // Patlama partikulleri
    const burstConfig = vfx.createPurpleSparkConfig('vfx_arise_burst', 150);
    const burst = vfx.particlePool.acquire({
      ...burstConfig,
      emitRate: 500,
      minEmitPower: 4,
      maxEmitPower: 10,
    });
    burst.emitter = deathPos.add(new Vector3(0, 0.8, 0));
    burst.targetStopDuration = 0.1;
    burst.start();
    setTimeout(() => vfx.particlePool.release(burst), 800);

    if (onComplete) onComplete();
  }, 800);
}
