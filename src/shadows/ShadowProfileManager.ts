/**
 * Golge Profil Yoneticisi
 * ShadowProfile verilerinin kalici yonetimi.
 * Immutable pattern: her guncelleme yeni nesne olusturur, mevcut nesne mutate edilmez.
 */

import { SHADOW_ENHANCEMENT } from '../config/GameConfig';
import { EQUIPMENT_DEFS } from '../data/shadowEquipment';
import { SKILL_BOOK_DEFS } from '../data/shadowSkillBooks';
import type {
  ShadowProfile,
  ShadowRank,
  EquipmentSlot,
} from './ShadowEnhancementTypes';
import { eventBus } from '../core/EventBus';

/**
 * Golge profillerini olusturur, gunceller ve yonetir.
 * Tum update metodlari yeni ShadowProfile nesnesi dondurur (immutable).
 */
export class ShadowProfileManager {
  private nextUid = 1;
  private profiles = new Map<number, ShadowProfile>();

  // ─── OLUSTURMA ───

  /** Golge ilk cikarildiginda profil olustur */
  createProfile(enemyDefId: string): ShadowProfile {
    const uid = this.nextUid++;
    const profile: ShadowProfile = {
      uid,
      enemyDefId,
      nickname: `${enemyDefId} #${uid}`,
      rank: 'soldier',
      kills: 0,
      equipment: { weapon: null, shield: null, armor: null },
      learnedSkillIds: [],
      hpPercent: 1,
    };
    this.profiles.set(uid, profile);
    return profile;
  }

  // ─── OKUMA ───

  getProfile(uid: number): ShadowProfile | null {
    return this.profiles.get(uid) ?? null;
  }

  getAllProfiles(): readonly ShadowProfile[] {
    return [...this.profiles.values()];
  }

  // ─── EKIPMAN ───

  /**
   * Esya kus — guncel profili dondurur.
   * Slot tipi ve tanim gecerliligi dogrulanir.
   * Envanterden esya cikarma sorumlulugu cagiriciya aittir.
   */
  equip(uid: number, itemId: string, slot: EquipmentSlot): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const equipDef = EQUIPMENT_DEFS[itemId];
    if (!equipDef) return null;
    if (equipDef.slot !== slot) return null;

    const updated: ShadowProfile = {
      ...profile,
      equipment: { ...profile.equipment, [slot]: itemId },
    };
    this.profiles.set(uid, updated);
    eventBus.emit('shadow:equip', { shadowUid: uid, slot, itemId });
    return updated;
  }

  /**
   * Esya cikar — { profile, itemId } dondurur.
   * Cagiriciya esyayi envantere geri ekleme sorumlulugu aittir.
   */
  unequip(uid: number, slot: EquipmentSlot): { profile: ShadowProfile; itemId: string } | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const itemId = profile.equipment[slot];
    if (!itemId) return null;

    const updated: ShadowProfile = {
      ...profile,
      equipment: { ...profile.equipment, [slot]: null },
    };
    this.profiles.set(uid, updated);
    eventBus.emit('shadow:unequip', { shadowUid: uid, slot, itemId });
    return { profile: updated, itemId };
  }

  // ─── YETENEKLER ───

  /** Yetenek ogren — maksimum slot ve tekrar kontrolu yapar */
  learnSkill(uid: number, skillId: string): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;
    if (!SKILL_BOOK_DEFS[skillId]) return null;
    if (profile.learnedSkillIds.includes(skillId)) return null;
    if (profile.learnedSkillIds.length >= SHADOW_ENHANCEMENT.maxSkillSlots) return null;

    const updated: ShadowProfile = {
      ...profile,
      learnedSkillIds: [...profile.learnedSkillIds, skillId],
    };
    this.profiles.set(uid, updated);
    eventBus.emit('shadow:learnSkill', { shadowUid: uid, skillId });
    return updated;
  }

  // ─── CAN YUZDESI ───

  /** HP yuzdesini guncelle (stok iyilesme vs.) — 0-1 arasinda clamp edilir */
  updateHpPercent(uid: number, hpPercent: number): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const clamped = Math.max(0, Math.min(1, hpPercent));
    const updated: ShadowProfile = { ...profile, hpPercent: clamped };
    this.profiles.set(uid, updated);
    return updated;
  }

  // ─── OLDURME & RUTBE ───

  /** Oldurme sayacini artir ve rutbe terfisi kontrol et */
  incrementKills(uid: number): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const newKills = profile.kills + 1;
    const newRank = this.calculateRank(newKills);
    const updated: ShadowProfile = { ...profile, kills: newKills, rank: newRank };
    this.profiles.set(uid, updated);

    if (newRank !== profile.rank) {
      const rankDef = SHADOW_ENHANCEMENT.ranks.find(r => r.rank === newRank);
      if (rankDef) {
        eventBus.emit('shadow:rankUp', {
          shadowUid: uid,
          newRank,
          rankName: rankDef.name,
        });
      }
    }
    return updated;
  }

  // ─── ISIM ───

  /** Golge takma adini degistir — maksimum 20 karakter */
  setNickname(uid: number, nickname: string): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const trimmed = nickname.slice(0, 20);
    const updated: ShadowProfile = { ...profile, nickname: trimmed };
    this.profiles.set(uid, updated);
    return updated;
  }

  // ─── SILME ───

  /** Profili kalici olarak sil (fusion kurban vs.) */
  deleteProfile(uid: number): boolean {
    return this.profiles.delete(uid);
  }

  // ─── YARDIMCI ───

  private calculateRank(kills: number): ShadowRank {
    const ranks = SHADOW_ENHANCEMENT.ranks;
    let result: ShadowRank = 'soldier';
    for (const r of ranks) {
      if (kills >= r.requiredKills) {
        result = r.rank as ShadowRank;
      }
    }
    return result;
  }
}
