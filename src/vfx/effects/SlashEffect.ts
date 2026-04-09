/**
 * Kilic darbesi izi efekti.
 * Kombo vuruslari ve dash skill'ler icin ark/cizgi gorseli.
 */

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

interface ActiveSlash {
  mesh: Mesh;
  mat: StandardMaterial;
  timer: number;
  maxTime: number;
}

export class SlashEffect {
  private scene: Scene;
  private slashes: ActiveSlash[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Tek ark slash efekti.
   * @param position — vurus noktasi
   * @param direction — vurus yonu
   * @param scale — boyut carpani (1=normal, 1.5=finisher)
   * @param color — ark rengi
   * @param texture — slash arc texture (null ise duz renk)
   * @param duration — sure (tipik: 0.2-0.4)
   */
  public spawnArc(
    position: Vector3,
    direction: Vector3,
    scale = 1,
    color: Color3 = new Color3(0.8, 0.6, 1.0),
    texture: DynamicTexture | null = null,
    duration = 0.3,
  ): void {
    const width = 2.0 * scale;
    const height = 0.5 * scale;

    const plane = MeshBuilder.CreatePlane(`vfx_slash_${Date.now()}`, {
      width, height,
    }, this.scene);

    // Pozisyon: vurus noktasi, hafif yukarda
    plane.position.set(position.x, position.y + 1.0, position.z);
    plane.billboardMode = 7; // BILLBOARDMODE_ALL — her zaman kameraya bakar
    plane.isPickable = false;

    const mat = new StandardMaterial(`vfx_slash_m_${Date.now()}`, this.scene);
    mat.emissiveColor = color;
    mat.diffuseColor = Color3.Black();
    if (texture) {
      mat.emissiveTexture = texture;
      mat.opacityTexture = texture;
    }
    mat.alpha = 0.9;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    plane.material = mat;

    this.slashes.push({
      mesh: plane,
      mat,
      timer: duration,
      maxTime: duration,
    });
  }

  /**
   * X seklinde capraz slash (finisher vb.).
   */
  public spawnCross(
    position: Vector3,
    scale = 1.2,
    color: Color3 = new Color3(0.9, 0.5, 1.0),
    texture: DynamicTexture | null = null,
  ): void {
    // Iki capraz ark olustur
    this.spawnArc(position, Vector3.Forward(), scale, color, texture, 0.35);
    // Ikinci arki biraz delay ile olusturmak yerine hemen ama farkli aci
    const width = 2.0 * scale;
    const height = 0.5 * scale;

    const plane = MeshBuilder.CreatePlane(`vfx_slash_x_${Date.now()}`, {
      width, height,
    }, this.scene);
    plane.position.set(position.x, position.y + 1.0, position.z);
    plane.billboardMode = 7;
    plane.rotation.z = Math.PI / 4; // 45 derece capraz
    plane.isPickable = false;

    const mat = new StandardMaterial(`vfx_slash_xm_${Date.now()}`, this.scene);
    mat.emissiveColor = color;
    mat.diffuseColor = Color3.Black();
    if (texture) {
      mat.emissiveTexture = texture;
      mat.opacityTexture = texture;
    }
    mat.alpha = 0.9;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    plane.material = mat;

    this.slashes.push({
      mesh: plane,
      mat,
      timer: 0.35,
      maxTime: 0.35,
    });
  }

  /** Her frame cagir */
  public update(dt: number): void {
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.timer -= dt;

      if (s.timer <= 0) {
        s.mesh.dispose();
        s.mat.dispose();
        this.slashes.splice(i, 1);
        continue;
      }

      const t = 1 - (s.timer / s.maxTime); // 0→1
      // Hizla buyur, sonra sol
      const scaleT = t < 0.3 ? t / 0.3 : 1;
      s.mesh.scaling.setAll(0.5 + scaleT * 0.5);
      // Fade out
      s.mat.alpha = 0.9 * (1 - t);
    }
  }

  public dispose(): void {
    for (const s of this.slashes) {
      s.mesh.dispose();
      s.mat.dispose();
    }
    this.slashes = [];
  }
}
