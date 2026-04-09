/**
 * Merkezi VFX Orkestratoru.
 * Tum skill efektlerini koordine eder — particle, isik, shake, decal, slash.
 * Her sahne (TestScene, DungeonScene) bir instance olusturur.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { SphereParticleEmitter } from '@babylonjs/core/Particles/EmitterTypes/sphereParticleEmitter';
import { BoxParticleEmitter } from '@babylonjs/core/Particles/EmitterTypes/boxParticleEmitter';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import type { Scene } from '@babylonjs/core/scene';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';

import { ParticlePool } from './effects/ParticlePool';
import type { ParticleConfig } from './effects/ParticlePool';
import { ScreenShake } from './effects/ScreenShake';
import { LightFlash } from './effects/LightFlash';
import { ShockwaveEffect } from './effects/ShockwaveEffect';
import { GroundDecal } from './effects/GroundDecal';
import { SlashEffect } from './effects/SlashEffect';
import { SlowMotion } from './effects/SlowMotion';
import { CinematicCamera } from './effects/CinematicCamera';
import { AfterimageEffect } from './effects/AfterimageEffect';
import {
  createFlareTexture,
  createSmokeTexture,
  createSparkTexture,
  createSlashArcTexture,
  createMagicCircleTexture,
  createRingTexture,
  createFireTexture,
  createIceTexture,
} from './effects/TextureGenerator';

/** VFX kalite seviyesi */
export enum VFXQuality {
  LOW    = 0,
  MEDIUM = 1,
  HIGH   = 2,
  ULTRA  = 3,
}

export class SkillVFXManager {
  private scene: Scene;
  private quality: VFXQuality;

  // Alt sistemler
  public readonly particlePool: ParticlePool;
  public readonly screenShake: ScreenShake;
  public readonly lightFlash: LightFlash;
  public readonly shockwave: ShockwaveEffect;
  public readonly groundDecal: GroundDecal;
  public readonly slashEffect: SlashEffect;
  public readonly glowLayer: GlowLayer;
  public readonly slowMotion: SlowMotion;
  public readonly cinematicCamera: CinematicCamera;
  public readonly afterimage: AfterimageEffect;

  constructor(scene: Scene, camera: ArcRotateCamera, quality: VFXQuality = VFXQuality.HIGH) {
    this.scene = scene;
    this.quality = quality;

    // Alt sistemler olustur
    this.particlePool = new ParticlePool(scene);
    this.screenShake = new ScreenShake();
    this.screenShake.setCamera(camera);
    this.lightFlash = new LightFlash(scene);
    this.shockwave = new ShockwaveEffect(scene);
    this.groundDecal = new GroundDecal(scene);
    this.slashEffect = new SlashEffect(scene);
    this.slowMotion = new SlowMotion();
    this.cinematicCamera = new CinematicCamera(camera);
    this.afterimage = new AfterimageEffect(scene);

    // GlowLayer — tum efektlere bloom ekler
    const glowSize = quality === VFXQuality.LOW ? 256 : (quality === VFXQuality.ULTRA ? 1024 : 512);
    this.glowLayer = new GlowLayer('vfx_glow', scene, {
      mainTextureFixedSize: glowSize,
      blurKernelSize: quality === VFXQuality.LOW ? 16 : 32,
    });
    this.glowLayer.intensity = 0.8;
  }

  // ─── KALITE CARPANLARI ───

  /** Partikul sayisi carpani */
  public getParticleMultiplier(): number {
    switch (this.quality) {
      case VFXQuality.LOW:    return 0.25;
      case VFXQuality.MEDIUM: return 0.5;
      case VFXQuality.HIGH:   return 1.0;
      case VFXQuality.ULTRA:  return 1.5;
      default:                return 1.0;
    }
  }

  /** Kalite seviyesinde glow aktif mi */
  public isGlowEnabled(): boolean {
    return this.quality >= VFXQuality.MEDIUM;
  }

  // ─── HAZIR PARTICLE CONFIG'LERI ───

