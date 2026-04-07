/**
 * Golge Yonetim Paneli
 * Golge listesi, detay ve oyuncu yetenek kitaplari.
 * Ekipman, craft ve dukkan panelleri kaldirildi.
 * Tab key veya soul slot tiklama ile acilir.
 */

import type { ShadowProfileManager } from '../shadows/ShadowProfileManager';
import type { ShadowInventory } from '../systems/ShadowInventory';
import type { ShadowProfile } from '../shadows/ShadowEnhancementTypes';
import type { PlayerStats } from '../shadows/ShadowEnhancementTypes';
import type { EnemyDef } from '../enemies/Enemy';
import { PLAYER_SKILL_BOOK_DEFS, ENEMY_SKILL_DEFS, BOOK_TO_SKILL_MAP, SKILL_KEY_LABELS } from '../data/shadowSkillBooks';
import { SHADOW_ENHANCEMENT } from '../config/GameConfig';
import { calculateShadowStats, calculateShadowStatsBreakdown } from '../shadows/ShadowStatCalculator';
import type { StatBreakdown } from '../shadows/ShadowStatCalculator';
import type { PlayerRankSystem } from '../progression/PlayerRankSystem';

type TabId = 'detail' | 'shop' | 'books' | 'skills';

type SlotKey = 'Q' | 'E' | 'R' | 'F';

const SKILL_RANK_COLORS: Readonly<Record<string, string>> = {
  none: '#888',
  E: '#4ade80',
  D: '#60a5fa',
  C: '#a855f7',
  B: '#f59e0b',
  A: '#ef4444',
  S: '#ec4899',
};

const RANK_COLORS: Record<string, string> = {
  soldier: '#aaa', knight: '#4ade80', elite: '#60a5fa', commander: '#f59e0b',
};

export class ShadowManageUI {
  private container: HTMLDivElement;
  private visible = false;
  private activeTab: TabId = 'detail';
  private selectedUid: number | null = null;
  private playerStats: PlayerStats = {
    str: 5, vit: 5, agi: 5, int: 5,
    maxHp: 120, maxMp: 55, attackDamage: 20, critChance: 0.075,
    attackSpeed: 1.1, moveSpeed: 5.25, defense: 9,
  };

  private profileManager: ShadowProfileManager;
  private inventory: ShadowInventory;
  private getEnemyDef: (name: string) => EnemyDef | null;
  private onUseBookCb: ((bookId: string) => boolean) | null = null;
  private playerRankSystem: PlayerRankSystem | null = null;
  private inDungeon = false;
  private pendingSkillId: string | null = null;

  constructor(
    profileManager: ShadowProfileManager,
    inventory: ShadowInventory,
    getEnemyDef: (name: string) => EnemyDef | null,
  ) {
    this.profileManager = profileManager;
    this.inventory = inventory;
    this.getEnemyDef = getEnemyDef;

    this.container = document.createElement('div');
    this.container.id = 'shadow-manage-ui';
    this.container.innerHTML = this.buildShell();
    document.body.appendChild(this.container);
    this.bindEvents();
  }

  // ─── PUBLIC API ───

  public open(): void {
    this.visible = true;
    this.refresh();
    this.container.classList.add('show');
  }

  public close(): void {
    this.visible = false;
    this.container.classList.remove('show');
  }

  public isOpen(): boolean { return this.visible; }

  public toggle(): void {
    if (this.visible) this.close(); else this.open();
  }

  public selectShadow(uid: number): void {
    this.selectedUid = uid;
    if (this.visible) this.refresh();
  }

  public setPlayerStats(stats: PlayerStats): void {
    this.playerStats = stats;
  }

  /** Kitap kullanma callback'i — TestScene tarafindan baglanir */
  public setOnUseBook(cb: (bookId: string) => boolean): void {
    this.onUseBookCb = cb;
  }

