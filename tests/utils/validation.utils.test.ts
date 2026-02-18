/**
 * Tests unitaires pour les utilitaires de validation
 * 
 * Valide le comportement des fonctions de validation pour
 * CharacterBaseStats, Skill, Target et les helpers clamp.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidCharacterStats,
  isValidSkill,
  isValidTarget,
  clampValue,
  clampRate,
  type ValidationResult,
} from '@/lib/utils/validation.utils';
import type { CharacterBaseStats, PlayerCharacter } from '@/lib/types';
import type { Skill, DamageType, SkillCategory, SkillElement } from '@/lib/types';
import type { Target } from '@/lib/types';
import { WeaponType } from '@/lib/types';

// ============================================================================
// CHARACTER STATS VALIDATION
// ============================================================================

describe('isValidCharacterStats', () => {
  // Helper pour créer des stats valides par défaut
  const createValidStats = (): CharacterBaseStats => ({
    level: 80,
    attack: 1000,
    attackMin: 950,
    attackMax: 1050,
    elementalAttack: 800,
    defense: 500,
    resistance: 200,
    critRate: 600,
    critDamage: 0.5,
    affinityRate: 0.25,
    affinityDamage: 0.2,
    precision: 500,
    armorPenetration: 200,
    elementalPenetration: 150,
  });

  it('should accept valid stats', () => {
    const stats = createValidStats();
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject level < 1', () => {
    const stats = { ...createValidStats(), level: 0 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('level must be between 1 and 100');
  });

  it('should reject level > 100', () => {
    const stats = { ...createValidStats(), level: 101 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('level must be between 1 and 100');
  });

  it('should reject negative attack', () => {
    const stats = { ...createValidStats(), attack: -100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('attack must be >= 0');
  });

  it('should reject attackMin > attackMax', () => {
    const stats = { ...createValidStats(), attackMin: 1100, attackMax: 1000 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('attackMin must be <= attackMax');
  });

  it('should reject negative attackMin', () => {
    const stats = { ...createValidStats(), attackMin: -50 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('attackMin must be >= 0');
  });

  it('should reject negative elementalAttack', () => {
    const stats = { ...createValidStats(), elementalAttack: -100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('elementalAttack must be >= 0');
  });

  it('should reject negative defense', () => {
    const stats = { ...createValidStats(), defense: -100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('defense must be >= 0');
  });

  it('should reject negative resistance', () => {
    const stats = { ...createValidStats(), resistance: -50 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('resistance must be >= 0');
  });

  it('should reject negative critRate', () => {
    const stats = { ...createValidStats(), critRate: -100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('critRate must be >= 0');
  });

  it('should reject negative critDamage', () => {
    const stats = { ...createValidStats(), critDamage: -0.5 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('critDamage must be >= 0');
  });

  it('should reject affinityRate < 0', () => {
    const stats = { ...createValidStats(), affinityRate: -0.1 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('affinityRate must be between 0 and 1');
  });

  it('should reject affinityRate > 1', () => {
    const stats = { ...createValidStats(), affinityRate: 1.5 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('affinityRate must be between 0 and 1');
  });

  it('should reject negative affinityDamage', () => {
    const stats = { ...createValidStats(), affinityDamage: -0.2 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('affinityDamage must be >= 0');
  });

  it('should reject negative precision', () => {
    const stats = { ...createValidStats(), precision: -100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('precision must be >= 0');
  });

  it('should reject negative armorPenetration', () => {
    const stats = { ...createValidStats(), armorPenetration: -50 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('armorPenetration must be >= 0');
  });

  it('should reject negative elementalPenetration', () => {
    const stats = { ...createValidStats(), elementalPenetration: -50 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('elementalPenetration must be >= 0');
  });

  it('should accumulate multiple errors', () => {
    const stats: CharacterBaseStats = {
      level: 0, // Invalid
      attack: -100, // Invalid
      attackMin: 1000,
      attackMax: 900, // Invalid (min > max)
      elementalAttack: 800,
      defense: -50, // Invalid
      resistance: 200,
      critRate: 600,
      critDamage: 0.5,
      affinityRate: 1.5, // Invalid
      affinityDamage: 0.2,
      precision: 500,
      armorPenetration: 200,
      elementalPenetration: 150,
    };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
    expect(result.errors).toContain('level must be between 1 and 100');
    expect(result.errors).toContain('attack must be >= 0');
    expect(result.errors).toContain('defense must be >= 0');
    expect(result.errors).toContain('affinityRate must be between 0 and 1');
  });

  it('should accept edge case: level 1', () => {
    const stats = { ...createValidStats(), level: 1 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: level 100', () => {
    const stats = { ...createValidStats(), level: 100 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: affinityRate = 0', () => {
    const stats = { ...createValidStats(), affinityRate: 0 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: affinityRate = 1 (cap is handled elsewhere)', () => {
    const stats = { ...createValidStats(), affinityRate: 1 };
    const result = isValidCharacterStats(stats);
    
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// SKILL VALIDATION
// ============================================================================

describe('isValidSkill', () => {
  // Helper pour créer une skill valide par défaut
  const createValidSkill = (): Skill => ({
    id: 'skill-001',
    name: 'Frappe rapide',
    description: 'Attaque physique rapide',
    physicalRatio: 1.2,
    elementalRatio: 0,
    cooldown: 5,
    castTime: 0.8,
    damageType: 'physical_only' as DamageType,
    category: 'active' as SkillCategory,
    element: 'none' as SkillElement,
    weaponType: WeaponType.Sword,
    talents: [],
    range: 5,
    areaOfEffect: 0,
  });

  it('should accept valid skill', () => {
    const skill = createValidSkill();
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty name', () => {
    const skill = { ...createValidSkill(), name: '' };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name must not be empty');
  });

  it('should reject whitespace-only name', () => {
    const skill = { ...createValidSkill(), name: '   ' };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name must not be empty');
  });

  it('should reject skill with both ratios = 0', () => {
    const skill = { ...createValidSkill(), physicalRatio: 0, elementalRatio: 0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('at least one of physicalRatio or elementalRatio must be > 0');
  });

  it('should reject negative physicalRatio', () => {
    const skill = { ...createValidSkill(), physicalRatio: -1.0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('physicalRatio must be >= 0');
  });

  it('should reject negative elementalRatio', () => {
    const skill = { ...createValidSkill(), elementalRatio: -0.5 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('elementalRatio must be >= 0');
  });

  it('should reject negative castTime', () => {
    const skill = { ...createValidSkill(), castTime: -1.0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('castTime must be >= 0');
  });

  it('should reject negative cooldown', () => {
    const skill = { ...createValidSkill(), cooldown: -5 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('cooldown must be >= 0');
  });

  it('should accept physical-only skill (elementalRatio = 0)', () => {
    const skill = { ...createValidSkill(), physicalRatio: 1.5, elementalRatio: 0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
  });

  it('should accept elemental-only skill (physicalRatio = 0)', () => {
    const skill = { ...createValidSkill(), physicalRatio: 0, elementalRatio: 1.8 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
  });

  it('should accept hybrid skill (both ratios > 0)', () => {
    const skill = { ...createValidSkill(), physicalRatio: 1.0, elementalRatio: 0.8 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
  });

  it('should accept instant skill (castTime = 0)', () => {
    const skill = { ...createValidSkill(), castTime: 0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
  });

  it('should accept spammable skill (cooldown = 0)', () => {
    const skill = { ...createValidSkill(), cooldown: 0 };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(true);
  });

  it('should accumulate multiple errors', () => {
    const skill: Skill = {
      ...createValidSkill(),
      name: '', // Invalid
      physicalRatio: -1.0, // Invalid
      elementalRatio: -0.5, // Invalid
      castTime: -1.0, // Invalid
      cooldown: -5, // Invalid
    };
    const result = isValidSkill(skill);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
    expect(result.errors).toContain('name must not be empty');
    expect(result.errors).toContain('physicalRatio must be >= 0');
    expect(result.errors).toContain('elementalRatio must be >= 0');
    expect(result.errors).toContain('castTime must be >= 0');
    expect(result.errors).toContain('cooldown must be >= 0');
  });
});

// ============================================================================
// TARGET VALIDATION
// ============================================================================

describe('isValidTarget', () => {
  // Helper pour créer une target valide par défaut
  const createValidTarget = (): Target => ({
    id: 'boss-001',
    name: 'Dragon des tempêtes',
    level: 80,
    defense: 800,
    resistance: 100,
    shield: 0.15,
    parry: 300,
    critResistance: 50,
  });

  it('should accept valid target', () => {
    const target = createValidTarget();
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject negative defense', () => {
    const target = { ...createValidTarget(), defense: -100 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('defense must be >= 0');
  });

  it('should reject negative resistance', () => {
    const target = { ...createValidTarget(), resistance: -50 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('resistance must be >= 0');
  });

  it('should reject shield < 0', () => {
    const target = { ...createValidTarget(), shield: -0.1 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('shield must be between 0 and 1');
  });

  it('should reject shield > 1', () => {
    const target = { ...createValidTarget(), shield: 1.5 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('shield must be between 0 and 1');
  });

  it('should reject negative parry', () => {
    const target = { ...createValidTarget(), parry: -100 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('parry must be >= 0');
  });

  it('should reject negative critResistance', () => {
    const target = { ...createValidTarget(), critResistance: -50 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('critResistance must be >= 0');
  });

  it('should accept target without critResistance', () => {
    const target = { ...createValidTarget() };
    delete (target as any).critResistance;
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: shield = 0 (no shield)', () => {
    const target = { ...createValidTarget(), shield: 0 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: shield = 1 (100% shield)', () => {
    const target = { ...createValidTarget(), shield: 1 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: resistance = 0', () => {
    const target = { ...createValidTarget(), resistance: 0 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
  });

  it('should accept edge case: defense = 0', () => {
    const target = { ...createValidTarget(), defense: 0 };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(true);
  });

  it('should accumulate multiple errors', () => {
    const target: Target = {
      ...createValidTarget(),
      defense: -100, // Invalid
      resistance: -50, // Invalid
      shield: 1.5, // Invalid
      parry: -100, // Invalid
      critResistance: -50, // Invalid
    };
    const result = isValidTarget(target);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
    expect(result.errors).toContain('defense must be >= 0');
    expect(result.errors).toContain('resistance must be >= 0');
    expect(result.errors).toContain('shield must be between 0 and 1');
    expect(result.errors).toContain('parry must be >= 0');
    expect(result.errors).toContain('critResistance must be >= 0');
  });
});

// ============================================================================
// CLAMP UTILITIES
// ============================================================================

describe('clampValue', () => {
  it('should return value when within range', () => {
    expect(clampValue(5, 0, 10)).toBe(5);
    expect(clampValue(7, 5, 15)).toBe(7);
  });

  it('should return min when value < min', () => {
    expect(clampValue(-5, 0, 10)).toBe(0);
    expect(clampValue(3, 5, 15)).toBe(5);
  });

  it('should return max when value > max', () => {
    expect(clampValue(15, 0, 10)).toBe(10);
    expect(clampValue(20, 5, 15)).toBe(15);
  });

  it('should handle edge case: value = min', () => {
    expect(clampValue(0, 0, 10)).toBe(0);
  });

  it('should handle edge case: value = max', () => {
    expect(clampValue(10, 0, 10)).toBe(10);
  });

  it('should handle edge case: min = max', () => {
    expect(clampValue(5, 7, 7)).toBe(7);
    expect(clampValue(7, 7, 7)).toBe(7);
    expect(clampValue(10, 7, 7)).toBe(7);
  });

  it('should handle negative ranges', () => {
    expect(clampValue(-5, -10, -1)).toBe(-5);
    expect(clampValue(-15, -10, -1)).toBe(-10);
    expect(clampValue(0, -10, -1)).toBe(-1);
  });

  it('should handle float values', () => {
    expect(clampValue(0.5, 0, 1)).toBeCloseTo(0.5);
    expect(clampValue(1.5, 0, 1)).toBeCloseTo(1);
    expect(clampValue(-0.5, 0, 1)).toBeCloseTo(0);
  });
});

describe('clampRate', () => {
  it('should return value when between 0 and 1', () => {
    expect(clampRate(0.5)).toBe(0.5);
    expect(clampRate(0.25)).toBe(0.25);
    expect(clampRate(0.999)).toBe(0.999);
  });

  it('should return 0 when value < 0', () => {
    expect(clampRate(-0.5)).toBe(0);
    expect(clampRate(-1)).toBe(0);
  });

  it('should return 1 when value > 1', () => {
    expect(clampRate(1.5)).toBe(1);
    expect(clampRate(2)).toBe(1);
  });

  it('should handle edge case: value = 0', () => {
    expect(clampRate(0)).toBe(0);
  });

  it('should handle edge case: value = 1', () => {
    expect(clampRate(1)).toBe(1);
  });

  it('should handle very small values', () => {
    expect(clampRate(0.0001)).toBeCloseTo(0.0001);
  });

  it('should handle very large values', () => {
    expect(clampRate(999)).toBe(1);
  });
});
