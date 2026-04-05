/**
 * Golge Stat Hesaplayici
 * Oyuncu statlarina dayali yuzde kopyalama sistemi.
 * Normal golgeler sabit yuzde, boss golgeleri rutbeye gore artan yuzde kullanir.
 * Yan etki yok — tamamen deterministik.
 */

import { SHADOW_ENHANCEMENT } from '../config/GameConfig';
import type { EnemyDef } from '../enemies/Enemy';
import type { ShadowProfile, ShadowFinalStats, PlayerStats, ShadowRank } from './ShadowEnhancementTypes';

/** Boss golgenin rutbesine gore stat yuzdesini getir */
function getBossStatPercent(rank: ShadowRank): number {
  const rankDef = SHADOW_ENHANCEMENT.ranks.find(r => r.rank === rank);
  return rankDef?.statPercent ?? SHADOW_ENHANCEMENT.bossBaseStatPercent;
}

/**
 * Nihai golge statlarini hesapla.
 * Oyuncu statlari x yuzde kopyalama sistemi.
 *
 * @param enemyDef    Golgenin kaynak dusman tanimi
 * @param profile     Golge profili (null ise sadece temel statlar dondurulur)
 * @param playerStats Oyuncunun guncel statlari
 * @returns Hesaplanmis nihai statlar
 */
export function calculateShadowStats(
  enemyDef: EnemyDef,
  profile: ShadowProfile | null,
  playerStats: PlayerStats,
): ShadowFinalStats {
  const isBoss = profile?.isBoss ?? enemyDef.isBoss ?? false;
  const pct = isBoss
    ? getBossStatPercent(profile?.rank ?? 'soldier')
    : SHADOW_ENHANCEMENT.normalStatPercent;

  // Statlar oyuncu statlarindan yuzdeli turetilir
  const maxHp = Math.max(20, Math.round(playerStats.vit * pct * 8));
  const damage = Math.max(1, Math.round(playerStats.str * pct * 2));
  const defense = Math.round(playerStats.vit * pct * 1.5);
  const blockChance = 0; // sadece skill'lerden gelir
  const attackCooldown: number = Math.max(0.5, 2.0 - playerStats.agi * pct * 0.02);
  const chaseSpeed: number = 4.0 + playerStats.agi * pct * 0.05;
  const patrolSpeed: number = 2.0 + playerStats.agi * pct * 0.025;

  return { maxHp, damage, defense, blockChance, attackCooldown, chaseSpeed, patrolSpeed };
}
