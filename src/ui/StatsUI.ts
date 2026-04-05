import type { LevelSystem } from '../progression/LevelSystem';

/**
 * Character stats panel - press P to open/close
 * Shows STR/VIT/AGI/INT with + buttons to distribute stat points
 */
export class StatsUI {
  private container: HTMLDivElement;
  private levelSystem: LevelSystem;
  private visible = false;
  private onStatChanged: (() => void) | null = null;

  constructor(levelSystem: LevelSystem) {
    this.levelSystem = levelSystem;

    this.container = document.createElement('div');
    this.container.id = 'stats-panel';
    this.container.innerHTML = `
      <style>
        #stats-panel {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 320px;
          background: rgba(10, 10, 25, 0.92);
          border: 1px solid rgba(120, 80, 200, 0.4);
          border-radius: 8px;
          padding: 20px;
          display: none;
          z-index: 40;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: white;
          pointer-events: all;
        }
        #stats-panel.show { display: block; }
        .stats-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          color: #c0a0ff;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(120, 80, 200, 0.3);
          padding-bottom: 10px;
        }
        .stats-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 13px;
          color: rgba(255,255,255,0.7);
        }
        .stats-points {
          text-align: center;
          color: #FFD700;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stat-name {
          font-size: 14px;
          font-weight: bold;
          width: 120px;
        }
        .stat-name .hint {
          font-size: 10px;
          font-weight: normal;
          color: rgba(255,255,255,0.4);
        }
        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #c0e0ff;
          width: 40px;
          text-align: center;
        }
        .stat-btn {
          width: 28px;
          height: 28px;
          border: 1px solid rgba(255,215,0,0.4);
          background: rgba(255,215,0,0.1);
          color: #FFD700;
          font-size: 18px;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
          pointer-events: all;
          transition: all 0.15s;
        }
        .stat-btn:hover {
          background: rgba(255,215,0,0.3);
          border-color: #FFD700;
        }
        .stat-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }
        .stats-derived {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid rgba(120, 80, 200, 0.3);
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          line-height: 1.8;
        }
        .stats-close {
          position: absolute;
          top: 8px; right: 12px;
          font-size: 20px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          pointer-events: all;
        }
        .stats-close:hover { color: white; }
      </style>
      <span class="stats-close" id="stats-close">&times;</span>
      <div class="stats-title">Karakter Statlari</div>
      <div class="stats-info">
        <span id="stats-level">Seviye: 1</span>
        <span id="stats-xp">XP: 0 / 100</span>
      </div>
      <div class="stats-points" id="stats-points">Dagitilacak Puan: 0</div>
      <div class="stat-row">
        <div class="stat-name">Guc <div class="hint">Saldiri hasari</div></div>
        <div class="stat-value" id="stat-str">5</div>
        <button class="stat-btn" id="btn-str">+</button>
      </div>
      <div class="stat-row">
        <div class="stat-name">Dayaniklilik <div class="hint">Maksimum can</div></div>
        <div class="stat-value" id="stat-vit">5</div>
        <button class="stat-btn" id="btn-vit">+</button>
      </div>
      <div class="stat-row">
        <div class="stat-name">Ceviklik <div class="hint">Kritik sans, hiz</div></div>
        <div class="stat-value" id="stat-agi">5</div>
        <button class="stat-btn" id="btn-agi">+</button>
      </div>
      <div class="stat-row">
        <div class="stat-name">Zeka <div class="hint">MP, skill gucu</div></div>
        <div class="stat-value" id="stat-int">5</div>
        <button class="stat-btn" id="btn-int">+</button>
      </div>
      <div class="stats-derived" id="stats-derived"></div>
    `;
    document.body.appendChild(this.container);

    // Button handlers
    const stats: ('str' | 'vit' | 'agi' | 'int')[] = ['str', 'vit', 'agi', 'int'];
    for (const stat of stats) {
      (this.container.querySelector(`#btn-${stat}`) as HTMLButtonElement).addEventListener('click', () => {
        this.levelSystem.distributeStatPoint(stat);
        this.refresh();
        if (this.onStatChanged) this.onStatChanged();
      });
    }

    (this.container.querySelector('#stats-close') as HTMLButtonElement).addEventListener('click', () => this.toggle());

    // P key to toggle
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') this.toggle();
    });
  }

  public toggle(): void {
    this.visible = !this.visible;
    if (this.visible) {
      this.refresh();
      this.container.classList.add('show');
    } else {
      this.container.classList.remove('show');
    }
  }

  public refresh(): void {
    const ls = this.levelSystem;
    (this.container.querySelector('#stats-level') as HTMLSpanElement).textContent = `Seviye: ${ls.level}`;
    (this.container.querySelector('#stats-xp') as HTMLSpanElement).textContent = `XP: ${ls.xp} / ${ls.xpToNext}`;
    (this.container.querySelector('#stats-points') as HTMLSpanElement).textContent = `Dagitilacak Puan: ${ls.statPoints}`;

    const cap = ls.STAT_CAP;
    (this.container.querySelector('#stat-str') as HTMLDivElement).textContent = `${ls.str}/${cap}`;
    (this.container.querySelector('#stat-vit') as HTMLDivElement).textContent = `${ls.vit}/${cap}`;
    (this.container.querySelector('#stat-agi') as HTMLDivElement).textContent = `${ls.agi}/${cap}`;
    (this.container.querySelector('#stat-int') as HTMLDivElement).textContent = `${ls.int}/${cap}`;

    const hasPoints = ls.statPoints > 0;
    (this.container.querySelector('#btn-str') as HTMLButtonElement).disabled = !hasPoints || ls.str >= cap;
    (this.container.querySelector('#btn-vit') as HTMLButtonElement).disabled = !hasPoints || ls.vit >= cap;
    (this.container.querySelector('#btn-agi') as HTMLButtonElement).disabled = !hasPoints || ls.agi >= cap;
    (this.container.querySelector('#btn-int') as HTMLButtonElement).disabled = !hasPoints || ls.int >= cap;

    (this.container.querySelector('#stats-derived') as HTMLDivElement).innerHTML = `
      Saldiri: ${ls.getAttackDamage()} | Maks HP: ${ls.getMaxHp()} | Maks MP: ${ls.getMaxMp()}<br>
      Kritik Sans: %${(ls.getCritChance() * 100).toFixed(1)} | Saldiri Hizi: x${ls.getAttackSpeed().toFixed(1)} | Hiz: ${ls.getMoveSpeed().toFixed(1)}<br>
      Savunma: ${ls.getDefense().toFixed(0)} | Pasif Azaltma: %${(ls.getDamageReduction() * 100).toFixed(1)}<br>
      Parry Sans: %${(ls.getParryChance() * 100).toFixed(1)} | Blok Azaltma: %${(ls.getBlockReduction() * 100).toFixed(0)}
    `;
  }

  public setOnStatChanged(cb: () => void): void { this.onStatChanged = cb; }

  public isVisible(): boolean { return this.visible; }

  public dispose(): void {
    this.container.remove();
  }
}
