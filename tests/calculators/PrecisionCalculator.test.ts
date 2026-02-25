import { describe, it, expect, beforeEach } from 'vitest';
import { PrecisionCalculator } from '@/lib/calculators/PrecisionCalculator';
import { createCharacter } from '../fixtures';

describe('PrecisionCalculator', () => {
  let calculator: PrecisionCalculator;

  beforeEach(() => {
    calculator = new PrecisionCalculator();
  });

  describe('calculatePrecision', () => {
    it('should calculate hit rate from precision vs target parry', () => {
      // Arrange — precision: 300, parry: 1000 (non capé)
      // 1.43 × 300 / (300 + 1000 + 150) = 429/1450 ≈ 0.296
      const character = createCharacter({ precision: 300 });

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 1000 });

      // Assert
      expect(result.hitRate).toBeCloseTo(0.296, 2);
      expect(result.precisionStat).toBe(300);
      expect(result.targetParry).toBe(1000);
    });

    it('should cap hit rate at 100% maximum', () => {
      // Arrange — precision: 3000 vs parry: 150 → 4290/3300 = 1.30 → capé à 1.0
      const character = createCharacter(); // precision: 3000

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 150 });

      // Assert — MAX_PRECISION_RATE = 1.0
      expect(result.hitRate).toBeCloseTo(1.0);
      expect(result.isCapped).toBe(true);
    });

    it('should handle minimum precision without going below zero', () => {
      // Arrange — precision: 0 → hitRate = 0
      const character = createCharacter({ precision: 0 });

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 300 });

      // Assert
      expect(result.hitRate).toBeGreaterThanOrEqual(0);
      expect(result.hitRate).toBeCloseTo(0);
      expect(result.isCapped).toBe(false);
    });

    it('should return miss rate as 1 - hitRate', () => {
      // Arrange
      const character = createCharacter({ precision: 300 });

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 1000 });

      // Assert
      expect(result.missChance).toBeCloseTo(1 - result.hitRate);
    });

    it('should handle equal precision and target parry', () => {
      // Arrange — precision = parry = 500
      // 1.43 × 500 / (500 + 500 + 150) = 715/1150 ≈ 0.622
      const character = createCharacter({ precision: 500 });

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 500 });

      // Assert
      expect(result.hitRate).toBeCloseTo(0.622, 2);
      expect(result.isCapped).toBe(false);
    });
  });

  describe('canHit', () => {
    it('should return true when randomRoll <= hitRate', () => {
      // Arrange — précision maximale, roll à 0 → toujours vrai
      const character = createCharacter(); // precision: 3000 → capped at 0.95
      expect(calculator.canHit(character, {}, 0)).toBe(true);
    });

    it('should return false when randomRoll exceeds hitRate', () => {
      // Arrange — precision: 0 → hitRate = 0, roll > 0 → toujours faux
      const character = createCharacter({ precision: 0 });
      expect(calculator.canHit(character, {}, 0.5)).toBe(false);
    });
  });

  describe('getMissChance', () => {
    it('should return 1 - hitRate', () => {
      const character = createCharacter({ precision: 300 });
      const result = calculator.calculatePrecision(character, { targetParry: 1000 });
      const missChance = calculator.getMissChance(character, { targetParry: 1000 });
      expect(missChance).toBeCloseTo(1 - result.hitRate);
    });
  });

  describe('getPrecisionRequiredForCap', () => {
    it('should return precision that achieves the 95% cap', () => {
      // Arrange — calcule la précision requise contre parry=0
      const required = calculator.getPrecisionRequiredForCap(0);
      const character = createCharacter({ precision: required });

      // Act
      const result = calculator.calculatePrecision(character, { targetParry: 0 });

      // Assert — avec la précision requise, le cap doit être atteint
      expect(result.isCapped).toBe(true);
    });
  });

  describe('isAtCap', () => {
    it('should return true when precision reaches the 95% cap', () => {
      const character = createCharacter(); // precision: 3000 → cap vs parry: 0
      expect(calculator.isAtCap(character, { targetParry: 0 })).toBe(true);
    });

    it('should return false when precision is below cap', () => {
      const character = createCharacter({ precision: 300 });
      expect(calculator.isAtCap(character, { targetParry: 1000 })).toBe(false);
    });
  });
});
