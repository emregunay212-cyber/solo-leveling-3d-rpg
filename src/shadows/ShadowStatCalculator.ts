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

/** Stat breakdown — UI'da bileşenleri ayrı renkte gostermek icin */
export interface StatBreakdown {
  readonly base: number;    // düşman def'ten gelen minimum
  readonly player: number;  // oyuncu stat kopyasından gelen
  readonly rank: number;    // rank bonusu (sadece boss)
  readonly total: number;
}

export interface ShadowStatsBreakdown {
  readonly maxHp: StatBreakdown;
  readonly damage: StatBreakdown;
  readonly defense: StatBreakdown;
  readonly attackCooldown: number;
}

export function calculateShadowStatsBreakdown(
  enemyDef: EnemyDef,
  profile: ShadowProfile | null,
  playerStats: PlayerStats,
): ShadowStatsBreakdown {
  const isBoss = profile?.isBoss ?? enemyDef.isBoss ?? false;
  const basePct = isBoss
    ? SHADOW_ENHANCEMENT.bossBaseStatPercent
    : SHADOW_ENHANCEMENT.normalStatPercent;
  const rankPct = isBoss
    ? getBossStatPercent(profile?.rank ?? 'soldier')
    : basePct;
  const rankBonus = rankPct - basePct; // rank'tan gelen ekstra yuzde

  // Düşman base (minimum floor)
  const baseHp = Math.round(enemyDef.hp * 0.3);
  const baseDmg = Math.round(enemyDef.damage * 0.5);
  const baseDef = 0;

  // Oyuncu stat kopyası (base pct ile)
  const playerHp = Math.max(20, Math.round(playerStats.maxHp * basePct));
  const playerDmg = Math.max(1, Math.round(playerStats.attackDamage * basePct));
  const playerDef = Math.round(playerStats.defense * basePct);

  // Rank bonusu (sadece boss, ekstra yuzde farki)
  const rankHp = isBoss ? Math.round(playerStats.maxHp * rankBonus) : 0;
  const rankDmg = isBoss ? Math.round(playerStats.attackDamage * rankBonus) : 0;
  const rankDef = isBoss ? Math.round(playerStats.defense * rankBonus) : 0;

  const totalHp = Math.max(baseHp, playerHp) + rankHp;
  const totalDmg = Math.max(baseDmg, playerDmg) + rankDmg;
  const totalDef = playerDef + rankDef;

  const attackCooldown: number = Math.max(0.5, 2.0 / (1 + playerStats.attackSpeed * rankPct * 0.3));

  return {
    maxHp: { base: baseHp, player: Math.max(0, playerHp - baseHp), rank: rankHp, total: totalHp },
    damage: { base: baseDmg, player: Math.max(0, playerDmg - baseDmg), rank: rankDmg, total: totalDmg },
    defense: { base: baseDef, player: playerDef, rank: rankDef, total: totalDef },
    attackCooldown,
  };
}
