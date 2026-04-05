/**
 * Golge Yetenek Calistirici
 * Her ShadowSoldier icin dusman-icerik yetenekleri calisma zamaninda yurutur.
 * Cooldown, buff ve tetikleme mantigi burada yonetilir.
 */

import { SKILL_BOOK_DEFS } from '../data/shadowSkillBooks';
import type { ShadowSkillDef, SkillStatBuff } from './ShadowEnhancementTypes';
import type { Enemy } from '../enemies/Enemy';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

interface ActiveBuff {
  readonly skillId: string;
  readonly stats: Partial<SkillStatBuff>;
  remaining: number; // saniye
}

export interface AttackResult {
  readonly bonusDamage: number;
  readonly aoeRadius: number;
}

export interface KillResult {
  readonly healAmount: number;
  readonly buffApplied: boolean;
}

export class ShadowSkillRunner {
  private readonly skills: ShadowSkillDef[] = [];
  private readonly cooldowns = new Map<string, number>();
  private activeBuffs: ActiveBuff[] = [];

  constructor(skillIds: readonly string[]) {
    for (const id of skillIds) {
      const def = SKILL_BOOK_DEFS[id];
      if (def) {
        this.skills.push(def);
        this.cooldowns.set(id, 0);
      }
    }
  }

  /** Her frame cagirilir — cooldown ve buff surelerini gunceller */
  update(dt: number): void {
    // Cooldown'lari dusur
    for (const [id, cd] of this.cooldowns) {
      if (cd > 0) {
        this.cooldowns.set(id, Math.max(0, cd - dt));
      }
    }

    // Aktif buff'lari dusur, suresi dolanlari kaldir
    for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
      this.activeBuffs[i].remaining -= dt;
      if (this.activeBuffs[i].remaining <= 0) {
        this.activeBuffs.splice(i, 1);
      }
    }
  }

  /**
   * Tetik: golge bir dusmana saldirdi.
   * Bonus hasar ve AoE yaricap bilgisi doner.
   */
  onAttack(_target: Enemy, _selfPos: Vector3, baseDamage: number): AttackResult {
    let bonusDamage = 0;
    let aoeRadius = 0;

    for (const skill of this.skills) {
      if (skill.trigger !== 'onAttack') continue;
      if (!this.isReady(skill.id)) continue;

      const { effect } = skill;

      // AoE saldiri (Shadow Cleave, Hellfire vb.)
      if (effect.aoeRadius && effect.damageMultiplier) {
        bonusDamage += baseDamage * (effect.damageMultiplier - 1);
        aoeRadius = Math.max(aoeRadius, effect.aoeRadius);
        this.cooldowns.set(skill.id, skill.cooldown);
      }
      // Duz hasar carpani (Heavy Strike, Pack Bonus vb.)
      else if (effect.damageMultiplier && effect.damageMultiplier > 1) {
        bonusDamage += baseDamage * (effect.damageMultiplier - 1);
        if (skill.cooldown > 0) {
          this.cooldowns.set(skill.id, skill.cooldown);
        }
      }
    }

    return { bonusDamage: Math.round(bonusDamage), aoeRadius };
  }

  /**
   * Tetik: golge hasar aldi.
   * Gelen hasari modifiye ederek doner.
   */
  onTakeDamage(incomingDamage: number): number {
    let modified = incomingDamage;

    for (const skill of this.skills) {
      if (skill.trigger !== 'onTakeDamage') continue;

      // Bloklama sansi ile hasari yarilat (Shield Block, Iron Will vb.)
      if (skill.effect.statBuff?.bonusBlockChance) {
        if (Math.random() < skill.effect.statBuff.bonusBlockChance) {
          modified = Math.max(1, Math.round(modified * 0.5));
        }
      }

      // Savunma bonusu (Tough Skin vb.)
      if (skill.effect.statBuff?.bonusDefense) {
        modified = Math.max(1, modified - skill.effect.statBuff.bonusDefense);
      }
    }

    return modified;
  }

  /**
   * Tetik: golge bir hedefi oldurdu.
   * Iyilesme miktari ve buff durumu doner.
   */
  onKill(): KillResult {
    let healAmount = 0;
    let buffApplied = false;

    for (const skill of this.skills) {
      if (skill.trigger !== 'onKill') continue;
      if (!this.isReady(skill.id)) continue;

      // Gecici hasar buff'i (damageMultiplier -> bonusDamagePercent)
      if (skill.effect.damageMultiplier && skill.effect.durationSeconds) {
        const bonusPercent = skill.effect.damageMultiplier - 1;
        this.activeBuffs.push({
          skillId: skill.id,
          stats: { bonusDamagePercent: bonusPercent },
          remaining: skill.effect.durationSeconds,
        });
        buffApplied = true;
        this.cooldowns.set(skill.id, skill.cooldown);
      }

      // statBuff bazli buff'lar
      if (skill.effect.statBuff && skill.effect.durationSeconds && skill.effect.durationSeconds > 0) {
        this.activeBuffs.push({
          skillId: skill.id,
          stats: skill.effect.statBuff,
          remaining: skill.effect.durationSeconds,
        });
        buffApplied = true;
        this.cooldowns.set(skill.id, skill.cooldown);
      }
    }

    return { healAmount, buffApplied };
  }

  /** Saldiri sonrasi lifesteal iyilesme miktari */
  getLifestealHeal(damageDealt: number): number {
    let heal = 0;
    for (const skill of this.skills) {
      if (skill.trigger === 'onAttack' && skill.effect.healPercent && skill.effect.healPercent > 0) {
        heal += damageDealt * skill.effect.healPercent;
      }
    }
    return Math.round(heal);
  }

  /** Periyodik iyilesme miktari — sadece hazir olan skilleri hesaplar */
  getPeriodicHeal(maxHp: number): number {
    let heal = 0;
    for (const skill of this.skills) {
      if (skill.trigger === 'periodic' && skill.effect.healPercent && skill.effect.healPercent > 0 && this.isReady(skill.id)) {
        heal += maxHp * skill.effect.healPercent;
        this.cooldowns.set(skill.id, skill.cooldown);
      }
    }
    return Math.round(heal);
  }

  /** Periyodik AoE hasar — enemy_hellfire gibi periodic damage skilleri */
  getPeriodicAoeDamage(baseDamage: number): { damage: number; aoeRadius: number } {
    let damage = 0;
    let aoeRadius = 0;
    for (const skill of this.skills) {
      if (skill.trigger === 'periodic' && skill.effect.aoeRadius && skill.effect.damageMultiplier && this.isReady(skill.id)) {
        damage += baseDamage * skill.effect.damageMultiplier;
        aoeRadius = Math.max(aoeRadius, skill.effect.aoeRadius);
        this.cooldowns.set(skill.id, skill.cooldown);
      }
    }
    return { damage: Math.round(damage), aoeRadius };
  }

  /** Shadow Step: teleportBehind skill'i hazir mi? Hazirsa cooldown baslat */
  shouldTeleportBehind(): boolean {
    for (const skill of this.skills) {
      if (skill.trigger === 'periodic' && skill.effect.teleportBehind && this.isReady(skill.id)) {
        this.cooldowns.set(skill.id, skill.cooldown);
        return true;
      }
    }
    return false;
  }

  /** Aktif buff'lardan toplam bonus hasar yuzdesi */
  getActiveBonusDamagePercent(): number {
    let total = 0;
    for (const buff of this.activeBuffs) {
      if (buff.stats.bonusDamagePercent) {
        total += buff.stats.bonusDamagePercent;
      }
    }
    return total;
  }

  /** Herhangi bir skill var mi? */
  hasSkills(): boolean {
    return this.skills.length > 0;
  }

  private isReady(skillId: string): boolean {
    return (this.cooldowns.get(skillId) ?? 0) <= 0;
  }
}
