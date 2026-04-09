/**
 * Kamera sarsintisi efekti.
 * Skill cast ve patlama anlarinda juice ekler.
 */

import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';

export class ScreenShake {
  private camera: ArcRotateCamera | null = null;
  private amplitude = 0;
  private duration = 0;
  private elapsed = 0;
  private originalAlpha = 0;
  private originalBeta = 0;
  private active = false;

  public setCamera(camera: ArcRotateCamera): void {
    this.camera = camera;
  }

  /**
   * Sarsinti baslat.
   * @param amplitude — max sapma (radyan), tipik: 0.05-0.2
   * @param duration — sure (saniye), tipik: 0.1-0.8
   */
  public shake(amplitude: number, duration: number): void {
    if (!this.camera) return;

    // Onceki sarsinti devam ediyorsa daha gucluyse birak
    if (this.active && this.amplitude > amplitude) return;

    this.amplitude = amplitude;
    this.duration = duration;
    this.elapsed = 0;
    this.originalAlpha = this.camera.alpha;
    this.originalBeta = this.camera.beta;
    this.active = true;
  }

  /** Her frame cagir */
  public update(dt: number): void {
    if (!this.active || !this.camera) return;

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      // Orijinal pozisyona geri don
      this.camera.alpha = this.originalAlpha;
      this.camera.beta = this.originalBeta;
      this.active = false;
      return;
    }

    // Decay: ilerledikce azalir
    const progress = this.elapsed / this.duration;
    const decay = 1 - progress;
    const currentAmp = this.amplitude * decay;

    // Rastgele sapma
    const shakeAlpha = (Math.random() * 2 - 1) * currentAmp;
    const shakeBeta = (Math.random() * 2 - 1) * currentAmp * 0.5;

    this.camera.alpha = this.originalAlpha + shakeAlpha;
    this.camera.beta = this.originalBeta + shakeBeta;
  }

  public isActive(): boolean {
    return this.active;
  }

  public dispose(): void {
    if (this.active && this.camera) {
      this.camera.alpha = this.originalAlpha;
      this.camera.beta = this.originalBeta;
    }
    this.active = false;
    this.camera = null;
  }
}
