import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';

interface RippleEffect {
  ring: Mesh;
  age: number;
  maxAge: number;
}

/**
 * Shows a ripple/wave effect on the ground where the player clicks.
 * Ring expands outward and fades away.
 */
export class ClickIndicator {
  private scene: Scene;
  private active: RippleEffect[] = [];
  private pool: Mesh[] = [];
  private material: StandardMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    this.material = new StandardMaterial('clickRippleMat', scene);
    this.material.diffuseColor = new Color3(0.5, 0.3, 1.0);
    this.material.emissiveColor = new Color3(0.3, 0.15, 0.7);
    this.material.alpha = 0.8;
    this.material.disableLighting = true;
    this.material.backFaceCulling = false;
  }

  public spawn(position: Vector3): void {
    const ring = this.getRing();
    ring.position.set(position.x, position.y + 0.05, position.z);
    ring.scaling.setAll(0.1);
    ring.isVisible = true;

    // Clone material so each ripple fades independently
    const mat = this.material.clone(`rippleMat_${Date.now()}`);
    mat.alpha = 0.8;
    ring.material = mat;

    this.active.push({
      ring,
      age: 0,
      maxAge: 0.6,
    });
  }

  public update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const ripple = this.active[i];
      ripple.age += dt;

      const t = ripple.age / ripple.maxAge; // 0 to 1

      if (t >= 1) {
        // Done - recycle
        ripple.ring.isVisible = false;
        (ripple.ring.material as StandardMaterial)?.dispose();
        this.pool.push(ripple.ring);
        this.active.splice(i, 1);
        continue;
      }

      // Expand ring
      const scale = 0.1 + t * 2.0;
      ripple.ring.scaling.setAll(scale);

      // Fade out
      const mat = ripple.ring.material as StandardMaterial;
      if (mat) {
        mat.alpha = 0.8 * (1 - t);
      }
    }
  }

  private getRing(): Mesh {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    // Create a torus (ring shape) flat on the ground
    const ring = MeshBuilder.CreateTorus('clickRing', {
      diameter: 1,
      thickness: 0.05,
      tessellation: 32,
    }, this.scene);
    ring.rotation.x = 0; // flat on ground
    ring.isPickable = false;
    ring.material = this.material;

    return ring;
  }

  public dispose(): void {
    this.active.forEach(r => {
      (r.ring.material as StandardMaterial)?.dispose();
      r.ring.dispose();
    });
    this.pool.forEach(m => m.dispose());
    this.material.dispose();
    this.active = [];
    this.pool = [];
  }
}
