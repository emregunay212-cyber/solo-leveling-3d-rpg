/**
 * Sprint 5 — Perfect Parry VFX
 * Ekran flash + shockwave + kivilcim + screen shake + "PARRY!" yazisi.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import type { SkillVFXManager } from '../SkillVFXManager';
import type { Scene } from '@babylonjs/core/scene';

export function playParryVFX(
  vfx: SkillVFXManager,
  scene: Scene,
  position: Vector3,
): void {
  // Shockwave
  vfx.shockwave.spawn(
    position.add(new Vector3(0, 0.1, 0)),
    3.0, 0.3,
    new Color3(1, 0.9, 0.2),
  );

  // Screen shake (keskin)
  vfx.screenShake.shake(0.12, 0.15);

  // Parlak kivilcim patlamasi
  const sparkCfg = vfx.createPurpleSparkConfig('parry_sparks', 200);
  const sparks = vfx.particlePool.acquire({
    ...sparkCfg,
    emitRate: 0,
    manualEmitCount: 200,
    minLifeTime: 0.4,
    maxLifeTime: 0.8,
    minEmitPower: 3.0,
    maxEmitPower: 6.0,
    color1: new Color4(1, 1, 1, 1),
    color2: new Color4(1, 0.85, 0.2, 0.8),
  });
  sparks.emitter = position.clone() as unknown as Vector3;
  sparks.start();
  setTimeout(() => {
    sparks.stop();
    setTimeout(() => vfx.particlePool.release(sparks), 1000);
  }, 100);

  // Isik flash
  vfx.lightFlash.flash(
    position.add(new Vector3(0, 1, 0)),
    new Color3(1, 0.9, 0.3),
    8.0, 0.2, 6,
  );

  // GlowLayer'a eklenen mesh'ler icin (gerekirse)
  // Ekran flash efekti — DOM overlay
  showFlashOverlay(0.05);

  // "PARRY!" yazisi
  showParryLabel();
}

/** Beyaz ekran flash — cok kisa sureli DOM overlay */
function showFlashOverlay(duration: number): void {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; inset: 0; background: rgba(255,255,255,0.55);
    pointer-events: none; z-index: 9999;
    transition: opacity ${duration}s linear;
  `;
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    flash.style.opacity = '0';
  });
  setTimeout(() => flash.remove(), duration * 1000 + 50);
}

/** "PARRY!" yazisi DOM overlay */
function showParryLabel(): void {
  const label = document.createElement('div');
  label.textContent = 'PARRY!';
  label.style.cssText = `
    position: fixed;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48px;
    font-weight: 900;
    color: #FFD700;
    text-shadow: 0 0 20px #FFD700, 0 0 40px #FFA500;
    pointer-events: none;
    z-index: 9998;
    animation: parryAnim 0.8s ease-out forwards;
  `;

  // CSS animasyonu
  if (!document.getElementById('parry-style')) {
    const style = document.createElement('style');
    style.id = 'parry-style';
    style.textContent = `
      @keyframes parryAnim {
        0%   { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
        30%  { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
        100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(label);
  setTimeout(() => label.remove(), 900);
}
