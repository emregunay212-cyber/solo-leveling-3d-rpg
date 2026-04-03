/**
 * HTML-based HUD overlay
 * HP, MP, XP bars, level, gold, combo indicator
 */
export class HUD {
  private container: HTMLDivElement;
  private hpFill!: HTMLDivElement;
  private mpFill!: HTMLDivElement;
  private xpFill!: HTMLDivElement;
  private hpText!: HTMLSpanElement;
  private mpText!: HTMLSpanElement;
  private levelText!: HTMLSpanElement;
  private goldText!: HTMLSpanElement;
  private comboIndicator!: HTMLDivElement;
  private xpPopup!: HTMLDivElement;
  private xpPopupTimer = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = `
      <style>
        #hud {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          font-family: 'Segoe UI', Arial, sans-serif;
          z-index: 10;
        }
        .hud-bars {
          position: absolute;
          top: 15px; left: 15px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .hud-level {
          color: #FFD700;
          font-size: 14px;
          font-weight: bold;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
          margin-bottom: 2px;
        }
        .bar-container {
          width: 220px;
          height: 16px;
          background: rgba(0,0,0,0.7);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .bar-container.xp-bar {
          height: 10px;
          margin-top: 2px;
        }
        .bar-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 1px;
        }
        .bar-fill.hp { background: linear-gradient(180deg, #e04040 0%, #a02020 100%); }
        .bar-fill.mp { background: linear-gradient(180deg, #4060e0 0%, #2030a0 100%); }
        .bar-fill.xp { background: linear-gradient(180deg, #e0c020 0%, #a08010 100%); }
        .bar-text {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 10px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }
        .hud-gold {
          color: #FFD700;
          font-size: 13px;
          font-weight: bold;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
          margin-top: 6px;
        }
        .combo-indicator {
          position: absolute;
          bottom: 150px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 24px;
          font-weight: bold;
          color: #FFD700;
          text-shadow: 0 0 10px rgba(255,215,0,0.5), 2px 2px 4px rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .combo-indicator.active { opacity: 1; }
        .xp-popup {
          position: absolute;
          top: 80px; left: 15px;
          font-size: 16px;
          font-weight: bold;
          color: #FFD700;
          text-shadow: 0 0 8px rgba(255,215,0,0.4), 1px 1px 3px rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
          transform: translateY(0);
        }
        .xp-popup.show {
          opacity: 1;
          transform: translateY(-10px);
        }
        .crosshair {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 4px; height: 4px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-radius: 50%;
        }
      </style>
      <div class="hud-bars">
        <div class="hud-level" id="hud-level">Lv. 1</div>
        <div class="bar-container">
          <div class="bar-fill hp" id="hud-hp-fill" style="width: 100%"></div>
          <span class="bar-text" id="hud-hp-text">100 / 100</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill mp" id="hud-mp-fill" style="width: 100%"></div>
          <span class="bar-text" id="hud-mp-text">50 / 50</span>
        </div>
        <div class="bar-container xp-bar">
          <div class="bar-fill xp" id="hud-xp-fill" style="width: 0%"></div>
        </div>
        <div class="hud-gold" id="hud-gold">Gold: 0</div>
      </div>
      <div class="combo-indicator" id="hud-combo"></div>
      <div class="xp-popup" id="hud-xp-popup"></div>
      <div class="crosshair"></div>
    `;

    document.body.appendChild(this.container);

    this.hpFill = document.getElementById('hud-hp-fill') as HTMLDivElement;
    this.mpFill = document.getElementById('hud-mp-fill') as HTMLDivElement;
    this.xpFill = document.getElementById('hud-xp-fill') as HTMLDivElement;
    this.hpText = document.getElementById('hud-hp-text') as HTMLSpanElement;
    this.mpText = document.getElementById('hud-mp-text') as HTMLSpanElement;
    this.levelText = document.getElementById('hud-level') as HTMLSpanElement;
    this.goldText = document.getElementById('hud-gold') as HTMLSpanElement;
    this.comboIndicator = document.getElementById('hud-combo') as HTMLDivElement;
    this.xpPopup = document.getElementById('hud-xp-popup') as HTMLDivElement;
  }

  public setHP(current: number, max: number): void {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.hpFill.style.width = `${pct}%`;
    this.hpText.textContent = `${Math.ceil(current)} / ${max}`;
  }

  public setMP(current: number, max: number): void {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.mpFill.style.width = `${pct}%`;
    this.mpText.textContent = `${Math.ceil(current)} / ${max}`;
  }

  public setXP(percent: number): void {
    this.xpFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  public setLevel(level: number): void {
    this.levelText.textContent = `Lv. ${level}`;
  }

  public setGold(gold: number): void {
    this.goldText.textContent = `Gold: ${gold}`;
  }

  public showXpGain(amount: number): void {
    this.xpPopup.textContent = `+${amount} XP`;
    this.xpPopup.classList.add('show');
    clearTimeout(this.xpPopupTimer as any);
    this.xpPopupTimer = window.setTimeout(() => {
      this.xpPopup.classList.remove('show');
    }, 800);
  }

  public showCombo(index: number): void {
    const labels = ['', 'HIT 2', 'FINISHER!'];
    if (index > 0 && index < labels.length) {
      this.comboIndicator.textContent = labels[index];
      this.comboIndicator.classList.add('active');
      setTimeout(() => this.comboIndicator.classList.remove('active'), 400);
    }
  }

  public dispose(): void {
    this.container.remove();
  }
}
