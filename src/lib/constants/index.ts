/**
 * WWM Ultimate Calculator - Constants Barrel Export
 * 
 * Central export file for all game constants.
 * Provides a single entry point for importing constants across the application.
 * 
 * This module exports:
 * - GAME_CONSTANTS: Core game values (stats limits, calculation constants, multipliers)
 * - FORMULAS: Will be added in Phase 1.2.2
 * 
 * Usage:
 * ```typescript
 * import { STAT_LIMITS, CALCULATION_CONSTANTS, DAMAGE_MULTIPLIERS } from '@/lib/constants';
 * ```
 * 
 * @module constants
 * @version 1.0.0
 */

// ============================================================================
// Game Constants
// ============================================================================
/**
 * Export all game constants including:
 * - SERVER_CONFIGS: Multi-server configurations (Global OW12, CN OW15)
 * - ACTIVE_SERVER_KEY: Current active server configuration key
 * - ACTIVE_SERVER: Current active server configuration
 * - STAT_LIMITS: Maximum and minimum values for character stats
 * - CALCULATION_CONSTANTS: Core values used in damage formulas
 * - DAMAGE_MULTIPLIERS: Multipliers for different combat outcomes
 * - DEFAULT_LEVEL_80_STATS: Reference stats for Level 80 characters
 * - DEFAULT_LEVEL_85_STATS: Reference stats for Level 85 characters (Global OW12)
 * - DPS_CONFIG: Configuration for DPS calculations
 */
export {
  SERVER_CONFIGS,
  ACTIVE_SERVER_KEY,
  ACTIVE_SERVER,
  STAT_LIMITS,
  CALCULATION_CONSTANTS,
  DAMAGE_MULTIPLIERS,
  DEFAULT_LEVEL_80_STATS,
  DEFAULT_LEVEL_85_STATS,
  DPS_CONFIG,
  type ServerConfigKey,
  type StatLimits,
  type CalculationConstants,
  type DamageMultipliers,
  type DefaultLevel80Stats,
  type DefaultLevel85Stats,
  type DpsConfig,
} from './GAME_CONSTANTS';

// ============================================================================
// Formula Functions
// ============================================================================
/**
 * Export all formula functions including:
 * - calculateDefenseReduction: Physical defense reduction (hyperbolic)
 * - calculateElementalReduction: Elemental resistance reduction (hyperbolic)
 * - calculateCriticalRate: Critical hit rate calculation
 * - calculatePrecisionRate: Precision/hit chance calculation
 * - calculateShieldPenetration: Qi Shield penetration with diminishing returns
 * - FORMULAS: Frozen object containing all formulas
 */
export {
  calculateDefenseReduction,
  calculateElementalReduction,
  calculateCriticalRate,
  calculatePrecisionRate,
  calculateShieldPenetration,
  FORMULAS,
  type Formulas,
} from './FORMULAS';
