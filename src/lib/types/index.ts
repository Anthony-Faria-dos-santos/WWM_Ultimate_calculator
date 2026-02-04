/**
 * WWM Ultimate Calculator - Core Types
 * 
 * Barrel export file for all type definitions.
 * Provides a single entry point for importing types across the application.
 * 
 * This module centralizes all type exports from:
 * - Character types (stats, equipment, player character)
 * - Skill types (skills, damage types, talents)
 * - Combat types (targets, pools, rates, damage calculations)
 * - DPS types (rotations, expected value, graduation)
 * 
 * Usage:
 * ```typescript
 * import { PlayerCharacter, Skill, DamageCalculation, RotationResult } from '@/lib/types';
 * ```
 * 
 * @module types
 * @version 1.0.0
 */

// ============================================================================
// Character Types
// ============================================================================
/**
 * Character-related types including:
 * - CharacterBaseStats: Base combat statistics
 * - PlayerCharacter: Complete character with equipment
 * - Equipment: Weapon, armor, and accessories
 * - WeaponType, MartialArtStyle: Enums for character classification
 */
export * from './Character.types';

// ============================================================================
// Skill Types
// ============================================================================
/**
 * Skill-related types including:
 * - Skill: Complete skill definition with ratios and timings
 * - SkillTalent: Talent modifiers for skills
 * - DamageType: Physical, Elemental, or Hybrid
 * - SkillCategory: Active, Passive, Ultimate, etc.
 * - SkillElement: Fire, Ice, Lightning, Wind, Earth, Poison
 */
export * from './Skill.types';

// ============================================================================
// Combat Types
// ============================================================================
/**
 * Combat calculation types including:
 * - Target: Enemy with defensive stats
 * - PhysicalPool, ElementalPool: Damage pools with reduction stages
 * - CombatRates: Precision, Critical, Affinity rates
 * - DamageCalculation: Complete damage calculation result
 * - CombatOutcome: Miss, Normal, Critical, Affinity, etc.
 * - PrecisionResult, CriticalResult, AffinityResult: Intermediate results
 */
export * from './Combat.types';

// ============================================================================
// DPS Types
// ============================================================================
/**
 * DPS and rotation types including:
 * - RotationResult: Complete rotation simulation result
 * - SkillUsage: Per-skill usage statistics
 * - TimelineEvent: Combat timeline events
 * - ExpectedValueResult: Probabilistic damage calculation
 * - DamageDistribution: Probability distribution across outcomes
 * - GraduationResult: Build comparison to optimal reference
 * - BuildComparison: Detailed comparison between two builds
 */
export * from './DPS.types';