  /** PlayerRankSystem referansini bagla — skills tab icin gerekli */
  public setPlayerRankSystem(prs: PlayerRankSystem): void {
    this.playerRankSystem = prs;
  }

  /** Dungeon icinde olup olmadigini ayarla — skills tab'i kilitler */
  public setInDungeon(value: boolean): void {
    this.inDungeon = value;
  }

  public refresh(): void {
    this.renderShadowList();
    this.renderRightPanel();
    this.renderGold();
  }

  public dispose(): void { this.container.remove(); }

  // ─── SHELL / STYLE ───

  private buildShell(): string {
    return `
    <style>
      #shadow-manage-ui {
        position: absolute; top:0; left:0; width:100%; height:100%;
        display:none; z-index:50; pointer-events:none;
        font-family:'Rajdhani','Segoe UI',sans-serif;
      }
      #shadow-manage-ui.show { display:flex; pointer-events:all; }
      .smu-overlay { position:absolute; top:0;left:0;width:100%;height:100%; background:rgba(0,0,0,0.6); }
      .smu-modal {
        position:relative; margin:auto; width:820px; max-height:85vh;
        background:linear-gradient(135deg,rgba(10,5,20,0.95),rgba(15,5,30,0.95));
        border:1px solid rgba(120,60,200,0.3); border-radius:8px;
        display:flex; flex-direction:column; overflow:hidden; z-index:1;
      }
      .smu-header {
        display:flex; justify-content:space-between; align-items:center;
        padding:10px 16px; border-bottom:1px solid rgba(120,60,200,0.2);
      }
      .smu-title { color:#c084fc; font-size:16px; font-weight:700; letter-spacing:2px; }
      .smu-gold { color:#f59e0b; font-size:13px; font-weight:700; }
      .smu-close { color:rgba(255,255,255,0.4); font-size:22px; cursor:pointer; }
      .smu-close:hover { color:#fff; }
      .smu-body { display:flex; flex:1; overflow:hidden; min-height:400px; }
      .smu-left {
        width:220px; border-right:1px solid rgba(120,60,200,0.15);
        overflow-y:auto; padding:8px;
      }
      .smu-right { flex:1; overflow-y:auto; padding:12px; }
      .smu-tabs {
        display:flex; border-top:1px solid rgba(120,60,200,0.2);
      }
      .smu-tab {
        flex:1; text-align:center; padding:8px 0; cursor:pointer;
        color:rgba(224,212,252,0.5); font-size:11px; font-weight:700;
        letter-spacing:1px; transition:color 0.15s,background 0.15s;
      }
      .smu-tab:hover { color:#c084fc; background:rgba(120,60,200,0.08); }
      .smu-tab.active { color:#c084fc; background:rgba(120,60,200,0.15);
        border-top:2px solid #a855f7; }
      .smu-shadow-item {
        padding:6px 8px; cursor:pointer; border-radius:4px; margin-bottom:2px;
        color:#e0d4fc; font-size:11px; transition:background 0.1s;
      }
      .smu-shadow-item:hover { background:rgba(120,60,200,0.12); }
      .smu-shadow-item.sel { background:rgba(168,85,247,0.2); border-left:2px solid #a855f7; }
      .smu-shadow-rank { font-size:9px; font-weight:700; margin-right:4px; }
      .smu-shadow-boss { font-size:8px; color:#f59e0b; margin-right:3px; }
      .smu-group-label { color:rgba(192,132,252,0.4); font-size:9px; font-weight:700;
        letter-spacing:1.5px; margin:8px 0 4px; text-transform:uppercase; }
      .smu-section { margin-bottom:12px; }
      .smu-section-title { color:rgba(192,132,252,0.6); font-size:10px; font-weight:700;
        letter-spacing:1.5px; margin-bottom:4px; text-transform:uppercase; }
      .smu-stat-row { display:flex; justify-content:space-between; color:#e0d4fc;
        font-size:12px; padding:2px 0; }
      .smu-stat-val { color:#c084fc; font-weight:700; }
      .smu-grid { display:flex; flex-wrap:wrap; gap:6px; }
      .smu-card {
        width:180px; padding:8px; background:rgba(20,8,40,0.8);
        border:1px solid rgba(100,40,160,0.2); border-radius:4px;
      }
      .smu-card-name { color:#e0d4fc; font-size:12px; font-weight:600; }
      .smu-card-desc { color:rgba(255,255,255,0.4); font-size:10px; margin:4px 0; }
      .smu-btn {
        display:inline-block; padding:3px 10px; font-size:10px; font-weight:700;
        border:1px solid rgba(168,85,247,0.4); border-radius:3px;
        background:rgba(168,85,247,0.15); color:#c084fc; cursor:pointer;
        transition:background 0.15s;
      }
      .smu-btn:hover { background:rgba(168,85,247,0.3); }
      .smu-btn.disabled { opacity:0.3; pointer-events:none; }
      .smu-empty { color:rgba(255,255,255,0.3); font-size:12px; font-style:italic; padding:16px; }
      .smu-skill-item { display:flex; align-items:center; gap:6px; padding:3px 0; }
      .smu-skill-name { color:#c084fc; font-size:11px; font-weight:600; }
      .smu-nickname { cursor:pointer; transition:color 0.15s; }
      .smu-nickname:hover { color:#c084fc; text-decoration:underline; text-decoration-style:dashed; }
      .smu-nickname-input {
        background:rgba(20,8,40,0.9); border:1px solid rgba(168,85,247,0.5);
        border-radius:3px; color:#e0d4fc; font-size:14px; font-weight:700;
        font-family:'Rajdhani','Segoe UI',sans-serif; padding:2px 6px;
        outline:none; width:160px;
      }
      .smu-nickname-input:focus { border-color:#c084fc; box-shadow:0 0 6px rgba(192,132,252,0.3); }
      .smu-slot-row {
        display:flex; align-items:center; gap:8px; padding:5px 8px;
        background:rgba(20,8,40,0.6); border-radius:4px; margin-bottom:4px;
      }
      .smu-slot-key {
        display:inline-flex; align-items:center; justify-content:center;
        width:28px; height:28px; border-radius:4px; font-size:13px;
        font-weight:700; color:#fff; flex-shrink:0;
      }
      .smu-slot-info { flex:1; color:#e0d4fc; font-size:12px; }
      .smu-slot-empty { color:rgba(255,255,255,0.3); font-style:italic; font-size:11px; }
      .smu-slot-clear {
        width:22px; height:22px; border-radius:3px; border:1px solid rgba(239,68,68,0.3);
        background:rgba(239,68,68,0.1); color:#ef4444; font-size:12px; cursor:pointer;
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
      }
      .smu-slot-clear:hover { background:rgba(239,68,68,0.25); }
      .smu-pool-item {
        display:flex; align-items:center; gap:8px; padding:5px 8px;
        background:rgba(20,8,40,0.5); border-radius:4px; margin-bottom:3px;
        cursor:pointer; transition:background 0.1s;
      }
      .smu-pool-item:hover { background:rgba(120,60,200,0.15); }
      .smu-pool-item.selected { background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.4); }
      .smu-assign-popup {
        display:flex; gap:4px; margin-left:auto;
      }
      .smu-assign-btn {
        padding:2px 8px; font-size:10px; font-weight:700; border-radius:3px;
        border:1px solid rgba(168,85,247,0.4); background:rgba(168,85,247,0.15);
        color:#c084fc; cursor:pointer; transition:background 0.15s;
      }
      .smu-assign-btn:hover { background:rgba(168,85,247,0.35); }
      .smu-assign-btn.disabled { opacity:0.3; pointer-events:none; }
      .smu-dungeon-warn {
        color:#f59e0b; font-size:11px; font-weight:600; text-align:center;
        padding:8px; background:rgba(245,158,11,0.08); border-radius:4px;
        border:1px solid rgba(245,158,11,0.2); margin-bottom:8px;
      }
    </style>
    <div class="smu-overlay" id="smu-overlay"></div>
    <div class="smu-modal">
      <div class="smu-header">
        <span class="smu-title">GOLGE YONETIMI</span>
        <span class="smu-gold" id="smu-gold">0 G</span>
        <span class="smu-close" id="smu-close">&times;</span>
      </div>
      <div class="smu-body">
        <div class="smu-left" id="smu-left"></div>
        <div class="smu-right" id="smu-right"></div>
      </div>
      <div class="smu-tabs">
        <div class="smu-tab active" data-tab="detail">DETAY</div>
        <div class="smu-tab" data-tab="shop">DUKKAN</div>
        <div class="smu-tab" data-tab="books">KITAPLAR</div>
        <div class="smu-tab" data-tab="skills">YETENEKLER</div>
      </div>
    </div>`;
  }

