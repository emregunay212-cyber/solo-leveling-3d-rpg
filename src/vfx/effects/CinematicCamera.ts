/**
 * Sprint 4 — Sinematik Kamera
 * ArcRotateCamera uzerinde gecici animasyonlu sekanslar.
 */

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

interface CameraStep {
  type: 'radius' | 'beta' | 'alpha' | 'fov' | 'target';
  from: number | Vector3;
  to: number | Vector3;
  duration: number;
  easing: EasingType;
}

interface ActiveStep extends CameraStep {
  elapsed: number;
}

export interface CameraSequence {
  steps: Array<{
    type: 'radius' | 'beta' | 'alpha' | 'fov' | 'target';
    delta: number | Vector3;   // ne kadar degisecek (mevcut degerden)
    duration: number;
    easing?: EasingType;
  }>;
  /** Tum sekans bittikten sonra orijinale don (saniye) */
  restoreAfter?: number;
}

/** On tanimli sinematik sekanslar */
export const CINEMATIC_SEQUENCES = {
  PARRY_ZOOM: {
    steps: [
      { type: 'fov' as const, delta: -0.15, duration: 0.08, easing: 'easeOut' as const },
      { type: 'fov' as const, delta:  0.15, duration: 0.10, easing: 'easeIn' as const },
    ],
  },
  Q_MAX_ARRIVAL: {
    steps: [
      { type: 'radius' as const, delta: -2,   duration: 0.10, easing: 'easeOut' as const },
      { type: 'radius' as const, delta:  2,   duration: 0.20, easing: 'easeIn' as const  },
    ],
  },
  F_CINEMATIC: {
    steps: [
      { type: 'radius' as const, delta:  5,   duration: 0.30, easing: 'easeOut' as const },
      { type: 'beta'   as const, delta: -0.2, duration: 0.30, easing: 'easeOut' as const },
      { type: 'radius' as const, delta: -5,   duration: 0.50, easing: 'easeIn' as const  },
      { type: 'beta'   as const, delta:  0.2, duration: 0.50, easing: 'easeIn' as const  },
    ],
  },
  DOMAIN_EXPAND: {
    steps: [
      { type: 'radius' as const, delta:  8,   duration: 0.30, easing: 'easeOut' as const },
      { type: 'beta'   as const, delta: -0.3, duration: 0.30, easing: 'easeOut' as const },
      { type: 'radius' as const, delta: -8,   duration: 0.50, easing: 'easeIn' as const  },
      { type: 'beta'   as const, delta:  0.3, duration: 0.50, easing: 'easeIn' as const  },
    ],
  },
};

interface ActiveStep extends CameraStep {
  elapsed: number;
}

export class CinematicCamera {
  private camera: ArcRotateCamera;
  private activeSteps: ActiveStep[] = [];
  private stepQueue: CameraStep[] = [];
  private baseRadius: number;
  private baseBeta: number;
  private baseAlpha: number;
  private baseFov: number;

  constructor(camera: ArcRotateCamera) {
    this.camera = camera;
    this.baseRadius = camera.radius;
    this.baseBeta   = camera.beta;
    this.baseAlpha  = camera.alpha;
    this.baseFov    = camera.fov;
  }

  /** Kamera sekansini oyna. */
  public play(seq: CameraSequence): void {
    // Onceki sekansları durdur, base'i guncelle
    this.activeSteps = [];
    this.stepQueue = [];
    this.baseRadius = this.camera.radius;
    this.baseBeta   = this.camera.beta;
    this.baseAlpha  = this.camera.alpha;
    this.baseFov    = this.camera.fov;

    let timeOffset = 0;
    for (const s of seq.steps) {
      const step = this.buildStep(s, timeOffset);
      this.stepQueue.push(step);
      timeOffset += s.duration;
    }

    // Ilk adimi baslat
    this.startNextStep();
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    for (let i = this.activeSteps.length - 1; i >= 0; i--) {
      const step = this.activeSteps[i];
      step.elapsed += dt;

      const rawT = Math.min(1, step.elapsed / step.duration);
      const t = this.ease(rawT, step.easing);

      if (typeof step.from === 'number' && typeof step.to === 'number') {
        const val = step.from + (step.to - step.from) * t;
        this.applyValue(step.type as string, val);
      }

      if (step.elapsed >= step.duration) {
        // Bu adim bitti — kuyruktaki bir sonrakini baslat
        this.activeSteps.splice(i, 1);
        this.startNextStep();
      }
    }
  }

  public isPlaying(): boolean {
    return this.activeSteps.length > 0 || this.stepQueue.length > 0;
  }

  // ─── internals ───

  private buildStep(
    s: CameraSequence['steps'][0],
    _timeOffset: number,
  ): CameraStep {
    const from = this.getCurrentValue(s.type);
    const delta = typeof s.delta === 'number' ? s.delta : 0;
    return {
      type: s.type,
      from,
      to: typeof from === 'number' ? from + delta : from,
      duration: s.duration,
      easing: s.easing ?? 'easeInOut',
    };
  }

  private startNextStep(): void {
    if (this.stepQueue.length === 0) return;
    const base = this.stepQueue.shift()!;
    // from'u guncelle (onceki adim nerede bitmis)
    const from = this.getCurrentValue(base.type);
    const delta = typeof base.to === 'number' && typeof base.from === 'number'
      ? base.to - base.from : 0;
    const activeStep: ActiveStep = {
      ...base,
      from,
      to: typeof from === 'number' ? from + delta : from,
      elapsed: 0,
    };
    this.activeSteps.push(activeStep);
  }

  private getCurrentValue(type: string): number {
    switch (type) {
      case 'radius': return this.camera.radius;
      case 'beta':   return this.camera.beta;
      case 'alpha':  return this.camera.alpha;
      case 'fov':    return this.camera.fov;
      default:       return 0;
    }
  }

  private applyValue(type: string, val: number): void {
    switch (type) {
      case 'radius': this.camera.radius = Math.max(2, val); break;
      case 'beta':   this.camera.beta   = Math.max(0.1, Math.min(1.5, val)); break;
      case 'alpha':  this.camera.alpha  = val; break;
      case 'fov':    this.camera.fov    = Math.max(0.3, Math.min(2.0, val)); break;
    }
  }

  private ease(t: number, type: EasingType): number {
    switch (type) {
      case 'easeIn':    return t * t;
      case 'easeOut':   return 1 - (1 - t) * (1 - t);
      case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      default:          return t;
    }
  }
}
