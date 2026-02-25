/**
 * Tests for CombatService
 * 
 * Vérifie que le service façade orchestre correctement tous les calculateurs.
 * 
 * @module tests/services
 */

import { describe, it, expect } from 'vitest';
import { CombatService } from '@/lib/services';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import { SkillElement, SkillCategory, DamageType } from '@/lib/types';
import { BonusCategory } from '@/lib/calculators';

describe('CombatService', () => {
  const service = new CombatService();

  const mockAttacker: CharacterBaseStats = {
    level: 80,
    attack: 1000,
    attackMin: 950,
    attackMax: 1050,
    elementalAttack: 500,
    defense: 300,
    resistance: 200,
    critRate: 2000,
    critDamage: 0.5,
    affinityRate: 0.25,
    affinityDamage: 0.2,
    precision: 1500,
    armorPenetration: 0,
    elementalPenetration: 0,
  };

  const mockSkill: Skill = {
    id: 'test-skill-001',
    name: 'Test Skill',
    description: 'A test skill for combat service',
    physicalRatio: 1.0,
    elementalRatio: 0.5,
    cooldown: 5,
    castTime: 0,
    damageType: DamageType.Hybrid,
    category: SkillCategory.Active,
    element: SkillElement.Fire,
    weaponType: null,
    talents: [],
    range: 5,
    areaOfEffect: 0,
  };

  const mockTarget: Target = {
    id: 'test-target',
    name: 'Test Dummy',
    level: 50,
    defense: 300,
    resistance: 200,
    shield: 0.1,
    parry: 400,
    critResistance: 500,
  };

  describe('Instanciation', () => {
    it('peut être instancié', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CombatService);
    });
  });

  describe('calculateSkillDamage', () => {
    it('délègue correctement au DamageOutcomeCalculator', () => {
      const result = service.calculateSkillDamage(mockAttacker, mockSkill, mockTarget);
      
      expect(result).toBeDefined();
      expect(result.finalDamage).toBeGreaterThan(0);
      expect(result.physicalPool).toBeDefined();
      expect(result.elementalPool).toBeDefined();
      expect(result.combatRates).toBeDefined();
    });

    it('accepte des bonus optionnels', () => {
      const result = service.calculateSkillDamage(mockAttacker, mockSkill, mockTarget, [
        { source: 'Test Bonus', category: BonusCategory.DamageIncrease, value: 0.2 }
      ]);
      
      expect(result.finalDamage).toBeGreaterThan(0);
    });
  });

  describe('calculateExpectedSkillDamage', () => {
    it('délègue correctement au mode Expected Value', () => {
      const result = service.calculateExpectedSkillDamage(mockAttacker, mockSkill, mockTarget);
      
      expect(result).toBeDefined();
      // Le mode expected retourne toujours un résultat déterministe (peut être n'importe quel outcome)
      expect(result.finalDamage).toBeGreaterThan(0);
    });
  });

  describe('calculateExpectedValue', () => {
    it('délègue correctement à ExpectedValueCalculator', () => {
      const result = service.calculateExpectedValue(mockAttacker, mockSkill, mockTarget);
      
      expect(result).toBeDefined();
      expect(result.expectedDamage).toBeGreaterThan(0);
      expect(result.distribution).toBeDefined();
      expect(result.variance).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('simulateRotation', () => {
    it('délègue correctement à RotationDPSCalculator (mode déterministe)', () => {
      const skills = [mockSkill];
      const result = service.simulateRotation(mockAttacker, skills, mockTarget, 10);
      
      expect(result).toBeDefined();
      expect(result.dps).toBeGreaterThan(0);
      expect(result.totalDamage).toBeGreaterThan(0);
      expect(result.totalHits).toBeGreaterThan(0);
      expect(result.timeline).toBeDefined();
      expect(Array.isArray(result.timeline)).toBe(true);
    });
  });

  describe('simulateExpectedRotation', () => {
    it('délègue correctement au mode Expected Value', () => {
      const skills = [mockSkill];
      const result = service.simulateExpectedRotation(mockAttacker, skills, mockTarget, 10);
      
      expect(result).toBeDefined();
      expect(result.dps).toBeGreaterThan(0);
      expect(result.totalDamage).toBeGreaterThan(0);
    });
  });

  describe('calculateHeal', () => {
    it('délègue correctement à HealCalculator', () => {
      const healSkill: Skill = {
        ...mockSkill,
        name: 'Heal',
        physicalRatio: 1.5,
      };
      
      const result = service.calculateHeal(mockAttacker, healSkill, 0.1);
      
      expect(result).toBeDefined();
      expect(result.baseHeal).toBeGreaterThan(0);
      expect(result.finalHeal).toBeGreaterThan(0);
      expect(result.healBonus).toBe(0.1);
    });
  });

  describe('calculateExpectedHeal', () => {
    it('délègue correctement au mode Expected Value', () => {
      const healSkill: Skill = {
        ...mockSkill,
        name: 'Heal',
        physicalRatio: 1.5,
      };
      
      const result = service.calculateExpectedHeal(mockAttacker, healSkill, 0.1);
      
      expect(result).toBeDefined();
      expect(result.finalHeal).toBeGreaterThan(0);
      expect(result.isCritical).toBe(false); // Expected Value n'a pas de crit
    });
  });

  describe('calculateGraduation', () => {
    it('délègue correctement à GraduationCalculator', () => {
      const yourDPS = 8500;
      const referenceDPS = 10000;
      
      const result = service.calculateGraduation(yourDPS, referenceDPS);
      
      expect(result).toBeDefined();
      expect(result.yourDPS).toBe(yourDPS);
      expect(result.referenceDPS).toBe(referenceDPS);
      expect(result.graduationRate).toBeCloseTo(85, 1);
      expect(result.rating).toBe('competitive'); // 85% = competitive (80-90%)
      expect(result.recommendation).toBeDefined();
    });

    it('calcule correctement le rating optimized', () => {
      const result = service.calculateGraduation(9600, 10000);
      expect(result.rating).toBe('optimized'); // 96% = optimized (90-100%)
      expect(result.graduationRate).toBeGreaterThanOrEqual(95);
    });

    it('calcule correctement le rating beginner', () => {
      const result = service.calculateGraduation(6000, 10000);
      expect(result.rating).toBe('beginner'); // 60% = beginner (<70%)
      expect(result.graduationRate).toBeLessThan(70);
    });
  });
});
