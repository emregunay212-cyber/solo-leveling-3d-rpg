/**
 * XP and Level system
 * Killing enemies gives XP -> level up -> stat points
 */
import { LEVEL_SYSTEM, MP } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';

export class LevelSystem {
  public level = 1;
  public xp = 0;
  public xpToNext = 100;
  public totalXp = 0;

  // Stats
  public statPoints = 0;
  public str = LEVEL_SYSTEM.initialStats.str;  // Attack damage
  public vit = LEVEL_SYSTEM.initialStats.vit;  // HP
  public agi = LEVEL_SYSTEM.initialStats.agi;  // Speed / crit
  public int = LEVEL_SYSTEM.initialStats.int;  // MP / skill damage

  public maxLevel = LEVEL_SYSTEM.maxLevel;

  // Callbacks
  private onLevelUp: ((level: number) => void) | null = null;
  private onXpGain: ((amount: number) => void) | null = null;

  constructor() {
    this.xpToNext = this.calcXpForLevel(2);
  }

  public setOnLevelUp(cb: (level: number) => void): void { this.onLevelUp = cb; }
  public setOnXpGain(cb: (amount: number) => void): void { this.onXpGain = cb; }

  public addXp(amount: number): void {
    if (this.level >= this.maxLevel) return;

    this.xp += amount;
    this.totalXp += amount;
    if (this.onXpGain) this.onXpGain(amount);
    eventBus.emit('player:xpGain', { amount });

    // Check for level up (can level up multiple times at once)
    while (this.xp >= this.xpToNext && this.level < this.maxLevel) {
      this.xp -= this.xpToNext;
      this.level++;
      this.statPoints += LEVEL_SYSTEM.statPointsPerLevel;

      // Auto stat increase
      this.str += LEVEL_SYSTEM.autoStatIncreasePerLevel;
      this.vit += LEVEL_SYSTEM.autoStatIncreasePerLevel;
      this.agi += LEVEL_SYSTEM.autoStatIncreasePerLevel;
      this.int += LEVEL_SYSTEM.autoStatIncreasePerLevel;

      this.xpToNext = this.calcXpForLevel(this.level + 1);

      if (this.onLevelUp) this.onLevelUp(this.level);
      eventBus.emit('player:levelUp', { level: this.level });
    }
  }

  public distributeStatPoint(stat: 'str' | 'vit' | 'agi' | 'int'): boolean {
    if (this.statPoints <= 0) return false;
    if (this[stat] >= this.STAT_CAP) return false; // already at cap
    this.statPoints--;
    this[stat]++;
    return true;
  }

  // Stat caps - beyond this, only equipment/skills can increase
  public readonly STAT_CAP = LEVEL_SYSTEM.statCap;

  // Derived stat caps (from stats alone, equipment can exceed)
  private readonly MAX_HP_CAP = LEVEL_SYSTEM.maxHp.cap;
  private readonly MAX_MP_CAP = LEVEL_SYSTEM.maxMp.cap;
  private readonly ATTACK_DMG_CAP = LEVEL_SYSTEM.attackDamage.cap;
  private readonly CRIT_CHANCE_CAP = LEVEL_SYSTEM.critChance.cap;
  private readonly ATTACK_SPEED_CAP = LEVEL_SYSTEM.attackSpeed.cap;
  private readonly MOVE_SPEED_CAP = LEVEL_SYSTEM.moveSpeed.cap;

  // Equipment/skill bonuses (added on top of stat-based values)
  public bonusAttack = 0;
  public bonusHp = 0;
  public bonusMp = 0;
  public bonusCritChance = 0;
  public bonusAttackSpeed = 0;

  // Derived stats: stat bazli deger cap'lenir, sonra ekipman bonusu eklenir.
  // Bonus, cap'i kasitli olarak asabilir (tasarim geregi).
  public getMaxHp(): number {
    return Math.min(this.MAX_HP_CAP, LEVEL_SYSTEM.maxHp.base + this.vit * LEVEL_SYSTEM.maxHp.multiplier) + this.bonusHp;
  }
  public getMaxMp(): number {
    return Math.min(this.MAX_MP_CAP, LEVEL_SYSTEM.maxMp.base + this.int * LEVEL_SYSTEM.maxMp.multiplier) + this.bonusMp;
  }
  public getAttackDamage(): number {
    return Math.min(this.ATTACK_DMG_CAP, LEVEL_SYSTEM.attackDamage.base + this.str * LEVEL_SYSTEM.attackDamage.multiplier) + this.bonusAttack;
  }
  public getCritChance(): number {
    return Math.min(this.CRIT_CHANCE_CAP, LEVEL_SYSTEM.critChance.base + this.agi * LEVEL_SYSTEM.critChance.multiplier) + this.bonusCritChance;
  }
  public getAttackSpeed(): number {
    return Math.min(this.ATTACK_SPEED_CAP, LEVEL_SYSTEM.attackSpeed.base + this.agi * LEVEL_SYSTEM.attackSpeed.multiplier) + this.bonusAttackSpeed;
  }
  public getMoveSpeed(): number {
    return Math.min(this.MOVE_SPEED_CAP, LEVEL_SYSTEM.moveSpeed.base + this.agi * LEVEL_SYSTEM.moveSpeed.multiplier);
  }

