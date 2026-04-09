/**
 * Yetenek tanim arabirimi.
 * Tum skill verileri bu interface'e uyar.
 */

import type { ChargeLevel } from './ChargeSystem';

/** Charge seviyesine gore degerler */
export interface ChargeLevelValues {
  range: number;
  damageMult: number;
  mpCost: number;
  /** Buff süresi (shield, blood rage vb.) */
  duration?: number;
  /** Parry penceresi suresi (shield) */
  parryWindow?: number;
  /** Hasar azaltma orani (shield) */
  damageReduction?: number;
  /** Ekstra aciklama (debug/UI icin) */
  extra?: string;
}

/** Charge konfigurasyonu */
export interface SkillChargeConfig {
  lv1Threshold: number;
  maxThreshold: number;
  canMoveWhileCharging: boolean;
  moveSpeedMultiplier: number;
  tap: ChargeLevelValues;
  lv1: ChargeLevelValues;
  max: ChargeLevelValues;
}

export interface SkillDef {
  readonly id: string;
  readonly name: string;
  readonly key: string;
  readonly mpCost: number;
  readonly cooldown: number;
  readonly duration: number;
  readonly range: number;
  readonly damageMultiplier: number;
  readonly scaleStat: 'str' | 'int';
  readonly type: 'dash' | 'buff' | 'aoe' | 'ultimate';
  readonly rank?: string;                // 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
  readonly power?: number;
  readonly damageReduction?: number;     // buff: hasar azaltma orani
  readonly slowMultiplier?: number;      // ultimate: yavaslama carpani
  readonly slowDuration?: number;        // ultimate: yavaslama suresi
  /** I-frame suresi (saniye) — charge'dan bagimsiz */
  readonly iframeDuration?: number;
  /** Cast animasyon kilitleme suresi */
  readonly castLockDuration?: number;
  /** Charge konfigurasyonu — yoksa tek seviye */
  readonly charge?: SkillChargeConfig;
}

export interface SkillState {
  def: SkillDef;
  cooldownRemaining: number;
  isActive: boolean;       // buff aktif mi
  activeTimer: number;      // buff kalan sure
}

/** Charge seviyesine gore SkillDef degerlerini al */
export function getChargeValues(
  def: SkillDef,
  level: ChargeLevel,
): ChargeLevelValues {
  if (!def.charge) {
    return {
      range: def.range,
      damageMult: def.damageMultiplier,
      mpCost: def.mpCost,
      duration: def.duration,
      damageReduction: def.damageReduction,
    };
  }
  return def.charge[level];
}
