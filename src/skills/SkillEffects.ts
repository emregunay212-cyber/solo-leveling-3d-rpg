/**
 * Skill gorsel efektleri — VFX Manager entegrasyonu.
 * VFX manager varsa gelismis efektler kullanilir, yoksa basit fallback.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';

import type { SkillVFXManager } from '../vfx/SkillVFXManager';
import type { ChargeLevel } from '../skills/ChargeSystem';
import { playDashTrailVFX } from '../vfx/skills/DashTrailVFX';
import { playPhantomStrikeVFX } from '../vfx/skills/PhantomStrikeVFX';
import { playShieldVFX } from '../vfx/skills/ShieldVFX';
import { playBurstVFX } from '../vfx/skills/BurstVFX';
import { playAuraVFX } from '../vfx/skills/AuraVFX';
import { playFlameburstVFX } from '../vfx/skills/FlameburstVFX';
import { playLightningVFX } from '../vfx/skills/LightningVFX';
import { playIcePrisonVFX } from '../vfx/skills/IcePrisonVFX';
import { playBloodRageVFX } from '../vfx/skills/BloodRageVFX';
import { playShadowDomainVFX } from '../vfx/skills/ShadowDomainVFX';
import { playVoidStrikeVFX } from '../vfx/skills/VoidStrikeVFX';

interface ActiveEffect {
  meshes: Mesh[];
  mats: StandardMaterial[];
  timer: number;
  maxTime: number;
  update: (t: number, dt: number) => void;
}

/**
 * Skill gorsel efektleri.
 * VFX manager bagliysa gelismis particle+glow+shake efektleri,
 * baglanmamissa basit mesh-bazli fallback.
 */
export class SkillEffects {
  private scene: Scene;
  private effects: ActiveEffect[] = [];
  private vfxManager: SkillVFXManager | null = null;

  // Aktif buff temizleme fonksiyonlari
  private activeShieldCleanup: (() => void) | null = null;
  private activeIceCleanup: (() => void) | null = null;
  private activeBloodCleanup: (() => void) | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** VFX manager bagla — sahne init sirasinda cagirilir */
  public setVFXManager(manager: SkillVFXManager): void {
    this.vfxManager = manager;
  }

  public getVFXManager(): SkillVFXManager | null {
    return this.vfxManager;
  }

  // ─── TEMEL 4 YETENEK ───

  /** Q — Golge Bicagi */
  public spawnDashTrail(
    startPos: Vector3,
    direction: Vector3,
    distance: number,
    chargeLevel: ChargeLevel = 'tap',
    playerMesh?: Mesh,
  ): void {
    if (this.vfxManager) {
      playDashTrailVFX(this.vfxManager, this.scene, startPos, direction, distance, chargeLevel, playerMesh);
      return;
    }
    this.fallbackDashTrail(startPos, direction, distance);
  }

  /** Q — Fantom Saldiri (coklu vurus) */
  public spawnPhantomStrike(
    playerPos: Vector3,
    direction: Vector3,
    hitCount: number,
    chargeLevel: ChargeLevel = 'tap',
  ): void {
    if (this.vfxManager) {
      playPhantomStrikeVFX(this.vfxManager, this.scene, playerPos, direction, hitCount, chargeLevel);
      return;
    }
    this.fallbackPhantomStrike(playerPos, direction, hitCount);
  }

  /** E — Golge Kalkani */
  public spawnShieldSphere(
    targetGetter: () => Vector3,
    duration: number,
    chargeLevel: ChargeLevel = 'tap',
  ): void {
    // Onceki kalkani temizle
    if (this.activeShieldCleanup) {
      this.activeShieldCleanup();
      this.activeShieldCleanup = null;
    }
    if (this.vfxManager) {
      this.activeShieldCleanup = playShieldVFX(this.vfxManager, this.scene, targetGetter, duration, chargeLevel);
      return;
    }
    this.fallbackShieldSphere(targetGetter, duration);
  }

  /** R — Golge Patlama */
  public spawnBurstRing(
    center: Vector3,
    maxRadius: number,
    chargeLevel: ChargeLevel = 'tap',
  ): void {
    if (this.vfxManager) {
      playBurstVFX(this.vfxManager, this.scene, center, maxRadius, chargeLevel);
      return;
    }
    this.fallbackBurstRing(center, maxRadius);
  }

  /** F — Hukumdar Aurasi */
  public spawnAuraWave(
    center: Vector3,
    maxRadius: number,
    chargeLevel: ChargeLevel = 'tap',
  ): void {
    if (this.vfxManager) {
      playAuraVFX(this.vfxManager, this.scene, center, maxRadius, chargeLevel);
      return;
    }
    this.fallbackAuraWave(center, maxRadius);
  }

