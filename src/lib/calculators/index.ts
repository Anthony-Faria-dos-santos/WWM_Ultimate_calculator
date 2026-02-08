/**
 * WWM Ultimate Calculator - Calculators Barrel Export
 * 
 * Central export file for all calculator modules.
 * Provides a single entry point for importing calculators across the application.
 * 
 * This module exports:
 * - BaseStatsCalculator: Calculate final character stats with equipment and buffs
 * - (Future) Pool calculators: Physical and Elemental damage pools
 * - (Future) Rate calculators: Precision, Critical, Affinity rates
 * - (Future) Combat calculators: Damage, Heal, Bonus multipliers
 * - (Future) DPS calculators: Rotation DPS, Expected Value, Graduation Rate
 * 
 * Usage:
 * ```typescript
 * import { BaseStatsCalculator } from '@/lib/calculators';
 * 
 * const calculator = new BaseStatsCalculator();
 * const stats = calculator.calculateFinalStats(character);
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
// Future Exports (Phase 1.3+)
// ============================================================================
// export * from './rates';
// export * from './combat';
// export * from './dps';
