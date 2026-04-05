/**
 * Golge Envanteri
 * Oyuncunun yetenek kitabi envanteri ve altin yonetimi.
 * Ekipman sistemi kaldirildi — sadece oyuncu yetenek kitaplari.
 * Immutable-style guncellemeler: Map uzerinde spread ile yeni InventoryItem nesneleri.
 */

import type { InventoryItem } from '../shadows/ShadowEnhancementTypes';
import { PLAYER_SKILL_BOOK_DEFS } from '../data/shadowSkillBooks';

export class ShadowInventory {
  private items = new Map<string, InventoryItem>();
  private gold = 0;

  // ─── ESYA YONETIMI ───

  /** Envantere esya ekle. Varsa sayiyi arttirir, yoksa yeni kayit olusturur. */
  addItem(id: string, type: 'skillbook', count = 1): void {
    const existing = this.items.get(id);
    if (existing) {
      this.items.set(id, { ...existing, count: existing.count + count });
    } else {
      this.items.set(id, { id, type, count });
    }
  }

  /** Envanterden esya cikar. Yeterli yoksa false doner. */
  removeItem(id: string, count = 1): boolean {
    const existing = this.items.get(id);
    if (!existing || existing.count < count) return false;

    if (existing.count === count) {
      this.items.delete(id);
    } else {
      this.items.set(id, { ...existing, count: existing.count - count });
    }
    return true;
  }

  getItem(id: string): InventoryItem | null {
    return this.items.get(id) ?? null;
  }

  getAllItems(): readonly InventoryItem[] {
    return [...this.items.values()];
  }

  getSkillBookItems(): readonly InventoryItem[] {
    return [...this.items.values()].filter(i => i.type === 'skillbook');
  }

  // ─── ALTIN YONETIMI ───

  getGold(): number {
    return this.gold;
  }

  addGold(amount: number): void {
    this.gold += amount;
  }

  spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  // ─── DUKKAN ───

  /** Dukkandan esya satin al. buyPrice > 0 olmali. */
  buyItem(itemId: string): boolean {
    const skillDef = PLAYER_SKILL_BOOK_DEFS[itemId];
    if (!skillDef || skillDef.buyPrice <= 0) return false;
    if (!this.spendGold(skillDef.buyPrice)) return false;

    this.addItem(itemId, 'skillbook');
    return true;
  }

  /** Esya sat — sellPrice kadar altin kazanilir. */
  sellItem(itemId: string): boolean {
    const skillDef = PLAYER_SKILL_BOOK_DEFS[itemId];
    if (!skillDef) return false;
    if (!this.removeItem(itemId, 1)) return false;

    this.addGold(skillDef.sellPrice);
    return true;
  }

  // ─── DUKKAN LISTESI ───

  /** Satin alinabilir tum oyuncu yetenek kitaplarini dondurur (buyPrice > 0). */
  getShopItems(): readonly { id: string; type: 'skillbook'; name: string; price: number }[] {
    const items: { id: string; type: 'skillbook'; name: string; price: number }[] = [];

    for (const def of Object.values(PLAYER_SKILL_BOOK_DEFS)) {
      if (def.buyPrice > 0) {
        items.push({ id: def.id, type: 'skillbook', name: def.name, price: def.buyPrice });
      }
    }

    return items;
  }
}
