/**
 * WWM Ultimate Calculator - Calculators Barrel Export
 * 
 * Central export file for all calculator modules.
 * Provides a single entry point for importing calculators across the application.
 * 
 * This module exports:
 * - BaseStatsCalculator: Calculate final character stats with equipment and buffs
 * - Pool calculators: Physical and Elemental damage pools
 * - Rate calculators: Precision, Critical, Affinity rates
 * - Combat calculators: DamageOutcomeCalculator (orchestrator)
 * - DPS calculators: Rotation DPS, Expected Value, Graduation Rate
 * 
 * Usage:
 * ```typescript
 * import { DamageOutcomeCalculator } from '@/lib/calculators';
 * 
 * const calculator = new DamageOutcomeCalculator();
 * const result = calculator.calculateDamage(attacker, skill, target);
 * ```
 * 
 * @module calculators
 * @version 1.0.0
 */

// ============================================================================
// Base Stats Calculator
// ============================================================================
/**
 * BaseStatsCalculator class and related types:
 * - BaseStatsCalculator: Main calculator class for character stats
 * - ActiveBuff: Interface for temporary buffs
 */
export { BaseStatsCalculator, type ActiveBuff } from './BaseStatsCalculator';

// ============================================================================
// Pool Calculators
// ============================================================================
/**
 * Physical and Elemental damage pool calculators:
 * - PhysicalPoolCalculator: Calculate physical damage with shield and defense reductions
 * - ElementalPoolCalculator: Calculate elemental damage with resistance reduction
 */
export { PhysicalPoolCalculator } from './PhysicalPoolCalculator';
export { ElementalPoolCalculator } from './ElementalPoolCalculator';

// ============================================================================
// Rates Calculators
// ============================================================================
/**
 * Combat rates calculators:
 * - CombatRatesCalculator: Calculate precision, critical, and affinity rates
 * - PrecisionCalculator: Specialized precision/hit chance calculator
 * - CriticalCalculator: Specialized critical hit rate calculator
 * - AffinityCalculator: Specialized affinity rate calculator
 */
export { CombatRatesCalculator } from './CombatRatesCalculator';
export { PrecisionCalculator } from './PrecisionCalculator';
export type { PrecisionResult, PrecisionCalculationOptions } from './PrecisionCalculator';
export { CriticalCalculator } from './CriticalCalculator';
export type { CriticalResult, CriticalCalculationOptions } from './CriticalCalculator';
export { AffinityCalculator } from './AffinityCalculator';
export type { AffinityResult } from './AffinityCalculator';
export { normalizeCombinedRates } from './normalizeCombinedRates';
export type { NormalizedRates } from './normalizeCombinedRates';

// ============================================================================
// Damage Outcome Calculator
// ============================================================================
/**
 * DamageOutcomeCalculator: Final damage pipeline orchestrator
 * Combines all pool and rate calculators to produce complete DamageCalculation results.
 * Supports deterministic and expected value calculation modes.
 */
export { DamageOutcomeCalculator } from './DamageOutcomeCalculator';

// ============================================================================
// Bonus & Heal Calculators
// ============================================================================
/**
 * BonusMultiplierCalculator: Chinese bonus rule (同类相加，异类相乘)
 * HealCalculator: Healing with crit support (no precision/affinity)
 */
export { BonusMultiplierCalculator, BonusCategory } from './BonusMultiplierCalculator';
export type { DamageBonus } from './BonusMultiplierCalculator';
export { HealCalculator } from './HealCalculator';
export type { HealCalculation } from './HealCalculator';

// ============================================================================
// DPS Calculators
// ============================================================================
/**
 * RotationDPSCalculator: Simulate skill rotation with cooldown tracking
 * ExpectedValueCalculator: Full probabilistic analysis with distribution
 * GraduationCalculator: Compare DPS to reference build
 */
export { RotationDPSCalculator } from './RotationDPSCalculator';
export { ExpectedValueCalculator } from './ExpectedValueCalculator';
export { GraduationCalculator } from './GraduationCalculator';

// ============================================================================
// Future Exports (Phase 1.7+)
// ============================================================================
// export { CombatService } from '../services/CombatService';
// export { ComparisonService } from '../services/ComparisonService';
