/**
 * Yetenek tanim arabirimi.
 * Tum skill verileri bu interface'e uyar.
 */
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
  readonly damageReduction?: number;     // buff: hasar azaltma orani
  readonly slowMultiplier?: number;      // ultimate: yavaslama carpani
  readonly slowDuration?: number;        // ultimate: yavaslama suresi
}

export interface SkillState {
  def: SkillDef;
  cooldownRemaining: number;
  isActive: boolean;       // buff aktif mi
  activeTimer: number;      // buff kalan sure
}