  // ─── EVENT BINDING ───

  private bindEvents(): void {
    this.container.querySelector('#smu-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#smu-overlay')!.addEventListener('click', () => this.close());

    const tabs = this.container.querySelectorAll('.smu-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = (tab as HTMLElement).dataset['tab'] as TabId;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderRightPanel();
      });
    });
  }

  // ─── GOLD ───

  private renderGold(): void {
    const el = this.container.querySelector('#smu-gold') as HTMLSpanElement;
    el.textContent = `${this.inventory.getGold()} G`;
  }

  // ─── LEFT PANEL: SHADOW LIST ───

  private renderShadowList(): void {
    const left = this.container.querySelector('#smu-left') as HTMLDivElement;
    const profiles = this.profileManager.getAllProfiles();

    if (profiles.length === 0) {
      left.innerHTML = '<div class="smu-empty">Henuz golge yok</div>';
      return;
    }

    // Group by enemyDefId
    const groups = new Map<string, ShadowProfile[]>();
    for (const p of profiles) {
      const arr = groups.get(p.enemyDefId) ?? [];
      arr.push(p);
      groups.set(p.enemyDefId, arr);
    }

    let html = '';
    for (const [defId, list] of groups) {
      const enemyDef = this.getEnemyDef(defId);
      const displayName = enemyDef?.name ?? defId;
      html += `<div class="smu-group-label">${displayName} (${list.length})</div>`;
      for (const p of list) {
        const sel = p.uid === this.selectedUid ? ' sel' : '';
        const rc = RANK_COLORS[p.rank] ?? '#aaa';
        const bossIcon = p.isBoss ? '<span class="smu-shadow-boss">&#9733;</span>' : '';
        const rankLabel = p.isBoss ? `<span class="smu-shadow-rank" style="color:${rc}">[${p.rank[0].toUpperCase()}]</span>` : '';
        html += `<div class="smu-shadow-item${sel}" data-uid="${p.uid}">
          ${bossIcon}${rankLabel}${p.nickname}
        </div>`;
      }
    }
    left.innerHTML = html;

    left.querySelectorAll('.smu-shadow-item').forEach(el => {
      el.addEventListener('click', () => {
        const uid = parseInt((el as HTMLElement).dataset['uid'] ?? '0', 10);
        this.selectedUid = uid;
        this.refresh();
      });
    });
  }

  // ─── RIGHT PANEL ROUTER ───

  private renderRightPanel(): void {
    switch (this.activeTab) {
      case 'detail': this.renderDetailTab(); break;
      case 'shop': this.renderShopTab(); break;
      case 'books': this.renderBooksTab(); break;
      case 'skills': this.renderSkillsTab(); break;
    }
  }

  // ─── NICKNAME EDITING ───

  private startNicknameEdit(nameEl: HTMLSpanElement, uid: number): void {
    const currentName = nameEl.textContent ?? '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'smu-nickname-input';
    input.value = currentName;
    input.maxLength = 20;

    const parent = nameEl.parentElement;
    if (!parent) return;
    parent.replaceChild(input, nameEl);
    input.focus();
    input.select();

    let saved = false;

    const saveNickname = (): void => {
      if (saved) return;
      saved = true;
      const trimmed = input.value.trim();
      if (trimmed.length > 0 && trimmed !== currentName) {
        this.profileManager.setNickname(uid, trimmed);
      }
      this.refresh();
    };

    const cancelEdit = (): void => {
      if (saved) return;
      saved = true;
      this.refresh();
    };

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveNickname();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
      e.stopPropagation();
    });

    input.addEventListener('blur', () => {
      saveNickname();
    });
  }

  // ─── DETAIL TAB (shadow detail + intrinsic skills) ───

  private renderDetailTab(): void {
    const right = this.container.querySelector('#smu-right') as HTMLDivElement;
    const profile = this.selectedUid !== null ? this.profileManager.getProfile(this.selectedUid) : null;

    if (!profile) {
      right.innerHTML = '<div class="smu-empty">Bir golge secin</div>';
      return;
    }

    const enemyDef = this.getEnemyDef(profile.enemyDefId);
    const stats = enemyDef ? calculateShadowStats(enemyDef, profile, this.playerStats) : null;
    const breakdown = enemyDef ? calculateShadowStatsBreakdown(enemyDef, profile, this.playerStats) : null;
    const rc = RANK_COLORS[profile.rank] ?? '#aaa';
    const rankName = SHADOW_ENHANCEMENT.ranks.find(r => r.rank === profile.rank)?.name ?? profile.rank;
    const typeLabel = profile.isBoss ? 'BOSS' : 'Normal';
    const typeColor = profile.isBoss ? '#f59e0b' : '#aaa';

    let html = `
    <div class="smu-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="smu-nickname" id="smu-nickname" style="color:#e0d4fc;font-size:14px;font-weight:700" title="Isim degistirmek icin tikla">${profile.nickname}</span>
        <span style="color:${typeColor};font-size:11px;font-weight:700">${typeLabel}</span>
      </div>`;

    if (profile.isBoss) {
      html += `<div class="smu-stat-row"><span>Rutbe</span><span class="smu-stat-val" style="color:${rc}">${rankName}</span></div>`;
    }

    html += `
      <div class="smu-stat-row"><span>Oldurmeler</span><span class="smu-stat-val">${profile.kills}</span></div>
      <div class="smu-stat-row"><span>HP</span><span class="smu-stat-val">${Math.round(profile.hpPercent * 100)}%</span></div>`;

    if (breakdown) {
      const bk = (label: string, bd: StatBreakdown): string => {
        const parts: string[] = [];
        if (bd.base > 0) parts.push(`<span style="color:#aaa">${bd.base}</span>`);
        if (bd.player > 0) parts.push(`<span style="color:#4ade80">+${bd.player}</span>`);
        if (bd.rank > 0) parts.push(`<span style="color:#f59e0b">+${bd.rank}</span>`);
        if (bd.skill > 0) parts.push(`<span style="color:#60a5fa">+${bd.skill}</span>`);
        const detail = parts.length > 1 ? ` (${parts.join(' ')})` : '';
        return `<div class="smu-stat-row"><span>${label}</span><span class="smu-stat-val"><span style="color:#e0d4fc;font-weight:700">${bd.total}</span>${detail}</span></div>`;
      };
      html += bk('Maks HP', breakdown.maxHp);
      html += `<div class="smu-stat-row"><span>Duz Vurus</span><span class="smu-stat-val" style="color:#ff6b6b;font-weight:700">${breakdown.hitDamage}</span></div>`;
      html += bk('Hasar', breakdown.damage);
      html += bk('Savunma', breakdown.defense);
      html += `<div class="smu-stat-row"><span>Saldiri Hizi</span><span class="smu-stat-val">${breakdown.attackCooldown.toFixed(2)}s</span></div>`;
    }
    html += '</div>';

    // Intrinsic skills from enemy definition
    html += '<div class="smu-section"><div class="smu-section-title">ICERIK YETENEKLER</div>';
    if (profile.shadowSkillIds.length === 0) {
      html += '<div class="smu-empty">Yetenek yok</div>';
    } else {
      for (const sid of profile.shadowSkillIds) {
        const sd = ENEMY_SKILL_DEFS[sid];
        html += `<div class="smu-skill-item">
          <span class="smu-skill-name">${sd?.name ?? sid}</span>
          <span style="color:rgba(255,255,255,0.3);font-size:10px">${sd?.description ?? ''}</span>
        </div>`;
      }
    }
    html += '</div>';

    right.innerHTML = html;

    // Nickname editing
    const nicknameEl = right.querySelector('#smu-nickname') as HTMLSpanElement | null;
    if (nicknameEl && this.selectedUid !== null) {
      const uid = this.selectedUid;
      nicknameEl.addEventListener('click', () => {
        this.startNicknameEdit(nicknameEl, uid);
      });
    }
  }

  // ─── SHOP TAB ───

  private renderShopTab(): void {
    const right = this.container.querySelector('#smu-right') as HTMLDivElement;
    const shopItems = this.inventory.getShopItems();

    if (shopItems.length === 0) {
      right.innerHTML = '<div class="smu-empty">Dukkanda urun yok</div>';
      return;
    }

    const gold = this.inventory.getGold();
    let html = '<div class="smu-section"><div class="smu-section-title">OYUNCU YETENEK KITAPLARI</div><div class="smu-grid">';
    for (const item of shopItems) {
      const skillDef = PLAYER_SKILL_BOOK_DEFS[item.id];
      const desc = skillDef?.description ?? '';
      const canBuy = gold >= item.price;
      html += `<div class="smu-card">
        <div class="smu-card-name" style="color:#c084fc">${item.name}</div>
        <div class="smu-card-desc">${desc}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:#f59e0b;font-size:11px;font-weight:700">${item.price} G</span>
          <span class="smu-btn${canBuy ? '' : ' disabled'}" data-buy="${item.id}">Satin Al</span>
        </div>
      </div>`;
    }
    html += '</div></div>';
    right.innerHTML = html;

    right.querySelectorAll('[data-buy]').forEach(el => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset['buy']!;
        this.inventory.buyItem(id);
        this.refresh();
      });
    });
  }

  // ─── BOOKS TAB (player skill books from inventory) ───

  private renderBooksTab(): void {
    const right = this.container.querySelector('#smu-right') as HTMLDivElement;
    const books = this.inventory.getSkillBookItems();

    let html = '<div class="smu-section"><div class="smu-section-title">OYUNCU YETENEK KITAPLARI (Envanter)</div>';

    if (books.length === 0) {
      html += '<div class="smu-empty">Envanterde yetenek kitabi yok</div>';
    } else {
      html += '<div class="smu-grid">';
      for (const book of books) {
        const def = PLAYER_SKILL_BOOK_DEFS[book.id];
        if (!def) continue;
        const skillId = BOOK_TO_SKILL_MAP[book.id];
        const keyLabel = skillId ? (SKILL_KEY_LABELS[skillId] ?? '') : '';
        const canUse = !!skillId && !!this.onUseBookCb;
        const useLabel = keyLabel ? `Kullan (${keyLabel})` : 'Kullan';
        html += `<div class="smu-card">
          <div class="smu-card-name" style="color:#c084fc">${def.name} x${book.count}</div>
          <div class="smu-card-desc">${def.description}</div>
          <div style="display:flex;justify-content:flex-end;margin-top:4px">
            <span class="smu-btn${canUse ? '' : ' disabled'}" data-use-book="${book.id}">${useLabel}</span>
          </div>
        </div>`;
      }
      html += '</div>';
    }
    html += '</div>';
    right.innerHTML = html;

    // Kitap kullanma event'leri
    right.querySelectorAll('[data-use-book]').forEach(el => {
      el.addEventListener('click', () => {
        const bookId = (el as HTMLElement).dataset['useBook']!;
        if (this.onUseBookCb) {
          const success = this.onUseBookCb(bookId);
          if (success) {
            const skillId = BOOK_TO_SKILL_MAP[bookId];
            const keyLabel = skillId ? (SKILL_KEY_LABELS[skillId] ?? '') : '';
            const msg = keyLabel
              ? `${keyLabel} yetenegi guclendirildi! (+15% hasar)`
              : 'Yetenek guclendirildi!';
            this.showNotification(msg);
            this.refresh();
          }
        }
      });
    });
  }

  // ─── SKILLS TAB (player Q/E/R/F skill management) ───

  private renderSkillsTab(): void {
    const right = this.container.querySelector('#smu-right') as HTMLDivElement;

    if (!this.playerRankSystem) {
      right.innerHTML = '<div class="smu-empty">Yetenek sistemi henuz yuklenmedi</div>';
      return;
    }

    const prs = this.playerRankSystem;
    const slotAssignments = prs.getSlotAssignments();
    const skillPool = prs.getSkillPool();
    const playerRank = prs.getRank();
    const totalPower = prs.getTotalPower();
    const slots: SlotKey[] = ['Q', 'E', 'R', 'F'];

    const slotColors: Record<SlotKey, string> = {
      Q: '#4ade80', E: '#60a5fa', R: '#f59e0b', F: '#ec4899',
    };

    let html = '';

    // Dungeon warning
    if (this.inDungeon) {
      html += '<div class="smu-dungeon-warn">Dungeon icinde yetenek degistirilemez</div>';
    }

    // ─── AKTIF YETENEKLER (current slot assignments) ───
    html += '<div class="smu-section"><div class="smu-section-title">AKTIF YETENEKLER</div>';

    for (const slot of slots) {
      const skillId = slotAssignments[slot];
      const skill = skillId ? skillPool.find(s => s.id === skillId) ?? null : null;
      const slotColor = slotColors[slot];

      html += `<div class="smu-slot-row">`;
      html += `<span class="smu-slot-key" style="background:${slotColor}">${slot}</span>`;

      if (skill) {
        const rc = SKILL_RANK_COLORS[skill.rank] ?? '#888';
        html += `<span class="smu-slot-info">
          <span style="font-weight:600">${skill.name}</span>
          <span style="color:${rc};font-size:10px;margin-left:4px">${skill.rank}-Rank</span>
          <span style="color:rgba(255,255,255,0.4);font-size:10px;margin-left:4px">P:${skill.power}</span>
        </span>`;
        if (!this.inDungeon) {
          html += `<span class="smu-slot-clear" data-clear-slot="${slot}" title="Slotu temizle">&times;</span>`;
        }
      } else {
        html += `<span class="smu-slot-empty">— bos —</span>`;
      }

      html += `</div>`;
    }

    // Rank + power summary
    const rankColor = SKILL_RANK_COLORS[playerRank] ?? '#888';
    html += `<div style="display:flex;justify-content:space-between;margin-top:6px;padding:4px 8px;
      background:rgba(20,8,40,0.4);border-radius:4px">
      <span style="color:rgba(255,255,255,0.5);font-size:11px">Oyuncu Rank:
        <span style="color:${rankColor};font-weight:700">${playerRank === 'none' ? '-' : playerRank}</span>
      </span>
      <span style="color:rgba(255,255,255,0.5);font-size:11px">Toplam Guc:
        <span style="color:#c084fc;font-weight:700">${totalPower}</span>
      </span>
    </div>`;
    html += '</div>';

    // ─── YETENEK HAVUZU (all learned skills) ───
    html += '<div class="smu-section"><div class="smu-section-title">YETENEK HAVUZU</div>';

    if (skillPool.length === 0) {
      html += '<div class="smu-empty">Henuz ogrenilmis yetenek yok</div>';
    } else {
      // Build a set of currently assigned skill IDs
      const assignedSlotMap = new Map<string, SlotKey>();
      for (const slot of slots) {
        const sid = slotAssignments[slot];
        if (sid) assignedSlotMap.set(sid, slot);
      }

      for (const skill of skillPool) {
        const rc = SKILL_RANK_COLORS[skill.rank] ?? '#888';
        const assignedTo = assignedSlotMap.get(skill.id);
        const isSelected = this.pendingSkillId === skill.id;

        html += `<div class="smu-pool-item${isSelected ? ' selected' : ''}" data-pool-skill="${skill.id}">`;
        html += `<span style="color:#e0d4fc;font-size:12px;font-weight:600;flex:1">${skill.name}</span>`;
        html += `<span style="color:${rc};font-size:10px;font-weight:700;min-width:50px">${skill.rank}-Rank</span>`;
        html += `<span style="color:rgba(255,255,255,0.4);font-size:10px;min-width:30px">P:${skill.power}</span>`;

        if (assignedTo) {
          const sc = slotColors[assignedTo];
          html += `<span style="color:${sc};font-size:10px;font-weight:700;min-width:20px;text-align:center">[${assignedTo}]</span>`;
        } else if (isSelected && !this.inDungeon) {
          // Show slot assignment buttons
          html += `<div class="smu-assign-popup">`;
          for (const s of slots) {
            html += `<span class="smu-assign-btn" data-assign-slot="${s}" data-assign-skill="${skill.id}">${s}</span>`;
          }
          html += `</div>`;
        } else {
          html += `<span style="min-width:20px;text-align:center;color:rgba(255,255,255,0.2);font-size:10px">[ ]</span>`;
        }

        html += `</div>`;
      }

      if (!this.inDungeon) {
        html += `<div style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:6px;text-align:center">
          Bir yetenege tikla → slot sec
        </div>`;
      }
    }
    html += '</div>';

    right.innerHTML = html;

    // ─── EVENT BINDING ───

    // Clear slot buttons
    right.querySelectorAll('[data-clear-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotKey = (el as HTMLElement).dataset['clearSlot'] as string;
        prs.clearSlot(slotKey);
        this.pendingSkillId = null;
        this.renderSkillsTab();
      });
    });

    // Pool item click — toggle selection
    right.querySelectorAll('[data-pool-skill]').forEach(el => {
      el.addEventListener('click', () => {
        if (this.inDungeon) return;
        const skillId = (el as HTMLElement).dataset['poolSkill'] as string;
        this.pendingSkillId = this.pendingSkillId === skillId ? null : skillId;
        this.renderSkillsTab();
      });
    });

    // Assign buttons
    right.querySelectorAll('[data-assign-slot]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotKey = (el as HTMLElement).dataset['assignSlot'] as string;
        const skillId = (el as HTMLElement).dataset['assignSkill'] as string;
        const success = prs.assignSkillToSlot(slotKey, skillId);
        if (success) {
          const skill = skillPool.find(s => s.id === skillId);
          this.showNotification(`${skill?.name ?? skillId} → ${slotKey} slotuna atandi`);
        }
        this.pendingSkillId = null;
        this.renderSkillsTab();
      });
    });
  }

  /** Kisa sureli bildirim goster */
  private showNotification(msg: string): void {
    const note = document.createElement('div');
    note.style.cssText = `
      position:fixed; top:20%; left:50%; transform:translateX(-50%);
      background:rgba(168,85,247,0.9); color:#fff; padding:8px 20px;
      border-radius:6px; font-family:'Rajdhani',sans-serif; font-size:14px;
      font-weight:700; z-index:100; pointer-events:none;
      animation:smu-fade 2s forwards;
    `;
    note.textContent = msg;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 2000);
  }
}
