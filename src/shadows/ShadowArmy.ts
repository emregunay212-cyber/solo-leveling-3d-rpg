import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { ShadowSoldier } from './ShadowSoldier';
import type { ShadowCombatMode } from './ShadowAI';
import { SHADOW } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';
import type { ShadowProfile, PlayerStats } from './ShadowEnhancementTypes';
import type { ShadowProfileManager } from './ShadowProfileManager';
import type { DamageNumbers } from '../combat/DamageNumbers';
import type { EnemyDef } from '../enemies/Enemy';
import type { Enemy } from '../enemies/Enemy';
import type { GameContext } from '../core/GameContext';

/**
 * Golge ordusu yoneticisi.
 * Golge cikarma, golge listesi, update ve dispose.
 * Oyuncu statlari referansi tutulur ve golge stat hesaplamalarinda kullanilir.
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
  private armyMode: ShadowCombatMode = 'defense';
  private playerStats: PlayerStats;

  // Ruh stok sistemi (1-2-3-4 slotlari)
  private soulSlots: SoulSlot[] = [
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
    { enemyDefId: null, enemyDef: null, count: 0, hpPercents: [], profiles: [] },
  ];
  private stockHealAccum = 0;
  private profileManager: ShadowProfileManager | null = null;

  constructor(scene: Scene, playerStats: PlayerStats, profileManager?: ShadowProfileManager) {
    this.scene = scene;
    this.playerStats = playerStats;
    this.profileManager = profileManager ?? null;
  }

  public setDamageNumbers(dn: DamageNumbers): void {
    this.damageNumbers = dn;
  }

  /** Oyuncu statlari degistiginde cagir — mevcut ve yeni golgeler guncel statlarla hesaplanir */
  public setPlayerStats(stats: PlayerStats): void {
    this.playerStats = stats;
    for (const shadow of this.shadows) {
      if (shadow.isAlive()) {
        shadow.recalculateStats(stats);
      }
    }
  }

  // ─── SAVAS MODU ───

  public setMode(mode: ShadowCombatMode): void {
    this.armyMode = mode;
    for (const shadow of this.shadows) {
      if (shadow.isAlive()) {
        shadow.setMode(mode);
      }
    }
    eventBus.emit('shadow:modeChanged', { mode });
  }

  public getMode(): ShadowCombatMode {
    return this.armyMode;
  }

  public toggleMode(): ShadowCombatMode {
    const newMode: ShadowCombatMode = this.armyMode === 'attack' ? 'defense' : 'attack';
    this.setMode(newMode);
    return newMode;
  }

  /** Golge cikarma denemesi — limit yok, bedeli MP/HP ile odenir */
  public tryExtract(
    sourceDef: EnemyDef,
    position: Vector3,
    playerLevel: number,
    playerInt: number,
    typeKey?: string,
  ): boolean {

    // Sans hesapla: baz + INT bonusu
    let chance = SHADOW.extractionChance + playerInt * SHADOW.extractionIntBonus;

    // Seviye farkina gore sans ayarlama
    const levelDiff = sourceDef.level - playerLevel;
    if (levelDiff > 0) {
      chance *= 1 / (1 + levelDiff * 0.15);
    } else if (levelDiff < 0) {
      chance = Math.min(0.95, chance + Math.abs(levelDiff) * 0.10);
    }

    if (Math.random() > chance) {
      eventBus.emit('shadow:failed', { reason: 'chance_fail' });
      return false;
    }

    // Profil olustur (profil yoneticisi varsa)
    const enemyDefId = typeKey ?? sourceDef.name;
    const profile = this.profileManager
      ? this.profileManager.createProfile(enemyDefId, sourceDef.isBoss, sourceDef.shadowSkillIds)
      : undefined;

    // Golge olustur — playerStats ile stat hesaplamasi yapilir
    const shadow = new ShadowSoldier(this.scene, position, sourceDef, this.playerStats, profile);
    shadow.setMode(this.armyMode);
    if (this.damageNumbers) shadow.setDamageNumbers(this.damageNumbers);
    this.bindShadowOnKill(shadow);
    this.shadows.push(shadow);

    eventBus.emit('shadow:extracted', {
      shadowType: sourceDef.name,
      name: sourceDef.name,
    });

    return true;
  }

  /** Her frame guncelle */
  public update(ctx: GameContext, enemies: Enemy[]): void {
    // Olu golgeleri temizle — stoklananlar haric profil sil
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      if (!this.shadows[i].isAlive()) {
        if (!this.shadows[i].getIsStocked()) {
          // Gercek olum — profili sil
          const deadProfile = this.shadows[i].getProfile();
          if (deadProfile && this.profileManager) {
            this.profileManager.deleteProfile(deadProfile.uid);
          }
          eventBus.emit('shadow:defeated', { shadowType: this.shadows[i].def.name });
        }
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

  public stockShadow(slotIndex: number, shadow: ShadowSoldier): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;
    if (!shadow.isAlive()) return false;

    const slot = this.soulSlots[slotIndex];
    const defName = shadow.def.name;

    if (slot.enemyDefId === null || slot.enemyDefId === defName) {
      slot.enemyDefId = defName;
      slot.enemyDef = shadow.def;

      const shadowProfile = shadow.getProfile();
      const hpPercent = shadow.hp / shadow.maxHp;
      if (shadowProfile && this.profileManager) {
        this.profileManager.updateHpPercent(shadowProfile.uid, hpPercent);
        slot.profiles.push({ ...shadowProfile, hpPercent });
      }

      slot.hpPercents.push(hpPercent);
      slot.count = slot.hpPercents.length;

      shadow.markAsStocked();
      shadow.takeDamage(999999);
      return true;
    }

    return false;
  }

  public summonFromStock(
    slotIndex: number,
    position: Vector3,
    _playerLevel: number,
  ): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;

    const slot = this.soulSlots[slotIndex];
    if (!slot.enemyDef || slot.count <= 0) return false;

    const def = slot.enemyDef;
    const hpPercent = slot.hpPercents.pop() ?? 1;
    const profile = slot.profiles.pop() ?? undefined;
    slot.count = slot.hpPercents.length;
    if (slot.count <= 0) {
      slot.enemyDefId = null;
      slot.enemyDef = null;
      slot.hpPercents = [];
      slot.profiles = [];
    }

    const shadow = new ShadowSoldier(this.scene, position, def, this.playerStats, profile);
    if (!profile) {
      shadow.setHpPercent(hpPercent);
    }
    shadow.setMode(this.armyMode);
    if (this.damageNumbers) shadow.setDamageNumbers(this.damageNumbers);
    this.bindShadowOnKill(shadow);
    this.shadows.push(shadow);
    return true;
  }

  /** Belirli bir profil index'inden stoktan cagir (picker UI icin) */
  public summonFromStockByIndex(
    slotIndex: number,
    profileIndex: number,
    position: Vector3,
  ): boolean {
    if (slotIndex < 0 || slotIndex >= 4) return false;

    const slot = this.soulSlots[slotIndex];
    if (!slot.enemyDef || profileIndex < 0 || profileIndex >= slot.profiles.length) return false;

    const def = slot.enemyDef;
    const profile = slot.profiles[profileIndex];
    const hpPercent = slot.hpPercents[profileIndex];

    // Diziden index ile cikar (pop degil)
    slot.profiles.splice(profileIndex, 1);
    slot.hpPercents.splice(profileIndex, 1);
    slot.count = slot.hpPercents.length;

    if (slot.count <= 0) {
      slot.enemyDefId = null;
      slot.enemyDef = null;
    }

    const shadow = new ShadowSoldier(this.scene, position, def, this.playerStats, profile);
    if (!profile) {
      shadow.setHpPercent(hpPercent);
    }
    shadow.setMode(this.armyMode);
    if (this.damageNumbers) shadow.setDamageNumbers(this.damageNumbers);
    this.bindShadowOnKill(shadow);
    this.shadows.push(shadow);
    return true;
  }

  public getSoulSlots(): readonly SoulSlot[] {
    return this.soulSlots;
  }

  // ─── KILL TRACKING ───

  /** Golge askerine kill callback'i bagla — profileManager uzerinden kill sayacini arttirir */
  private bindShadowOnKill(shadow: ShadowSoldier): void {
    shadow.setOnKill((uid: number, enemyLevel: number, isBoss: boolean) => {
      if (this.profileManager) {
        // Kill degeri: boss = level*3, normal = level bazli
        const killValue = isBoss ? enemyLevel * 3 : Math.max(1, Math.ceil(enemyLevel / 2));
        this.profileManager.incrementKills(uid, killValue);
      }
    });
  }

  // ─── MANA DRAIN ───

  public getManaDrainPerSecond(playerLevel: number): number {
    let total = 0;
    for (const shadow of this.shadows) {
      if (!shadow.isAlive()) continue;
      const enemyLv = shadow.def.level;
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

  public updateStockHealing(dt: number): void {
    this.stockHealAccum += dt;
    if (this.stockHealAccum < SHADOW.stockHealInterval) return;
    this.stockHealAccum -= SHADOW.stockHealInterval;

    for (const slot of this.soulSlots) {
      if (slot.count <= 0) continue;
      for (let i = 0; i < slot.hpPercents.length; i++) {
        const newHp = Math.min(1, slot.hpPercents[i] + SHADOW.stockHealPercent);
        slot.hpPercents[i] = newHp;

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
