import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SkillDef, SkillState } from './SkillDef';
import { getChargeValues } from './SkillDef';
import { SKILL_LIST } from './skills';
import { SKILLS, SKILL_CHARGE } from '../config/GameConfig';
import { InputManager } from '../core/InputManager';
import { eventBus } from '../core/EventBus';
import { ChargeSystem, type ChargeLevel, type ChargeConfig } from './ChargeSystem';

export interface SkillCastResult {
  skill: SkillDef;
  damage: number;
  /** Charge seviyesi: tap / lv1 / max */
  chargeLevel: ChargeLevel;
  /** Charge suresi (saniye) */
  chargeTime: number;
  /** Charge seviyesine gore hesaplanmis menzil */
  range: number;
  /** Gercek harcanan MP */
  mpCost: number;
}

/** Upgrade sabitleri */
const MAX_UPGRADE_LEVEL = 5;
const DAMAGE_BONUS_PER_LEVEL = 0.15;
const COOLDOWN_REDUCTION_PER_LEVEL = 0.05;

export class SkillSystem {
  private slots: SkillState[] = [];
  private input: InputManager;
  private keyWasDown = new Map<string, boolean>();

  /** Her slot icin bir ChargeSystem */
  private chargeMap = new Map<string, ChargeSystem>();

  /** Skill upgrade sistemi — her kitap +15% hasar, -5% cooldown */
  private skillUpgrades = new Map<string, number>();

  /** Buff state */
  private shieldActive = false;
  private shieldTimer = 0;
  private shieldReduction: number = SKILLS.shadowShield.damageReduction;

  /** I-frame suresi */
  private iframeTimer = 0;
  /** Cast kilit suresi (animasyon) */
  private castLockTimer = 0;

  /** Callbacks */
  private onCast: ((result: SkillCastResult) => void) | null = null;
  /** Charge basladiginda cagrilir (UI / targeting icin) */
  private onChargeStart: ((skillId: string, key: string) => void) | null = null;
  /** Charge bittigi/iptal edildiginde cagrilir */
  private onChargeEnd: (() => void) | null = null;
  /** Charge seviyesi degistiginde cagrilir */
  private onChargeLevel: ((level: ChargeLevel, skillId: string) => void) | null = null;

  constructor(input: InputManager) {
    this.input = input;

    for (const def of SKILL_LIST) {
      this.slots.push({
        def,
        cooldownRemaining: 0,
        isActive: false,
        activeTimer: 0,
      });
      this.keyWasDown.set(def.key, false);
      this.chargeMap.set(def.key, new ChargeSystem());
    }
  }

  // ─── Callbacks ───

  public setOnCast(cb: (result: SkillCastResult) => void): void {
    this.onCast = cb;
  }

  public setOnChargeStart(cb: (skillId: string, key: string) => void): void {
    this.onChargeStart = cb;
  }

  public setOnChargeEnd(cb: () => void): void {
    this.onChargeEnd = cb;
  }

  public setOnChargeLevel(cb: (level: ChargeLevel, skillId: string) => void): void {
    this.onChargeLevel = cb;
  }

  // ─── Update ───

  public update(
    dt: number,
    currentMp: number,
    statStr: number,
    statInt: number,
  ): SkillCastResult | null {
    // Timer'lar
    if (this.iframeTimer > 0) this.iframeTimer = Math.max(0, this.iframeTimer - dt);
    if (this.castLockTimer > 0) this.castLockTimer = Math.max(0, this.castLockTimer - dt);

    // Cooldown'lari guncelle
    for (const slot of this.slots) {
      if (slot.cooldownRemaining > 0) {
        slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - dt);
      }
    }

