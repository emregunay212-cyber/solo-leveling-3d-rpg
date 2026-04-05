import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SkillDef, SkillState } from './SkillDef';
import { SKILL_LIST } from './skills';
import { SKILLS } from '../config/GameConfig';
import { InputManager } from '../core/InputManager';
import { eventBus } from '../core/EventBus';

export interface SkillCastResult {
  skill: SkillDef;
  damage: number;
}

/**
 * Yetenek yonetim sistemi.
 * Q/E/R/F skill slotlarini, cooldown, MP ve buff'lari yonetir.
 */
/** Upgrade sabitleri */
const MAX_UPGRADE_LEVEL = 5;
const DAMAGE_BONUS_PER_LEVEL = 0.15;
const COOLDOWN_REDUCTION_PER_LEVEL = 0.05;

export class SkillSystem {
  private slots: SkillState[] = [];
  private input: InputManager;
  private keyWasDown = new Map<string, boolean>();

  // Skill upgrade sistemi — her kitap +15% hasar, -5% cooldown
  private skillUpgrades = new Map<string, number>();

  // Buff state
  private shieldActive = false;
  private shieldTimer = 0;
  private readonly SHIELD_REDUCTION = SKILLS.shadowShield.damageReduction;

  // Callbacks — TestScene baglayacak
  private onCast: ((result: SkillCastResult) => void) | null = null;

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
    }
  }

  public setOnCast(cb: (result: SkillCastResult) => void): void {
    this.onCast = cb;
  }

  /**
   * Her frame cagir.
   * @returns cast edilen skill veya null
   */
  public update(dt: number, currentMp: number, statStr: number, statInt: number): SkillCastResult | null {
    // Cooldown'lari guncelle
    for (const slot of this.slots) {
      if (slot.cooldownRemaining > 0) {
        slot.cooldownRemaining = Math.max(0, slot.cooldownRemaining - dt);
      }
    }

    // Buff timer
    if (this.shieldActive) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldTimer = 0;
      }
    }

    // Tus kontrolu (sadece yeni basildiginda tetikle — toggle)
    for (const slot of this.slots) {
      const isDown = this.input.isKeyDown(slot.def.key);
      const wasDown = this.keyWasDown.get(slot.def.key) ?? false;

      if (isDown && !wasDown) {
        const result = this.tryCast(slot, currentMp, statStr, statInt);
        if (result) {
          this.keyWasDown.set(slot.def.key, true);
          return result;
        }
      }

      this.keyWasDown.set(slot.def.key, isDown);
    }

    return null;
  }

  private tryCast(slot: SkillState, currentMp: number, statStr: number, statInt: number): SkillCastResult | null {
    // Cooldown kontrol
    if (slot.cooldownRemaining > 0) return null;
    // MP kontrol
    if (currentMp < slot.def.mpCost) return null;

    // Upgrade seviyesine gore cooldown azaltma uygula
    const upgradeLevel = this.getUpgradeLevel(slot.def.id);
    const cdReduction = 1 - upgradeLevel * COOLDOWN_REDUCTION_PER_LEVEL;
    slot.cooldownRemaining = slot.def.cooldown * Math.max(0.5, cdReduction);

    // Hasar hesapla — upgrade bonusu ile
    const baseStat = slot.def.scaleStat === 'str' ? statStr : statInt;
    const baseDamage = baseStat * slot.def.damageMultiplier;
    const damageMultiplier = 1 + upgradeLevel * DAMAGE_BONUS_PER_LEVEL;
    const damage = Math.round(baseDamage * damageMultiplier);

    // Buff aktif et (shield skill icin)
    if (slot.def.type === 'buff') {
      this.shieldActive = true;
      this.shieldTimer = slot.def.duration;
      slot.isActive = true;
      slot.activeTimer = slot.def.duration;
    }

    const result: SkillCastResult = { skill: slot.def, damage };

    eventBus.emit('skill:cast', { skillId: slot.def.id, mpCost: slot.def.mpCost });

    if (this.onCast) this.onCast(result);
    return result;
  }

  // ─── Skill Upgrade ───

  /** Yetenek upgrade seviyesini artir. Maksimum 5. */
  public upgradeSkill(skillId: string): boolean {
    const current = this.skillUpgrades.get(skillId) ?? 0;
    if (current >= MAX_UPGRADE_LEVEL) return false;
    this.skillUpgrades.set(skillId, current + 1);
    eventBus.emit('skill:upgraded', { skillId, newLevel: current + 1 });
    return true;
  }

  /** Yetenek upgrade seviyesini dondur */
  public getUpgradeLevel(skillId: string): number {
    return this.skillUpgrades.get(skillId) ?? 0;
  }

  // ─── Passive Buffs ───

  /** HP regen: her seviye +%3 maxHP/5sn → saniyede %0.6 maxHP */
  public getPassiveHpRegenPercent(): number {
    const level = this.getUpgradeLevel('passive_hp_regen');
    return level * 0.006; // %0.6 maxHP per second per level
  }

  /** Hasar azaltma: her seviye +%5 damage reduction */
  public getPassiveDamageReduction(): number {
    const level = this.getUpgradeLevel('passive_damage_reduce');
    return Math.min(0.25, level * 0.05); // max %25
  }

  // ─── Getters ───

  public getSlots(): readonly SkillState[] {
    return this.slots;
  }

  public isShieldActive(): boolean {
    return this.shieldActive;
  }

  public getShieldReduction(): number {
    return this.shieldActive ? this.SHIELD_REDUCTION : 0;
  }

  public getShieldTimer(): number {
    return this.shieldTimer;
  }

  public getSlotByKey(key: string): SkillState | undefined {
    return this.slots.find(s => s.def.key === key);
  }
}
