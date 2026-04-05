/**
 * Oyuncu Rank Sistemi
 * Ogrenilen yeteneklerin toplam gucune gore rank hesaplar.
 * Q/E/R/F skill slot atamalarini yonetir.
 * Dungeon giris kontrolu saglar.
 */

import { PLAYER_RANK } from '../config/GameConfig';
import type { PlayerRank } from '../dungeon/types';
import { eventBus } from '../core/EventBus';

// ─── TIPLER ───

export interface LearnedSkill {
  readonly id: string;
  readonly name: string;
  readonly rank: PlayerRank;
  readonly power: number;
  readonly key: string;
  readonly type: string;
}

type SlotKey = 'Q' | 'E' | 'R' | 'F';

const VALID_SLOTS: readonly SlotKey[] = ['Q', 'E', 'R', 'F'] as const;

function isValidSlot(key: string): key is SlotKey {
  return (VALID_SLOTS as readonly string[]).includes(key);
}

// ─── SISTEM ───

export class PlayerRankSystem {
  private rank: PlayerRank = 'none';
  private skillPool: LearnedSkill[] = [];

  // Q/E/R/F slot atamalari (skill ID veya null)
  private slotAssignments: Record<SlotKey, string | null> = {
    Q: null,
    E: null,
    R: null,
    F: null,
  };

  /**
   * Baslangic yeteneklerini havuza ekle.
   * Engine/TestScene tarafindan oyun basinda cagirilir.
   */
  public initializeStartingSkills(skills: readonly LearnedSkill[]): void {
    for (const skill of skills) {
      this.addSkillToPool(skill);
    }
    // Baslangic yeteneklerini varsayilan slotlara ata
    this.autoAssignDefaults();
  }

  /**
   * Yetenek havuzuna yeni skill ekle.
   * Ayni ID tekrar eklenemez.
   */
  public addSkillToPool(skill: LearnedSkill): void {
    if (this.skillPool.some(s => s.id === skill.id)) return;
    this.skillPool = [...this.skillPool, skill];
    this.recalculateRank();
  }

  /** Tum ogrenilmis yetenekleri dondur (readonly) */
  public getSkillPool(): readonly LearnedSkill[] {
    return this.skillPool;
  }

  /** Mevcut oyuncu rankini dondur */
  public getRank(): PlayerRank {
    return this.rank;
  }

  /** Toplam skill power degerini dondur */
  public getTotalPower(): number {
    return this.skillPool.reduce((sum, s) => sum + s.power, 0);
  }

  // ─── SLOT YONETIMI ───

  /**
   * Havuzdaki bir yetenegini bir slota (Q/E/R/F) ata.
   * Ayni yetenek baska bir slottaysa onceki slottan kaldirilir.
   * @returns basarili mi
   */
  public assignSkillToSlot(slotKey: string, skillId: string): boolean {
    if (!isValidSlot(slotKey)) return false;
    if (!this.skillPool.some(s => s.id === skillId)) return false;

    // Skill baska slotta varsa temizle
    for (const key of VALID_SLOTS) {
      if (this.slotAssignments[key] === skillId) {
        this.slotAssignments = { ...this.slotAssignments, [key]: null };
      }
    }

    this.slotAssignments = { ...this.slotAssignments, [slotKey]: skillId };
    eventBus.emit('stat:changed', {});
    return true;
  }

  /** Bir slotu temizle */
  public clearSlot(slotKey: string): void {
    if (!isValidSlot(slotKey)) return;
    this.slotAssignments = { ...this.slotAssignments, [slotKey]: null };
    eventBus.emit('stat:changed', {});
  }

  /** Iki slottaki yetenekleri takas et */
  public swapSlots(slotA: string, slotB: string): boolean {
    if (!isValidSlot(slotA) || !isValidSlot(slotB)) return false;
    if (slotA === slotB) return false;

    const skillA = this.slotAssignments[slotA];
    const skillB = this.slotAssignments[slotB];

    this.slotAssignments = {
      ...this.slotAssignments,
      [slotA]: skillB,
      [slotB]: skillA,
    };

    eventBus.emit('stat:changed', {});
    return true;
  }

  /** Slot atamalarinin kopyasini dondur */
  public getSlotAssignments(): Readonly<Record<SlotKey, string | null>> {
    return { ...this.slotAssignments };
  }

  /** Belirli slottaki yetenegini dondur */
  public getSkillInSlot(slotKey: string): LearnedSkill | null {
    if (!isValidSlot(slotKey)) return null;
    const id = this.slotAssignments[slotKey];
    if (!id) return null;
    return this.skillPool.find(s => s.id === id) ?? null;
  }

  /** Slota atanmamis yetenekleri listele */
  public getUnassignedSkills(): readonly LearnedSkill[] {
    const assignedIds = new Set(
      Object.values(this.slotAssignments).filter((id): id is string => id !== null)
    );
    return this.skillPool.filter(s => !assignedIds.has(s.id));
  }

  // ─── DUNGEON GIRIS KONTROLU ───

  /**
   * Oyuncu bu dungeon rankine girebilir mi?
   * Kendi rankindan en fazla 2 ust seviyeye kadar izin verilir.
   */
  public canEnterDungeon(dungeonRank: string): boolean {
    const playerRankIdx = PLAYER_RANK.ranks.indexOf(
      this.rank as typeof PLAYER_RANK.ranks[number]
    );
    const dungeonRankIdx = PLAYER_RANK.ranks.indexOf(
      dungeonRank as typeof PLAYER_RANK.ranks[number]
    );
    if (playerRankIdx < 0 || dungeonRankIdx < 0) return false;
    return dungeonRankIdx - playerRankIdx <= 2;
  }

  // ─── DAHILI HESAPLAMA ───

  /** Toplam skill power'a gore rank yeniden hesapla */
  private recalculateRank(): void {
    const totalPower = this.getTotalPower();
    const oldRank = this.rank;

    let newRank: PlayerRank = 'none';
    const thresholds = PLAYER_RANK.skillPowerThresholds;

    if (totalPower >= thresholds.S) newRank = 'S';
    else if (totalPower >= thresholds.A) newRank = 'A';
    else if (totalPower >= thresholds.B) newRank = 'B';
    else if (totalPower >= thresholds.C) newRank = 'C';
    else if (totalPower >= thresholds.D) newRank = 'D';
    else if (totalPower >= thresholds.E) newRank = 'E';

    this.rank = newRank;
    if (oldRank !== newRank) {
      eventBus.emit('player:rankChanged', { oldRank, newRank });
    }
  }

  /**
   * Baslangic yeteneklerini varsayilan slotlara otomatik ata.
   * Yetenek key'ine gore eslestirme yapar (KeyQ -> Q, KeyE -> E vb.)
   */
  private autoAssignDefaults(): void {
    const keyToSlot: Record<string, SlotKey> = {
      KeyQ: 'Q',
      KeyE: 'E',
      KeyR: 'R',
      KeyF: 'F',
    };

    for (const skill of this.skillPool) {
      const slot = keyToSlot[skill.key];
      if (slot && this.slotAssignments[slot] === null) {
        this.slotAssignments = { ...this.slotAssignments, [slot]: skill.id };
      }
    }
  }
}
