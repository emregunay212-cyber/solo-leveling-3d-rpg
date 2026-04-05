/**
 * Drop Sistemi
 * Dusman oldugunde drop tablosuna gore esya dusurur ve envantere ekler.
 * EventBus'a dogrudan abone olmaz — TestScene tarafindan cagirilir.
 */

import { eventBus } from '../core/EventBus';
import { SHADOW_DROP_TABLES } from '../data/shadowDropTables';
import { SHADOW_ENHANCEMENT } from '../config/GameConfig';
import type { ShadowInventory } from './ShadowInventory';

export class DropSystem {
  private inventory: ShadowInventory;

  constructor(inventory: ShadowInventory) {
    this.inventory = inventory;
  }

  /**
   * Dusman oldugunde cagirilir. Drop tablosundan esya dusurur.
   * enemyName: SHADOW_DROP_TABLES anahtarlariyla eslesir (ornegin 'goblin', 'wolf').
   * enemyLevel: dusmanin seviyesi — minLevel kontrolu icin.
   */
  rollDrops(enemyName: string, enemyLevel: number): void {
    const table = SHADOW_DROP_TABLES[enemyName];
    if (!table) return;

    for (const entry of table) {
      if (enemyLevel < entry.minLevel) continue;

      const roll = Math.random();
      const adjustedChance = entry.chance * SHADOW_ENHANCEMENT.dropChanceMultiplier;

      if (roll < adjustedChance) {
        this.inventory.addItem(entry.itemId, entry.itemType);
        eventBus.emit('loot:drop', {
          itemId: entry.itemId,
          itemType: entry.itemType,
          enemyName,
        });
      }
    }
  }

  /** Dusman olumunden gelen altini envantere ekler. */
  addGold(amount: number): void {
    this.inventory.addGold(amount);
  }
}
