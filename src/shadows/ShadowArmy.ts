import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { ShadowSoldier } from './ShadowSoldier';
import { SHADOW } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';
import type { ShadowProfile } from './ShadowEnhancementTypes';
import type { ShadowProfileManager } from './ShadowProfileManager';
import type { DamageNumbers } from '../combat/DamageNumbers';
import type { EnemyDef } from '../enemies/Enemy';
import type { Enemy } from '../enemies/Enemy';
import type { GameContext } from '../core/GameContext';

/**
 * Golge ordusu yoneticisi.
 * Golge cikarma, golge listesi, update ve dispose.
 */
/** Ruh stok slotu (1-4) */
export interface SoulSlot {
  enemyDefId: string | null;  // hangi tur stoklu (null = bos)
  enemyDef: EnemyDef | null;
  count: number;              // kac adet stoklu (profiles.length ile esitlenir)
  hpPercents: number[];       // her stoklanan golgenin HP yuzdesi (0-1) — ShadowUI uyumlulugu icin
  profiles: ShadowProfile[];  // her stoklanan golgenin profili
}

export class ShadowArmy {
  private shadows: ShadowSoldier[] = [];
  private scene: Scene;
  private damageNumbers: DamageNumbers | null = null;

  // Ruh stok sistemi (1-2-3-4 slotlari)
  private soulSlots: SoulSlot[] = [
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
  ];
  private stockHealAccum = 0;
  private profileManager: ShadowProfileManager | null = null;

  constructor(scene: Scene, profileManager?: ShadowProfileManager) {
    this.scene = scene;
    this.profileManager = profileManager ?? null;
  }

  public setDamageNumbers(dn: DamageNumbers): void {
    this.damageNumbers = dn;
  }

  /** Golge cikarma denemesi — limit yok, bedeli MP/HP ile odenir */
  public tryExtract(
    sourceDef: EnemyDef,
    position: Vector3,
    playerLevel: number,
    playerInt: number,
  ): boolean {

    // Sans hesapla: baz + INT bonusu
    let chance = SHADOW.extractionChance + playerInt * SHADOW.extractionIntBonus;

    // Seviye farkina gore sans ayarlama
    const levelDiff = sourceDef.level - playerLevel;
    if (levelDiff > 0) {
      // Guclu dusman → sans duser (her seviye farki icin -%15)
      chance *= 1 / (1 + levelDiff * 0.15);
    } else if (levelDiff < 0) {
      // Zayif dusman → sans artar (her seviye farki icin +%10, max %95)
      chance = Math.min(0.95, chance + Math.abs(levelDiff) * 0.10);
    }

    // INT ile zayif dusmanlar neredeyse garanti, gucluler mumkun
    // Ornek (INT 5, Lv1 oyuncu):
    //   Goblin Lv1:  %60 + %1.5 = %61.5
    //   Seytan Lv12: %61.5 * 1/(1+11*0.15) = %22.5
    // Ornek (INT 50, Lv10 oyuncu):
    //   Goblin Lv1:  min(%95, %75 + 9*%10) = %95
    //   Seytan Lv12: %75 * 1/(1+2*0.15) = %57.7

    if (Math.random() > chance) {
      eventBus.emit('shadow:failed', { reason: 'chance_fail' });
      return false;
    }

    // Profil olustur (profil yoneticisi varsa)
    const profile = this.profileManager
      ? this.profileManager.createProfile(sourceDef.name)
      : undefined;

    // Golge olustur — profil varsa stat hesaplamasi profil uzerinden yapilir
    const shadow = new ShadowSoldier(this.scene, position, sourceDef, profile);
    if (this.damageNumbers) shadow.setDamageNumbers(this.damageNumbers);
    this.shadows.push(shadow);

    eventBus.emit('shadow:extracted', {
      shadowType: sourceDef.name,
      name: sourceDef.name,
    });

    return true;
  }

  /** Her frame guncelle */
  public update(ctx: GameContext, enemies: Enemy[]): void {
    // Olu golgeleri temizle
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      if (!this.shadows[i].isAlive()) {
        eventBus.emit('shadow:defeated', { shadowType: this.shadows[i].def.name });
        this.shadows[i].dispose();
        this.shadows.splice(i, 1);
      }
    }

    // Diger golge pozisyonlarini topla (separation icin)
    const allPositions = this.shadows.map(s => s.position);

