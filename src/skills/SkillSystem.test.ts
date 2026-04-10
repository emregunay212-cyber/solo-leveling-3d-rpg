import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillSystem } from './SkillSystem';
import { SKILLS } from '../config/GameConfig';

// Mock InputManager
function createMockInput() {
  const keys = new Map<string, boolean>();
  return {
    isKeyDown: (code: string) => keys.get(code) ?? false,
    isBlocking: () => false,
    pressKey: (code: string) => keys.set(code, true),
    releaseKey: (code: string) => keys.set(code, false),
  };
}

describe('SkillSystem', () => {
  let system: SkillSystem;
  let input: ReturnType<typeof createMockInput>;

  beforeEach(() => {
    input = createMockInput();
    system = new SkillSystem(input as any);
  });

  it('4 skill slotu olmali', () => {
    expect(system.getSlots()).toHaveLength(4);
  });

  it('Q basilinca phantomStrike cast etmeli', () => {
    input.pressKey('KeyQ');
    const result = system.update(0.016, 100, 10, 10);
    expect(result).not.toBeNull();
    expect(result!.skill.id).toBe('phantomStrike');
  });

  it('MP yetersizse cast etmemeli', () => {
    input.pressKey('KeyQ');
    const result = system.update(0.016, 0, 10, 10); // 0 MP
    expect(result).toBeNull();
  });

  it('cooldown sirasinda cast etmemeli', () => {
    input.pressKey('KeyQ');
    system.update(0.016, 100, 10, 10); // ilk cast
    input.releaseKey('KeyQ');
    system.update(0.016, 100, 10, 10); // release frame
    input.pressKey('KeyQ');
    const result = system.update(0.016, 100, 10, 10); // tekrar bas
    expect(result).toBeNull(); // cooldown'da
  });

  it('cooldown bittikten sonra tekrar cast edebilmeli', () => {
    input.pressKey('KeyQ');
    system.update(0.016, 100, 10, 10);
    input.releaseKey('KeyQ');
    // Cooldown bitmesini bekle
    system.update(SKILLS.phantomStrike.cooldown + 0.1, 100, 10, 10);
    input.pressKey('KeyQ');
    const result = system.update(0.016, 100, 10, 10);
    expect(result).not.toBeNull();
  });

  it('E basilinca shadowShield buff aktif etmeli', () => {
    input.pressKey('KeyE');
    system.update(0.016, 100, 10, 10);
    expect(system.isShieldActive()).toBe(true);
    expect(system.getShieldReduction()).toBeGreaterThan(0);
  });

  it('shield buff suresi dolunca bitmeli', () => {
    input.pressKey('KeyE');
    system.update(0.016, 100, 10, 10);
    input.releaseKey('KeyE');
    // Buff suresini gecir
    system.update(SKILLS.shadowShield.duration + 0.1, 100, 10, 10);
    expect(system.isShieldActive()).toBe(false);
    expect(system.getShieldReduction()).toBe(0);
  });

  it('hasar STR bazli hesaplanmali (phantomStrike)', () => {
    input.pressKey('KeyQ');
    const result = system.update(0.016, 100, 20, 5); // STR=20
    expect(result).not.toBeNull();
    expect(result!.damage).toBe(Math.round(20 * SKILLS.phantomStrike.damageMultiplier));
  });

  it('hasar INT bazli hesaplanmali (shadowBurst)', () => {
    input.pressKey('KeyR');
    const result = system.update(0.016, 100, 5, 30); // INT=30
    expect(result).not.toBeNull();
    expect(result!.damage).toBe(Math.round(30 * SKILLS.shadowBurst.damageMultiplier));
  });

  it('F basilinca sovereignAura cast etmeli', () => {
    input.pressKey('KeyF');
    const result = system.update(0.016, 100, 10, 10);
    expect(result).not.toBeNull();
    expect(result!.skill.id).toBe('sovereignAura');
  });

  it('callback tetiklenmeli', () => {
    const cb = vi.fn();
    system.setOnCast(cb);
    input.pressKey('KeyQ');
    system.update(0.016, 100, 10, 10);
    expect(cb).toHaveBeenCalledOnce();
  });
});
