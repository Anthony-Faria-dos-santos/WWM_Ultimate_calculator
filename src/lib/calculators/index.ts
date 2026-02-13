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
 * - (Future) DPS calculators: Rotation DPS, Expected Value, Graduation Rate
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
// Bonus Multiplier Calculator (Phase 1.5)
// ============================================================================
/**
 * BonusMultiplierCalculator: Damage bonus calculator with Chinese stacking rules
 * Implements 同类相加，异类相乘 (same category adds, different categories multiply)
 */
export { BonusMultiplierCalculator } from './BonusMultiplierCalculator';
export { BonusCategory } from './BonusMultiplierCalculator';
export type { DamageBonus, BonusCategoryBreakdown } from './BonusMultiplierCalculator';

// ============================================================================
// Heal Calculator (Phase 1.5)
// ============================================================================
/**
 * HealCalculator: Healing calculation with critical support
 * Supports deterministic and expected value modes.
 * No precision/affinity checks, uses heal bonus instead of damage multipliers.
 */
export { HealCalculator } from './HealCalculator';
export type { HealCalculation } from './HealCalculator';

// ============================================================================
// Future Exports (Phase 1.5+)
// ============================================================================
// export * from './combat';
// export * from './dps';
