/**
 * Golge Profil Yoneticisi
 * ShadowProfile verilerinin kalici yonetimi.
 * Immutable pattern: her guncelleme yeni nesne olusturur, mevcut nesne mutate edilmez.
 * Ekipman ve yetenek ogretme kaldirildi — golgeler kaynak dusmanin sabit yeteneklerini kullanir.
 */

import { SHADOW_ENHANCEMENT } from '../config/GameConfig';
import type {
  ShadowProfile,
  ShadowRank,
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
  createProfile(
    enemyDefId: string,
    isBoss: boolean,
    shadowSkillIds: readonly string[],
  ): ShadowProfile {
    const uid = this.nextUid++;
    const profile: ShadowProfile = {
      uid,
      enemyDefId,
      nickname: `${enemyDefId} #${uid}`,
      rank: 'soldier',
      kills: 0,
      isBoss,
      shadowSkillIds: [...shadowSkillIds],
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

  /** Oldurme sayacini artir ve rutbe terfisi kontrol et — sadece boss golgeler rank atlayabilir */
  incrementKills(uid: number, killValue = 1): ShadowProfile | null {
    const profile = this.profiles.get(uid);
    if (!profile) return null;

    const newKills = profile.kills + killValue;
    // Sadece boss golgeler rank atlayabilir
    const newRank = profile.isBoss ? this.calculateRank(newKills) : 'soldier' as ShadowRank;
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
