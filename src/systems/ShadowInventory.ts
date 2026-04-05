/**
 * Golge Envanteri
 * Oyuncunun ekipman ve yetenek kitabi envanteri.
 * Immutable-style guncellemeler: Map uzerinde spread ile yeni InventoryItem nesneleri.
 */

import type { InventoryItem, EquipmentRarity } from '../shadows/ShadowEnhancementTypes';
import { EQUIPMENT_DEFS } from '../data/shadowEquipment';
import { SKILL_BOOK_DEFS } from '../data/shadowSkillBooks';
import { SHADOW_ENHANCEMENT } from '../config/GameConfig';

/** Nadirlik sirasi — craft sisteminde bir ust kademeye gecis icin */
const RARITY_ORDER: readonly EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export class ShadowInventory {
  private items = new Map<string, InventoryItem>();
  private gold = 0;

  // ─── ESYA YONETIMI ───

  /** Envantere esya ekle. Varsa sayiyi arttirir, yoksa yeni kayit olusturur. */
  addItem(id: string, type: 'equipment' | 'skillbook', count = 1): void {
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

  getEquipmentItems(): readonly InventoryItem[] {
    return [...this.items.values()].filter(i => i.type === 'equipment');
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
    const equipDef = EQUIPMENT_DEFS[itemId];
    const skillDef = SKILL_BOOK_DEFS[itemId];
    const def = equipDef ?? skillDef;
    if (!def || def.buyPrice <= 0) return false;
    if (!this.spendGold(def.buyPrice)) return false;

    const type: 'equipment' | 'skillbook' = equipDef ? 'equipment' : 'skillbook';
    this.addItem(itemId, type);
    return true;
  }

  /** Esya sat — sellPrice kadar altin kazanilir. */
  sellItem(itemId: string): boolean {
    const equipDef = EQUIPMENT_DEFS[itemId];
    const skillDef = SKILL_BOOK_DEFS[itemId];
    const def = equipDef ?? skillDef;
    if (!def) return false;
    if (!this.removeItem(itemId, 1)) return false;

    this.addGold(def.sellPrice);
    return true;
  }

  // ─── CRAFT ───

  /**
   * Craft: craftRatio adet ayni nadirlik esya -> 1 adet ust nadirlik esya (ayni slot).
   * Sadece ekipman icin gecerli.
   * Basarili olursa sonuc esya ID'si, basarisizsa null doner.
   */
  craft(itemId: string): string | null {
    const def = EQUIPMENT_DEFS[itemId];
    if (!def) return null;

    const item = this.items.get(itemId);
    if (!item || item.count < SHADOW_ENHANCEMENT.craftRatio) return null;

    const currentRarityIdx = RARITY_ORDER.indexOf(def.rarity);
    if (currentRarityIdx < 0 || currentRarityIdx >= RARITY_ORDER.length - 1) return null;

    const nextRarity = RARITY_ORDER[currentRarityIdx + 1];

    // Ayni slot tipinde bir ust nadirlik esya bul
    const resultItem = Object.values(EQUIPMENT_DEFS).find(
      e => e.slot === def.slot && e.rarity === nextRarity,
    );
    if (!resultItem) return null;

    // Malzemeleri tuket
    if (!this.removeItem(itemId, SHADOW_ENHANCEMENT.craftRatio)) return null;

    // Sonucu ekle
    this.addItem(resultItem.id, 'equipment');
    return resultItem.id;
  }

  // ─── DUKKAN LISTESI ───

  /** Satin alinabilir tum esyalari dondurur (buyPrice > 0). */
  getShopItems(): readonly { id: string; type: 'equipment' | 'skillbook'; name: string; price: number }[] {
    const items: { id: string; type: 'equipment' | 'skillbook'; name: string; price: number }[] = [];

    for (const def of Object.values(EQUIPMENT_DEFS)) {
      if (def.buyPrice > 0) {
        items.push({ id: def.id, type: 'equipment', name: def.name, price: def.buyPrice });
      }
    }
    for (const def of Object.values(SKILL_BOOK_DEFS)) {
      if (def.buyPrice > 0) {
        items.push({ id: def.id, type: 'skillbook', name: def.name, price: def.buyPrice });
      }
    }

    return items;
  }
}
