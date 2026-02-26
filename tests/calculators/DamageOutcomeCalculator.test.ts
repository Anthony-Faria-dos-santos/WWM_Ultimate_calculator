import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DamageOutcomeCalculator } from '@/lib/calculators/DamageOutcomeCalculator';
import { CombatOutcome } from '@/lib/types';
import { DamageZone, type DamageBonus } from '@/lib/calculators/BonusMultiplierCalculator';
import { createCharacter, createSkill, TEST_FIXTURES } from '../fixtures';

// standardDPS vs weakEnemy : aucune réduction → baseDamage = attack × physicalRatio
// Rolls Math.random (3 appels) : [précision, critique, affinité]
// precisionRate = 1.0 → roll < 1.0 toujours touche
// normalizedCritRate ≈ 0.449 → roll < 0.449 → crit
// normalizedAffinityRate = 0.25 → roll < 0.25 → aff

describe('DamageOutcomeCalculator', () => {
  let calculator: DamageOutcomeCalculator;
  const weakEnemy = TEST_FIXTURES.targets.weakEnemy;

  beforeEach(() => {
    calculator = new DamageOutcomeCalculator();
    vi.restoreAllMocks();
  });

  describe('calculateDamage (déterministe)', () => {
    it('should calculate deterministic damage for a normal hit', () => {
      // Arrange — [hit, no-crit, no-aff] → Normal
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // précision < 1.0 → hit
        .mockReturnValueOnce(0.9)  // crit roll >= 0.449 → pas de crit
        .mockReturnValueOnce(0.9); // aff roll >= 0.25 → pas d'aff
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateDamage(character, skill, weakEnemy);

      // Assert
      expect(result.outcome).toBe(CombatOutcome.Normal);
      expect(result.critMultiplier).toBe(1.0);
      expect(result.affinityMultiplier).toBe(1.0);
      expect(result.finalDamage).toBeCloseTo(result.baseDamage);
    });

    it('should calculate damage with critical hit', () => {
      // Arrange — [hit, crit, no-aff] → Critical
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // hit
        .mockReturnValueOnce(0.1)  // crit roll < 0.449 → crit
        .mockReturnValueOnce(0.9); // no aff
      const character = createCharacter(); // critDamage: 0.30

      // Act
      const result = calculator.calculateDamage(character, createSkill({ physicalRatio: 1.0 }), weakEnemy);

      // Assert — critMult = 1.5 + 0.30 = 1.80
      expect(result.outcome).toBe(CombatOutcome.Critical);
      expect(result.critMultiplier).toBeCloseTo(1.80);
      expect(result.finalDamage).toBeCloseTo(result.baseDamage * 1.80);
    });

    it('should calculate damage with affinity proc', () => {
      // Arrange — [hit, no-crit, aff] → Affinity
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)  // hit
        .mockReturnValueOnce(0.9)  // no crit
        .mockReturnValueOnce(0.1); // aff roll < 0.25 → aff
      const character = createCharacter(); // affinityDamage: 0.15

      // Act
      const result = calculator.calculateDamage(character, createSkill({ physicalRatio: 1.0 }), weakEnemy);

      // Assert — affMult = 1.35 + 0.15 = 1.50
      expect(result.outcome).toBe(CombatOutcome.Affinity);
      expect(result.affinityMultiplier).toBeCloseTo(1.50);
      expect(result.finalDamage).toBeCloseTo(result.baseDamage * 1.50);
    });

    it('should return minimum damage (MIN_DAMAGE) for zero attack', () => {
      // Arrange — attack = 0 → baseDamage = 0
      // DamageOutcomeCalculator applique Math.max(STAT_LIMITS.MIN_DAMAGE, ...) = 1
      const character = createCharacter({ attack: 0, elementalAttack: 0 });
      const skill = createSkill({ physicalRatio: 1.0, elementalRatio: 0 });

      // Act
      const result = calculator.calculateDamage(character, skill, weakEnemy);

      // Assert — baseDamage = 0, finalDamage = MIN_DAMAGE (1)
      expect(result.baseDamage).toBe(0);
      expect(result.finalDamage).toBe(1); // STAT_LIMITS.MIN_DAMAGE garantit un dégât minimum
    });
  });

  describe('calculateExpectedDamage (Expected Value)', () => {
    it('should calculate expected damage higher than base damage', () => {
      // Arrange — standardDPS vs weakEnemy, baseDamage = 2500
      // EV > baseDamage car les multiplicateurs critiques/affinités sont > 1
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });

      // Act
      const result = calculator.calculateExpectedDamage(character, skill, weakEnemy);

      // Assert
      expect(result.outcome).toBe(CombatOutcome.Normal); // convention mode EV
      expect(result.baseDamage).toBeCloseTo(2500);       // attack: 2500 × ratio: 1.0, pas de réduction
      expect(result.finalDamage).toBeGreaterThan(result.baseDamage);
    });

    it('should integrate pools, rates, and bonuses correctly', () => {
      // Arrange — Augmentation +30% × Independent +15% = 1.30 × 1.15 = 1.495
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.30, source: 'Buff général' },
        { category: DamageZone.Independent, value: 0.15, source: 'Condition spéciale' },
      ];

      // Act
      const withBonus = calculator.calculateExpectedDamage(character, skill, weakEnemy, bonuses);
      const withoutBonus = calculator.calculateExpectedDamage(character, skill, weakEnemy, []);

      // Assert — le multiplicateur de bonus doit être 1.495
      expect(withBonus.bonusMultipliers).toBeCloseTo(1.495);
      expect(withBonus.finalDamage).toBeCloseTo(withoutBonus.finalDamage * 1.495);
    });
  });
});
