/**
 * ParticleSystem nesne havuzu.
 * Her skill efekti havuzdan alinir, bitince geri doner — GC baski azalir.
 */

import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { GPUParticleSystem } from '@babylonjs/core/Particles/gpuParticleSystem';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

/** Particle system olusturma konfigurasyonu */
export interface ParticleConfig {
  readonly name: string;
  readonly capacity: number;
  readonly texture: DynamicTexture;
  readonly emitRate: number;
  readonly minLifeTime: number;
  readonly maxLifeTime: number;
  readonly minSize: number;
  readonly maxSize: number;
  readonly color1: Color4;
  readonly color2: Color4;
  readonly colorDead: Color4;
  readonly minEmitPower: number;
  readonly maxEmitPower: number;
  readonly gravity?: Vector3;
  readonly blendMode?: number;
  readonly useGPU?: boolean;
  /** Manuel patlama — emitRate:0 ile birlikte kullanilir */
  readonly manualEmitCount?: number;
  readonly targetStopDuration?: number;
}

export class ParticlePool {
  private scene: Scene;
  private pools = new Map<string, ParticleSystem[]>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Havuzdan particle system al veya yeni olustur */
  public acquire(config: ParticleConfig): ParticleSystem {
    const pool = this.pools.get(config.name);
    if (pool && pool.length > 0) {
      const sys = pool.pop()!;
      this.applyConfig(sys, config);
      return sys;
    }

    const sys = config.useGPU
      ? new GPUParticleSystem(config.name, { capacity: config.capacity }, this.scene) as unknown as ParticleSystem
      : new ParticleSystem(config.name, config.capacity, this.scene);

    this.applyConfig(sys, config);
    return sys;
  }

  /** Kullanilmis particle system'i havuza geri ver */
  public release(sys: ParticleSystem): void {
    sys.stop();
    sys.reset();
    const name = sys.name;
    if (!this.pools.has(name)) {
      this.pools.set(name, []);
    }
    const pool = this.pools.get(name)!;
    // Havuz boyutunu sinirla
    if (pool.length < 4) {
      pool.push(sys);
    } else {
      sys.dispose();
    }
  }

  /** Tek kullanimlik: particle system olustur, sur, sonra otomatik temizle */
  public playOnce(
    config: ParticleConfig,
    emitter: Vector3,
    durationMs: number,
  ): ParticleSystem {
    const sys = this.acquire(config);
    sys.emitter = emitter;
    sys.start();

    // Yayimi durdur, kalan partikullerin olmesini bekle
    setTimeout(() => {
      sys.stop();
      const maxLife = config.maxLifeTime * 1000;
      setTimeout(() => {
        this.release(sys);
      }, maxLife + 100);
    }, durationMs);

    return sys;
  }

  private applyConfig(sys: ParticleSystem, cfg: ParticleConfig): void {
    sys.particleTexture = cfg.texture;
    sys.emitRate = cfg.emitRate;
    sys.minLifeTime = cfg.minLifeTime;
    sys.maxLifeTime = cfg.maxLifeTime;
    sys.minSize = cfg.minSize;
    sys.maxSize = cfg.maxSize;
    sys.color1 = cfg.color1;
    sys.color2 = cfg.color2;
    sys.colorDead = cfg.colorDead;
    sys.minEmitPower = cfg.minEmitPower;
    sys.maxEmitPower = cfg.maxEmitPower;
    sys.gravity = cfg.gravity ?? new Vector3(0, -2, 0);
    if (cfg.blendMode !== undefined) {
      sys.blendMode = cfg.blendMode;
    }
    if (cfg.manualEmitCount !== undefined) {
      sys.manualEmitCount = cfg.manualEmitCount;
    }
    if (cfg.targetStopDuration !== undefined) {
      sys.targetStopDuration = cfg.targetStopDuration;
    }
  }

  public dispose(): void {
    for (const pool of this.pools.values()) {
      for (const sys of pool) sys.dispose();
    }
    this.pools.clear();
  }
}
