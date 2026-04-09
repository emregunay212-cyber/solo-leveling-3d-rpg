/**
 * Sprint 6 — Afterimage Efekti
 * Dash sirasinda golge siluetleri (yari-saydam klon mesh'ler, fade-out).
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

interface Afterimage {
  mesh: Mesh;
  mat: StandardMaterial;
  timer: number;
  maxTime: number;
}

export class AfterimageEffect {
  private scene: Scene;
  private images: Afterimage[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Golge afterimage olustur.
   * @param sourceMesh  Kopyalanacak mesh (oyuncu mesh'i)
   * @param position    Kalkis / ara nokta pozisyonu
   * @param rotation    Mesh rotasyonu
   * @param count       Kac adet olusturulacak
   * @param interval    Aralarindaki gecikme (saniye)
   * @param color       Siluet rengi (varsayilan siyah-mor)
   * @param fadeDuration Her birinin kaybolma suresi
   */
  public spawn(
    sourceMesh: Mesh,
    position: Vector3,
    rotation: Vector3,
    count: number = 3,
    interval: number = 0.05,
    color: Color3 = new Color3(0.3, 0.1, 0.6),
    fadeDuration: number = 0.3,
  ): void {
    for (let i = 0; i < count; i++) {
      const delay = i * interval;
      setTimeout(() => {
        this.spawnSingle(sourceMesh, position, rotation, color, fadeDuration);
      }, delay * 1000);
    }
  }

  private spawnSingle(
    sourceMesh: Mesh,
    position: Vector3,
    rotation: Vector3,
    color: Color3,
    fadeDuration: number,
  ): void {
    const clone = sourceMesh.clone(`afterimage_${Date.now()}`, null);
    if (!clone) return;

    clone.position.copyFrom(position);
    clone.rotation.copyFrom(rotation);
    clone.isPickable = false;

    const mat = new StandardMaterial(`afterimage_mat_${Date.now()}`, this.scene);
    mat.emissiveColor = color;
    mat.diffuseColor = Color3.Black();
    mat.alpha = 0.6;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    clone.material = mat;

    this.images.push({
      mesh: clone,
      mat,
      timer: fadeDuration,
      maxTime: fadeDuration,
    });
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    for (let i = this.images.length - 1; i >= 0; i--) {
      const img = this.images[i];
      img.timer -= dt;
      if (img.timer <= 0) {
        img.mesh.dispose();
        img.mat.dispose();
        this.images.splice(i, 1);
      } else {
        img.mat.alpha = 0.6 * (img.timer / img.maxTime);
      }
    }
  }

  public dispose(): void {
    for (const img of this.images) {
      img.mesh.dispose();
      img.mat.dispose();
    }
    this.images = [];
  }
}
