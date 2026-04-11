/**
 * Guvenli Bolge Sistemi
 * Oyuncunun spawn/respawn noktasinda dusmanlarin giremeyecegi alan.
 * EnemyAI bu registry'i kontrol ederek safe zone icindeki oyuncuya saldiramaz.
 */

import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

// ─── SAFE ZONE ───

export class SafeZone {
  public readonly center: Vector3;
  public readonly radius: number;

  constructor(center: Vector3, radius: number) {
    this.center = center.clone();
    this.radius = radius;
  }

  /** XZ duzleminde pozisyon kontrolu (Y yok sayilir) */
  public isInside(pos: Vector3): boolean {
    const dx = pos.x - this.center.x;
    const dz = pos.z - this.center.z;
    return (dx * dx + dz * dz) <= this.radius * this.radius;
  }
}

// ─── GLOBAL REGISTRY ───

/**
 * Tum aktif safe zone'lari tutan statik registry.
 * Sahne gecislerinde removeAll() ile temizlenir.
 */
export class SafeZoneRegistry {
  private static zones: SafeZone[] = [];

  /** Yeni safe zone ekle */
  public static addZone(zone: SafeZone): void {
    SafeZoneRegistry.zones = [...SafeZoneRegistry.zones, zone];
  }

  /** Tum zone'lari temizle (sahne gecisi) */
  public static removeAll(): void {
    SafeZoneRegistry.zones = [];
  }

  /** Pozisyon herhangi bir safe zone icinde mi? */
  public static isPositionSafe(pos: Vector3): boolean {
    for (const zone of SafeZoneRegistry.zones) {
      if (zone.isInside(pos)) return true;
    }
    return false;
  }

  /** Aktif zone sayisi (debug) */
  public static getCount(): number {
    return SafeZoneRegistry.zones.length;
  }
}

// ─── GORSEL OLUSTURUCU ───

/**
 * Safe zone icin yari saydam zemin diski olusturur.
 * Solo Leveling temali parlayan mor/mavi daire.
 */
export function createSafeZoneMesh(
  scene: Scene,
  center: Vector3,
  radius: number,
  color: Color3 = new Color3(0.66, 0.33, 0.97), // mor
): Mesh {
  // Dis kenar halkasi
  const ring = MeshBuilder.CreateTorus('safeZoneRing', {
    diameter: radius * 2,
    thickness: 0.15,
    tessellation: 64,
  }, scene);
  ring.position.set(center.x, 0.05, center.z);

  const ringMat = new StandardMaterial('safeZoneRingMat', scene);
  ringMat.emissiveColor = color;
  ringMat.diffuseColor = Color3.Black();
  ringMat.alpha = 0.6;
  ringMat.backFaceCulling = false;
  ring.material = ringMat;

  // Ic alan diski
  const disc = MeshBuilder.CreateDisc('safeZoneDisc', {
    radius,
    tessellation: 64,
  }, scene);
  disc.rotation.x = Math.PI / 2; // yatay yap
  disc.position.set(center.x, 0.02, center.z);

  const discMat = new StandardMaterial('safeZoneDiscMat', scene);
  discMat.emissiveColor = color;
  discMat.diffuseColor = Color3.Black();
  discMat.alpha = 0.08;
  discMat.backFaceCulling = false;
  disc.material = discMat;

  // Ring'i parent yap, disc child olsun — tek dispose ile temizlenir
  disc.parent = ring;

  return ring;
}