  // ─── BOSS SKILL EFEKTLERI ───

  /** Alev Patlamasi (B-Rank AoE) */
  public spawnFlameburst(center: Vector3, radius: number): void {
    if (this.vfxManager) {
      playFlameburstVFX(this.vfxManager, this.scene, center, radius);
      return;
    }
    this.fallbackBurstRing(center, radius);
  }

  /** Yildirim Zinciri (B-Rank AoE) */
  public spawnLightningChain(center: Vector3, radius: number): void {
    if (this.vfxManager) {
      playLightningVFX(this.vfxManager, this.scene, center, radius);
      return;
    }
    this.fallbackBurstRing(center, radius);
  }

  /** Buz Hapishanesi (A-Rank Buff) */
  public spawnIcePrison(center: Vector3, duration: number): void {
    if (this.activeIceCleanup) {
      this.activeIceCleanup();
      this.activeIceCleanup = null;
    }
    if (this.vfxManager) {
      this.activeIceCleanup = playIcePrisonVFX(this.vfxManager, this.scene, center, duration);
      return;
    }
    this.fallbackShieldSphere(() => center, duration);
  }

  /** Kan Ofkesi (A-Rank Buff) */
  public spawnBloodRage(targetGetter: () => Vector3, duration: number): void {
    if (this.activeBloodCleanup) {
      this.activeBloodCleanup();
      this.activeBloodCleanup = null;
    }
    if (this.vfxManager) {
      this.activeBloodCleanup = playBloodRageVFX(this.vfxManager, this.scene, targetGetter, duration);
      return;
    }
    this.fallbackShieldSphere(targetGetter, duration);
  }

  /** Golge Alani (S-Rank Ultimate) */
  public spawnShadowDomain(center: Vector3, radius: number): void {
    if (this.vfxManager) {
      playShadowDomainVFX(this.vfxManager, this.scene, center, radius);
      return;
    }
    this.fallbackAuraWave(center, radius);
  }

  /** Bosluk Darbesi (S-Rank Dash) */
  public spawnVoidStrike(startPos: Vector3, endPos: Vector3, direction: Vector3, distance: number): void {
    if (this.vfxManager) {
      playVoidStrikeVFX(this.vfxManager, this.scene, startPos, endPos, direction, distance);
      return;
    }
    this.fallbackDashTrail(startPos, direction, distance);
  }

  // ─── UPDATE / DISPOSE ───

