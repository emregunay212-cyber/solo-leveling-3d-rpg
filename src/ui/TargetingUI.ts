/**
 * Sprint 2 — Hedefleme UI
 * Charge bar + seviye gostergesi + "HAZIR!" bildirimi.
 */

import type { ChargeLevel } from '../skills/ChargeSystem';

export class TargetingUI {
  private container: HTMLDivElement;
  private barFill: HTMLDivElement;
  private levelLabel: HTMLDivElement;
  private readyLabel: HTMLDivElement;
  private skillLabel: HTMLDivElement;
  private visible = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 165px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      pointer-events: none;
      z-index: 200;
      opacity: 0;
      transition: opacity 0.15s;
    `;

    // Skill ismi
    this.skillLabel = document.createElement('div');
    this.skillLabel.style.cssText = `
      font-family: 'Segoe UI', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: rgba(200, 160, 255, 0.8);
      letter-spacing: 2px;
      text-transform: uppercase;
    `;

    // Charge bar
    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 200px; height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      overflow: visible;
      position: relative;
    `;

    this.barFill = document.createElement('div');
    this.barFill.style.cssText = `
      height: 100%;
      width: 0%;
      border-radius: 3px;
      background: linear-gradient(90deg, #5B0E91, #B06EFF);
      transition: width 0.05s linear, background 0.2s;
      box-shadow: 0 0 8px currentColor;
    `;
    barBg.appendChild(this.barFill);

    // Lv1 / MAX isaretciler
    const marker1 = this.createMarker(15);   // lv1 esigi = %15 (0.3/2.0 = 15%)
    const markerMax = this.createMarker(100);
    barBg.appendChild(marker1);
    barBg.appendChild(markerMax);

    // Seviye etiketi
    this.levelLabel = document.createElement('div');
    this.levelLabel.style.cssText = `
      font-family: 'Segoe UI', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: rgba(180, 120, 255, 0.9);
      letter-spacing: 1px;
    `;

    // HAZIR label
    this.readyLabel = document.createElement('div');
    this.readyLabel.style.cssText = `
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 900;
      color: #FF4444;
      text-shadow: 0 0 12px #FF0000;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0;
      transition: opacity 0.15s;
    `;
    this.readyLabel.textContent = 'MAX!';

    this.container.appendChild(this.skillLabel);
    this.container.appendChild(barBg);
    this.container.appendChild(this.levelLabel);
    this.container.appendChild(this.readyLabel);
    document.body.appendChild(this.container);
  }

  private createMarker(pct: number): HTMLDivElement {
    const m = document.createElement('div');
    m.style.cssText = `
      position: absolute;
      top: -3px;
      left: ${pct}%;
      width: 2px;
      height: 12px;
      background: rgba(255,255,255,0.3);
      border-radius: 1px;
    `;
    return m;
  }

  public show(skillName: string): void {
    this.visible = true;
    this.skillLabel.textContent = skillName;
    this.container.style.opacity = '1';
  }

  public update(chargeTime: number, maxThreshold: number, level: ChargeLevel): void {
    if (!this.visible) return;

    const pct = Math.min(100, (chargeTime / maxThreshold) * 100);
    this.barFill.style.width = `${pct}%`;

    switch (level) {
      case 'tap':
        this.barFill.style.background = 'linear-gradient(90deg, #5B0E91, #B06EFF)';
        this.levelLabel.textContent = 'Tap';
        this.levelLabel.style.color = 'rgba(180,120,255,0.9)';
        this.readyLabel.style.opacity = '0';
        break;
      case 'lv1':
        this.barFill.style.background = 'linear-gradient(90deg, #806000, #FFD700)';
        this.levelLabel.textContent = 'Lv1 ●';
        this.levelLabel.style.color = '#FFD700';
        this.readyLabel.style.opacity = '0';
        break;
      case 'max':
        this.barFill.style.background = 'linear-gradient(90deg, #800000, #FF4444)';
        this.levelLabel.textContent = 'MAX ●●';
        this.levelLabel.style.color = '#FF4444';
        this.readyLabel.style.opacity = '1';
        break;
    }
  }

  public hide(): void {
    this.visible = false;
    this.container.style.opacity = '0';
    this.barFill.style.width = '0%';
    this.readyLabel.style.opacity = '0';
  }

  public dispose(): void {
    this.container.remove();
  }
}
