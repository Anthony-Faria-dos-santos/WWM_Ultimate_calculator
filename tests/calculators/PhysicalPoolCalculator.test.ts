import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicalPoolCalculator } from '@/lib/calculators/PhysicalPoolCalculator';
import { createCharacter, createSkill, createTarget } from '../fixtures';

describe('PhysicalPoolCalculator', () => {
  let calculator: PhysicalPoolCalculator;

  beforeEach(() => {
    calculator = new PhysicalPoolCalculator();
  });

  describe('calculatePhysicalPool', () => {
    it('should calculate base attack from attack × physicalRatio', () => {
      // Arrange
      const character = createCharacter({ attack: 2500 });
      const skill = createSkill({ physicalRatio: 1.5 });
      const target = createTarget({ defense: 0, shield: 0 });

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — 2500 × 1.5 = 3750
      expect(pool.baseAttack).toBe(3750);
    });

    it('should apply shield reduction correctly', () => {
      // Arrange
      const character = createCharacter({ attack: 2500, armorPenetration: 0 });
      const skill = createSkill({ physicalRatio: 1.0 });
      const target = createTarget({ shield: 0.20, defense: 0 });

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — baseAttack = 2500, afterShield = 2500 × 0.80 = 2000
      expect(pool.shieldReduction).toBe(0.20);
      expect(pool.afterShield).toBeCloseTo(pool.baseAttack * 0.8);
    });

    it('should apply defense reduction with armor penetration', () => {
      // Arrange — standardDPS (armorPen: 800) vs standardEnemy (defense: 1200)
      // netDefense = max(0, 1200 - 800) = 400 → reduction = 400/3260 ≈ 0.123
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });
      const target = createTarget();

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert
      expect(pool.defenseReduction).toBeGreaterThan(0);
      expect(pool.afterDefense).toBeLessThan(pool.afterShield);
      expect(pool.defenseReduction).toBeCloseTo(400 / (400 + 2860));
    });

    it('should handle zero shield', () => {
      // Arrange
      const character = createCharacter({ attack: 2000 });
      const skill = createSkill({ physicalRatio: 1.0 });
      const target = createTarget({ shield: 0 });

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — pas de réduction par bouclier
      expect(pool.shieldReduction).toBe(0);
      expect(pool.afterShield).toBe(pool.baseAttack);
    });

    it('should handle zero physical ratio', () => {
      // Arrange — compétence sans composante physique
      const character = createCharacter({ attack: 2500 });
      const skill = createSkill({ physicalRatio: 0 });
      const target = createTarget();

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — tout le pipeline produit 0
      expect(pool.baseAttack).toBe(0);
      expect(pool.afterShield).toBe(0);
      expect(pool.afterDefense).toBe(0);
    });

    it('should handle armor penetration exceeding defense', () => {
      // Arrange — armorPenetration (5000) > defense (1000) → netDefense = 0
      const character = createCharacter({ armorPenetration: 5000 });
      const skill = createSkill({ physicalRatio: 1.0 });
      const target = createTarget({ defense: 1000, shield: 0 });

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — reduction ≈ 0 car netDefense = max(0, 1000-5000) = 0
      expect(pool.defenseReduction).toBeCloseTo(0);
      expect(pool.afterDefense).toBeCloseTo(pool.afterShield);
    });

    it('should handle zero attack', () => {
      // Arrange
      const character = createCharacter({ attack: 0 });
      const skill = createSkill({ physicalRatio: 1.5 });
      const target = createTarget();

      // Act
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert — tout le pipeline reste à 0
      expect(pool.baseAttack).toBe(0);
      expect(pool.afterShield).toBe(0);
      expect(pool.afterDefense).toBe(0);
    });
  });

  describe('calculateFinalDamage', () => {
    it('should return the same value as calculatePhysicalPool.afterDefense', () => {
      // Arrange
      const character = createCharacter();
      const skill = createSkill({ physicalRatio: 1.0 });
      const target = createTarget();

      // Act
      const finalDamage = calculator.calculateFinalDamage(character, target, skill);
      const pool = calculator.calculatePhysicalPool(character, target, skill);

      // Assert
      expect(finalDamage).toBe(pool.afterDefense);
    });
  });

  describe('hasPhysicalDamage', () => {
    it('should return true when physicalRatio > 0', () => {
      const skill = createSkill({ physicalRatio: 1.5 });
      expect(calculator.hasPhysicalDamage(skill)).toBe(true);
    });

    it('should return false when physicalRatio is 0', () => {
      const skill = createSkill({ physicalRatio: 0 });
      expect(calculator.hasPhysicalDamage(skill)).toBe(false);
    });
  });
});
