/**
 * Sprint 3 — Combo Zincir UI
 * Combo penceresi timer, tetiklenen combo ismi, streak sayaci.
 */

export class ComboUI {
  private container: HTMLDivElement;
  private timerBar: HTMLDivElement;
  private timerFill: HTMLDivElement;
  private streakLabel: HTMLDivElement;
  private comboNameEl: HTMLDivElement;
  private nameTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Ana konteyner — ekranin ortasinda, skill bar'in uzerinde
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 110px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      pointer-events: none;
      z-index: 200;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // Timer bar
    this.timerBar = document.createElement('div');
    this.timerBar.style.cssText = `
      width: 160px; height: 4px;
      background: rgba(255,255,255,0.15);
      border-radius: 2px;
      overflow: hidden;
    `;
    this.timerFill = document.createElement('div');
    this.timerFill.style.cssText = `
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #9B4DFF, #FF2277);
      border-radius: 2px;
      transition: width 0.05s linear;
    `;
    this.timerBar.appendChild(this.timerFill);

    // Streak sayaci
    this.streakLabel = document.createElement('div');
    this.streakLabel.style.cssText = `
      font-family: 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: rgba(180, 120, 255, 0.9);
      letter-spacing: 1px;
    `;

    // Combo ismi
    this.comboNameEl = document.createElement('div');
    this.comboNameEl.style.cssText = `
      position: fixed;
      right: 80px;
      top: 50%;
      transform: translateY(-50%);
      font-family: 'Segoe UI', sans-serif;
      font-size: 20px;
      font-weight: 900;
      color: #B06EFF;
      text-shadow: 0 0 16px #7B2FBE, 0 0 32px #4A0E78;
      letter-spacing: 2px;
      text-transform: uppercase;
      pointer-events: none;
      z-index: 300;
      opacity: 0;
      transition: opacity 0.15s;
    `;
    document.body.appendChild(this.comboNameEl);

    this.container.appendChild(this.timerBar);
    this.container.appendChild(this.streakLabel);
    document.body.appendChild(this.container);
  }

  /** Combo penceresi aktifse goster. */
  public showWindow(remaining: number, total: number, streak: number): void {
    if (remaining <= 0) {
      this.container.style.opacity = '0';
      return;
    }
    this.container.style.opacity = '1';
    const pct = (remaining / total) * 100;
    this.timerFill.style.width = `${pct}%`;

    if (streak > 1) {
      this.streakLabel.textContent = `x${streak} COMBO`;
    } else {
      this.streakLabel.textContent = '';
    }
  }

  /** Combo tetiklenince ismi goster. */
  public showComboName(name: string): void {
    if (!name) return;
    if (this.nameTimeout) clearTimeout(this.nameTimeout);
    this.comboNameEl.textContent = name + '!';
    this.comboNameEl.style.opacity = '1';
    this.nameTimeout = setTimeout(() => {
      this.comboNameEl.style.opacity = '0';
    }, 800);
  }

  public dispose(): void {
    if (this.nameTimeout) clearTimeout(this.nameTimeout);
    this.container.remove();
    this.comboNameEl.remove();
  }
}
