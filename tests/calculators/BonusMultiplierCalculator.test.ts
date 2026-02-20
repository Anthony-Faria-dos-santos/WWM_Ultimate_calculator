import { describe, it, expect, beforeEach } from 'vitest';
import {
  BonusMultiplierCalculator,
  BonusCategory,
  type DamageBonus,
} from '@/lib/calculators/BonusMultiplierCalculator';

describe('BonusMultiplierCalculator — 同类相加，异类相乘', () => {
  let calculator: BonusMultiplierCalculator;

  beforeEach(() => {
    calculator = new BonusMultiplierCalculator();
  });

  describe('calculateBonusMultiplier', () => {
    it('should return 1.0 with no bonuses', () => {
      // Act & Assert — aucun bonus → multiplicateur neutre
      expect(calculator.calculateBonusMultiplier([])).toBe(1.0);
    });

    it('should add same-type bonuses (同类相加)', () => {
      // Arrange — deux bonus de même catégorie s'additionnent
      // DamageIncrease: +20% + +10% = +30% → multiplicateur 1.30
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
        { category: BonusCategory.DamageIncrease, value: 0.10, source: 'Talent' },
      ];

      // Act
      const result = calculator.calculateBonusMultiplier(bonuses);

      // Assert — (1 + 0.20 + 0.10) = 1.30
      expect(result).toBeCloseTo(1.30);
    });

    it('should multiply different-type bonuses (异类相乘)', () => {
      // Arrange — deux bonus de catégories différentes se multiplient
      // DamageIncrease: +30%, SkillDamage: +15% → 1.30 × 1.15 = 1.495
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.30, source: 'Arme' },
        { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
      ];

      // Act
      const result = calculator.calculateBonusMultiplier(bonuses);

      // Assert — 1.30 × 1.15 = 1.495
      expect(result).toBeCloseTo(1.495);
    });

    it('should handle mixed bonus types correctly', () => {
      // Arrange — deux DamageIncrease additionnés, puis multiplié par SkillDamage
      // DI: +20%+10% = +30% → ×1.30, SD: +15% → ×1.15 → total: 1.495
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
        { category: BonusCategory.DamageIncrease, value: 0.10, source: 'Talent' },
        { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set' },
      ];

      // Act
      const result = calculator.calculateBonusMultiplier(bonuses);

      // Assert
      expect(result).toBeCloseTo(1.495);
    });

    it('should handle single bonus', () => {
      // Arrange
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.ElementalDamage, value: 0.25, source: 'Élémentaire' },
      ];

      // Act
      const result = calculator.calculateBonusMultiplier(bonuses);

      // Assert — (1 + 0.25) = 1.25
      expect(result).toBeCloseTo(1.25);
    });

    it('should support negative values (debuffs)', () => {
      // Arrange — debuff qui réduit les dégâts
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.30, source: 'Buff' },
        { category: BonusCategory.DamageIncrease, value: -0.10, source: 'Debuff' },
      ];

      // Act
      const result = calculator.calculateBonusMultiplier(bonuses);

      // Assert — (1 + 0.30 - 0.10) = 1.20
      expect(result).toBeCloseTo(1.20);
    });
  });

  describe('getBreakdown', () => {
    it('should return empty map for empty bonus list', () => {
      const breakdown = calculator.getBreakdown([]);
      expect(breakdown.size).toBe(0);
    });

    it('should return correct sum and multiplier per category', () => {
      // Arrange
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.20, source: 'A' },
        { category: BonusCategory.DamageIncrease, value: 0.10, source: 'B' },
      ];

      // Act
      const breakdown = calculator.getBreakdown(bonuses);

      // Assert
      const di = breakdown.get(BonusCategory.DamageIncrease);
      expect(di?.sum).toBeCloseTo(0.30);
      expect(di?.multiplier).toBeCloseTo(1.30);
      expect(di?.sources).toHaveLength(2);
    });
  });
});