    // Shield buff timer
    if (this.shieldActive) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldTimer = 0;
        // Shield buff bittigi slot'u deaktif et
        const shieldSlot = this.slots.find(s => s.def.id === 'shadowShield');
        if (shieldSlot) shieldSlot.isActive = false;
      }
    }

    // Cast lock aktifse giris engelle
    if (this.castLockTimer > 0) {
      // Charge'lari da guncelle ama cast etme
      for (const slot of this.slots) {
        const cs = this.chargeMap.get(slot.def.key);
        if (cs?.isCharging()) cs.update(dt);
      }
      return null;
    }

    // Her slot icin input kontrol
    for (const slot of this.slots) {
      const key = slot.def.key;
      const isDown = this.input.isKeyDown(key);
      const wasDown = this.keyWasDown.get(key) ?? false;
      const cs = this.chargeMap.get(key)!;

      // Yeni basildiysa → sarj baslat
      if (isDown && !wasDown) {
        const config = this.buildChargeConfig(slot.def);
        cs.startCharge(key, config);
        this.onChargeStart?.(slot.def.id, key);
        eventBus.emit('charge:start' as never, { skillId: slot.def.id } as never);
      }

      // Sarj guncellemesi ve seviye bildirim
      if (isDown && cs.isCharging()) {
        const prevLevel = cs.getLevel();
        cs.update(dt);
        const newLevel = cs.getLevel();
        if (newLevel !== prevLevel) {
          this.onChargeLevel?.(newLevel, slot.def.id);
          eventBus.emit('charge:level' as never, { skillId: slot.def.id, level: newLevel } as never);
        }
      }

      // Tus birakildi → cast et
      if (!isDown && wasDown && cs.isCharging()) {
        const { level, chargeTime } = cs.release();
        this.onChargeEnd?.();
        eventBus.emit('charge:release' as never, { skillId: slot.def.id, level } as never);

        const result = this.tryCast(slot, level, chargeTime, currentMp, statStr, statInt);
        this.keyWasDown.set(key, isDown);
        if (result) return result;
      }

      this.keyWasDown.set(key, isDown);
    }

    // Sag tik ile sarj iptal
    if (this.input.isKeyDown('RightMouseButton') || this.input.isKeyDown('Escape')) {
      for (const slot of this.slots) {
        const cs = this.chargeMap.get(slot.def.key);
        if (cs?.isCharging()) {
          cs.cancel();
          this.onChargeEnd?.();
          eventBus.emit('charge:cancel' as never, { skillId: slot.def.id } as never);
        }
      }
    }

    return null;
  }

  // ─── Cast Logic ───

  private tryCast(
    slot: SkillState,
    level: ChargeLevel,
    chargeTime: number,
    currentMp: number,
    statStr: number,
    statInt: number,
  ): SkillCastResult | null {
    // Cooldown kontrol
    if (slot.cooldownRemaining > 0) return null;

    // Charge degerlerini al
    const cv = getChargeValues(slot.def, level);
    const mpCost = cv.mpCost;

    // MP kontrol
    if (currentMp < mpCost) return null;

    // Upgrade seviyesine gore cooldown azalt
    const upgradeLevel = this.getUpgradeLevel(slot.def.id);
    const cdReduction = 1 - upgradeLevel * COOLDOWN_REDUCTION_PER_LEVEL;
    slot.cooldownRemaining = slot.def.cooldown * Math.max(0.5, cdReduction);

    // Hasar hesapla
    const baseStat = slot.def.scaleStat === 'str' ? statStr : statInt;
    const baseDamage = baseStat * cv.damageMult;
    const upgradeBonus = 1 + upgradeLevel * DAMAGE_BONUS_PER_LEVEL;
    const damage = Math.round(baseDamage * upgradeBonus);

    // Buff aktif et (shield skill icin)
    if (slot.def.type === 'buff') {
      const duration = cv.duration ?? slot.def.duration;
      const dmgReduction = cv.damageReduction ?? slot.def.damageReduction ?? 0;
      this.shieldActive = true;
      this.shieldTimer = duration;
      this.shieldReduction = dmgReduction;
      slot.isActive = true;
      slot.activeTimer = duration;
    }

    // I-frame baslat
    if (slot.def.iframeDuration && slot.def.iframeDuration > 0) {
      this.iframeTimer = slot.def.iframeDuration;
    }

    // Cast lock baslat
    if (slot.def.castLockDuration && slot.def.castLockDuration > 0) {
      this.castLockTimer = slot.def.castLockDuration;
    }

    const result: SkillCastResult = {
      skill: slot.def,
      damage,
      chargeLevel: level,
      chargeTime,
      range: cv.range,
      mpCost,
    };

    eventBus.emit('skill:cast', { skillId: slot.def.id, mpCost });
    if (this.onCast) this.onCast(result);
    return result;
  }

  private buildChargeConfig(def: SkillDef): ChargeConfig {
    const cfg = SKILL_CHARGE[def.id];
    if (cfg) {
      return {
        lv1Threshold: cfg.lv1Threshold,
        maxThreshold: cfg.maxThreshold,
        canMoveWhileCharging: cfg.canMoveWhileCharging,
        moveSpeedMultiplier: cfg.moveSpeedMultiplier,
      };
    }
    // Varsayilan: aninda cast (tap only)
    return {
      lv1Threshold: 0.3,
      maxThreshold: 2.0,
      canMoveWhileCharging: true,
      moveSpeedMultiplier: 1.0,
    };
  }

  // ─── Skill Upgrade ───

  public upgradeSkill(skillId: string): boolean {
    const current = this.skillUpgrades.get(skillId) ?? 0;
    if (current >= MAX_UPGRADE_LEVEL) return false;
    this.skillUpgrades.set(skillId, current + 1);
    eventBus.emit('skill:upgraded', { skillId, newLevel: current + 1 });
    return true;
  }

  public getUpgradeLevel(skillId: string): number {
    return this.skillUpgrades.get(skillId) ?? 0;
  }

  // ─── Passive Buffs ───

  public getPassiveHpRegenPercent(): number {
    const level = this.getUpgradeLevel('passive_hp_regen');
    return level * 0.006;
  }

  public getPassiveDamageReduction(): number {
    const level = this.getUpgradeLevel('passive_damage_reduce');
    return Math.min(0.25, level * 0.05);
  }

  // ─── Slot Degistirme ───

  public replaceSlotByKey(keyCode: string, newDef: SkillDef): boolean {
    const idx = this.slots.findIndex(s => s.def.key === keyCode);
    if (idx < 0) return false;

    const old = this.slots[idx];
    this.slots[idx] = {
      def: newDef,
      cooldownRemaining: 0,
      isActive: false,
      activeTimer: 0,
    };

    this.keyWasDown.delete(old.def.key);
    this.keyWasDown.set(newDef.key, false);

    // Eski charge system'i temizle, yenisini olustur
    this.chargeMap.delete(old.def.key);
    this.chargeMap.set(newDef.key, new ChargeSystem());

    return true;
  }

  public restoreSlotByKey(keyCode: string): boolean {
    const original = SKILL_LIST.find(s => s.key === keyCode);
    if (!original) return false;
    return this.replaceSlotByKey(keyCode, original);
  }

  // ─── Getters ───

  public getSlots(): readonly SkillState[] {
    return this.slots;
  }

  public isShieldActive(): boolean {
    return this.shieldActive;
  }

  public getShieldReduction(): number {
    return this.shieldActive ? this.shieldReduction : 0;
  }

  public getShieldTimer(): number {
    return this.shieldTimer;
  }

  public getSlotByKey(key: string): SkillState | undefined {
    return this.slots.find(s => s.def.key === key);
  }

  public isInIframe(): boolean {
    return this.iframeTimer > 0;
  }

  public isCastLocked(): boolean {
    return this.castLockTimer > 0;
  }

  public getChargingSkillKey(): string | null {
    for (const [key, cs] of this.chargeMap) {
      if (cs.isCharging()) return key;
    }
    return null;
  }

  public getChargeState(skillKey: string): import('./ChargeSystem').ChargeState | null {
    return this.chargeMap.get(skillKey)?.getState() ?? null;
  }

  public getMoveSpeedMultiplier(): number {
    for (const [key, cs] of this.chargeMap) {
      if (cs.isCharging()) {
        const slot = this.slots.find(s => s.def.key === key);
        if (!slot) continue;
        const cfg = SKILL_CHARGE[slot.def.id];
        if (cfg && !cfg.canMoveWhileCharging) return 0;
        return cfg?.moveSpeedMultiplier ?? 1.0;
      }
    }
    return 1.0;
  }
}
