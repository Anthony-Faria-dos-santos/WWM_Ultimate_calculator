import { describe, it, expect, beforeEach } from 'vitest';
import { CriticalCalculator } from '@/lib/calculators/CriticalCalculator';
import { createCharacter } from '../fixtures';

describe('CriticalCalculator', () => {
  let calculator: CriticalCalculator;

  beforeEach(() => {
    calculator = new CriticalCalculator();
  });

  describe('calculateCritical', () => {
    it('should calculate crit rate from character critRate stat', () => {
      // Arrange — standardDPS: critRate brute 600
      // 1.15 × (600 / (600 + 938)) = 1.15 × 600/1538 ≈ 0.449
      const character = createCharacter(); // critRate: 600

      // Act
      const result = calculator.calculateCritical(character);

      // Assert
      expect(result.criticalRate).toBeCloseTo(0.449, 2);
      expect(result.criticalStat).toBe(600);
      expect(result.targetCritResistance).toBe(0);
      expect(result.isCapped).toBe(false);
    });

    it('should cap crit rate at 80% maximum', () => {
      // Arrange — critRate: 5000 → 1.15 × 5000/5938 ≈ 0.968 → capé à 0.80
      const character = createCharacter({ critRate: 5000 });

      // Act
      const result = calculator.calculateCritical(character);

      // Assert
      expect(result.criticalRate).toBeCloseTo(0.80);
      expect(result.isCapped).toBe(true);
    });

    it('should handle zero critRate', () => {
      // Arrange
      const character = createCharacter({ critRate: 0 });

      // Act
      const result = calculator.calculateCritical(character);

      // Assert
      expect(result.criticalRate).toBeCloseTo(0);
      expect(result.isCapped).toBe(false);
    });

    it('should return the crit damage multiplier of 1.5', () => {
      // Arrange
      const character = createCharacter();

      // Act
      const result = calculator.calculateCritical(character);

      // Assert — multiplicateur critique de base : ×1.5 (150% dégâts)
      expect(result.critMultiplier).toBe(1.5);
    });

    it('should reduce crit rate when target has crit resistance', () => {
      // Arrange — net crit = max(0, 600 - 300) = 300
      // 1.15 × (300 / (300 + 938)) ≈ 0.279
      const character = createCharacter({ critRate: 600 });

      // Act
      const withResistance = calculator.calculateCritical(character, { targetCritResistance: 300 });
      const withoutResistance = calculator.calculateCritical(character);

      // Assert — la résistance réduit le taux de critique
      expect(withResistance.criticalRate).toBeLessThan(withoutResistance.criticalRate);
      expect(withResistance.criticalRate).toBeCloseTo(0.279, 2);
    });
  });

  describe('isCritical', () => {
    it('should return true when randomRoll <= criticalRate', () => {
      // Arrange — roll à 0 → toujours un critique (si critRate > 0)
      const character = createCharacter();
      expect(calculator.isCritical(character, {}, 0)).toBe(true);
    });

    it('should return false when randomRoll exceeds criticalRate', () => {
      // Arrange — critRate: 0 → jamais critique
      const character = createCharacter({ critRate: 0 });
      expect(calculator.isCritical(character, {}, 0.5)).toBe(false);
    });
  });

  describe('getCritMultiplier', () => {
    it('should return the base critical damage multiplier (1.5)', () => {
      expect(calculator.getCritMultiplier()).toBe(1.5);
    });
  });

  describe('getCriticalRequiredForCap', () => {
    it('should return stat that achieves 80% critical rate', () => {
      const required = calculator.getCriticalRequiredForCap(0);
      const character = createCharacter({ critRate: required });
      const result = calculator.calculateCritical(character);
      expect(result.isCapped).toBe(true);
    });
  });

  describe('isAtCap', () => {
    it('should return true when critRate reaches 80% cap', () => {
      const character = createCharacter({ critRate: 5000 });
      expect(calculator.isAtCap(character)).toBe(true);
    });

    it('should return false when critRate is below cap', () => {
      const character = createCharacter(); // critRate: 600 → ~44.9%
      expect(calculator.isAtCap(character)).toBe(false);
    });
  });
});