    // Her golgeyi guncelle — kendi pozisyonu haric digerleri gonder
    for (let i = 0; i < this.shadows.length; i++) {
      const others = allPositions.filter((_, idx) => idx !== i);
      this.shadows[i].update(ctx, enemies, others);
    }
  }

  /** Tum golgeleri tek bir hedefe yonlendir (Ctrl + cift tik) */
  public commandAllToAttack(target: Enemy): void {
    for (const shadow of this.shadows) {
      if (shadow.isAlive()) {
        shadow.forceTarget(target);
      }
    }
  }

  // ─── RUH STOK SISTEMI ───

  /**
   * Sahada yasayan bir golgeyi stok slotuna kaydet.
   * Golge sahneden kaldirilir, slot'a eklenir.
   * Ayni turden ise staklenebilir, farkli turse reddedilir.
   * @returns true ise stoklandi
   */
  public stockShadow(slotIndex: number, shadow: ShadowSoldier): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    if (!shadow.isAlive()) return false;

    const slot = this.soulSlots[slotIndex];
    const defName = shadow.def.name;

    // Slot bos veya ayni tur → stokla
    if (slot.enemyDefId === null || slot.enemyDefId === defName) {
      slot.enemyDefId = defName;
      slot.enemyDef = shadow.def;

      // Profil varsa profileManager uzerinden HP guncelle ve slot'a ekle
      const shadowProfile = shadow.getProfile();
      const hpPercent = shadow.hp / shadow.maxHp;
      if (shadowProfile && this.profileManager) {
        this.profileManager.updateHpPercent(shadowProfile.uid, hpPercent);
        slot.profiles.push({ ...shadowProfile, hpPercent });
      }

      // HP yuzdesini kaydet (ShadowUI uyumlulugu)
      slot.hpPercents.push(hpPercent);
      slot.count = slot.hpPercents.length;

      // Golgeyi sahneden kaldir
      shadow.takeDamage(999999);
      return true;
    }

    // Farkli tur → reddedilir
    return false;
  }

  /**
   * Stoktan bir golge cagir (Alt + 1/2/3/4).
   * Aktif golge sayisi max'tan azsa sahneye cikarir.
   */
  public summonFromStock(
    slotIndex: number,
    position: Vector3,
    playerLevel: number,
  ): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;

    const slot = this.soulSlots[slotIndex];
    if (!slot.enemyDef || slot.count <= 0) return false;

    // Stoktan bir azalt ve HP ile sahneye cikar
    const def = slot.enemyDef!;
    const hpPercent = slot.hpPercents.pop() ?? 1;
    const profile = slot.profiles.pop() ?? undefined;
    slot.count = slot.hpPercents.length;
    if (slot.count <= 0) {
      slot.enemyDefId = null;
      slot.enemyDef = null;
      slot.hpPercents = [];
      slot.profiles = [];
    }

    const shadow = new ShadowSoldier(this.scene, position, def, profile);
    // Profili olmayan golgeler icin eski yontemle HP ayarla
    if (!profile) {
      shadow.setHpPercent(hpPercent);
    }
    if (this.damageNumbers) shadow.setDamageNumbers(this.damageNumbers);
    this.shadows.push(shadow);
    return true;
  }

  public getSoulSlots(): readonly SoulSlot[] {
    return this.soulSlots;
  }

  // ─── MANA DRAIN ───

  /**
   * Aktif golgelerin saniyede harcadigi toplam MP.
   * Guclu golgeler daha cok, zayif golgeler daha az MP harcar.
   * Oyuncu seviyesi arttikca drain azalir.
   */
  public getManaDrainPerSecond(playerLevel: number): number {
    let total = 0;
    for (const shadow of this.shadows) {
      if (!shadow.isAlive()) continue;
      const enemyLv = shadow.def.level;
      // Baz + dusman seviyesi bonusu - oyuncu seviyesi indirimi
      const drain = SHADOW.manaDrainBase
        + enemyLv * SHADOW.manaDrainPerEnemyLevel
        - playerLevel * SHADOW.manaDrainLevelReduction;
      total += Math.max(SHADOW.manaDrainMin, drain);
    }
    return total;
  }

  /** Tum aktif golgeleri yok et (oyuncu olunce) */
  public killAllShadows(): void {
    for (const shadow of this.shadows) {
      if (shadow.isAlive()) {
        shadow.takeDamage(999999);
      }
    }
  }

  // ─── STOK IYILESME ───

  /** Envanterdeki golgelerin HP'sini zamanla artir */
  public updateStockHealing(dt: number): void {
    this.stockHealAccum += dt;
    if (this.stockHealAccum < SHADOW.stockHealInterval) return;
    this.stockHealAccum -= SHADOW.stockHealInterval;

    for (const slot of this.soulSlots) {
      if (slot.count <= 0) continue;
      for (let i = 0; i < slot.hpPercents.length; i++) {
        const newHp = Math.min(1, slot.hpPercents[i] + SHADOW.stockHealPercent);
        slot.hpPercents[i] = newHp;

        // Profil varsa profileManager uzerinden de guncelle
        if (i < slot.profiles.length && this.profileManager) {
          const p = slot.profiles[i];
          const updated = this.profileManager.updateHpPercent(p.uid, newHp);
          if (updated) {
            slot.profiles[i] = updated;
          }
        }
      }
    }
  }

  /** Slot'taki tum golgeler full HP mi? */
  public isSlotFullHp(slotIndex: number): boolean {
    const slot = this.soulSlots[slotIndex];
    if (!slot || slot.count <= 0) return false;
    return slot.hpPercents.every(hp => hp >= 1);
  }

  public getAliveCount(): number {
    return this.shadows.filter(s => s.isAlive()).length;
  }

  public getShadows(): readonly ShadowSoldier[] {
    return this.shadows;
  }

  public dispose(): void {
    for (const shadow of this.shadows) {
      shadow.dispose();
    }
    this.shadows = [];
  }
}
