/**
 * Sprint 3 — Skill Combo Zincir Sistemi
 * Skill-to-skill kombo baglantilari, bonus hesaplama, combo penceresi.
 */

import { eventBus } from '../core/EventBus';

export interface ComboLink {
  from: string;
  to: string;
  name: string;
  /** Bonus turu */
  bonusType: 'damage' | 'range' | 'cooldown_free' | 'instant' | 'aoe_double';
  /** Carpan: 0.3 = +%30, 2.0 = 2x, 0.0 = bedelsiz */
  bonusValue: number;
}

export interface ComboBonus {
  link: ComboLink;
  /** Hasar carpani (1.0 = etki yok, 1.3 = +%30) */
  damageMult: number;
  /** Menzil carpani */
  rangeMult: number;
  /** MP maliyet sifirlansin mi */
  freeCast: boolean;
  /** AoE alani iki katina mi cikarilsin */
  doubleAoe: boolean;
  /** Ilk vurus otomatik kritik mi */
  autoCrit: boolean;
}

const COMBO_LINKS: ComboLink[] = [
  { from: 'shadowBlade',  to: 'shadowBurst',  name: 'Golge Kesisimi',   bonusType: 'damage',       bonusValue: 0.30 },
  { from: 'shadowBurst',  to: 'shadowBlade',  name: 'Patlama Kacisi',   bonusType: 'cooldown_free', bonusValue: 0.0  },
  { from: 'sovereignAura',to: 'shadowBurst',  name: 'Hukumdar Gazabi',  bonusType: 'aoe_double',   bonusValue: 2.0  },
  { from: 'shadowBlade',  to: 'normal',        name: 'Momentum',         bonusType: 'instant',      bonusValue: 1.0  },

  // Boss drop combo'lari
  { from: 'skill_flame_burst',    to: 'skill_lightning_chain', name: 'Firtina Atesi',  bonusType: 'damage',    bonusValue: 0.50 },
  { from: 'skill_ice_prison',     to: 'shadowBurst',           name: 'Buzul Kirilmasi',bonusType: 'damage',    bonusValue: 2.00 },
  { from: 'skill_shadow_domain',  to: 'skill_void_strike',     name: 'Boyut Yikimi',   bonusType: 'aoe_double',bonusValue: 2.0  },
];

export class ComboChainSystem {
  private readonly WINDOW = 1.5;   // saniye

  private windowTimer = 0;
  private lastSkillId: string | null = null;
  private streakCount = 0;
  private pendingBonus: ComboBonus | null = null;

  /** BloodRage aktif mi — tum combo bonuslari 2x */
  private bloodRageActive = false;

  // ─── API ───

  /** Skill hasar verdikten sonra cagirilir — combo penceresi acar. */
  public onSkillHit(skillId: string): void {
    this.lastSkillId = skillId;
    this.windowTimer = this.WINDOW;
    this.streakCount++;
    eventBus.emit('combo:chain', {
      name: '', from: skillId, to: '', bonus: 0,
    } as never);
  }

  /** Bir skill cast edilmeden once kontrol et. */
  public checkCombo(nextSkillId: string): ComboBonus | null {
    if (this.windowTimer <= 0 || !this.lastSkillId) return null;

    const link = COMBO_LINKS.find(
      l => l.from === this.lastSkillId && l.to === nextSkillId,
    );
    if (!link) return null;

    const mult = this.bloodRageActive ? 2 : 1;
    const bonus = this.buildBonus(link, mult);

    eventBus.emit('combo:chain', {
      name: link.name,
      from: link.from,
      to: link.to,
      bonus: link.bonusValue,
    } as never);

    this.pendingBonus = bonus;
    return bonus;
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    if (this.windowTimer > 0) {
      this.windowTimer -= dt;
      if (this.windowTimer <= 0) {
        this.windowTimer = 0;
        this.lastSkillId = null;
        this.streakCount = 0;
        this.pendingBonus = null;
      }
    }
  }

  public setBloodRageActive(active: boolean): void {
    this.bloodRageActive = active;
  }

  public getWindowRemaining(): number {
    return Math.max(0, this.windowTimer);
  }

  public getLastSkillId(): string | null {
    return this.lastSkillId;
  }

  public getStreakCount(): number {
    return this.streakCount;
  }

  public isWindowOpen(): boolean {
    return this.windowTimer > 0;
  }

  /** Mevcut skill icin olasi combo baglantilari. */
  public getPossibleCombos(): ComboLink[] {
    if (!this.lastSkillId) return [];
    return COMBO_LINKS.filter(l => l.from === this.lastSkillId);
  }

  // ─── Internals ───

  private buildBonus(link: ComboLink, mult: number): ComboBonus {
    const bonus: ComboBonus = {
      link,
      damageMult: 1.0,
      rangeMult: 1.0,
      freeCast: false,
      doubleAoe: false,
      autoCrit: false,
    };

    switch (link.bonusType) {
      case 'damage':
        bonus.damageMult = 1 + link.bonusValue * mult;
        break;
      case 'range':
        bonus.rangeMult = 1 + link.bonusValue * mult;
        break;
      case 'cooldown_free':
        bonus.freeCast = true;
        bonus.rangeMult = 2.0;
        break;
      case 'instant':
        bonus.autoCrit = true;
        break;
      case 'aoe_double':
        bonus.doubleAoe = true;
        bonus.damageMult = 1 + (link.bonusValue - 1) * mult;
        break;
    }

    return bonus;
  }
}
