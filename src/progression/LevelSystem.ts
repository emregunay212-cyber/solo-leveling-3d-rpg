/**
 * XP and Level system
 * Killing enemies gives XP -> level up -> stat points
 */
export class LevelSystem {
  public level = 1;
  public xp = 0;
  public xpToNext = 100;
  public totalXp = 0;

  // Stats
  public statPoints = 0;
  public str = 5;  // Attack damage
  public vit = 5;  // HP
  public agi = 5;  // Speed / crit
  public int = 5;  // MP / skill damage

  public maxLevel = 100;

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

    // Check for level up (can level up multiple times at once)
    while (this.xp >= this.xpToNext && this.level < this.maxLevel) {
      this.xp -= this.xpToNext;
      this.level++;
      this.statPoints += 5; // 5 stat points per level

      // Auto stat increase
      this.str += 1;
      this.vit += 1;
      this.agi += 1;
      this.int += 1;

      this.xpToNext = this.calcXpForLevel(this.level + 1);

      if (this.onLevelUp) this.onLevelUp(this.level);
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
  public readonly STAT_CAP = 90; // max points per stat via level-up

  // Derived stat caps (from stats alone, equipment can exceed)
  private readonly MAX_HP_CAP = 800;
  private readonly MAX_MP_CAP = 480;
  private readonly ATTACK_DMG_CAP = 190;
  private readonly CRIT_CHANCE_CAP = 0.40;       // 40%
  private readonly ATTACK_SPEED_CAP = 2.0;       // x2.0
  private readonly MOVE_SPEED_CAP = 8.0;

  // Equipment/skill bonuses (added on top of stat-based values)
  public bonusAttack = 0;
  public bonusHp = 0;
  public bonusMp = 0;
  public bonusCritChance = 0;
  public bonusAttackSpeed = 0;

  // Derived stats (capped from stats, then equipment added)
  public getMaxHp(): number {
    return Math.min(this.MAX_HP_CAP, 80 + this.vit * 8) + this.bonusHp;
  }
  public getMaxMp(): number {
    return Math.min(this.MAX_MP_CAP, 30 + this.int * 5) + this.bonusMp;
  }
  public getAttackDamage(): number {
    return Math.min(this.ATTACK_DMG_CAP, 10 + this.str * 2) + this.bonusAttack;
  }
  public getCritChance(): number {
    return Math.min(this.CRIT_CHANCE_CAP, 0.05 + this.agi * 0.005) + this.bonusCritChance;
  }
  public getAttackSpeed(): number {
    return Math.min(this.ATTACK_SPEED_CAP, 1.0 + this.agi * 0.02) + this.bonusAttackSpeed;
  }
  public getMoveSpeed(): number {
    return Math.min(this.MOVE_SPEED_CAP, 5 + this.agi * 0.05);
  }

  public getXpPercent(): number {
    return this.xpToNext > 0 ? (this.xp / this.xpToNext) * 100 : 0;
  }

  private calcXpForLevel(level: number): number {
    // XP curve: each level needs more XP
    // Level 2 = 100, Level 10 ~= 500, Level 50 ~= 5000, Level 100 ~= 20000
    return Math.floor(50 * level + 10 * level * level * 0.3);
  }

  // Death penalty: lose 5% of current level XP
  public applyDeathPenalty(): void {
    const penalty = Math.floor(this.xpToNext * 0.05);
    this.xp = Math.max(0, this.xp - penalty);
  }
}
