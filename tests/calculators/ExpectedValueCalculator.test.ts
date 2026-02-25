import { describe, it, expect, beforeEach } from 'vitest';
import { ExpectedValueCalculator } from '@/lib/calculators/ExpectedValueCalculator';
import { CombatOutcome } from '@/lib/types';
import { createCharacter, createSkill, TEST_FIXTURES } from '../fixtures';

describe('ExpectedValueCalculator', () => {
  let calculator: ExpectedValueCalculator;
  const weakEnemy = TEST_FIXTURES.targets.weakEnemy;

  beforeEach(() => {
    calculator = new ExpectedValueCalculator();
  });

  describe('calculateExpectedValue', () => {
    it('should calculate expected value as weighted average', () => {
      // Arrange — standardDPS vs weakEnemy : baseDamage = attack × ratio = 2500
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedValue(character, skill, weakEnemy);

      // Assert — EV > baseDamage car critRate > 0 et affinityRate > 0
      expect(result.expectedDamage).toBeGreaterThan(0);
      // Avec précision à 100% et critRate > 0 : EV > Normal damage (2500)
      expect(result.expectedDamage).toBeGreaterThan(2500);
    });

    it('should have probabilities summing to 1.0', () => {
      // Arrange
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedValue(character, skill, weakEnemy);
      const d = result.distribution;

      // Assert — Σ P_i = 1.0 (propriété fondamentale d'une distribution de probabilités)
      const totalProbability =
        d.missProbability +
        d.normalProbability +
        d.critProbability +
        d.affinityProbability +
        d.critAffinityProbability +
        d.abrasionProbability;

      expect(totalProbability).toBeCloseTo(1.0, 4);
    });

    it('should return higher EV with higher crit rate', () => {
      // Arrange — même setup mais critRate différents
      const highCritChar = createCharacter({ critRate: 2000, critDamage: 0.30 });
      const lowCritChar = createCharacter({ critRate: 100, critDamage: 0.30 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const highCritResult = calculator.calculateExpectedValue(highCritChar, skill, weakEnemy);
      const lowCritResult = calculator.calculateExpectedValue(lowCritChar, skill, weakEnemy);

      // Assert — plus de critique = EV plus élevée
      expect(highCritResult.expectedDamage).toBeGreaterThan(lowCritResult.expectedDamage);
      expect(highCritResult.distribution.critProbability).toBeGreaterThan(
        lowCritResult.distribution.critProbability
      );
    });

    it('should return correct distribution breakdown', () => {
      // Arrange — standardDPS vs weakEnemy (parry=0 → hitRate=1.0)
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedValue(character, skill, weakEnemy);
      const d = result.distribution;

      // Assert — toutes les probabilités entre 0 et 1
      expect(d.missProbability).toBeGreaterThanOrEqual(0);
      expect(d.normalProbability).toBeGreaterThan(0);
      expect(d.critProbability).toBeGreaterThan(0);     // critRate: 600 → ~45%
      expect(d.affinityProbability).toBeGreaterThan(0); // affinityRate: 0.25
      expect(d.critAffinityProbability).toBeGreaterThan(0);
      expect(d.abrasionProbability).toBe(0); // Non implémenté actuellement

      // Les dégâts par outcome existent dans le record
      expect(result.damageByOutcome[CombatOutcome.Normal]).toBeGreaterThan(0);
      expect(result.damageByOutcome[CombatOutcome.Critical]).toBeGreaterThan(
        result.damageByOutcome[CombatOutcome.Normal]
      );
    });

    it('should handle zero crit and zero affinity', () => {
      // Arrange — critRate: 0, affinityRate: 0 → seuls Miss et Normal possibles
      const character = createCharacter({ critRate: 0, affinityRate: 0 });
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedValue(character, skill, weakEnemy);
      const d = result.distribution;

      // Assert — pas de crit ni d'affinité dans la distribution
      expect(d.critProbability).toBeCloseTo(0);
      expect(d.affinityProbability).toBeCloseTo(0);
      expect(d.critAffinityProbability).toBeCloseTo(0);
      // EV = baseDamage × 1.0 (seulement Normal avec précision à 100%)
      expect(result.expectedDamage).toBeCloseTo(result.damageByOutcome[CombatOutcome.Normal]);
      // variance nulle (tous les coups font le même dégât)
      expect(result.variance).toBeCloseTo(0, 1);
    });
  });
});
