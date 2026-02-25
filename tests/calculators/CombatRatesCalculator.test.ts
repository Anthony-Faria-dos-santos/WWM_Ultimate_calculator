import { describe, it, expect, beforeEach } from 'vitest';
import { CombatRatesCalculator } from '@/lib/calculators/CombatRatesCalculator';
import { createCharacter, createTarget } from '../fixtures';

describe('CombatRatesCalculator', () => {
  let calculator: CombatRatesCalculator;

  beforeEach(() => {
    calculator = new CombatRatesCalculator();
  });

  describe('calculateCombatRates', () => {
    it('should return all five combat rates from character and target', () => {
      // Arrange — standardDPS vs standardEnemy
      const character = createCharacter();
      const target = createTarget();

      // Act
      const rates = calculator.calculateCombatRates(character, target);

      // Assert — toutes les propriétés doivent être présentes et valides
      // MAX_PRECISION_RATE = 1.0 (cap à 100% avec précision élevée)
      expect(rates.precisionRate).toBeGreaterThan(0);
      expect(rates.precisionRate).toBeLessThanOrEqual(1.0);
      expect(rates.critRate).toBeGreaterThan(0);
      expect(rates.critRate).toBeLessThanOrEqual(0.80);
      expect(rates.affinityRate).toBeCloseTo(0.25); // stat directe, cap 60%
      expect(rates.normalizedCritRate).toBeGreaterThan(0);
      expect(rates.normalizedAffinityRate).toBeGreaterThan(0);
    });

    it('should delegate to individual rate calculators', () => {
      // Arrange
      const character = createCharacter();
      const target = createTarget();

      // Act
      const rates = calculator.calculateCombatRates(character, target);
      const precision = calculator.calculatePrecision(character, target);
      const crit = calculator.calculateCritical(character, target);
      const affinity = calculator.calculateAffinity(character);

      // Assert — les helpers individuels doivent correspondre
      expect(rates.precisionRate).toBeCloseTo(precision);
      expect(rates.critRate).toBeCloseTo(crit);
      expect(rates.affinityRate).toBeCloseTo(affinity);
    });

    it('should normalize rates when crit + affinity exceed 100%', () => {
      // Arrange — critRate: 5000 → 0.80 (cap), affinityRate: 0.40 → total 1.20 > 1.0
      const character = createCharacter({ critRate: 5000, affinityRate: 0.40 });
      const target = createTarget();

      // Act
      const rates = calculator.calculateCombatRates(character, target);

      // Assert — normalisation appliquée : crit=0.80, aff=0.40 → total=1.20
      expect(rates.critRate).toBeCloseTo(0.80);
      expect(rates.affinityRate).toBeCloseTo(0.40);
      // Les taux normalisés doivent être < taux bruts
      expect(rates.normalizedCritRate).toBeLessThan(rates.critRate);
      expect(rates.normalizedAffinityRate).toBeLessThan(rates.affinityRate);
      // Les taux normalisés doivent conserver les proportions (ratio 0.80:0.40 = 2:1)
      const ratio = rates.normalizedCritRate / rates.normalizedAffinityRate;
      expect(ratio).toBeCloseTo(0.80 / 0.40, 2);
    });

    it('should not normalize when crit + affinity are within 100%', () => {
      // Arrange — critRate brute: 600 → ~0.449, affinityRate: 0.25 → total ≈ 0.699
      const character = createCharacter(); // critRate: 600, affinityRate: 0.25
      const target = createTarget();

      // Act
      const rates = calculator.calculateCombatRates(character, target);

      // Assert — pas de normalisation nécessaire
      expect(rates.normalizedCritRate).toBeCloseTo(rates.critRate);
      expect(rates.normalizedAffinityRate).toBeCloseTo(rates.affinityRate);
    });
  });

  describe('calculatePrecision', () => {
    it('should return precision rate capped at 1.0 for high precision', () => {
      // precision: 3000, parry: 0 → 1.43 × 3000/3150 = 1.362 → capé à 1.0
      const character = createCharacter(); // precision: 3000
      const target = createTarget({ parry: 0 });
      const rate = calculator.calculatePrecision(character, target);
      expect(rate).toBeCloseTo(1.0); // MAX_PRECISION_RATE = 1.0
    });
  });

  describe('calculateCritical', () => {
    it('should return critical rate for character vs target', () => {
      // standardDPS: critRate: 600 → 1.15 × 600/1538 ≈ 0.449
      const character = createCharacter(); // critRate: 600
      const target = createTarget({ critResistance: 0 });
      const rate = calculator.calculateCritical(character, target);
      expect(rate).toBeCloseTo(0.449, 2);
    });
  });

  describe('calculateAffinity', () => {
    it('should return affinity rate as direct stat (capped at 60%)', () => {
      const character = createCharacter(); // affinityRate: 0.25
      const rate = calculator.calculateAffinity(character);
      expect(rate).toBeCloseTo(0.25);
    });
  });

  describe('needsNormalization', () => {
    it('should return true when critRate + affinityRate exceeds 100%', () => {
      const character = createCharacter({ critRate: 5000, affinityRate: 0.40 });
      const target = createTarget();
      const rates = calculator.calculateCombatRates(character, target);
      expect(calculator.needsNormalization(rates)).toBe(true);
    });

    it('should return false when total is within 100%', () => {
      const character = createCharacter(); // total ≈ 69.9%
      const target = createTarget();
      const rates = calculator.calculateCombatRates(character, target);
      expect(calculator.needsNormalization(rates)).toBe(false);
    });
  });
});
