import { describe, it, expect, beforeEach } from 'vitest';
import { ElementalPoolCalculator } from '@/lib/calculators/ElementalPoolCalculator';
import { createCharacter, createSkill, createTarget } from '../fixtures';

describe('ElementalPoolCalculator', () => {
  let calculator: ElementalPoolCalculator;

  beforeEach(() => {
    calculator = new ElementalPoolCalculator();
  });

  describe('calculateElementalPool', () => {
    it('should calculate base elemental attack from elementalAttack × elementalRatio', () => {
      // Arrange
      const character = createCharacter({ elementalAttack: 1800, elementalPenetration: 0 });
      const skill = createSkill({ elementalRatio: 2.0 });
      const target = createTarget({ resistance: 0 });

      // Act
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert — 1800 × 2.0 = 3600
      expect(pool.baseElemental).toBe(3600);
    });

    it('should apply resistance reduction correctly', () => {
      // Arrange — resistance = 530, penetration = 0
      // netResistance = 530 → reduction = 530/(530+530) = 0.5 (50%)
      const character = createCharacter({ elementalAttack: 1800, elementalPenetration: 0 });
      const skill = createSkill({ elementalRatio: 1.0 });
      const target = createTarget({ resistance: 530 });

      // Act
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert
      expect(pool.resistanceReduction).toBeCloseTo(0.5);
      expect(pool.afterResistance).toBeCloseTo(pool.baseElemental * 0.5);
    });

    it('should handle resistance penetration', () => {
      // Arrange — même cible, même perso, mais avec/sans pénétration
      // resistance: 400, penetration: 200 → netResistance = 200 → moins de réduction
      const character = createCharacter({ elementalAttack: 1800, elementalPenetration: 200 });
      const characterNoPen = createCharacter({ elementalAttack: 1800, elementalPenetration: 0 });
      const skill = createSkill({ elementalRatio: 1.0 });
      const target = createTarget({ resistance: 400 });

      // Act
      const poolWithPen = calculator.calculateElementalPool(character, target, skill);
      const poolNoPen = calculator.calculateElementalPool(characterNoPen, target, skill);

      // Assert — la pénétration réduit la résistance nette → plus de dégâts
      expect(poolWithPen.resistanceReduction).toBeLessThan(poolNoPen.resistanceReduction);
      expect(poolWithPen.afterResistance).toBeGreaterThan(poolNoPen.afterResistance);
    });

    it('should handle zero elemental ratio', () => {
      // Arrange — compétence sans composante élémentaire
      const character = createCharacter({ elementalAttack: 1800 });
      const skill = createSkill({ elementalRatio: 0 });
      const target = createTarget();

      // Act
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert — pas de dégâts élémentaires
      expect(pool.baseElemental).toBe(0);
      expect(pool.afterResistance).toBe(0);
    });

    it('should handle zero resistance', () => {
      // Arrange — résistance nulle → aucune réduction (plein dégâts)
      const character = createCharacter({ elementalAttack: 1800, elementalPenetration: 0 });
      const skill = createSkill({ elementalRatio: 1.0 });
      const target = createTarget({ resistance: 0 });

      // Act
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert
      expect(pool.resistanceReduction).toBeCloseTo(0);
      expect(pool.afterResistance).toBeCloseTo(pool.baseElemental);
    });

    it('should handle penetration exceeding resistance', () => {
      // Arrange — penetration (600) > resistance (300) → netResistance = -300
      // La résistance négative est traitée comme une faiblesse élémentaire (bonus dégâts)
      const character = createCharacter({ elementalAttack: 1800, elementalPenetration: 600 });
      const skill = createSkill({ elementalRatio: 1.0 });
      const target = createTarget({ resistance: 300 });

      // Act
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert — réduction < 0 → multiplicateur de dégâts > 1
      expect(pool.resistanceReduction).toBeLessThan(0);
      expect(pool.afterResistance).toBeGreaterThan(pool.baseElemental);
    });
  });

  describe('calculateFinalDamage', () => {
    it('should return the same value as calculateElementalPool.afterResistance', () => {
      // Arrange
      const character = createCharacter();
      const skill = createSkill({ elementalRatio: 1.5 });
      const target = createTarget();

      // Act
      const finalDamage = calculator.calculateFinalDamage(character, target, skill);
      const pool = calculator.calculateElementalPool(character, target, skill);

      // Assert
      expect(finalDamage).toBe(pool.afterResistance);
    });
  });

  describe('hasElementalDamage', () => {
    it('should return true when elementalRatio > 0', () => {
      const skill = createSkill({ elementalRatio: 2.0 });
      expect(calculator.hasElementalDamage(skill)).toBe(true);
    });

    it('should return false when elementalRatio is 0', () => {
      const skill = createSkill({ elementalRatio: 0 });
      expect(calculator.hasElementalDamage(skill)).toBe(false);
    });
  });

  describe('getResistanceReductionPercent', () => {
    it('should calculate resistance reduction correctly', () => {
      // Arrange — resistance: 530, penetration: 0 → 530/(530+530) = 0.5
      const target = createTarget({ resistance: 530 });

      // Act
      const reduction = calculator.getResistanceReductionPercent(target, 0);

      // Assert
      expect(reduction).toBeCloseTo(0.5);
    });

    it('should return 0 when penetration equals resistance', () => {
      // Arrange — netResistance = 400 - 400 = 0 → reduction = 0
      const target = createTarget({ resistance: 400 });

      // Act
      const reduction = calculator.getResistanceReductionPercent(target, 400);

      // Assert
      expect(reduction).toBeCloseTo(0);
    });
  });
});