  /** Mor kivilcim — genel skill efekti */
  public createPurpleSparkConfig(name: string, capacity = 200): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createSparkTexture(this.scene),
      emitRate: 100,
      minLifeTime: 0.2,
      maxLifeTime: 0.5,
      minSize: 0.05,
      maxSize: 0.15,
      color1: new Color4(0.7, 0.3, 1.0, 1.0),
      color2: new Color4(0.5, 0.1, 0.9, 1.0),
      colorDead: new Color4(0.2, 0.0, 0.4, 0.0),
      minEmitPower: 2,
      maxEmitPower: 5,
      gravity: new Vector3(0, -1, 0),
      blendMode: ParticleSystem.BLENDMODE_ADD,
    };
  }

  /** Ates partikulleri */
  public createFireConfig(name: string, capacity = 300): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createFireTexture(this.scene),
      emitRate: 150,
      minLifeTime: 0.3,
      maxLifeTime: 0.8,
      minSize: 0.1,
      maxSize: 0.4,
      color1: new Color4(1.0, 0.8, 0.2, 1.0),
      color2: new Color4(1.0, 0.3, 0.0, 1.0),
      colorDead: new Color4(0.3, 0.0, 0.0, 0.0),
      minEmitPower: 3,
      maxEmitPower: 8,
      gravity: new Vector3(0, 2, 0),
      blendMode: ParticleSystem.BLENDMODE_ADD,
    };
  }

  /** Buz partikulleri */
  public createIceConfig(name: string, capacity = 200): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createIceTexture(this.scene),
      emitRate: 80,
      minLifeTime: 1.0,
      maxLifeTime: 2.5,
      minSize: 0.05,
      maxSize: 0.2,
      color1: new Color4(0.8, 0.95, 1.0, 1.0),
      color2: new Color4(0.5, 0.8, 1.0, 0.8),
      colorDead: new Color4(0.3, 0.5, 0.7, 0.0),
      minEmitPower: 0.5,
      maxEmitPower: 2,
      gravity: new Vector3(0, -0.5, 0),
    };
  }

  /** Duman/sis */
  public createSmokeConfig(name: string, capacity = 100): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createSmokeTexture(this.scene),
      emitRate: 40,
      minLifeTime: 0.5,
      maxLifeTime: 1.5,
      minSize: 0.3,
      maxSize: 0.8,
      color1: new Color4(0.3, 0.2, 0.4, 0.5),
      color2: new Color4(0.2, 0.1, 0.3, 0.3),
      colorDead: new Color4(0.1, 0.0, 0.1, 0.0),
      minEmitPower: 0.5,
      maxEmitPower: 1.5,
      gravity: new Vector3(0, 1, 0),
    };
  }

  /** Kan partikulleri */
  public createBloodConfig(name: string, capacity = 150): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createFlareTexture(this.scene),
      emitRate: 100,
      minLifeTime: 0.3,
      maxLifeTime: 0.8,
      minSize: 0.05,
      maxSize: 0.15,
      color1: new Color4(1.0, 0.0, 0.0, 1.0),
      color2: new Color4(0.8, 0.0, 0.0, 0.8),
      colorDead: new Color4(0.3, 0.0, 0.0, 0.0),
      minEmitPower: 2,
      maxEmitPower: 5,
      gravity: new Vector3(0, -3, 0),
      blendMode: ParticleSystem.BLENDMODE_ADD,
    };
  }

  /** Yildirim kivilcim */
  public createLightningConfig(name: string, capacity = 100): ParticleConfig {
    return {
      name,
      capacity: Math.round(capacity * this.getParticleMultiplier()),
      texture: createSparkTexture(this.scene),
      emitRate: 200,
      minLifeTime: 0.05,
      maxLifeTime: 0.2,
      minSize: 0.03,
      maxSize: 0.1,
      color1: new Color4(1.0, 1.0, 1.0, 1.0),
      color2: new Color4(0.4, 0.7, 1.0, 1.0),
      colorDead: new Color4(0.0, 0.2, 0.5, 0.0),
      minEmitPower: 5,
      maxEmitPower: 12,
      gravity: new Vector3(0, -1, 0),
      blendMode: ParticleSystem.BLENDMODE_ADD,
    };
  }

  // ─── YARDIMCI: Emitter ayarlama ───

  /** Kure emitter olustur */
  public createSphereEmitter(radius: number, radiusRange = 0): SphereParticleEmitter {
    const emitter = new SphereParticleEmitter(radius);
    emitter.radiusRange = radiusRange;
    return emitter;
  }

  /** Kutu emitter olustur */
  public createBoxEmitter(
    min: Vector3 = new Vector3(-1, 0, -1),
    max: Vector3 = new Vector3(1, 1, 1),
    dirMin: Vector3 = new Vector3(-1, 1, -1),
    dirMax: Vector3 = new Vector3(1, 3, 1),
  ): BoxParticleEmitter {
    const emitter = new BoxParticleEmitter();
    emitter.minEmitBox = min;
    emitter.maxEmitBox = max;
    emitter.direction1 = dirMin;
    emitter.direction2 = dirMax;
    return emitter;
  }

  // ─── TEXTURE ERISIMLERI ───

  public getFlareTexture() { return createFlareTexture(this.scene); }
  public getSmokeTexture() { return createSmokeTexture(this.scene); }
  public getSparkTexture() { return createSparkTexture(this.scene); }
  public getSlashArcTexture() { return createSlashArcTexture(this.scene); }
  public getMagicCircleTexture() { return createMagicCircleTexture(this.scene); }
  public getRingTexture() { return createRingTexture(this.scene); }
  public getFireTexture() { return createFireTexture(this.scene); }
  public getIceTexture() { return createIceTexture(this.scene); }

  // ─── UPDATE ───

  /** Her frame gercek dt ile cagir (slow motion uygulanmamis) */
  public update(realDt: number): void {
    this.slowMotion.update(realDt);
    const dt = this.slowMotion.scaleDt(realDt);

    this.screenShake.update(dt);
    this.lightFlash.update(dt);
    this.shockwave.update(dt);
    this.groundDecal.update(dt);
    this.slashEffect.update(dt);
    this.cinematicCamera.update(realDt);
    this.afterimage.update(realDt);
  }

  /** Slow motion uygulanmis dt dondurur — oyun sistemleri bu dt'yi kullanabilir */
  public scaleDt(realDt: number): number {
    return this.slowMotion.scaleDt(realDt);
  }

  // ─── DISPOSE ───

  public dispose(): void {
    this.particlePool.dispose();
    this.screenShake.dispose();
    this.lightFlash.dispose();
    this.shockwave.dispose();
    this.groundDecal.dispose();
    this.slashEffect.dispose();
    this.afterimage.dispose();
    this.glowLayer.dispose();
  }
}
