import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { DAMAGE_NUMBERS } from '../config/GameConfig';

interface FloatingNumber {
  mesh: Mesh;
  velocity: Vector3;
  lifetime: number;
  maxLifetime: number;
}

/**
 * Floating damage numbers that appear above enemies when hit.
 * White = normal, Yellow = critical, Red = player taking damage
 */
export class DamageNumbers {
  private scene: Scene;
  private active: FloatingNumber[] = [];
  private pool: Mesh[] = [];
  private readonly MAX_POOL = DAMAGE_NUMBERS.maxPoolSize;
  private readonly FLOAT_SPEED = DAMAGE_NUMBERS.floatSpeed;
  private readonly LIFETIME = DAMAGE_NUMBERS.lifetime;
  private readonly SPREAD = DAMAGE_NUMBERS.spreadRange;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public spawn(
    position: Vector3,
    damage: number,
    type: 'normal' | 'critical' | 'player_hurt' | 'parry' | 'block' | 'backstab' | 'skill' | 'arise' | 'extract_fail'
  ): void {
    const mesh = this.getMesh();

    // Set text and color based on type
    const typeConfig = DAMAGE_NUMBERS.types[type];
    const color = typeConfig.color;
    const fontSize = typeConfig.fontSize;
    let text: string;

    switch (type) {
      case 'critical':
        text = `${damage}!`; break;
      case 'parry':
        text = 'PARRY!'; break;
      case 'backstab':
        text = `${damage}!`; break;
      case 'arise':
        text = 'ARISE!'; break;
      case 'extract_fail':
        text = 'BASARISIZ'; break;
      default:
        text = `${damage}`; break;
    }

    this.updateTexture(mesh, text, color, fontSize);

    // Position with random spread
    mesh.position = position.clone();
    mesh.position.x += (Math.random() - 0.5) * this.SPREAD;
    mesh.position.y += 0.5 + Math.random() * 0.3;
    mesh.position.z += (Math.random() - 0.5) * this.SPREAD;
    mesh.isVisible = true;

    // Scale based on type
    mesh.scaling.setAll(typeConfig.scale);

    this.active.push({
      mesh,
      velocity: new Vector3(
        (Math.random() - 0.5) * 0.5,
        this.FLOAT_SPEED,
        (Math.random() - 0.5) * 0.5
      ),
      lifetime: this.LIFETIME,
      maxLifetime: this.LIFETIME,
    });
  }

  public update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const num = this.active[i];
      num.lifetime -= dt;

      if (num.lifetime <= 0) {
        // Return to pool
        num.mesh.isVisible = false;
        this.pool.push(num.mesh);
        this.active.splice(i, 1);
        continue;
      }

      // Float up and slow down
      const t = 1 - (num.lifetime / num.maxLifetime);
      num.mesh.position.addInPlace(num.velocity.scale(dt));
      num.velocity.y *= DAMAGE_NUMBERS.velocityDeceleration; // decelerate

      // Fade out in last 30%
      const fadeStart = DAMAGE_NUMBERS.fadeStartPercent;
      if (t > fadeStart) {
        const alpha = 1 - (t - fadeStart) / (1 - fadeStart);
        const mat = num.mesh.material as StandardMaterial;
        if (mat) mat.alpha = alpha;
      }

      // Billboard: always face camera
      num.mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
    }
  }

  private getMesh(): Mesh {
    if (this.pool.length > 0) {
      const mesh = this.pool.pop()!;
      const mat = mesh.material as StandardMaterial;
      if (mat) mat.alpha = 1;
      return mesh;
    }

    // Create new plane mesh for the number
    const plane = MeshBuilder.CreatePlane('dmgNum', { width: 1.2, height: 0.6 }, this.scene);
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.isPickable = false;

    const texture = new DynamicTexture('dmgTex', { width: 256, height: 128 }, this.scene, false);
    texture.hasAlpha = true;

    const mat = new StandardMaterial('dmgMat', this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.useAlphaFromDiffuseTexture = true;
    mat.backFaceCulling = false;
    plane.material = mat;

    return plane;
  }

  private updateTexture(mesh: Mesh, text: string, color: string, fontSize: number): void {
    const mat = mesh.material as StandardMaterial;
    if (!mat) return;
    const texture = mat.diffuseTexture as DynamicTexture;
    if (!texture) return;

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 256, 128);

    // Text shadow
    ctx.font = `bold ${fontSize}px Arial`;
    (ctx as unknown as CanvasRenderingContext2D).textAlign = 'center';
    (ctx as unknown as CanvasRenderingContext2D).textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 130, 66);

    // Main text
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 64);

    texture.update();
  }

  public dispose(): void {
    this.active.forEach(n => n.mesh.dispose());
    this.pool.forEach(m => m.dispose());
    this.active = [];
    this.pool = [];
  }
}
