import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealCalculator } from '@/lib/calculators/HealCalculator';
import { createCharacter, createSkill } from '../fixtures';

describe('HealCalculator', () => {
  let calculator: HealCalculator;

  beforeEach(() => {
    calculator = new HealCalculator();
    vi.restoreAllMocks();
  });

  describe('calculateHeal (déterministe)', () => {
    it('should calculate base heal from attack × physicalRatio', () => {
      // Arrange — baseHeal = attack × physicalRatio (indépendant du crit roll)
      const character = createCharacter({ attack: 2500 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateHeal(character, skill, 0);

      // Assert — baseHeal toujours = 2500 × 1.0
      expect(result.baseHeal).toBe(2500);
      expect(result.healBonus).toBe(0);
      expect(result.finalHeal).toBeGreaterThan(0);
    });

    it('should apply critical multiplier to heal', () => {
      // Arrange — forcer un coup critique (roll < critRate)
      vi.spyOn(Math, 'random').mockReturnValue(0); // roll = 0 < tout critRate > 0
      const character = createCharacter({ attack: 2500, critRate: 600, critDamage: 0.30 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateHeal(character, skill, 0);

      // Assert — critique : baseHeal × (1.5 + 0.30) = 2500 × 1.80 = 4500
      expect(result.isCritical).toBe(true);
      expect(result.critMultiplier).toBeCloseTo(1.80); // 1.5 + critDamage(0.30)
      expect(result.finalHeal).toBeCloseTo(4500);
    });

    it('should apply heal bonus to final heal', () => {
      // Arrange — pas de crit (roll = 1.0 → jamais critique)
      vi.spyOn(Math, 'random').mockReturnValue(1.0);
      const character = createCharacter({ attack: 2500, critRate: 0 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateHeal(character, skill, 0.20);

      // Assert — finalHeal = 2500 × 1.0 × (1 + 0.20) = 3000
      expect(result.healBonus).toBe(0.20);
      expect(result.finalHeal).toBeCloseTo(3000);
    });

    it('should handle zero heal power (attack = 0)', () => {
      // Arrange
      const character = createCharacter({ attack: 0 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateHeal(character, skill, 0);

      // Assert
      expect(result.baseHeal).toBe(0);
      expect(result.finalHeal).toBe(0);
    });
  });

  describe('calculateExpectedHeal (Expected Value)', () => {
    it('should calculate expected heal as weighted average', () => {
      // Arrange — mode EV : pas de roll aléatoire
      // critRate ≈ 0.449, critDamageMult = 1.80
      // expectedMult = 1 + 0.449 × (1.80 - 1) = 1 + 0.359 = 1.359
      // finalHeal = 2500 × 1.0 × 1.359 ≈ 3398
      const character = createCharacter({ attack: 2500, critRate: 600, critDamage: 0.30 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedHeal(character, skill, 0);

      // Assert
      expect(result.isCritical).toBe(false); // convention EV : pas de roll réel
      expect(result.baseHeal).toBe(2500);
      expect(result.finalHeal).toBeGreaterThan(result.baseHeal); // EV > base car critRate > 0
    });

    it('should apply heal bonus in expected value mode', () => {
      // Arrange
      const character = createCharacter({ attack: 2500, critRate: 0, critDamage: 0 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act — critRate = 0 → expectedMult = 1.0, finalHeal = 2500 × 1.20 = 3000
      const result = calculator.calculateExpectedHeal(character, skill, 0.20);

      // Assert
      expect(result.finalHeal).toBeCloseTo(3000);
      expect(result.healBonus).toBe(0.20);
    });
  });
});
