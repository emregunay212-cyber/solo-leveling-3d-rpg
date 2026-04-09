/**
 * Sprint 1 — Charge Sistemi
 * Basili tutma suresi takibi + 3-seviye (tap / lv1 / max) hesaplama.
 * SkillSystem tarafindan kullanilir.
 */

export type ChargeLevel = 'tap' | 'lv1' | 'max';

export interface ChargeConfig {
  /** Lv1 esigi — saniyeleri asinca lv1 olur (varsayilan 0.3) */
  lv1Threshold: number;
  /** MAX esigi — bu sureyi asinca max olur (varsayilan 2.0) */
  maxThreshold: number;
  /** Charge sirasinda hareket edilebilir mi */
  canMoveWhileCharging: boolean;
  /** Charge sirasinda hareket hizi carpani (1.0 = tam, 0.3 = %30) */
  moveSpeedMultiplier: number;
}

export interface ChargeState {
  isCharging: boolean;
  chargeTime: number;
  level: ChargeLevel;
  /** Hangi skill key'i sarj ediliyor */
  skillKey: string | null;
}

export const DEFAULT_CHARGE_CONFIG: ChargeConfig = {
  lv1Threshold: 0.3,
  maxThreshold: 2.0,
  canMoveWhileCharging: true,
  moveSpeedMultiplier: 1.0,
};

/**
 * Tek tus icin sarj yonetici.
 * SkillSystem'da her slot icin biri tutulur.
 */
export class ChargeSystem {
  private _isCharging = false;
  private _chargeTime = 0;
  private _skillKey: string | null = null;
  private _config: ChargeConfig = { ...DEFAULT_CHARGE_CONFIG };

  /** Sarja basla. */
  public startCharge(key: string, config: ChargeConfig): void {
    this._isCharging = true;
    this._chargeTime = 0;
    this._skillKey = key;
    this._config = config;
  }

  /** Her frame cagir. */
  public update(dt: number): ChargeState {
    if (this._isCharging) {
      this._chargeTime += dt;
    }
    return this.getState();
  }

  /** Tus birakildi — mevcut seviyeyi don, durumu sifirla. */
  public release(): { level: ChargeLevel; chargeTime: number } {
    const level = this.computeLevel();
    const time = this._chargeTime;
    this.reset();
    return { level, chargeTime: time };
  }

  /** Sag tik veya baska iptal: charge sifirlanir, MP harcanmaz. */
  public cancel(): void {
    this.reset();
  }

  public isCharging(): boolean {
    return this._isCharging;
  }

  public getLevel(): ChargeLevel {
    return this.computeLevel();
  }

  public getChargeTime(): number {
    return this._chargeTime;
  }

  public getSkillKey(): string | null {
    return this._skillKey;
  }

  public getConfig(): ChargeConfig {
    return this._config;
  }

  public getState(): ChargeState {
    return {
      isCharging: this._isCharging,
      chargeTime: this._chargeTime,
      level: this.computeLevel(),
      skillKey: this._skillKey,
    };
  }

  private computeLevel(): ChargeLevel {
    if (this._chargeTime >= this._config.maxThreshold) return 'max';
    if (this._chargeTime >= this._config.lv1Threshold) return 'lv1';
    return 'tap';
  }

  private reset(): void {
    this._isCharging = false;
    this._chargeTime = 0;
    this._skillKey = null;
  }
}
