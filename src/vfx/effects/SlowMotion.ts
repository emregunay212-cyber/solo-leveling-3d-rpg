/**
 * Sprint 4 — Slow Motion
 * Engine rendering loop etkilemez; sadece update loop'ta dt'yi olcekler.
 * Kullanici: SlowMotion.getRealDt() yerine SlowMotion.scaleDt(dt) kullanir.
 */

export class SlowMotion {
  private _timeScale = 1.0;
  private _targetScale = 1.0;
  private _duration = 0;
  private _elapsed = 0;
  private _active = false;

  /**
   * Slow-motion tetikle.
   * @param timeScale  Zaman hizi (0.2 = %20 hiz, 1.0 = normal)
   * @param duration   Kac saniye surecek (gercek sure, olceklenmemis)
   */
  public trigger(timeScale: number, duration: number): void {
    this._timeScale = Math.max(0.05, Math.min(1.0, timeScale));
    this._targetScale = this._timeScale;
    this._duration = duration;
    this._elapsed = 0;
    this._active = true;
  }

  /**
   * Her frame gercek dt ile cagir (scaleDt'den ONCE).
   * Ic sayaci gercek zamanda ilerler.
   */
  public update(realDt: number): void {
    if (!this._active) return;
    this._elapsed += realDt;
    if (this._elapsed >= this._duration) {
      this._active = false;
      this._timeScale = 1.0;
      this._elapsed = 0;
    }
  }

  /**
   * Oyun sistemleri icin dt'yi olcekle.
   * Slow-motion aktifse daha kucuk dt don.
   */
  public scaleDt(realDt: number): number {
    return realDt * this._timeScale;
  }

  public isActive(): boolean {
    return this._active;
  }

  public getTimeScale(): number {
    return this._timeScale;
  }

  public getRemainingRealTime(): number {
    return Math.max(0, this._duration - this._elapsed);
  }

  /** Slow-motion'i aninda iptal et. */
  public cancel(): void {
    this._active = false;
    this._timeScale = 1.0;
    this._elapsed = 0;
  }
}
