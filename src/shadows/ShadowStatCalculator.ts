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

  // Derived stat'lardan yuzde kopyalama — ekipman bonuslari dahil
  // Minimum: dusman def degerlerinin bir yuzdesini taban olarak kullan
  const rawMaxHp = Math.max(20, Math.round(playerStats.maxHp * pct));
  const rawDamage = Math.max(1, Math.round(playerStats.attackDamage * pct));
  const maxHp = Math.max(rawMaxHp, Math.round(enemyDef.hp * 0.3));
  const damage = Math.max(rawDamage, Math.round(enemyDef.damage * 0.5));
  const defense = Math.round(playerStats.defense * pct);
  const blockChance = 0; // sadece skill'lerden gelir
  const attackCooldown: number = Math.max(0.5, 2.0 / (1 + playerStats.attackSpeed * pct * 0.3));
  const chaseSpeed: number = 4.0 + playerStats.moveSpeed * pct * 0.3;
  const patrolSpeed: number = 2.0 + playerStats.moveSpeed * pct * 0.15;

  return { maxHp, damage, defense, blockChance, attackCooldown, chaseSpeed, patrolSpeed };
}
