import { describe, it, expect, beforeEach } from 'vitest';
import { LevelSystem } from './LevelSystem';
import { LEVEL_SYSTEM } from '../config/GameConfig';

describe('LevelSystem', () => {
  let ls: LevelSystem;

  beforeEach(() => {
    ls = new LevelSystem();
  });

  describe('baslangic durumu', () => {
    it('seviye 1 ile baslamali', () => {
      expect(ls.level).toBe(1);
      expect(ls.xp).toBe(0);
    });

    it('baslangic statlari config ile eslesimli olmali', () => {
      expect(ls.str).toBe(LEVEL_SYSTEM.initialStats.str);
      expect(ls.vit).toBe(LEVEL_SYSTEM.initialStats.vit);
      expect(ls.agi).toBe(LEVEL_SYSTEM.initialStats.agi);
      expect(ls.int).toBe(LEVEL_SYSTEM.initialStats.int);
    });

    it('stat puani 0 ile baslamali', () => {
      expect(ls.statPoints).toBe(0);
    });
  });

  describe('XP ve seviye atlama', () => {
    it('XP ekleyince totalXp artmali', () => {
      ls.addXp(50);
      expect(ls.totalXp).toBe(50);
      expect(ls.xp).toBe(50);
    });

    it('yeterli XP ile seviye atlamali', () => {
      const xpNeeded = ls.xpToNext;
      ls.addXp(xpNeeded);
      expect(ls.level).toBe(2);
    });

    it('seviye atlayinca stat puani kazanmali', () => {
      const xpNeeded = ls.xpToNext;
      ls.addXp(xpNeeded);
      expect(ls.statPoints).toBe(LEVEL_SYSTEM.statPointsPerLevel);
    });

    it('seviye atlayinca otomatik stat artmali', () => {
      const initialStr = ls.str;
      ls.addXp(ls.xpToNext);
      expect(ls.str).toBe(initialStr + LEVEL_SYSTEM.autoStatIncreasePerLevel);
    });

    it('coklu seviye atlama desteklenmeli', () => {
      ls.addXp(100000);
      expect(ls.level).toBeGreaterThan(2);
    });

    it('max seviyeyi gecmemeli', () => {
      ls.addXp(999999999);
      expect(ls.level).toBeLessThanOrEqual(LEVEL_SYSTEM.maxLevel);
    });
  });

  describe('stat dagitimi', () => {
    it('puan varken stat dagitilabilmeli', () => {
      ls.addXp(ls.xpToNext); // seviye 2 → 5 puan
      expect(ls.distributeStatPoint('str')).toBe(true);
      expect(ls.statPoints).toBe(LEVEL_SYSTEM.statPointsPerLevel - 1);
    });

    it('puan yokken stat dagitilamamali', () => {
      expect(ls.distributeStatPoint('str')).toBe(false);
    });

    it('stat cap sinirinda dagitilamamali', () => {
      // Stat'i cap'e cek
      (ls as any).str = LEVEL_SYSTEM.statCap;
      ls.statPoints = 10;
      expect(ls.distributeStatPoint('str')).toBe(false);
    });
  });

  describe('turetilmis statlar', () => {
    it('maxHp pozitif olmali', () => {
      expect(ls.getMaxHp()).toBeGreaterThan(0);
    });

    it('VIT artinca maxHp artmali', () => {
      const hpBefore = ls.getMaxHp();
      (ls as any).vit += 10;
      expect(ls.getMaxHp()).toBeGreaterThan(hpBefore);
    });

    it('maxHp cap sinirini gecmemeli (bonus haric)', () => {
      (ls as any).vit = 999;
      expect(ls.getMaxHp()).toBeLessThanOrEqual(LEVEL_SYSTEM.maxHp.cap);
    });

    it('critChance AGI ile artmali', () => {
      const critBefore = ls.getCritChance();
      (ls as any).agi += 20;
      expect(ls.getCritChance()).toBeGreaterThan(critBefore);
    });

    it('parryChance AGI ile artmali', () => {
      const parryBefore = ls.getParryChance();
      (ls as any).agi += 20;
      expect(ls.getParryChance()).toBeGreaterThan(parryBefore);
    });

    it('blockReduction VIT ile artmali', () => {
      const blockBefore = ls.getBlockReduction();
      (ls as any).vit += 20;
      expect(ls.getBlockReduction()).toBeGreaterThan(blockBefore);
    });

    it('defense VIT ile artmali', () => {
      const defBefore = ls.getDefense();
      (ls as any).vit += 20;
      expect(ls.getDefense()).toBeGreaterThan(defBefore);
    });

    it('damageReduction 0-1 araliginda olmali', () => {
      expect(ls.getDamageReduction()).toBeGreaterThanOrEqual(0);
      expect(ls.getDamageReduction()).toBeLessThan(1);
    });
  });

  describe('olum cezasi', () => {
    it('XP kaybetmeli', () => {
      ls.addXp(50);
      const xpBefore = ls.xp;
      ls.applyDeathPenalty();
      expect(ls.xp).toBeLessThan(xpBefore);
    });

    it('XP negatife dusmemeli', () => {
      ls.applyDeathPenalty();
      expect(ls.xp).toBeGreaterThanOrEqual(0);
    });
  });

  describe('XP yuzdesi', () => {
    it('0 ile 100 arasinda olmali', () => {
      expect(ls.getXpPercent()).toBeGreaterThanOrEqual(0);
      expect(ls.getXpPercent()).toBeLessThanOrEqual(100);
    });

    it('XP ekleyince artmali', () => {
      ls.addXp(10);
      expect(ls.getXpPercent()).toBeGreaterThan(0);
    });
  });
});
