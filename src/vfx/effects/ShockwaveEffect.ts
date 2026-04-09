/**
 * Genisleyen halka (shockwave) efekti.
 * AoE yeteneklerinde patlama dalgasi gorseli.
 */

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

interface ActiveShockwave {
  mesh: Mesh;
  mat: StandardMaterial;
  timer: number;
  maxTime: number;
  targetRadius: number;
  startY: number;
}

export class ShockwaveEffect {
  private scene: Scene;
  private waves: ActiveShockwave[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Shockwave olustur.
   * @param center — merkez pozisyon
   * @param targetRadius — max genisleme yaricapi
   * @param duration — sure (tipik: 0.3-0.6)
   * @param color — halka rengi
   * @param thickness — halka kalinligi (tipik: 0.08-0.15)
   */
  public spawn(
    center: Vector3,
    targetRadius: number,
    duration: number,
    color: Color3 = new Color3(0.5, 0.15, 0.9),
    thickness = 0.1,
  ): void {
    const ring = MeshBuilder.CreateTorus(`vfx_shock_${Date.now()}`, {
      diameter: 0.5,
      thickness,
      tessellation: 48,
    }, this.scene);
    ring.position.set(center.x, center.y + 0.1, center.z);
    ring.isPickable = false;

    const mat = new StandardMaterial(`vfx_shock_m_${Date.now()}`, this.scene);
    mat.emissiveColor = color;
    mat.diffuseColor = Color3.Black();
    mat.alpha = 0.8;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    ring.material = mat;

    this.waves.push({
      mesh: ring,
      mat,
      timer: duration,
      maxTime: duration,
      targetRadius,
      startY: center.y + 0.1,
    });
  }

  /** Her frame cagir */
  public update(dt: number): void {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.timer -= dt;

      if (w.timer <= 0) {
        w.mesh.dispose();
        w.mat.dispose();
        this.waves.splice(i, 1);
        continue;
      }

      const t = 1 - (w.timer / w.maxTime); // 0→1
      // Genisler
      const scale = 1 + t * w.targetRadius * 4;
      w.mesh.scaling.setAll(scale);
      // Hafif yukselir
      w.mesh.position.y = w.startY + t * 0.3;
      // Fade out
      w.mat.alpha = 0.8 * (1 - t);
    }
  }

  public dispose(): void {
    for (const w of this.waves) {
      w.mesh.dispose();
      w.mat.dispose();
    }
    this.waves = [];
  }
}
