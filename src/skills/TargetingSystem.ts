/**
 * Sprint 2 — Hedefleme Sistemi
 * Charge sirasinda zeminde AoE daire veya yon oku gostergesi.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { ChargeLevel } from './ChargeSystem';

export type TargetingMode = 'aoe_circle' | 'direction_arrow' | 'none';

export interface TargetingConfig {
  mode: TargetingMode;
  /** Tap anindaki radius */
  minRadius: number;
  /** LV1 charge anindaki radius (verilmezse interpolasyon kullanilir) */
  lv1Radius?: number;
  /** MAX charge anindaki radius */
  maxRadius: number;
  /** Maksimum menzil (fare bu mesafeden uzaktaysa snap'le) */
  maxRange: number;
  color: Color3;
}

const PURPLE  = new Color3(0.48, 0.18, 0.75);
const YELLOW  = new Color3(1.0,  0.85, 0.0);
const ORANGE  = new Color3(1.0,  0.45, 0.0);
const RED     = new Color3(1.0,  0.1,  0.1);

export class TargetingSystem {
  private scene: Scene;
  private active = false;
  private mode: TargetingMode = 'none';
  private config!: TargetingConfig;

  // Mesh'ler
  private aoeDisc: Mesh | null = null;
  private aoeMat: StandardMaterial | null = null;
  private arrowMesh: Mesh | null = null;
  private arrowMat: StandardMaterial | null = null;

  // Son hesaplanan hedef
  private _targetPosition = Vector3.Zero();
  private _direction = Vector3.Forward();

  // Pulse animasyon
  private pulseTime = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(scene: Scene, _camera?: unknown) {
    this.scene = scene;
  }

  /** Hedeflemeyi etkinlestir. Charge basinda cagir. */
  public activate(config: TargetingConfig): void {
    this.deactivate();
    this.active = true;
    this.mode = config.mode;
    this.config = config;
    this.pulseTime = 0;

    if (config.mode === 'aoe_circle') {
      this.createAoeDisc(config.minRadius, config.color);
    } else if (config.mode === 'direction_arrow') {
      this.createArrow(config.maxRange, config.color);
    }
  }

  /**
   * Her frame cagir.
   * @param playerPos  Oyuncu pozisyonu (merkez icin)
   * @param mouseWorld Farenin 3D dunya pozisyonu
   * @param chargeLevel Mevcut sarj seviyesi
   */
  public update(
    dt: number,
    playerPos: Vector3,
    mouseWorld: Vector3,
    chargeLevel: ChargeLevel,
  ): void {
    if (!this.active) return;
    this.pulseTime += dt;

    if (this.mode === 'aoe_circle') {
      this.updateAoeCircle(playerPos, mouseWorld, chargeLevel);
    } else if (this.mode === 'direction_arrow') {
      this.updateArrow(playerPos, mouseWorld, chargeLevel);
    }
  }

  /** Charge bittikten sonra hedeflemeyi kapat. */
  public deactivate(): void {
    this.active = false;
    this.mode = 'none';
    if (this.aoeDisc) {
      this.aoeDisc.dispose();
      this.aoeDisc = null;
    }
    if (this.aoeMat) {
      this.aoeMat.dispose();
      this.aoeMat = null;
    }
    if (this.arrowMesh) {
      this.arrowMesh.dispose();
      this.arrowMesh = null;
    }
    if (this.arrowMat) {
      this.arrowMat.dispose();
      this.arrowMat = null;
    }
  }

  public getTargetPosition(): Vector3 {
    return this._targetPosition.clone();
  }

  public getDirection(): Vector3 {
    return this._direction.clone();
  }

  public isActive(): boolean {
    return this.active;
  }

  public dispose(): void {
    this.deactivate();
  }

  // ─── AoE Daire ───

  private createAoeDisc(radius: number, color: Color3): void {
    this.aoeDisc = MeshBuilder.CreateDisc('targeting_disc', {
      radius,
      tessellation: 48,
    }, this.scene);
    this.aoeDisc.rotation.x = Math.PI / 2;
    this.aoeDisc.isPickable = false;

    this.aoeMat = new StandardMaterial('targeting_disc_mat', this.scene);
    this.aoeMat.emissiveColor = color;
    this.aoeMat.diffuseColor = Color3.Black();
    this.aoeMat.alpha = 0.35;
    this.aoeMat.backFaceCulling = false;
    this.aoeMat.disableLighting = true;
    this.aoeDisc.material = this.aoeMat;
  }

