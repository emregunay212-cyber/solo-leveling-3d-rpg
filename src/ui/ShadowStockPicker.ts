import type { SoulSlot } from '../shadows/ShadowArmy';
import { SHADOW_ENHANCEMENT } from '../config/GameConfig';

/**
 * Stok golge secici popup.
 * Alt+1/2/3/4 ile slot'ta birden fazla golge varsa acilir.
 * Oyuncu hangi golgeyi cagirmak istedigini secer.
 */
export class ShadowStockPicker {
  private container: HTMLDivElement;
  private visible = false;
  private currentOnSelect: ((profileIndex: number) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'shadow-stock-picker';
    this.container.innerHTML = `
      <style>
        #shadow-stock-picker {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 50;
          display: none;
          pointer-events: auto;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
        }
        .ssp-panel {
          background: linear-gradient(135deg, rgba(10,5,20,0.95) 0%, rgba(20,8,40,0.95) 100%);
          border: 1px solid rgba(120,60,200,0.4);
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 300px;
          max-width: 360px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 30px rgba(120,60,200,0.2);
        }
        .ssp-header {
          font-size: 13px;
          font-weight: 700;
          color: #c084fc;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(120,60,200,0.25);
        }
        .ssp-entry {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          margin-bottom: 6px;
          background: rgba(30,12,55,0.7);
          border: 1px solid rgba(100,40,160,0.2);
          border-radius: 5px;
          transition: border-color 0.2s;
        }
        .ssp-entry:hover {
          border-color: rgba(192,132,252,0.5);
        }
        .ssp-entry-info {
          flex: 1;
        }
        .ssp-entry-name {
          font-size: 13px;
          font-weight: 700;
          color: #e0d4fc;
          margin-bottom: 2px;
        }
        .ssp-entry-rank {
          font-size: 10px;
          font-weight: 600;
          margin-left: 6px;
        }
        .ssp-entry-details {
          font-size: 10px;
          color: rgba(192,132,252,0.7);
        }
        .ssp-entry-hp {
          font-size: 10px;
          color: #4ade80;
          margin-right: 10px;
        }
        .ssp-entry-hp.low { color: #facc15; }
        .ssp-entry-hp.critical { color: #ff6b6b; }
        .ssp-summon-btn {
          background: linear-gradient(180deg, rgba(120,60,200,0.5) 0%, rgba(80,30,160,0.5) 100%);
          border: 1px solid rgba(192,132,252,0.4);
          border-radius: 4px;
          color: #c084fc;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: background 0.2s, border-color 0.2s;
        }
        .ssp-summon-btn:hover {
          background: linear-gradient(180deg, rgba(160,80,240,0.6) 0%, rgba(120,50,200,0.6) 100%);
          border-color: rgba(192,132,252,0.7);
        }
        .ssp-close-btn {
          display: block;
          width: 100%;
          margin-top: 6px;
          background: rgba(40,20,60,0.6);
          border: 1px solid rgba(100,40,160,0.3);
          border-radius: 4px;
          color: rgba(192,132,252,0.6);
          font-size: 11px;
          font-weight: 600;
          padding: 5px 0;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .ssp-close-btn:hover {
          color: #c084fc;
        }
      </style>
      <div class="ssp-panel">
        <div class="ssp-header" id="ssp-header"></div>
        <div id="ssp-entries"></div>
        <button class="ssp-close-btn" id="ssp-close">Kapat</button>
      </div>
    `;
    document.body.appendChild(this.container);

    const closeBtn = this.container.querySelector('#ssp-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());
  }

  public open(
    slot: SoulSlot,
    slotIndex: number,
    onSelect: (profileIndex: number) => void,
  ): void {
    this.currentOnSelect = onSelect;

    const rankColors: Record<string, string> = {
      soldier: '#aaa', knight: '#4ade80', elite: '#60a5fa', commander: '#f59e0b',
    };
    const rankNames: Record<string, string> = {
      soldier: 'Asker', knight: 'Sovalye', elite: 'Elit', commander: 'Komutan',
    };

    const headerEl = this.container.querySelector('#ssp-header') as HTMLDivElement;
    headerEl.textContent = `Slot ${slotIndex + 1} \u2014 ${slot.enemyDefId ?? '?'}  (${slot.count} golge)`;

    const entriesEl = this.container.querySelector('#ssp-entries') as HTMLDivElement;
    entriesEl.innerHTML = '';

    for (let i = 0; i < slot.profiles.length; i++) {
      const profile = slot.profiles[i];
      const hpPct = slot.hpPercents[i] ?? 1;
      const hpPercent = Math.round(hpPct * 100);

      const entry = document.createElement('div');
      entry.className = 'ssp-entry';

      // Rank bilgisi
      const rank = profile.rank;
      const rankColor = rankColors[rank] ?? '#aaa';
      const rankName = rankNames[rank] ?? rank;

      // Kill bilgisi
      const kills = profile.kills;

      // Boss gostergesi
      const bossPrefix = profile.isBoss ? '\u2605 ' : '';

      // HP rengi
      let hpClass = '';
      if (hpPct < 0.25) hpClass = ' critical';
      else if (hpPct < 0.6) hpClass = ' low';

      // Rank bilgisi — sadece SHADOW_ENHANCEMENT ranks arrayinden uygun olan
      const rankDef = SHADOW_ENHANCEMENT.ranks.find(r => r.rank === rank);
      const rankDisplayName = rankDef?.name ?? rankName;

      entry.innerHTML = `
        <div class="ssp-entry-info">
          <div class="ssp-entry-name">
            ${bossPrefix}${profile.nickname}
            <span class="ssp-entry-rank" style="color:${rankColor}">${rankDisplayName}</span>
          </div>
          <div class="ssp-entry-details">${kills} kill</div>
        </div>
        <span class="ssp-entry-hp${hpClass}">HP: %${hpPercent}</span>
        <button class="ssp-summon-btn" data-idx="${i}">Cagir</button>
      `;
      entriesEl.appendChild(entry);

      const btn = entry.querySelector('.ssp-summon-btn') as HTMLButtonElement;
      const profileIndex = i;
      btn.addEventListener('click', () => {
        if (this.currentOnSelect) {
          this.currentOnSelect(profileIndex);
        }
        this.close();
      });
    }

    this.container.style.display = 'block';
    this.visible = true;
  }

  public close(): void {
    this.container.style.display = 'none';
    this.visible = false;
    this.currentOnSelect = null;
  }

  public isOpen(): boolean {
    return this.visible;
  }

  public dispose(): void {
    this.container.remove();
  }
}