  public update(dt: number): void {
    // VFX manager kendi update'ini calistirir (sahne update'inde cagirilir)
    if (this.vfxManager) {
      this.vfxManager.update(dt);
    }

    // Fallback efektleri
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.timer -= dt;
      if (fx.timer <= 0) {
        for (const mesh of fx.meshes) mesh.dispose();
        for (const mat of fx.mats) mat.dispose();
        this.effects.splice(i, 1);
        continue;
      }
      const t = 1 - (fx.timer / fx.maxTime);
      fx.update(t, dt);
    }
  }

  public dispose(): void {
    if (this.activeShieldCleanup) this.activeShieldCleanup();
    if (this.activeIceCleanup) this.activeIceCleanup();
    if (this.activeBloodCleanup) this.activeBloodCleanup();

    for (const fx of this.effects) {
      for (const mesh of fx.meshes) mesh.dispose();
      for (const mat of fx.mats) mat.dispose();
    }
    this.effects = [];

    if (this.vfxManager) {
      this.vfxManager.dispose();
      this.vfxManager = null;
    }
  }

  // ─── FALLBACK (basit mesh efektler — VFX manager yoksa) ───

  private makeMat(name: string, color: Color3, emissive: Color3, alpha: number): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = color;
    mat.emissiveColor = emissive;
    mat.alpha = alpha;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    return mat;
  }

  private fallbackPhantomStrike(center: Vector3, direction: Vector3, hitCount: number): void {
    for (let i = 0; i < hitCount; i++) {
      setTimeout(() => {
        const angle = Math.atan2(direction.x, direction.z) + (i % 2 === 0 ? 0.4 : -0.4);
        const slash = MeshBuilder.CreatePlane(`fx_phantom_${i}`, { width: 1.5, height: 0.08 }, this.scene);
        slash.position = center.clone();
        slash.position.y += 0.8 + (i % 3) * 0.3;
        slash.rotation.y = angle;
        slash.isPickable = false;
        const mat = this.makeMat(`fx_phantom_m_${i}`, new Color3(0.5, 0.1, 0.9), new Color3(0.7, 0.3, 1.0), 0.8);
        slash.material = mat;

        this.effects.push({
          meshes: [slash], mats: [mat], timer: 0.2, maxTime: 0.2,
          update: (t) => {
            slash.scaling.x = 0.3 + t * 1.2;
            mat.alpha = 0.8 * (1 - t);
          },
        });
      }, i * 80);
    }
  }

  private fallbackDashTrail(startPos: Vector3, direction: Vector3, distance: number): void {
    const midPoint = startPos.add(direction.scale(distance / 2));
    const angle = Math.atan2(direction.x, direction.z);

    const trail = MeshBuilder.CreatePlane('fx_trail', { width: distance, height: 0.8 }, this.scene);
    trail.position.set(midPoint.x, startPos.y + 0.05, midPoint.z);
    trail.rotation.x = Math.PI / 2;
    trail.rotation.z = -angle;
    trail.isPickable = false;
    const mat = this.makeMat('fx_trail_m', new Color3(0.5, 0.1, 0.9), new Color3(0.6, 0.2, 1.0), 0.7);
    trail.material = mat;

    this.effects.push({
      meshes: [trail], mats: [mat], timer: 0.4, maxTime: 0.4,
      update: (t) => { mat.alpha = 0.7 * (1 - t); },
    });
  }

  private fallbackShieldSphere(targetGetter: () => Vector3, duration: number): void {
    const ring = MeshBuilder.CreateTorus('fx_shield_ring', { diameter: 2.6, thickness: 0.06, tessellation: 48 }, this.scene);
    ring.isPickable = false;
    const ringMat = this.makeMat('fx_shield_ring_m', new Color3(0.5, 0.15, 0.8), new Color3(0.6, 0.2, 1.0), 0.5);
    ring.material = ringMat;

    this.effects.push({
      meshes: [ring], mats: [ringMat], timer: duration, maxTime: duration,
      update: (t, dt) => {
        const p = targetGetter();
        ring.position.set(p.x, p.y + 0.5, p.z);
        ring.rotation.y += dt * 1.5;
        const remaining = (1 - t) * duration;
        if (remaining < 1) ringMat.alpha = 0.5 * remaining;
      },
    });
  }

  private fallbackBurstRing(center: Vector3, maxRadius: number): void {
    const wave = MeshBuilder.CreateTorus('fx_burst_wave', { diameter: 0.5, thickness: 0.12, tessellation: 48 }, this.scene);
    wave.position.set(center.x, center.y + 0.08, center.z);
    wave.isPickable = false;
    const waveMat = this.makeMat('fx_burst_wave_m', new Color3(0.5, 0.1, 0.9), new Color3(0.7, 0.2, 1.0), 0.8);
    wave.material = waveMat;

    this.effects.push({
      meshes: [wave], mats: [waveMat], timer: 0.7, maxTime: 0.7,
      update: (t) => {
        wave.scaling.setAll(1 + t * maxRadius * 2.5);
        waveMat.alpha = 0.8 * (1 - t);
      },
    });
  }

  private fallbackAuraWave(center: Vector3, maxRadius: number): void {
    const pillar = MeshBuilder.CreateCylinder('fx_aura_pillar', { height: 0.5, diameter: 1.2, tessellation: 24 }, this.scene);
    pillar.position.set(center.x, center.y + 0.25, center.z);
    pillar.isPickable = false;
    const pillarMat = this.makeMat('fx_aura_pillar_m', new Color3(0.5, 0.1, 0.8), new Color3(0.7, 0.25, 1.0), 0.3);
    pillar.material = pillarMat;

    const shock = MeshBuilder.CreateTorus('fx_aura_shock', { diameter: 0.5, thickness: 0.08, tessellation: 48 }, this.scene);
    shock.position.set(center.x, center.y + 0.15, center.z);
    shock.isPickable = false;
    const shockMat = this.makeMat('fx_aura_shock_m', new Color3(0.4, 0.08, 0.7), new Color3(0.5, 0.15, 0.9), 0.5);
    shock.material = shockMat;

    this.effects.push({
      meshes: [pillar, shock], mats: [pillarMat, shockMat], timer: 1.5, maxTime: 1.5,
      update: (t) => {
        pillar.scaling.y = 0.5 + t * 12;
        pillar.position.y = center.y + pillar.scaling.y * 0.25;
        pillarMat.alpha = 0.3 * (1 - t * 0.8);
        shock.scaling.setAll(1 + t * maxRadius * 3);
        shockMat.alpha = 0.5 * Math.max(0, 1 - t * 1.5);
      },
    });
  }
}
