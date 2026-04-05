import type { SoulSlot } from '../shadows/ShadowArmy';
import type { ShadowCombatMode } from '../shadows/ShadowAI';

/**
 * Golge ordusu UI — Solo Leveling temali sayac + stok slotlari.
 */
export class ShadowUI {
  private container: HTMLDivElement;
  private countText!: HTMLSpanElement;
  private extractModeIndicator!: HTMLDivElement;
  private modeIndicator!: HTMLSpanElement;
  private slotElements: HTMLDivElement[] = [];
  private onSlotClick: ((slotIndex: number) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'shadow-ui';
    this.container.innerHTML = `
      <style>
        #shadow-ui {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          pointer-events: none;
          z-index: 11;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }

        /* ─── GOLGE PANEL (sol ust, HUD altinda) ─── */
        .shadow-panel {
          position: absolute;
          top: 120px; left: 12px;
          width: 260px;
          background: linear-gradient(135deg, rgba(10,5,20,0.88) 0%, rgba(15,5,30,0.85) 100%);
          border: 1px solid rgba(120,60,200,0.2);
          border-radius: 6px;
          padding: 8px 12px 10px;
          backdrop-filter: blur(6px);
        }

        .shadow-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .shadow-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(192,132,252,0.6);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .shadow-count {
          font-family: 'Orbitron', monospace;
          font-size: 12px;
          font-weight: 700;
          color: #c084fc;
          text-shadow: 0 0 8px rgba(192,132,252,0.4);
        }

        /* ─── RUH STOK SLOTLARI ─── */
        .soul-slots {
          display: flex;
          gap: 4px;
        }
        .soul-slot {
          width: 56px;
          height: 36px;
          background: rgba(20,8,40,0.9);
          border: 1px solid rgba(100,40,160,0.3);
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .soul-slot.filled {
          border-color: rgba(168,85,247,0.6);
          box-shadow: 0 0 8px rgba(168,85,247,0.15);
          background: linear-gradient(180deg, rgba(30,12,55,0.95) 0%, rgba(20,8,40,0.95) 100%);
          pointer-events: auto;
          cursor: pointer;
        }
        .soul-slot.filled:hover {
          border-color: rgba(192,132,252,0.8);
          box-shadow: 0 0 12px rgba(192,132,252,0.3);
        }
        .soul-slot-rank {
          position: absolute;
          top: 2px; right: 4px;
          font-family: 'Orbitron', monospace;
          font-size: 7px;
          font-weight: 900;
          line-height: 1;
        }
        .soul-slot-boss {
          position: absolute;
          bottom: 2px; right: 14px;
          font-size: 8px;
          color: #f59e0b;
          font-weight: 700;
        }
        .soul-slot-key {
          position: absolute;
          top: 2px; left: 4px;
          font-family: 'Orbitron', monospace;
          color: rgba(255,255,255,0.25);
          font-size: 8px;
          font-weight: 700;
        }
        .soul-slot.filled .soul-slot-key {
          color: rgba(192,132,252,0.6);
        }
        .soul-slot-name {
          color: rgba(192,132,252,0.8);
          font-size: 7px;
          font-weight: 600;
          text-align: center;
          line-height: 1;
          margin-top: 4px;
          letter-spacing: 0.3px;
        }
        .soul-slot-count {
          position: absolute;
          bottom: 2px; right: 4px;
          font-family: 'Orbitron', monospace;
          color: #e0d4fc;
          font-size: 9px;
          font-weight: 700;
          text-shadow: 0 0 4px rgba(192,132,252,0.4);
        }

        .soul-slot-hp {
          position: absolute;
          bottom: 2px; left: 4px;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #555;
          transition: background 0.3s;
        }
        .soul-slot-hp.full {
          background: #4ade80;
          box-shadow: 0 0 4px rgba(74,222,128,0.6);
        }
        .soul-slot-hp.healing {
          background: #facc15;
          box-shadow: 0 0 3px rgba(250,204,21,0.4);
        }

        /* ─── SAVAS MODU GOSTERGESI ─── */
        .shadow-mode {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 1px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .shadow-mode.attack {
          color: #ff6b6b;
          background: rgba(255,107,107,0.15);
          border: 1px solid rgba(255,107,107,0.3);
        }
        .shadow-mode.defense {
          color: #60a5fa;
          background: rgba(96,165,250,0.15);
          border: 1px solid rgba(96,165,250,0.3);
        }

        /* ─── CIKARMA MODU ─── */
        .extract-mode {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -80px);
          font-family: 'Orbitron', monospace;
          font-size: 18px;
          font-weight: 900;
          color: #c084fc;
          text-shadow:
            0 0 20px rgba(192,132,252,0.6),
            0 0 40px rgba(192,132,252,0.3),
            2px 2px 6px rgba(0,0,0,0.9);
          opacity: 0;
          transition: opacity 0.2s;
          letter-spacing: 5px;
        }
        .extract-mode.active { opacity: 1; }
      </style>

      <div class="shadow-panel">
        <div class="shadow-header">
          <span class="shadow-label">GOLGELER</span>
          <span class="shadow-mode defense" id="shadow-mode">SAVUNMA</span>
          <span class="shadow-count" id="shadow-count">0 / 3</span>
        </div>
        <div class="soul-slots" id="soul-slots"></div>
      </div>
      <div class="extract-mode" id="extract-mode">◈ ARISE ◈</div>
    `;

    document.body.appendChild(this.container);
    this.countText = document.getElementById('shadow-count') as HTMLSpanElement;
    this.extractModeIndicator = document.getElementById('extract-mode') as HTMLDivElement;
    this.modeIndicator = document.getElementById('shadow-mode') as HTMLSpanElement;

    // 4 stok slotu
    const slotsContainer = document.getElementById('soul-slots')!;
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'soul-slot';
      slot.innerHTML = `
        <span class="soul-slot-key">${i + 1}</span>
        <span class="soul-slot-name" id="soul-name-${i}"></span>
        <span class="soul-slot-count" id="soul-count-${i}"></span>
        <span class="soul-slot-hp" id="soul-hp-${i}"></span>
        <span class="soul-slot-rank" id="soul-rank-${i}"></span>
        <span class="soul-slot-boss" id="soul-boss-${i}"></span>
      `;
      const slotIndex = i;
      slot.addEventListener('click', () => {
        if (slot.classList.contains('filled') && this.onSlotClick) {
          this.onSlotClick(slotIndex);
        }
      });
      slotsContainer.appendChild(slot);
      this.slotElements.push(slot);
    }
  }

  public updateCount(activeCount: number, drainPerSecond: number, regenPerSecond: number): void {
    if (activeCount === 0) {
      this.countText.textContent = '0';
    } else {
      const net = regenPerSecond - drainPerSecond;
      const sign = net >= 0 ? '+' : '';
      this.countText.innerHTML =
        `${activeCount} ◆ <span style="color:#4ade80">+${regenPerSecond.toFixed(1)}</span>` +
        ` / <span style="color:#ff6b6b">-${drainPerSecond.toFixed(1)}</span>` +
        ` <span style="color:${net >= 0 ? '#4ade80' : '#ff6b6b'}">(${sign}${net.toFixed(1)})</span> MP/s`;
    }
  }

  public setExtractMode(active: boolean): void {
    if (active) {
      this.extractModeIndicator.classList.add('active');
    } else {
      this.extractModeIndicator.classList.remove('active');
    }
  }

  public updateMode(mode: ShadowCombatMode): void {
    if (mode === 'attack') {
      this.modeIndicator.textContent = 'SALDIRI';
      this.modeIndicator.className = 'shadow-mode attack';
    } else {
      this.modeIndicator.textContent = 'SAVUNMA';
      this.modeIndicator.className = 'shadow-mode defense';
    }
  }

  public updateSoulSlots(slots: readonly SoulSlot[]): void {
    const rankColors: Record<string, string> = {
      soldier: '#aaa', knight: '#4ade80', elite: '#60a5fa', commander: '#f59e0b',
    };

    for (let i = 0; i < 4; i++) {
      const slot = slots[i];
      const el = this.slotElements[i];
      const nameEl = document.getElementById(`soul-name-${i}`)!;
      const countEl = document.getElementById(`soul-count-${i}`)!;
      const hpEl = document.getElementById(`soul-hp-${i}`)!;
      const rankEl = document.getElementById(`soul-rank-${i}`)!;
      const bossEl = document.getElementById(`soul-boss-${i}`)!;

      if (slot && slot.count > 0 && slot.enemyDefId) {
        el.classList.add('filled');
        nameEl.textContent = slot.enemyDefId;
        countEl.textContent = `x${slot.count}`;

        // HP gostergesi: tum golgeler full ise yesil, iyilesiyorsa sari
        const allFull = slot.hpPercents.every(hp => hp >= 1);
        hpEl.className = 'soul-slot-hp' + (allFull ? ' full' : ' healing');

        // Rank indicator — only meaningful for boss shadows
        if (slot.profiles.length > 0) {
          const topProfile = slot.profiles[0];
          if (topProfile.isBoss) {
            const topRank = topProfile.rank;
            const letter = topRank[0].toUpperCase();
            rankEl.textContent = letter;
            rankEl.style.color = rankColors[topRank] ?? '#aaa';
            bossEl.textContent = '\u2605'; // star icon for boss
          } else {
            rankEl.textContent = '';
            bossEl.textContent = '';
          }
        } else {
          rankEl.textContent = '';
          bossEl.textContent = '';
        }
      } else {
        el.classList.remove('filled');
        nameEl.textContent = '';
        countEl.textContent = '';
        hpEl.className = 'soul-slot-hp';
        rankEl.textContent = '';
        bossEl.textContent = '';
      }
    }
  }

  public setOnSlotClick(cb: (slotIndex: number) => void): void {
    this.onSlotClick = cb;
  }

  public dispose(): void {
    this.container.remove();
  }
}