  // Block/Parry derived stats
  private readonly PARRY_CHANCE_CAP = LEVEL_SYSTEM.parryChance.cap;
  private readonly BLOCK_REDUCTION_CAP = LEVEL_SYSTEM.blockReduction.cap;
  private readonly DEFENSE_CAP = LEVEL_SYSTEM.defense.cap;

  public getParryChance(): number {
    return Math.min(this.PARRY_CHANCE_CAP, LEVEL_SYSTEM.parryChance.base + this.agi * LEVEL_SYSTEM.parryChance.multiplier);
  }

  // VIT bazli savunma puani → hasar azaltma formulunde kullanilir
  public getDefense(): number {
    return Math.min(this.DEFENSE_CAP, LEVEL_SYSTEM.defense.base + this.vit * LEVEL_SYSTEM.defense.multiplier);
  }

  // Blok hasar azaltma: baz %30 + VIT'ten gelen savunma bonusu (max %70)
  public getBlockReduction(): number {
    const base = LEVEL_SYSTEM.blockReduction.base;
    const vitBonus = this.vit * LEVEL_SYSTEM.blockReduction.multiplier;
    return Math.min(this.BLOCK_REDUCTION_CAP, base + vitBonus);
  }

  // Pasif hasar azaltma (blok olmadan, her zaman aktif)
  public getDamageReduction(): number {
    const defense = this.getDefense();
    // Azalan getiri formulü: savunma / (savunma + 100) → max ~%60
    return defense / (defense + LEVEL_SYSTEM.damageReductionDenominator);
  }

  /** INT bazli MP yenileme hizi (MP/saniye) */
  public getMpRegen(): number {
    return MP.regenBase + this.int * MP.regenPerInt;
  }

  /** INT bazli skill hasar carpani */
  public getSkillDamage(baseMultiplier: number): number {
    return Math.round(this.int * baseMultiplier);
  }

  public getXpPercent(): number {
    return this.xpToNext > 0 ? (this.xp / this.xpToNext) * 100 : 0;
  }

  private calcXpForLevel(level: number): number {
    // XP curve: Metin2 tarzi agir grind
    // Level 2 ~= 410, Level 10 ~= 7k, Level 30 ~= 57k, Level 50 ~= 160k, Level 100 ~= 633k
    return Math.floor(
      LEVEL_SYSTEM.xpCurve.baseMultiplier * level +
      LEVEL_SYSTEM.xpCurve.levelMultiplier * level * level * LEVEL_SYSTEM.xpCurve.growthFactor
    );
  }

  /**
   * Debug: Istenen seviyeye aninda atla.
   * Stat puanlari ve auto-stat artislari dogru hesaplanir.
   */
  public setLevel(targetLevel: number): void {
    const clamped = Math.max(1, Math.min(targetLevel, this.maxLevel));
    if (clamped === this.level) return;

    // Stat'lari sifirla ve yeniden hesapla
    const levelsGained = clamped - 1; // level 1'den basliyoruz
    (this as { str: number }).str = LEVEL_SYSTEM.initialStats.str + levelsGained * LEVEL_SYSTEM.autoStatIncreasePerLevel;
    (this as { vit: number }).vit = LEVEL_SYSTEM.initialStats.vit + levelsGained * LEVEL_SYSTEM.autoStatIncreasePerLevel;
    (this as { agi: number }).agi = LEVEL_SYSTEM.initialStats.agi + levelsGained * LEVEL_SYSTEM.autoStatIncreasePerLevel;
    (this as { int: number }).int = LEVEL_SYSTEM.initialStats.int + levelsGained * LEVEL_SYSTEM.autoStatIncreasePerLevel;
    this.statPoints = levelsGained * LEVEL_SYSTEM.statPointsPerLevel;

    this.level = clamped;
    this.xp = 0;
    this.xpToNext = this.calcXpForLevel(this.level + 1);

    if (this.onLevelUp) this.onLevelUp(this.level);
    eventBus.emit('player:levelUp', { level: this.level });
  }

  // Death penalty: lose 5% of current level XP
  public applyDeathPenalty(): void {
    const penalty = Math.floor(this.xpToNext * LEVEL_SYSTEM.deathPenaltyPercent);
    this.xp = Math.max(0, this.xp - penalty);
  }
}
