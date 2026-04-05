/**
 * Golge Stat Hesaplayici
 * Saf fonksiyonlar: temel dusman def + ekipman + rutbe'den nihai statlari hesaplar.
 * Yan etki yok — tamamen deterministik.
 */

import { SHADOW, SHADOW_ENHANCEMENT } from '../config/GameConfig';
import { EQUIPMENT_DEFS } from '../data/shadowEquipment';
import type { EnemyDef } from '../enemies/Enemy';
import type { ShadowProfile, ShadowFinalStats, ShadowRank } from './ShadowEnhancementTypes';

/** Rutbe bonus tanimini getir — bulunamazsa ilk rutbeyi dondurur */
function getRankBonuses(rank: ShadowRank) {
  return SHADOW_ENHANCEMENT.ranks.find(r => r.rank === rank) ?? SHADOW_ENHANCEMENT.ranks[0];
}

/**
 * Nihai golge statlarini hesapla.
 * Siralama: temel stat -> ekipman bonuslari -> rutbe bonuslari -> cap clamp.
 *
 * @param enemyDef  Golgenin kaynak dusman tanimi
 * @param profile   Golge profili (null ise sadece temel statlar dondurulur)
 * @returns Hesaplanmis nihai statlar
 */
export function calculateShadowStats(
  enemyDef: EnemyDef,
  profile: ShadowProfile | null,
): ShadowFinalStats {
  // Temel statlar: dusman def * golge carpanlari
  let maxHp = Math.round(enemyDef.hp * SHADOW.shadowHpMultiplier);
  let damage = Math.round(enemyDef.damage * SHADOW.shadowDamageMultiplier);
  let defense = 0;
  let blockChance = 0;
  let attackCooldown: number = SHADOW.attackCooldown;
  let chaseSpeed: number = SHADOW.chaseSpeed;
  let patrolSpeed: number = SHADOW.patrolSpeed;

  if (!profile) {
    return { maxHp, damage, defense, blockChance, attackCooldown, chaseSpeed, patrolSpeed };
  }

  // Ekipman bonuslarini uygula
  const slotKeys: readonly EquipmentSlotKey[] = ['weapon', 'shield', 'armor'];
  for (const slotKey of slotKeys) {
    const itemId = profile.equipment[slotKey];
    if (!itemId) continue;

    const def = EQUIPMENT_DEFS[itemId];
    if (!def) continue;

    const s = def.stats;

    if (s.bonusDamage) damage += s.bonusDamage;
    if (s.bonusDamagePercent) damage = Math.round(damage * (1 + s.bonusDamagePercent));
    if (s.bonusHp) maxHp += s.bonusHp;
    if (s.bonusHpPercent) maxHp = Math.round(maxHp * (1 + s.bonusHpPercent));
    if (s.bonusDefense) defense += s.bonusDefense;
    if (s.bonusBlockChance) blockChance += s.bonusBlockChance;
    if (s.bonusAttackSpeed) attackCooldown = Math.max(0.5, attackCooldown - s.bonusAttackSpeed);
    if (s.bonusMoveSpeed) {
      chaseSpeed += s.bonusMoveSpeed;
      patrolSpeed += s.bonusMoveSpeed * 0.5;
    }
  }

  // Rutbe bonuslarini uygula
  const rankBonus = getRankBonuses(profile.rank);
  maxHp = Math.round(maxHp * (1 + rankBonus.bonusHpPercent));
  damage = Math.round(damage * (1 + rankBonus.bonusDamagePercent));
  chaseSpeed *= (1 + rankBonus.bonusSpeedPercent);
  patrolSpeed *= (1 + rankBonus.bonusSpeedPercent);
  attackCooldown *= (1 - rankBonus.bonusCooldownReduction);

  // Uest sinir clamp
  blockChance = Math.min(blockChance, SHADOW_ENHANCEMENT.equipmentStatCaps.bonusBlockChance);

  return { maxHp, damage, defense, blockChance, attackCooldown, chaseSpeed, patrolSpeed };
}

// Dahili tip — slot anahtarlarini yinelemek icin
type EquipmentSlotKey = 'weapon' | 'shield' | 'armor';
