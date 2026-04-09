import { COMBO } from '../config/GameConfig';

/**
 * Manages attack combo chains.
 * Click -> Hit1 -> (click within window) -> Hit2 -> (click within window) -> Hit3
 * If window expires, combo resets.
 */
export class ComboSystem {
  private comboIndex = 0;
  private comboTimer = 0;
  private attackCooldown = 0;
  private isAttacking = false;
  private attackTimer = 0;

  // Attack speed multiplier: 1.0 = normal, higher = faster attacks
  private attackSpeedMult = 1.0;

  // Combo definitions from central config
  public readonly COMBO_STEPS = COMBO.hits;

  public update(dt: number): void {
    // Attack animation timer
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Cooldown between attacks
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Combo window timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        // Combo expired
        this.comboIndex = 0;
      }
    }
  }

  /**
   * Try to start an attack. Returns combo step info if attack started, null if on cooldown.
   */
  public tryAttack(): { damageMultiplier: number; comboIndex: number; isFinisher: boolean } | null {
    if (this.attackCooldown > 0) return null;

    const step = this.COMBO_STEPS[this.comboIndex];
    const speedDiv = this.attackSpeedMult; // higher = faster
    const result = {
      damageMultiplier: step.damageMultiplier,
      comboIndex: this.comboIndex,
      isFinisher: this.comboIndex === this.COMBO_STEPS.length - 1,
    };

    // Start attack - duration divided by speed multiplier
    this.isAttacking = true;
    this.attackTimer = step.duration / speedDiv;
    this.attackCooldown = (step.duration + COMBO.cooldownBuffer) / speedDiv;

    // Advance combo or reset
    if (this.comboIndex < this.COMBO_STEPS.length - 1) {
      this.comboIndex++;
      this.comboTimer = (step.window + step.duration) / speedDiv;
    } else {
      this.comboIndex = 0;
      this.comboTimer = 0;
      this.attackCooldown = (step.duration + COMBO.finisherCooldownBuffer) / speedDiv;
    }

    return result;
  }

  public resetCombo(): void {
    this.comboIndex = 0;
    this.comboTimer = 0;
  }

  public setAttackSpeed(mult: number): void { this.attackSpeedMult = Math.max(COMBO.minAttackSpeedMultiplier, mult); }
  public getAttackSpeed(): number { return this.attackSpeedMult; }
  public getIsAttacking(): boolean { return this.isAttacking; }
  public getComboIndex(): number { return this.comboIndex; }
  public getAttackProgress(): number {
    if (!this.isAttacking) return 0;
    const step = this.COMBO_STEPS[Math.max(0, this.comboIndex - 1)];
    return 1 - (this.attackTimer / step.duration);
  }
}
