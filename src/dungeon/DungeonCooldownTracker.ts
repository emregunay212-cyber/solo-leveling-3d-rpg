/**
 * Dungeon giris bekleme suresi takipçisi.
 * Her rank icin ayri cooldown zamanlayicisi tutar.
 */

import { DUNGEON } from '../config/GameConfig';
import type { DungeonRank } from './types';

export class DungeonCooldownTracker {
  /** rank -> cooldown bitis zamani (Date.now() + sure) */
  private readonly cooldowns = new Map<DungeonRank, number>();

  /**
   * Belirtilen rank icin bekleme suresini baslatir.
   * DUNGEON.cooldownMinutes konfigurasyonundan sure alinir.
   */
  startCooldown(rank: DungeonRank): void {
    const minutes = DUNGEON.cooldownMinutes[rank];
    const expiresAt = Date.now() + minutes * 60 * 1000;
    this.cooldowns.set(rank, expiresAt);
  }

  /**
   * Belirtilen rank dungeon'i girise hazir mi?
   * Cooldown yoksa veya suresi dolduysa true doner.
   */
  isAvailable(rank: DungeonRank): boolean {
    const expiresAt = this.cooldowns.get(rank);
    if (expiresAt === undefined) return true;
    return Date.now() >= expiresAt;
  }

  /**
   * Kalan bekleme suresi (milisaniye).
   * Hazirsa 0 doner.
   */
  getRemainingMs(rank: DungeonRank): number {
    const expiresAt = this.cooldowns.get(rank);
    if (expiresAt === undefined) return 0;
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Kalan sureyi okunabilir formatta dondurur.
   * Ornek: "23:45" veya "Hazir"
   */
  getRemainingFormatted(rank: DungeonRank): string {
    const remainingMs = this.getRemainingMs(rank);
    if (remainingMs <= 0) return 'Hazir';

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  /**
   * Belirtilen rank'in cooldown'ini sifirlar.
   * Test veya admin islemleri icin.
   */
  clearCooldown(rank: DungeonRank): void {
    this.cooldowns.delete(rank);
  }

  /** Tum cooldown'lari temizler. */
  clearAll(): void {
    this.cooldowns.clear();
  }
}
