import { describe, it, expect } from 'vitest';
import { CombatSystem } from './CombatSystem';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { COMBAT } from '../config/GameConfig';

describe('CombatSystem static methods', () => {
  describe('isFacing', () => {
    it('entity hedefe bakiyorsa true donmeli', () => {
      // rotY=0 → +Z yonune bakiyor, hedef +Z'de
      const result = CombatSystem.isFacing(
        new Vector3(0, 0, 0), 0,
        new Vector3(0, 0, 5),
      );
      expect(result).toBe(true);
    });

    it('entity hedefe arkasi donukse false donmeli', () => {
      // rotY=0 → +Z yonune bakiyor, hedef -Z'de (arkada)
      const result = CombatSystem.isFacing(
        new Vector3(0, 0, 0), 0,
        new Vector3(0, 0, -5),
      );
      expect(result).toBe(false);
    });

    it('entity yana bakiyorsa false donmeli (dar aci)', () => {
      // rotY=0 → +Z, hedef tam sagda (+X)
      const result = CombatSystem.isFacing(
        new Vector3(0, 0, 0), 0,
        new Vector3(10, 0, 0),
        Math.PI / 6, // 30 derece — dar aci
      );
      expect(result).toBe(false);
    });

    it('ayni pozisyonda true donmeli', () => {
      const result = CombatSystem.isFacing(
        new Vector3(5, 0, 5), 0,
        new Vector3(5, 0, 5),
      );
      expect(result).toBe(true);
    });
  });

  describe('isTargetBehind', () => {
    it('saldiran hedefin arkasindaysa true donmeli', () => {
      // hedef +Z'ye bakiyor, saldiran -Z'de (arkada)
      const result = CombatSystem.isTargetBehind(
        new Vector3(0, 0, -5), // saldiran
        new Vector3(0, 0, 0),  // hedef
        0,                      // hedef +Z'ye bakiyor
      );
      expect(result).toBe(true);
    });

    it('saldiran hedefin onundeyse false donmeli', () => {
      // hedef +Z'ye bakiyor, saldiran +Z'de (onde)
      const result = CombatSystem.isTargetBehind(
        new Vector3(0, 0, 5),
        new Vector3(0, 0, 0),
        0,
      );
      expect(result).toBe(false);
    });

    it('saldiran yandaysa false donmeli', () => {
      // hedef +Z'ye bakiyor, saldiran +X'te (yanda)
      const result = CombatSystem.isTargetBehind(
        new Vector3(5, 0, 0),
        new Vector3(0, 0, 0),
        0,
      );
      expect(result).toBe(false);
    });
  });
});
