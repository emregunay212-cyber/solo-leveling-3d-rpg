/**
 * Solo Leveling themed HUD — dark, cinematic, neon-glow bars
 * HP (kirmizi), MP (mor), XP (altin), Level badge, Gold counter
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
  private blockIndicator!: HTMLDivElement;
  private autoAttackIndicator!: HTMLDivElement;
  private xpPopupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&display=swap');

        #hud {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        /* ─── PANEL SOL UST ─── */
        .hud-panel {
          position: absolute;
          top: 12px; left: 12px;
          width: 260px;
          background: linear-gradient(135deg, rgba(10,5,20,0.92) 0%, rgba(20,10,35,0.88) 100%);
          border: 1px solid rgba(120,60,200,0.25);
          border-radius: 8px;
          padding: 10px 14px 12px;
          backdrop-filter: blur(8px);
          box-shadow:
            0 0 20px rgba(100,40,180,0.12),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        /* ─── SEVIYE BADGE ─── */
        .hud-level-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .hud-level-badge {
          background: linear-gradient(135deg, #1a0a30 0%, #2d1050 100%);
          border: 1.5px solid rgba(168,85,247,0.5);
          border-radius: 6px;
          padding: 2px 10px;
          box-shadow: 0 0 10px rgba(168,85,247,0.2);
        }
        .hud-level-text {
          font-family: 'Orbitron', monospace;
          font-size: 13px;
          font-weight: 900;
          color: #c084fc;
          letter-spacing: 1.5px;
          text-shadow: 0 0 8px rgba(192,132,252,0.5);
        }
        .hud-gold-display {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #fbbf24;
          text-shadow: 0 0 6px rgba(251,191,36,0.3);
          margin-left: auto;
          letter-spacing: 0.5px;
        }
        .hud-gold-icon { opacity: 0.8; margin-right: 3px; }

        /* ─── BAR GENEL ─── */
        .hud-bar {
          position: relative;
          height: 18px;
          margin-bottom: 5px;
          border-radius: 3px;
          overflow: hidden;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .hud-bar.xp {
          height: 8px;
          margin-bottom: 0;
          margin-top: 3px;
          border-radius: 2px;
        }

        /* ─── BAR DOLGU ─── */
        .hud-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }

        /* HP — kirmizi/turuncu neon */
        .hud-bar-fill.hp {
          background: linear-gradient(90deg, #dc2626 0%, #ef4444 60%, #f87171 100%);
          box-shadow:
            0 0 8px rgba(239,68,68,0.5),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .hud-bar-fill.hp::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%);
          border-radius: 2px 2px 0 0;
        }

        /* MP — mor neon */
        .hud-bar-fill.mp {
          background: linear-gradient(90deg, #7c3aed 0%, #8b5cf6 60%, #a78bfa 100%);
          box-shadow:
            0 0 8px rgba(139,92,246,0.5),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .hud-bar-fill.mp::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%);
          border-radius: 2px 2px 0 0;
        }

        /* XP — altin */
        .hud-bar-fill.xp {
          background: linear-gradient(90deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%);
          box-shadow: 0 0 6px rgba(245,158,11,0.4);
        }

        /* ─── BAR LABEL ─── */
        .hud-bar-label {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Rajdhani', sans-serif;
          font-size: 9px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .hud-bar-value {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          letter-spacing: 0.5px;
        }

        /* ─── BAR IKON (sol basi) ─── */
        .hud-bar-icon {
          position: absolute;
          left: -1px; top: -1px; bottom: -1px;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          z-index: 2;
          border-radius: 3px 0 0 3px;
        }
        .hud-bar-icon.hp-icon {
          background: linear-gradient(180deg, #991b1b 0%, #7f1d1d 100%);
          border-right: 1px solid rgba(239,68,68,0.3);
        }
        .hud-bar-icon.mp-icon {
          background: linear-gradient(180deg, #5b21b6 0%, #4c1d95 100%);
          border-right: 1px solid rgba(139,92,246,0.3);
        }

        /* ─── SEPARATOR ─── */
        .hud-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%);
          margin: 6px 0 4px;
        }

        /* ─── COMBO ─── */
        .combo-indicator {
          position: absolute;
          bottom: 160px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Orbitron', monospace;
          font-size: 22px;
          font-weight: 900;
          color: #fbbf24;
          text-shadow:
            0 0 20px rgba(251,191,36,0.6),
            0 0 40px rgba(251,191,36,0.3),
            2px 2px 4px rgba(0,0,0,0.9);
          opacity: 0;
          transition: opacity 0.15s;
          letter-spacing: 3px;
        }
        .combo-indicator.active { opacity: 1; }

        /* ─── XP POPUP ─── */
        .xp-popup {
          position: absolute;
          top: 100px; left: 20px;
          font-family: 'Orbitron', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #fbbf24;
          text-shadow: 0 0 10px rgba(251,191,36,0.5), 1px 1px 3px rgba(0,0,0,0.9);
          opacity: 0;
          transition: opacity 0.3s, transform 0.3s;
          transform: translateY(0);
          letter-spacing: 1px;
        }
        .xp-popup.show {
          opacity: 1;
          transform: translateY(-12px);
        }

        /* ─── BLOCK ─── */
        .block-indicator {
          position: absolute;
          bottom: 105px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Orbitron', monospace;
          font-size: 16px;
          font-weight: 700;
          color: #60a5fa;
          text-shadow:
            0 0 15px rgba(96,165,250,0.6),
            2px 2px 4px rgba(0,0,0,0.9);
          opacity: 0;
          transition: opacity 0.15s;
          letter-spacing: 4px;
        }
        .block-indicator.active { opacity: 1; }

        /* ─── CROSSHAIR ─── */
        .crosshair {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 6px; height: 6px;
          border: 1.5px solid rgba(168,85,247,0.35);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(168,85,247,0.15);
        }

        /* ─── PULSE ANIMATION (HP dusunce) ─── */
        @keyframes bar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .hud-bar-fill.hp.low {
          animation: bar-pulse 0.8s ease-in-out infinite;
        }
      </style>

      <div class="hud-panel">
        <div class="hud-level-row">
          <div class="hud-level-badge">
            <span class="hud-level-text" id="hud-level">LV 1</span>
          </div>
          <span class="hud-gold-display" id="hud-gold">
            <span class="hud-gold-icon">⬡</span>0
          </span>
        </div>

        <div class="hud-bar">
          <div class="hud-bar-icon hp-icon">♥</div>
          <div class="hud-bar-fill hp" id="hud-hp-fill" style="width: 100%"></div>
          <span class="hud-bar-label" style="left:24px">HP</span>
          <span class="hud-bar-value" id="hud-hp-text">100 / 100</span>
        </div>

        <div class="hud-bar">
          <div class="hud-bar-icon mp-icon">◆</div>
          <div class="hud-bar-fill mp" id="hud-mp-fill" style="width: 100%"></div>
          <span class="hud-bar-label" style="left:24px">MP</span>
          <span class="hud-bar-value" id="hud-mp-text">50 / 50</span>
        </div>

        <div class="hud-bar xp">
          <div class="hud-bar-fill xp" id="hud-xp-fill" style="width: 0%"></div>
        </div>
      </div>

      <div class="combo-indicator" id="hud-combo"></div>
      <div class="block-indicator" id="hud-block">◈ SAVUNMA ◈</div>
      <div id="hud-auto-attack" style="
        position: fixed;
        bottom: 90px;
        right: 20px;
        background: rgba(168, 85, 247, 0.15);
        border: 1px solid rgba(168, 85, 247, 0.5);
        color: #c084fc;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 700;
        font-size: 14px;
        padding: 4px 12px;
        border-radius: 4px;
        letter-spacing: 2px;
        text-shadow: 0 0 8px rgba(168, 85, 247, 0.6);
        display: none;
        pointer-events: none;
      ">AUTO [T]</div>
      <div class="xp-popup" id="hud-xp-popup"></div>
      <div class="crosshair"></div>
    `;

    document.body.appendChild(this.container);

    this.hpFill = this.container.querySelector('#hud-hp-fill') as HTMLDivElement;
    this.mpFill = this.container.querySelector('#hud-mp-fill') as HTMLDivElement;
    this.xpFill = this.container.querySelector('#hud-xp-fill') as HTMLDivElement;
    this.hpText = this.container.querySelector('#hud-hp-text') as HTMLSpanElement;
    this.mpText = this.container.querySelector('#hud-mp-text') as HTMLSpanElement;
    this.levelText = this.container.querySelector('#hud-level') as HTMLSpanElement;
    this.goldText = this.container.querySelector('#hud-gold') as HTMLSpanElement;
    this.comboIndicator = this.container.querySelector('#hud-combo') as HTMLDivElement;
    this.blockIndicator = this.container.querySelector('#hud-block') as HTMLDivElement;
    this.autoAttackIndicator = this.container.querySelector('#hud-auto-attack') as HTMLDivElement;
    this.xpPopup = this.container.querySelector('#hud-xp-popup') as HTMLDivElement;
  }

  public setHP(current: number, max: number): void {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.hpFill.style.width = `${pct}%`;
    this.hpText.textContent = `${Math.ceil(current)} / ${max}`;
    // Dusuk HP'de pulse efekti
    if (pct < 25) {
      this.hpFill.classList.add('low');
    } else {
      this.hpFill.classList.remove('low');
    }
  }

  public setMP(current: number, max: number, regenPerSec = 0, drainPerSec = 0): void {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.mpFill.style.width = `${pct}%`;

    if (drainPerSec > 0) {
      const net = regenPerSec - drainPerSec;
      const sign = net >= 0 ? '+' : '';
      this.mpText.innerHTML =
        `${Math.ceil(current)} / ${max}` +
        ` <span style="font-size:9px;color:${net >= 0 ? '#4ade80' : '#ff6b6b'}">(${sign}${net.toFixed(1)}/s)</span>`;
    } else {
      this.mpText.textContent = `${Math.ceil(current)} / ${max}`;
    }
  }

  public setXP(percent: number): void {
    this.xpFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  public setLevel(level: number): void {
    this.levelText.textContent = `LV ${level}`;
  }

  public setGold(gold: number): void {
    this.goldText.innerHTML = `<span class="hud-gold-icon">⬡</span>${gold}`;
  }

  public showXpGain(amount: number): void {
    this.xpPopup.textContent = `+${amount} XP`;
    this.xpPopup.classList.add('show');
    if (this.xpPopupTimer) clearTimeout(this.xpPopupTimer);
    this.xpPopupTimer = setTimeout(() => {
      this.xpPopup.classList.remove('show');
    }, 800);
  }

  public setBlocking(active: boolean): void {
    if (active) {
      this.blockIndicator.classList.add('active');
    } else {
      this.blockIndicator.classList.remove('active');
    }
  }

  public showCombo(index: number): void {
    const labels = ['', '◆ HIT 2 ◆', '⚡ FINISHER ⚡'];
    if (index > 0 && index < labels.length) {
      this.comboIndicator.textContent = labels[index];
      this.comboIndicator.classList.add('active');
      setTimeout(() => this.comboIndicator.classList.remove('active'), 400);
    }
  }

  public setAutoAttack(enabled: boolean): void {
    this.autoAttackIndicator.style.display = enabled ? 'block' : 'none';
  }

  public dispose(): void {
    this.container.remove();
  }
}
