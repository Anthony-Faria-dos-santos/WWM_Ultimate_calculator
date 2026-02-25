import { describe, it, expect, beforeEach } from 'vitest';
import {
  BonusMultiplierCalculator,
  DamageZone,
  BonusCategory,
  type DamageBonus,
} from '@/lib/calculators/BonusMultiplierCalculator';

describe('BonusMultiplierCalculator — 同类相加，异类相乘', () => {
  let calculator: BonusMultiplierCalculator;

  beforeEach(() => {
    calculator = new BonusMultiplierCalculator();
  });

  describe('calculateBonusMultiplier', () => {
    it('retourne 1.0 sans bonus', () => {
      expect(calculator.calculateBonusMultiplier([])).toBe(1.0);
    });

    it('additionne les bonus de même zone (同类相加)', () => {
      // Arrange — Augmentation : +20% + +10% = +30% → 1.30
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.20, source: 'Arme' },
        { category: DamageZone.Augmentation, value: 0.10, source: 'Talent' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      expect(result).toBeCloseTo(1.30);
    });

    it('multiplie les bonus de zones différentes (异类相乘)', () => {
      // Arrange — Augmentation +30% et Independent +15% → 1.30 × 1.15
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.30, source: 'Buff général' },
        { category: DamageZone.Independent, value: 0.15, source: 'Condition spéciale' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // (1 + 0.30) × (1 + 0.15) = 1.30 × 1.15 = 1.495
      expect(result).toBeCloseTo(1.495);
    });

    it('additionne intra-zone puis multiplie inter-zones', () => {
      // Arrange — 2× Augmentation additifs + 1× Independent multiplicatif
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.20, source: 'Arme' },
        { category: DamageZone.Augmentation, value: 0.10, source: 'Talent' },
        { category: DamageZone.Independent, value: 0.15, source: 'Condition spéciale' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // Augmentation: (1 + 0.20 + 0.10) = 1.30
      // Independent: (1 + 0.15) = 1.15
      // Total: 1.30 × 1.15 = 1.495
      expect(result).toBeCloseTo(1.495);
    });

    it('gère un bonus unique', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Deepening, value: 0.25, source: 'Attribut Bellstrike' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // Deepening avec sous-groupe unique → (1 + 0.25) = 1.25
      expect(result).toBeCloseTo(1.25);
    });

    it('gère les debuffs (valeurs négatives)', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.30, source: 'Buff' },
        { category: DamageZone.Augmentation, value: -0.10, source: 'Debuff' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // (1 + 0.30 - 0.10) = 1.20
      expect(result).toBeCloseTo(1.20);
    });

    it('agrège Independent de manière multiplicative par source', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Independent, value: 0.20, source: 'Source A' },
        { category: DamageZone.Independent, value: 0.10, source: 'Source B' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // (1 + 0.20) × (1 + 0.10) = 1.20 × 1.10 = 1.32
      expect(result).toBeCloseTo(1.32);
    });

    it('agrège Deepening par sous-groupe attribut', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Deepening, value: 0.20, source: 'Talent A', subGroup: 'bellstrike' },
        { category: DamageZone.Deepening, value: 0.10, source: 'Talent B', subGroup: 'bellstrike' },
        { category: DamageZone.Deepening, value: 0.15, source: 'Talent C', subGroup: 'bamboocut' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // bellstrike: (1 + 0.20 + 0.10) = 1.30
      // bamboocut: (1 + 0.15) = 1.15
      // Total: 1.30 × 1.15 = 1.495
      expect(result).toBeCloseTo(1.495);
    });

    it('agrège Reduction de manière multiplicative', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Reduction, value: -0.20, source: 'Bouclier ennemi' },
        { category: DamageZone.Reduction, value: -0.10, source: 'Armure ennemi' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // (1 - 0.20) × (1 - 0.10) = 0.80 × 0.90 = 0.72
      expect(result).toBeCloseTo(0.72);
    });

    it('combine 3 zones différentes correctement', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.30, source: 'Buff général' },
        { category: DamageZone.Independent, value: 0.20, source: 'Condition spéciale' },
        { category: DamageZone.Reduction, value: -0.10, source: 'Réduction cible' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // 1.30 × 1.20 × 0.90 = 1.404
      expect(result).toBeCloseTo(1.404);
    });
  });

  describe('getBreakdown', () => {
    it('retourne une map vide sans bonus', () => {
      const breakdown = calculator.getBreakdown([]);
      expect(breakdown.size).toBe(0);
    });

    it('retourne somme et multiplicateur corrects par zone', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.20, source: 'A' },
        { category: DamageZone.Augmentation, value: 0.10, source: 'B' },
      ];

      const breakdown = calculator.getBreakdown(bonuses);

      const aug = breakdown.get(DamageZone.Augmentation);
      expect(aug?.sum).toBeCloseTo(0.30);
      expect(aug?.multiplier).toBeCloseTo(1.30);
      expect(aug?.sources).toHaveLength(2);
    });

    it('retourne un breakdown multi-zones', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: DamageZone.Augmentation, value: 0.20, source: 'Buff' },
        { category: DamageZone.Independent, value: 0.15, source: 'Indép.' },
      ];

      const breakdown = calculator.getBreakdown(bonuses);

      expect(breakdown.size).toBe(2);

      const aug = breakdown.get(DamageZone.Augmentation);
      expect(aug?.multiplier).toBeCloseTo(1.20);

      const ind = breakdown.get(DamageZone.Independent);
      expect(ind?.multiplier).toBeCloseTo(1.15);
    });
  });

  describe('compatibilité BonusCategory (deprecated)', () => {
    it('BonusCategory mappe correctement vers DamageZone', () => {
      expect(BonusCategory.DamageIncrease).toBe(DamageZone.Augmentation);
      expect(BonusCategory.SkillDamage).toBe(DamageZone.Augmentation);
      expect(BonusCategory.ElementalDamage).toBe(DamageZone.Deepening);
      expect(BonusCategory.WeaponDamage).toBe(DamageZone.Augmentation);
      expect(BonusCategory.SetBonus).toBe(DamageZone.Augmentation);
      expect(BonusCategory.SpecialCondition).toBe(DamageZone.Independent);
    });

    it('fonctionne avec BonusCategory comme category', () => {
      const bonuses: readonly DamageBonus[] = [
        { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
        { category: BonusCategory.SpecialCondition, value: 0.15, source: 'Spécial' },
      ];

      const result = calculator.calculateBonusMultiplier(bonuses);

      // Augmentation(0.20) × Independent(0.15) = 1.20 × 1.15 = 1.38
      expect(result).toBeCloseTo(1.38);
    });
  });
});
