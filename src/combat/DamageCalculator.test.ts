import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DamageCalculator, DamageContext } from './DamageCalculator';
import { LevelSystem } from '../progression/LevelSystem';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

// DamageNumbers mock
const mockSpawn = vi.fn();
const mockDamageNumbers = { spawn: mockSpawn } as any;

function makeCtx(overrides: Partial<DamageContext> = {}): DamageContext {
  return {
    playerPos: new Vector3(0, 0, 0),
    playerRotY: 0,           // facing +Z
    playerIsBlocking: false,
    playerIsAttacking: false,
    enemyMeshPos: new Vector3(0, 0, 5), // enemy in front
    ...overrides,
  };
}

describe('DamageCalculator', () => {
  let calc: DamageCalculator;
  let ls: LevelSystem;

  beforeEach(() => {
    ls = new LevelSystem();
    calc = new DamageCalculator(ls, mockDamageNumbers);
    mockSpawn.mockClear();
  });

  it('normal hasar uygulmali (blok yok)', () => {
    const result = calc.calculateIncomingDamage(100, false, makeCtx());
    expect(result.type).toBe('normal');
    expect(result.damage).toBeGreaterThan(0);
    expect(result.damage).toBeLessThanOrEqual(100);
    expect(mockSpawn).toHaveBeenCalledOnce();
  });

  it('backstab hasari artirmali', () => {
    const normal = calc.calculateIncomingDamage(100, false, makeCtx());
    mockSpawn.mockClear();
    const backstab = calc.calculateIncomingDamage(100, true, makeCtx());
    expect(backstab.type).toBe('backstab');
    expect(backstab.damage).toBeGreaterThan(normal.damage);
  });

  it('blok hasari azaltmali (oyuncu dusmana bakiyor)', () => {
    const ctx = makeCtx({ playerIsBlocking: true });
    // Parry sansini sifirla
    (ls as any).agi = 0;

    const results: number[] = [];
    for (let i = 0; i < 50; i++) {
      mockSpawn.mockClear();
      const r = calc.calculateIncomingDamage(100, false, ctx);
      if (r.type === 'block') results.push(r.damage);
    }

    // En az bir block sonucu olmali
    expect(results.length).toBeGreaterThan(0);
    // Block hasari normal hasardan dusuk olmali
    for (const dmg of results) {
      expect(dmg).toBeLessThan(100);
    }
  });

  it('blok gecersiz oyuncu dusmana bakmiyor ise', () => {
    const ctx = makeCtx({
      playerIsBlocking: true,
      playerRotY: Math.PI,          // arkaya bakiyor
      enemyMeshPos: new Vector3(0, 0, 5), // dusman onde
    });

    const result = calc.calculateIncomingDamage(100, false, ctx);
    expect(result.type).toBe('normal');
  });

  it('backstab blok/parry gecersiz kilmali', () => {
    const ctx = makeCtx({ playerIsBlocking: true });
    const result = calc.calculateIncomingDamage(100, true, ctx);
    expect(result.type).toBe('backstab');
  });

  it('pasif savunma her zaman uygulanmali', () => {
    // VIT arttir → daha fazla savunma
    (ls as any).vit = 50;
    const result = calc.calculateIncomingDamage(100, false, makeCtx());
    expect(result.damage).toBeLessThan(100);
  });
});
