/**
 * Sprint 5 — Perfect Parry Sistemi
 * E kalkaninin ilk X saniyesinde vuruş alma → parry tetiklenir.
 */

import type { Enemy } from '../enemies/Enemy';
import { eventBus } from '../core/EventBus';

export interface ParryConfig {
  /** Parry penceresi suresi (saniye) */
  window: number;
  /** Saldiran stun suresi */
  stunDuration: number;
  /** Yansitilan hasar orani (0.3 = %30) */
  reflectPercent: number;
}

export interface ParryResult {
  success: true;
  reflectedDamage: number;
  stunDuration: number;
}

export class ParrySystem {
  private parryWindowTimer = 0;
  private _isParryActive = false;
  private config: ParryConfig = {
    window: 0.4,
    stunDuration: 0.5,
    reflectPercent: 0.3,
  };

  /** E skill cast edildiginde cagir — parry penceresi acilir. */
  public activateParry(config: ParryConfig): void {
    this._isParryActive = true;
    this.parryWindowTimer = config.window;
    this.config = config;
  }

  /** Her frame cagir. */
  public update(dt: number): void {
    if (this._isParryActive) {
      this.parryWindowTimer -= dt;
      if (this.parryWindowTimer <= 0) {
        this.parryWindowTimer = 0;
        this._isParryActive = false;
      }
    }
  }

  public isParryActive(): boolean {
    return this._isParryActive;
  }

  public getWindowRemaining(): number {
    return Math.max(0, this.parryWindowTimer);
  }

  /**
   * Hasar geldigi anda kontrol et.
   * Parry aktifse: saldiran stun, hasar yansitilir, null yerine ParryResult don.
   * Parry aktif degilse: null don (normal hasar hesapla).
   */
  public checkParry(
    incomingDamage: number,
    attacker: Enemy,
  ): ParryResult | null {
    if (!this._isParryActive) return null;

    const reflected = Math.round(incomingDamage * this.config.reflectPercent);
    attacker.applySlow(0.0, this.config.stunDuration); // hizi 0'a indir = stun

    eventBus.emit('player:damage', {
      amount: 0,
      type: 'parry',
    });

    // Parry sonrasi pencere kapanir (bir kere kullanilabilir)
    this._isParryActive = false;
    this.parryWindowTimer = 0;

    return {
      success: true,
      reflectedDamage: reflected,
      stunDuration: this.config.stunDuration,
    };
  }

  public dispose(): void {
    this._isParryActive = false;
    this.parryWindowTimer = 0;
  }
}
