/**
 * Gate Secim Paneli
 * Oyuncu portala yaklastiginda acilir.
 * 6 dungeon rankini (E-S) listeler, cooldown ve giris kontrolu yapar.
 */

import { DUNGEON_RANK_DEFS } from '../dungeon/DungeonDefs';
import { DUNGEON, PLAYER_RANK } from '../config/GameConfig';
import type { DungeonCooldownTracker } from '../dungeon/DungeonCooldownTracker';
import type { DungeonRank, PlayerRank } from '../dungeon/types';

const ALL_RANKS: readonly DungeonRank[] = DUNGEON.ranks;

export class DungeonSelectUI {
  private container: HTMLDivElement;
  private visible = false;
  private onEnter: (rank: DungeonRank) => void;
  private cooldownTracker: DungeonCooldownTracker;
  private getPlayerRank: () => PlayerRank;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    onEnter: (rank: DungeonRank) => void,
    cooldownTracker: DungeonCooldownTracker,
    getPlayerRank: () => PlayerRank,
  ) {
    this.onEnter = onEnter;
    this.cooldownTracker = cooldownTracker;
    this.getPlayerRank = getPlayerRank;

    this.container = document.createElement('div');
    this.container.id = 'dungeon-select-ui';
    this.container.innerHTML = this.buildShell();
    document.body.appendChild(this.container);
    this.bindEvents();
  }

  // ─── PUBLIC API ───

  public open(): void {
    if (this.visible) return;
    this.visible = true;
    this.refresh();
    this.container.classList.add('show');
    // Cooldown'lari her saniye guncelle
    this.refreshTimer = setInterval(() => {
      if (this.visible) this.renderList();
    }, 1000);
  }

  public close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.classList.remove('show');
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public isOpen(): boolean {
    return this.visible;
  }

  public refresh(): void {
    this.renderList();
  }

  public dispose(): void {
    this.close();
    this.container.remove();
  }

  // ─── SHELL / STYLE ───

  private buildShell(): string {
    return `
    <style>
      #dungeon-select-ui {
        position:absolute; top:0; left:0; width:100%; height:100%;
        display:none; z-index:55; pointer-events:none;
        font-family:'Rajdhani','Segoe UI',sans-serif;
      }
      #dungeon-select-ui.show { display:flex; pointer-events:all; }
      .dsu-overlay { position:absolute; top:0;left:0;width:100%;height:100%;
        background:rgba(0,0,0,0.65); }
      .dsu-modal {
        position:relative; margin:auto; width:460px; max-height:80vh;
        background:linear-gradient(135deg,rgba(10,5,20,0.96),rgba(15,5,30,0.96));
        border:1px solid rgba(120,60,200,0.35); border-radius:8px;
        display:flex; flex-direction:column; overflow:hidden; z-index:1;
      }
      .dsu-header {
        display:flex; justify-content:space-between; align-items:center;
        padding:12px 16px; border-bottom:1px solid rgba(120,60,200,0.25);
      }
      .dsu-title { color:#c084fc; font-size:16px; font-weight:700; letter-spacing:2px; }
      .dsu-rank-badge {
        font-size:11px; font-weight:700; padding:2px 8px; border-radius:3px;
        background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.3);
      }
      .dsu-close { color:rgba(255,255,255,0.4); font-size:22px; cursor:pointer; }
      .dsu-close:hover { color:#fff; }
      .dsu-body { flex:1; overflow-y:auto; padding:8px 12px; }
      .dsu-row {
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 10px; margin-bottom:4px; border-radius:4px;
        background:rgba(20,8,40,0.6); border:1px solid rgba(100,40,160,0.15);
        transition:background 0.15s;
      }
      .dsu-row:hover { background:rgba(30,12,55,0.8); }
      .dsu-row-left { display:flex; flex-direction:column; gap:2px; }
      .dsu-row-name { font-size:13px; font-weight:700; }
      .dsu-row-info { font-size:10px; color:rgba(255,255,255,0.4); }
      .dsu-row-right { display:flex; align-items:center; gap:8px; }
      .dsu-cooldown { font-size:10px; color:rgba(255,255,255,0.5); font-weight:600; }
      .dsu-cooldown.ready { color:#4ade80; }
      .dsu-btn {
        padding:4px 12px; font-size:11px; font-weight:700;
        border:1px solid rgba(168,85,247,0.4); border-radius:3px;
        background:rgba(168,85,247,0.15); color:#c084fc; cursor:pointer;
        transition:background 0.15s;
      }
      .dsu-btn:hover { background:rgba(168,85,247,0.3); }
      .dsu-btn.disabled { opacity:0.3; pointer-events:none; }
      .dsu-locked { font-size:10px; color:#ef4444; font-weight:700; letter-spacing:1px; }
    </style>
    <div class="dsu-overlay" id="dsu-overlay"></div>
    <div class="dsu-modal">
      <div class="dsu-header">
        <span class="dsu-title">GATE SECIMI</span>
        <span class="dsu-rank-badge" id="dsu-player-rank"></span>
        <span class="dsu-close" id="dsu-close">&times;</span>
      </div>
      <div class="dsu-body" id="dsu-body"></div>
    </div>`;
  }

  // ─── EVENT BINDING ───

  private bindEvents(): void {
    this.container.querySelector('#dsu-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#dsu-overlay')!.addEventListener('click', () => this.close());
  }

  // ─── RENDER ───

  private renderList(): void {
    const body = this.container.querySelector('#dsu-body') as HTMLDivElement;
    const playerRank = this.getPlayerRank();
    const playerRankIdx = PLAYER_RANK.ranks.indexOf(
      playerRank as typeof PLAYER_RANK.ranks[number],
    );

    // Player rank badge
    const badge = this.container.querySelector('#dsu-player-rank') as HTMLSpanElement;
    const badgeColor = playerRank === 'none' ? '#888' : (DUNGEON_RANK_DEFS[playerRank as DungeonRank]?.color ?? '#888');
    badge.textContent = `Rank: ${playerRank === 'none' ? 'Yok' : playerRank}`;
    badge.style.color = badgeColor;

    let html = '';
    for (const rank of ALL_RANKS) {
      const def = DUNGEON_RANK_DEFS[rank];
      const dungeonRankIdx = PLAYER_RANK.ranks.indexOf(
        rank as typeof PLAYER_RANK.ranks[number],
      );
      const rankDiff = dungeonRankIdx - playerRankIdx;
      const isLocked = rankDiff > DUNGEON.maxRankAbove;
      const isAvailable = this.cooldownTracker.isAvailable(rank);
      const cooldownText = isAvailable ? 'Hazir' : this.cooldownTracker.getRemainingFormatted(rank);
      const recLevel = DUNGEON.recommendedLevel[rank];

      const canEnter = !isLocked && isAvailable;

      html += `<div class="dsu-row">
        <div class="dsu-row-left">
          <span class="dsu-row-name" style="color:${def.color}">${def.name}</span>
          <span class="dsu-row-info">Onerilen Seviye: ${recLevel}</span>
        </div>
        <div class="dsu-row-right">`;

      if (isLocked) {
        html += `<span class="dsu-locked">KILITLI</span>`;
      } else {
        const readyClass = isAvailable ? ' ready' : '';
        html += `<span class="dsu-cooldown${readyClass}">${cooldownText}</span>`;
        html += `<span class="dsu-btn${canEnter ? '' : ' disabled'}" data-rank="${rank}">Gir</span>`;
      }

      html += `</div></div>`;
    }

    body.innerHTML = html;

    // Enter button events
    body.querySelectorAll('[data-rank]').forEach(el => {
      el.addEventListener('click', () => {
        const rank = (el as HTMLElement).dataset['rank'] as DungeonRank;
        this.close();
        this.onEnter(rank);
      });
    });
  }
}
