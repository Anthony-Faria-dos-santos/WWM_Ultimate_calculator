import { describe, it, expect, beforeEach } from 'vitest';
import { AffinityCalculator } from '@/lib/calculators/AffinityCalculator';
import { createCharacter } from '../fixtures';

describe('AffinityCalculator', () => {
  let calculator: AffinityCalculator;

  beforeEach(() => {
    calculator = new AffinityCalculator();
  });

  describe('calculateAffinity', () => {
    it('should calculate affinity rate directly from character stat', () => {
      // Arrange — affinityRate: 0.25 (stat directe, pas de formule de scaling)
      const character = createCharacter(); // affinityRate: 0.25

      // Act
      const result = calculator.calculateAffinity(character);

      // Assert
      expect(result.affinityRate).toBeCloseTo(0.25);
      expect(result.rawAffinityRate).toBeCloseTo(0.25);
      expect(result.isCapped).toBe(false);
    });

    it('should cap affinity rate at 60% maximum', () => {
      // Arrange — affinityRate: 0.80 → capé à 0.60
      const character = createCharacter({ affinityRate: 0.80 });

      // Act
      const result = calculator.calculateAffinity(character);

      // Assert
      expect(result.affinityRate).toBeCloseTo(0.60);
      expect(result.rawAffinityRate).toBeCloseTo(0.80);
      expect(result.isCapped).toBe(true);
    });

    it('should handle zero affinityRate', () => {
      // Arrange
      const character = createCharacter({ affinityRate: 0 });

      // Act
      const result = calculator.calculateAffinity(character);

      // Assert
      expect(result.affinityRate).toBe(0);
      expect(result.isCapped).toBe(false);
    });

    it('should return the affinity damage multiplier of 1.35', () => {
      // Arrange
      const character = createCharacter();

      // Act
      const result = calculator.calculateAffinity(character);

      // Assert — multiplicateur d'affinité de base : ×1.35 (135% dégâts)
      expect(result.affinityMultiplier).toBeCloseTo(1.35);
    });
  });

  describe('isAffinity', () => {
    it('should return true when randomRoll <= affinityRate', () => {
      // Arrange — roll à 0 → toujours affinité (si rate > 0)
      const character = createCharacter(); // affinityRate: 0.25
      expect(calculator.isAffinity(character, 0)).toBe(true);
    });

    it('should return false when randomRoll exceeds affinityRate', () => {
      // Arrange — affinityRate: 0 → jamais affinité
      const character = createCharacter({ affinityRate: 0 });
      expect(calculator.isAffinity(character, 0.5)).toBe(false);
    });
  });

  describe('getAffinityMultiplier', () => {
    it('should return the base affinity damage multiplier (1.35)', () => {
      expect(calculator.getAffinityMultiplier()).toBeCloseTo(1.35);
    });
  });

  describe('getCombinedMultiplier', () => {
    it('should return 1.0 for normal hit (no crit, no affinity)', () => {
      expect(calculator.getCombinedMultiplier(false, false)).toBeCloseTo(1.0);
    });

    it('should return 1.5 for critical only', () => {
      expect(calculator.getCombinedMultiplier(true, false)).toBeCloseTo(1.5);
    });

    it('should return 1.35 for affinity only', () => {
      expect(calculator.getCombinedMultiplier(false, true)).toBeCloseTo(1.35);
    });

    it('should return 1.85 for critical + affinity (additif)', () => {
      // 1 + 0.50 (crit) + 0.35 (aff) = 1.85
      expect(calculator.getCombinedMultiplier(true, true)).toBeCloseTo(1.85);
    });
  });

  describe('isAtCap', () => {
    it('should return true when affinityRate exceeds 60% cap', () => {
      const character = createCharacter({ affinityRate: 0.70 });
      expect(calculator.isAtCap(character)).toBe(true);
    });

    it('should return false when affinityRate is below cap', () => {
      const character = createCharacter(); // affinityRate: 0.25
      expect(calculator.isAtCap(character)).toBe(false);
    });
  });
});
