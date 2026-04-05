import { describe, it, expect } from 'vitest';
import { createGameContext } from './GameContext';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

describe('GameContext', () => {
  it('tum alanlari dogru dondurmeli', () => {
    const pos = new Vector3(1, 2, 3);
    const ctx = createGameContext(0.016, pos, 1.5, true, false, true, 80, 100);

    expect(ctx.deltaTime).toBe(0.016);
    expect(ctx.timestamp).toBeGreaterThan(0);
    expect(ctx.player.position).toBe(pos);
    expect(ctx.player.rotationY).toBe(1.5);
    expect(ctx.player.isAlive).toBe(true);
    expect(ctx.player.isBlocking).toBe(false);
    expect(ctx.player.isAttacking).toBe(true);
    expect(ctx.player.hp).toBe(80);
    expect(ctx.player.maxHp).toBe(100);
  });

  it('olu oyuncu durumunu yansitmali', () => {
    const ctx = createGameContext(0.016, Vector3.Zero(), 0, false, false, false, 0, 100);
    expect(ctx.player.isAlive).toBe(false);
    expect(ctx.player.hp).toBe(0);
  });
});
