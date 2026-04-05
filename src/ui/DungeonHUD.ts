/**
 * Dungeon HUD Overlay
 * Dungeon icinde rank etiketi, kalan canavar sayisi ve boss HP gosterir.
 */

import { DUNGEON_RANK_DEFS } from '../dungeon/DungeonDefs';
import type { DungeonRank } from '../dungeon/types';

export class DungeonHUD {
  private container: HTMLDivElement;
  private bossWarningTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'dungeon-hud';
    this.container.innerHTML = this.buildShell();
    document.body.appendChild(this.container);
  }

  // ─── PUBLIC API ───

  public setRank(rank: DungeonRank): void {
    const def = DUNGEON_RANK_DEFS[rank];
    const label = this.container.querySelector('#dhud-rank') as HTMLDivElement;
    label.textContent = `${def.name.replace('Gate', 'DUNGEON')}`;
    label.style.color = def.color;
  }

  public setRemainingEnemies(count: number): void {
    const el = this.container.querySelector('#dhud-remaining') as HTMLDivElement;
    el.textContent = `Kalan Canavar: ${count}`;
  }

  public showBossBar(name: string, hp: number, maxHp: number): void {
    const wrapper = this.container.querySelector('#dhud-boss') as HTMLDivElement;
    wrapper.style.display = 'block';
    const nameEl = this.container.querySelector('#dhud-boss-name') as HTMLDivElement;
    nameEl.textContent = name;
    this.updateBossHp(hp, maxHp);
  }

  public updateBossHp(hp: number, maxHp: number): void {
    const fill = this.container.querySelector('#dhud-boss-fill') as HTMLDivElement;
    const pct = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    fill.style.width = `${pct * 100}%`;

    const hpText = this.container.querySelector('#dhud-boss-hp') as HTMLSpanElement;
    hpText.textContent = `${Math.ceil(hp)} / ${Math.ceil(maxHp)}`;
  }

  public hideBossBar(): void {
    const wrapper = this.container.querySelector('#dhud-boss') as HTMLDivElement;
    wrapper.style.display = 'none';
  }

  public showBossWarning(): void {
    const warning = this.container.querySelector('#dhud-warning') as HTMLDivElement;
    warning.style.display = 'block';
    if (this.bossWarningTimer !== null) {
      clearTimeout(this.bossWarningTimer);
    }
    this.bossWarningTimer = setTimeout(() => {
      warning.style.display = 'none';
      this.bossWarningTimer = null;
    }, 3000);
  }

  public dispose(): void {
    if (this.bossWarningTimer !== null) {
      clearTimeout(this.bossWarningTimer);
    }
    this.container.remove();
  }

  // ─── SHELL / STYLE ───

  private buildShell(): string {
    return `
    <style>
      #dungeon-hud {
        position:absolute; top:0; left:0; width:100%; pointer-events:none;
        font-family:'Rajdhani','Segoe UI',sans-serif; z-index:30;
      }
      #dhud-rank {
        text-align:center; font-size:18px; font-weight:700;
        letter-spacing:3px; padding:8px 0 2px;
        text-shadow:0 0 8px rgba(0,0,0,0.6);
      }
      #dhud-remaining {
        text-align:center; font-size:13px; font-weight:600;
        color:rgba(224,212,252,0.7); padding:0 0 6px;
      }
      #dhud-boss {
        display:none; width:60%; max-width:500px; margin:0 auto;
        padding:0 0 4px;
      }
      #dhud-boss-name {
        text-align:center; font-size:14px; font-weight:700;
        color:#ef4444; letter-spacing:1px; margin-bottom:2px;
        text-shadow:0 0 6px rgba(239,68,68,0.4);
      }
      .dhud-boss-bar {
        width:100%; height:10px; background:rgba(20,8,40,0.8);
        border:1px solid rgba(239,68,68,0.3); border-radius:3px;
        overflow:hidden; position:relative;
      }
      #dhud-boss-fill {
        height:100%; width:100%;
        background:linear-gradient(90deg,#dc2626,#ef4444);
        border-radius:2px; transition:width 0.2s;
      }
      #dhud-boss-hp {
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        font-size:9px; font-weight:700; color:#fff;
        text-shadow:0 0 3px rgba(0,0,0,0.8);
      }
      #dhud-warning {
        display:none; position:fixed; top:30%; left:50%;
        transform:translateX(-50%);
        font-size:36px; font-weight:900; color:#ef4444;
        letter-spacing:6px; text-shadow:0 0 20px rgba(239,68,68,0.6);
        animation:dhud-flash 0.5s ease-in-out infinite alternate;
      }
      @keyframes dhud-flash {
        from { opacity:1; transform:translateX(-50%) scale(1); }
        to { opacity:0.6; transform:translateX(-50%) scale(1.05); }
      }
    </style>
    <div id="dhud-rank"></div>
    <div id="dhud-remaining"></div>
    <div id="dhud-boss">
      <div id="dhud-boss-name"></div>
      <div class="dhud-boss-bar">
        <div id="dhud-boss-fill"></div>
        <span id="dhud-boss-hp"></span>
      </div>
    </div>
    <div id="dhud-warning">BOSS GELIYOR!</div>`;
  }
}
