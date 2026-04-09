/**
 * Zemin uzerine AoE buyu cemberi / patlama izi.
 * ShaderMaterial yerine StandardMaterial + DynamicTexture ile basit ama etkili.
 */

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

interface ActiveDecal {
  mesh: Mesh;
  mat: StandardMaterial;
  timer: number;
  maxTime: number;
  rotSpeed: number;
  scaleFrom: number;
  scaleTo: number;
}

export class GroundDecal {
  private scene: Scene;
  private decals: ActiveDecal[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Zemin dairesi olustur.
   * @param center — merkez pozisyon
   * @param radius — yaricap
   * @param duration — gorsel sure
   * @param texture — buyu cemberi/catlak texture
   * @param color — emissive renk
   * @param rotSpeed — rotation hizi (rad/sn)
   * @param scaleAnim — true ise 0'dan buyur
   */
  public spawn(
    center: Vector3,
    radius: number,
    duration: number,
    texture: DynamicTexture | null,
    color: Color3 = new Color3(0.5, 0.15, 0.9),
    rotSpeed = 0.5,
    scaleAnim = true,
  ): void {
    const disc = MeshBuilder.CreateDisc(`vfx_decal_${Date.now()}`, {
      radius,
      tessellation: 48,
    }, this.scene);
    disc.rotation.x = Math.PI / 2; // yere yatir
    disc.position.set(center.x, center.y + 0.03, center.z);
    disc.isPickable = false;

    const mat = new StandardMaterial(`vfx_decal_m_${Date.now()}`, this.scene);
    mat.emissiveColor = color;
    mat.diffuseColor = Color3.Black();
    if (texture) {
      mat.emissiveTexture = texture;
      mat.opacityTexture = texture;
    }
    mat.alpha = 0.7;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    disc.material = mat;

    if (scaleAnim) {
      disc.scaling.setAll(0.01);
    }

    this.decals.push({
      mesh: disc,
      mat,
      timer: duration,
      maxTime: duration,
      rotSpeed,
      scaleFrom: scaleAnim ? 0.01 : 1,
      scaleTo: 1,
    });
  }

  /** Her frame cagir */
  public update(dt: number): void {
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.timer -= dt;

      if (d.timer <= 0) {
        d.mesh.dispose();
        d.mat.dispose();
        this.decals.splice(i, 1);
        continue;
      }

      const t = 1 - (d.timer / d.maxTime); // 0→1

      // Rotation
      d.mesh.rotation.y += dt * d.rotSpeed;

      // Scale animasyonu (ilk %30'da buyur)
      if (d.scaleFrom < 1) {
        const scaleT = Math.min(1, t / 0.3);
        const eased = 1 - Math.pow(1 - scaleT, 3); // ease-out cubic
        const s = d.scaleFrom + (d.scaleTo - d.scaleFrom) * eased;
        d.mesh.scaling.setAll(s);
      }

      // Son %30'da fade out
      const fadeStart = 0.7;
      if (t > fadeStart) {
        const fadeT = (t - fadeStart) / (1 - fadeStart);
        d.mat.alpha = 0.7 * (1 - fadeT);
      }
    }
  }

  public dispose(): void {
    for (const d of this.decals) {
      d.mesh.dispose();
      d.mat.dispose();
    }
    this.decals = [];
  }
}
