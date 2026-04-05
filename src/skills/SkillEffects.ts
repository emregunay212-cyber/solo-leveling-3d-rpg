import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';

interface ActiveEffect {
  meshes: Mesh[];
  mats: StandardMaterial[];
  timer: number;
  maxTime: number;
  update: (t: number, dt: number) => void;
}

/**
 * Skill gorsel efektleri — Solo Leveling mor tema.
 * Q: zemin isik seridi, E: vucut kalkani disk, R: patlama dalgasi, F: enerji sutunu
 */
export class SkillEffects {
  private scene: Scene;
  private effects: ActiveEffect[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
  }

  private makeMat(name: string, color: Color3, emissive: Color3, alpha: number): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = color;
    mat.emissiveColor = emissive;
    mat.alpha = alpha;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    return mat;
  }

  /** Q — Golge Bicagi: zemine yakin uzun mor isik seridi */
  public spawnDashTrail(startPos: Vector3, direction: Vector3, distance: number): void {
    const midPoint = startPos.add(direction.scale(distance / 2));
    const angle = Math.atan2(direction.x, direction.z);

    // Uzun ince plane — yolun tamamini kaplar
    const trail = MeshBuilder.CreatePlane('fx_trail', {
      width: distance, height: 0.8,
    }, this.scene);
    trail.position.set(midPoint.x, startPos.y + 0.05, midPoint.z);
    trail.rotation.x = Math.PI / 2; // yere yatir
    trail.rotation.z = -angle;
    trail.isPickable = false;

    const mat = this.makeMat('fx_trail_m',
      new Color3(0.5, 0.1, 0.9),
      new Color3(0.6, 0.2, 1.0),
      0.7,
    );
    trail.material = mat;

    // Kenar glow — biraz daha genis ve soluk
    const glow = MeshBuilder.CreatePlane('fx_trail_glow', {
      width: distance * 1.1, height: 1.6,
    }, this.scene);
    glow.position.copyFrom(trail.position);
    glow.position.y -= 0.01;
    glow.rotation.x = Math.PI / 2;
    glow.rotation.z = -angle;
    glow.isPickable = false;

    const glowMat = this.makeMat('fx_trail_glow_m',
      new Color3(0.3, 0.05, 0.6),
      new Color3(0.4, 0.1, 0.8),
      0.3,
    );
    glow.material = glowMat;

    this.effects.push({
      meshes: [trail, glow],
      mats: [mat, glowMat],
      timer: 0.4,
      maxTime: 0.4,
      update: (t) => {
        // Hizla solar
        mat.alpha = 0.7 * (1 - t);
        glowMat.alpha = 0.3 * (1 - t);
        // Hafif genisleme
        trail.scaling.y = 1 + t * 0.3;
        glow.scaling.y = 1 + t * 0.5;
      },
    });
  }

  /** E — Golge Kalkani: vucut etrafinda donen disk + halka */
  public spawnShieldSphere(targetGetter: () => Vector3, duration: number): void {
    // Govde etrafinda yatay disk (bel hizasinda)
    const disk = MeshBuilder.CreateDisc('fx_shield_disk', {
      radius: 1.3, tessellation: 32,
    }, this.scene);
    disk.rotation.x = Math.PI / 2; // yere paralel
    disk.isPickable = false;

    const diskMat = this.makeMat('fx_shield_disk_m',
      new Color3(0.3, 0.08, 0.5),
      new Color3(0.4, 0.12, 0.7),
      0.2,
    );
    disk.material = diskMat;

    // Donen dis halka (torus — bel hizasi)
    const ring = MeshBuilder.CreateTorus('fx_shield_ring', {
      diameter: 2.6, thickness: 0.06, tessellation: 48,
    }, this.scene);
    ring.isPickable = false;

    const ringMat = this.makeMat('fx_shield_ring_m',
      new Color3(0.5, 0.15, 0.8),
      new Color3(0.6, 0.2, 1.0),
      0.5,
    );
    ring.material = ringMat;

    // Ust halka (omuz hizasi)
    const ring2 = MeshBuilder.CreateTorus('fx_shield_ring2', {
      diameter: 1.8, thickness: 0.04, tessellation: 32,
    }, this.scene);
    ring2.isPickable = false;
    const ring2Mat = this.makeMat('fx_shield_ring2_m',
      new Color3(0.4, 0.1, 0.7),
      new Color3(0.5, 0.15, 0.9),
      0.35,
    );
    ring2.material = ring2Mat;

    const meshes = [disk, ring, ring2];
    const mats = [diskMat, ringMat, ring2Mat];

    this.effects.push({
      meshes, mats,
      timer: duration,
      maxTime: duration,
      update: (t, dt) => {
        const p = targetGetter();

        // Disk — bel hizasi
        disk.position.set(p.x, p.y + 0.5, p.z);
        // Ana halka — bel hizasi, doner
        ring.position.set(p.x, p.y + 0.5, p.z);
        ring.rotation.y += dt * 1.5;
        ring.rotation.x = Math.sin(t * Math.PI * 4) * 0.08; // hafif sallanma
        // Ust halka — omuz hizasi, ters yonde doner
        ring2.position.set(p.x, p.y + 1.2, p.z);
        ring2.rotation.y -= dt * 2.5;

        // Nefes efekti
        const pulse = 1 + Math.sin(t * Math.PI * 10) * 0.04;
        disk.scaling.setAll(pulse);

        // Son 1 saniyede fade out
        const remaining = (1 - t) * duration;
        if (remaining < 1) {
          diskMat.alpha = 0.2 * remaining;
          ringMat.alpha = 0.5 * remaining;
          ring2Mat.alpha = 0.35 * remaining;
        }
      },
    });
  }

  /** R — Golge Patlama: zeminden yukselen sok dalgasi */
  public spawnBurstRing(center: Vector3, maxRadius: number): void {
    // Zemin dalgasi — genisleyen torus
    const wave = MeshBuilder.CreateTorus('fx_burst_wave', {
      diameter: 0.5, thickness: 0.12, tessellation: 48,
    }, this.scene);
    wave.position.set(center.x, center.y + 0.08, center.z);
    wave.isPickable = false;

    const waveMat = this.makeMat('fx_burst_wave_m',
      new Color3(0.5, 0.1, 0.9),
      new Color3(0.7, 0.2, 1.0),
      0.8,
    );
    wave.material = waveMat;

    // Dikey enerji halkasi (dikine duran torus)
    const vRing = MeshBuilder.CreateTorus('fx_burst_vring', {
      diameter: 0.3, thickness: 0.05, tessellation: 32,
    }, this.scene);
    vRing.position.set(center.x, center.y + 0.8, center.z);
    vRing.rotation.x = Math.PI / 2; // dikine cevir
    vRing.isPickable = false;

    const vRingMat = this.makeMat('fx_burst_vring_m',
      new Color3(0.6, 0.15, 1.0),
      new Color3(0.7, 0.25, 1.0),
      0.6,
    );
    vRing.material = vRingMat;

    // Merkez parlama diski
    const flash = MeshBuilder.CreateDisc('fx_burst_flash', {
      radius: 0.8, tessellation: 24,
    }, this.scene);
    flash.position.set(center.x, center.y + 0.1, center.z);
    flash.rotation.x = Math.PI / 2;
    flash.isPickable = false;

    const flashMat = this.makeMat('fx_burst_flash_m',
      new Color3(0.7, 0.3, 1.0),
      new Color3(0.9, 0.5, 1.0),
      0.6,
    );
    flash.material = flashMat;

    const meshes = [wave, vRing, flash];
    const mats = [waveMat, vRingMat, flashMat];

    this.effects.push({
      meshes, mats,
      timer: 0.7,
      maxTime: 0.7,
      update: (t, dt) => {
        // Dalga genisler
        const scale = 1 + t * maxRadius * 2.5;
        wave.scaling.setAll(scale);
        wave.position.y = center.y + 0.08 + t * 0.3;

        // Dikey halka genisler + yukselir
        vRing.scaling.setAll(1 + t * maxRadius * 2);
        vRing.position.y = center.y + 0.8 + t * 2;
        vRing.rotation.z += dt * 4;

        // Merkez flash hizla buyuyup solar
        flash.scaling.setAll(1 + t * 3);

        // Fade out
        waveMat.alpha = 0.8 * (1 - t);
        vRingMat.alpha = 0.6 * (1 - t * 1.2);
        flashMat.alpha = 0.6 * Math.max(0, 1 - t * 2);
      },
    });
  }

  /** F — Hukumdar Aurasi: zemin catlagi + enerji sutunu + sok dalgasi */
  public spawnAuraWave(center: Vector3, maxRadius: number): void {
    // Enerji sutunu (dikey silindir)
    const pillar = MeshBuilder.CreateCylinder('fx_aura_pillar', {
      height: 0.5, diameter: 1.2, tessellation: 24,
    }, this.scene);
    pillar.position.set(center.x, center.y + 0.25, center.z);
    pillar.isPickable = false;

    const pillarMat = this.makeMat('fx_aura_pillar_m',
      new Color3(0.5, 0.1, 0.8),
      new Color3(0.7, 0.25, 1.0),
      0.3,
    );
    pillar.material = pillarMat;

    // Zemin catlak halkasi
    const crack = MeshBuilder.CreateTorus('fx_aura_crack', {
      diameter: 1, thickness: 0.2, tessellation: 48,
    }, this.scene);
    crack.position.set(center.x, center.y + 0.05, center.z);
    crack.isPickable = false;

    const crackMat = this.makeMat('fx_aura_crack_m',
      new Color3(0.6, 0.15, 0.9),
      new Color3(0.8, 0.3, 1.0),
      0.7,
    );
    crack.material = crackMat;

    // Dis sok dalgasi (buyuk torus)
    const shock = MeshBuilder.CreateTorus('fx_aura_shock', {
      diameter: 0.5, thickness: 0.08, tessellation: 48,
    }, this.scene);
    shock.position.set(center.x, center.y + 0.15, center.z);
    shock.isPickable = false;

    const shockMat = this.makeMat('fx_aura_shock_m',
      new Color3(0.4, 0.08, 0.7),
      new Color3(0.5, 0.15, 0.9),
      0.5,
    );
    shock.material = shockMat;

    // Ust parlama diski
    const crown = MeshBuilder.CreateDisc('fx_aura_crown', {
      radius: 0.6, tessellation: 24,
    }, this.scene);
    crown.position.set(center.x, center.y + 0.1, center.z);
    crown.rotation.x = Math.PI / 2;
    crown.isPickable = false;

    const crownMat = this.makeMat('fx_aura_crown_m',
      new Color3(0.8, 0.4, 1.0),
      new Color3(1.0, 0.6, 1.0),
      0.5,
    );
    crown.material = crownMat;

    const meshes = [pillar, crack, shock, crown];
    const mats = [pillarMat, crackMat, shockMat, crownMat];

    this.effects.push({
      meshes, mats,
      timer: 1.5,
      maxTime: 1.5,
      update: (t, dt) => {
        // Sutun yukselir + genisler
        const pillarH = 0.5 + t * 12;
        pillar.scaling.y = pillarH;
        pillar.position.y = center.y + pillarH * 0.25;
        pillar.scaling.x = 1 - t * 0.3;
        pillar.scaling.z = 1 - t * 0.3;
        pillarMat.alpha = 0.3 * (1 - t * 0.8);

        // Catlak halkasi genisler
        crack.scaling.setAll(1 + t * maxRadius * 2);
        crackMat.alpha = 0.7 * (1 - t);

        // Sok dalgasi hizla genisler
        shock.scaling.setAll(1 + t * maxRadius * 3);
        shock.position.y = center.y + 0.15 + t * 0.5;
        shockMat.alpha = 0.5 * Math.max(0, 1 - t * 1.5);

        // Ust parlama
        crown.scaling.setAll(1 + t * 4);
        crownMat.alpha = 0.5 * Math.max(0, 1 - t * 2.5);
      },
    });
  }

  public update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.timer -= dt;

      if (fx.timer <= 0) {
        for (const mesh of fx.meshes) mesh.dispose();
        for (const mat of fx.mats) mat.dispose();
        this.effects.splice(i, 1);
        continue;
      }

      const t = 1 - (fx.timer / fx.maxTime);
      fx.update(t, dt);
    }
  }

  public dispose(): void {
    for (const fx of this.effects) {
      for (const mesh of fx.meshes) mesh.dispose();
      for (const mat of fx.mats) mat.dispose();
    }
    this.effects = [];
  }
}
