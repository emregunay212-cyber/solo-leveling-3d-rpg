import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './EventBus';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

describe('EventBus', () => {
  it('emit edilen event dinleyiciye ulasmali', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    bus.on('player:levelUp', callback);
    bus.emit('player:levelUp', { level: 5 });
    expect(callback).toHaveBeenCalledWith({ level: 5 });
  });

  it('off ile dinleyici kaldirilmali', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    bus.on('player:xpGain', callback);
    bus.off('player:xpGain', callback);
    bus.emit('player:xpGain', { amount: 100 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('once sadece bir kez tetiklenmeli', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    bus.once('stat:changed', callback);
    bus.emit('stat:changed', {});
    bus.emit('stat:changed', {});
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('clear tum dinleyicileri temizlemeli', () => {
    const bus = new EventBus();
    const callback = vi.fn();
    bus.on('player:levelUp', callback);
    bus.clear();
    bus.emit('player:levelUp', { level: 2 });
    expect(callback).not.toHaveBeenCalled();
  });

  it('birden fazla dinleyici desteklenmeli', () => {
    const bus = new EventBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on('player:xpGain', cb1);
    bus.on('player:xpGain', cb2);
    bus.emit('player:xpGain', { amount: 50 });
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });
});
