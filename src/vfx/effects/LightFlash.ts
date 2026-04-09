/**
 * Anlik isik patlamasi efekti.
 * Skill cast aninda kisa sureli renkli PointLight.
 */

import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

interface ActiveFlash {
  light: PointLight;
  timer: number;
  maxTime: number;
  startIntensity: number;
}

const MAX_CONCURRENT = 6;

export class LightFlash {
  private scene: Scene;
  private flashes: ActiveFlash[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Isik patlamasi olustur.
   * @param position — isik pozisyonu
   * @param color — isik rengi
   * @param intensity — baslangic yogunlugu (tipik: 3-8)
   * @param duration — sure (saniye, tipik: 0.1-0.5)
   * @param range — isik menzili (tipik: 5-15)
   */
  public flash(
    position: Vector3,
    color: Color3,
    intensity: number,
    duration: number,
    range = 10,
  ): void {
    // Esik asildiysa en eski flash'i erken bitir
    if (this.flashes.length >= MAX_CONCURRENT) {
      const oldest = this.flashes.shift();
      if (oldest) oldest.light.dispose();
    }

    const light = new PointLight(`vfx_flash_${Date.now()}`, position, this.scene);
    light.diffuse = color;
    light.specular = color;
    light.intensity = intensity;
    light.range = range;

    this.flashes.push({
      light,
      timer: duration,
      maxTime: duration,
      startIntensity: intensity,
    });
  }

  /** Her frame cagir */
  public update(dt: number): void {
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.timer -= dt;

      if (f.timer <= 0) {
        f.light.dispose();
        this.flashes.splice(i, 1);
        continue;
      }

      // Linear fade-out
      const t = f.timer / f.maxTime;
      f.light.intensity = f.startIntensity * t;
    }
  }

  public dispose(): void {
    for (const f of this.flashes) f.light.dispose();
    this.flashes = [];
  }
}
