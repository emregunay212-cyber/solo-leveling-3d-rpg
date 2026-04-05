import { describe, it, expect, beforeEach } from 'vitest';
import { ComboSystem } from './ComboSystem';
import { COMBO } from '../config/GameConfig';

describe('ComboSystem', () => {
  let combo: ComboSystem;

  beforeEach(() => {
    combo = new ComboSystem();
  });

  it('ilk saldiri basarili olmali', () => {
    const result = combo.tryAttack();
    expect(result).not.toBeNull();
    expect(result!.damageMultiplier).toBe(COMBO.hits[0].damageMultiplier);
    expect(result!.isFinisher).toBe(false);
  });

  it('cooldown sirasinda saldiri basarisiz olmali', () => {
    combo.tryAttack();
    const result = combo.tryAttack();
    expect(result).toBeNull();
  });

  it('cooldown sonrasi ikinci hit gelmeli', () => {
    combo.tryAttack();
    // Cooldown'u bitir ama combo window icinde kal
    const cooldown = COMBO.hits[0].duration + COMBO.cooldownBuffer + 0.01;
    combo.update(cooldown);
    const result = combo.tryAttack();
    expect(result).not.toBeNull();
    expect(result!.damageMultiplier).toBe(COMBO.hits[1].damageMultiplier);
  });

  it('ucuncu hit finisher olmali', () => {
    combo.tryAttack();
    const cd1 = COMBO.hits[0].duration + COMBO.cooldownBuffer + 0.01;
    combo.update(cd1);
    combo.tryAttack();
    const cd2 = COMBO.hits[1].duration + COMBO.cooldownBuffer + 0.01;
    combo.update(cd2);
    const result = combo.tryAttack();
    expect(result).not.toBeNull();
    expect(result!.isFinisher).toBe(true);
    expect(result!.damageMultiplier).toBe(COMBO.hits[2].damageMultiplier);
  });

  it('resetCombo combo index\'i sifirlamali', () => {
    combo.tryAttack();
    combo.resetCombo();
    expect(combo.getComboIndex()).toBe(0);
  });

  it('attack speed ayarlanabilmeli', () => {
    combo.setAttackSpeed(1.5);
    expect(combo.getAttackSpeed()).toBe(1.5);
  });

  it('minimum attack speed siniri olmali', () => {
    combo.setAttackSpeed(0.01);
    expect(combo.getAttackSpeed()).toBeGreaterThanOrEqual(COMBO.minAttackSpeedMultiplier);
  });
});