  private updateAoeCircle(
    playerPos: Vector3,
    mouseWorld: Vector3,
    chargeLevel: ChargeLevel,
  ): void {
    if (!this.aoeDisc || !this.aoeMat) return;
    const cfg = this.config;

    // Pozisyon: oyuncu merkezli veya fare takipli (menzil sinirina snap)
    let center: Vector3;
    const toMouse = mouseWorld.subtract(playerPos);
    toMouse.y = 0;
    const dist = toMouse.length();

    if (dist <= cfg.maxRange) {
      center = new Vector3(mouseWorld.x, 0.02, mouseWorld.z);
    } else {
      const clamped = playerPos.add(toMouse.normalize().scale(cfg.maxRange));
      center = new Vector3(clamped.x, 0.02, clamped.z);
    }
    this._targetPosition = center.clone();
    this.aoeDisc.position.copyFrom(center);

    // Charge seviyesine gore boyut — kesin degerler kullan (lv1Radius varsa)
    let radius: number;
    if (chargeLevel === 'max') {
      radius = cfg.maxRadius;
    } else if (chargeLevel === 'lv1') {
      radius = cfg.lv1Radius ?? (cfg.minRadius + (cfg.maxRadius - cfg.minRadius) * 0.6);
    } else {
      radius = cfg.minRadius;
    }
    const scale = radius / cfg.minRadius;
    this.aoeDisc.scaling.setAll(scale);

    // Renk: tap=mor, lv1=sari, max=kirmizi+pulse
    let emissive: Color3;
    if (chargeLevel === 'max') {
      const p = 0.7 + 0.3 * Math.sin(this.pulseTime * 8);
      emissive = RED.scale(p);
      this.aoeMat.alpha = 0.35 + 0.15 * Math.sin(this.pulseTime * 8);
    } else if (chargeLevel === 'lv1') {
      emissive = YELLOW;
      this.aoeMat.alpha = 0.35;
    } else {
      emissive = PURPLE;
      this.aoeMat.alpha = 0.25;
    }
    this.aoeMat.emissiveColor = emissive;
  }

  // ─── Yon Oku ───

  private createArrow(length: number, color: Color3): void {
    this.arrowMesh = MeshBuilder.CreateBox('targeting_arrow', {
      width: 0.15,
      height: 0.02,
      depth: length,
    }, this.scene);
    this.arrowMesh.isPickable = false;

    this.arrowMat = new StandardMaterial('targeting_arrow_mat', this.scene);
    this.arrowMat.emissiveColor = color;
    this.arrowMat.diffuseColor = Color3.Black();
    this.arrowMat.alpha = 0.7;
    this.arrowMat.backFaceCulling = false;
    this.arrowMat.disableLighting = true;
    this.arrowMesh.material = this.arrowMat;
  }

  private updateArrow(
    playerPos: Vector3,
    mouseWorld: Vector3,
    chargeLevel: ChargeLevel,
  ): void {
    if (!this.arrowMesh || !this.arrowMat) return;
    const cfg = this.config;

    // Yon: oyuncudan fareye
    const toMouse = mouseWorld.subtract(playerPos);
    toMouse.y = 0;
    const len = toMouse.length();

    if (len < 0.01) {
      this.arrowMesh.setEnabled(false);
      return;
    }
    this.arrowMesh.setEnabled(true);

    const dir = toMouse.normalize();
    this._direction = dir.clone();

    // Charge seviyesine gore uzunluk
    const t = chargeLevel === 'max' ? 1.0 : chargeLevel === 'lv1' ? 0.6 : 0.3;
    const arrowLen = cfg.maxRange * t;

    const midPoint = playerPos.add(dir.scale(arrowLen / 2));
    midPoint.y = 0.05;
    this.arrowMesh.position.copyFrom(midPoint);

    const angle = Math.atan2(dir.x, dir.z);
    this.arrowMesh.rotation.y = angle;

    this.arrowMesh.scaling.z = arrowLen / cfg.maxRange;

    // Renk
    if (chargeLevel === 'max') {
      const p = 0.8 + 0.2 * Math.sin(this.pulseTime * 8);
      this.arrowMat.emissiveColor = ORANGE.scale(p);
    } else if (chargeLevel === 'lv1') {
      this.arrowMat.emissiveColor = YELLOW;
    } else {
      this.arrowMat.emissiveColor = PURPLE;
    }
  }
}
