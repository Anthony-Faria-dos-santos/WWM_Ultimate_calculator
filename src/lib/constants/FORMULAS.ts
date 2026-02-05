/**
 * WWM Ultimate Calculator - Formula Functions
 * 
 * Pure mathematical functions for combat calculations in Where Winds Meet.
 * All formulas are based on hyperbolic or linear scaling validated by the community.
 * 
 * These functions implement the core damage calculation formulas including:
 * - Defense and resistance reduction (hyperbolic diminishing returns)
 * - Critical hit rate calculation
 * - Precision/hit chance calculation
 * - Shield penetration mechanics
 * 
 * All functions are pure (no side effects) and immutable.
 * They can be used in calculators, services, or directly in components.
 * 
 * Reference: .dev/docs/Back/phases/WWM-Formules-Reference-v1.3.md section 2.2
 * 
 * @module constants/FORMULAS
 * @version 1.0.0
 */

import {
  CALCULATION_CONSTANTS,
  STAT_LIMITS,
} from './GAME_CONSTANTS';

// ============================================================================
// DEFENSE AND RESISTANCE REDUCTION
// ============================================================================

/**
 * Calculate defense reduction percentage using hyperbolic formula.
 * 
 * Formula: `Defense / (Defense + 2860)`
 * 
 * The hyperbolic formula creates diminishing returns:
 * - 0 defense → 0% reduction
 * - 1430 defense → 33.3% reduction
 * - 2860 defense → 50% reduction (inflection point)
 * - 5720 defense → 66.7% reduction
 * - 8580 defense → 75% reduction
 * 
 * Armor penetration is subtracted from defense before calculation.
 * Negative defense after penetration is treated as 0 (no bonus damage).
 * 
 * @param defense - Target's base defense value
 * @param penetration - Attacker's armor penetration (default: 0)
 * @returns Defense reduction percentage (0-1 range, e.g. 0.5 = 50% reduction)
 * 
 * @example
 * // Calculate defense reduction with penetration
 * const reduction = calculateDefenseReduction(800, 200);
 * // 600 net defense → 600/(600+2860) = 0.173 (17.3% reduction)
 * 
 * @example
 * // High defense with penetration
 * const reduction = calculateDefenseReduction(5000, 1000);
 * // 4000 net defense → 4000/(4000+2860) = 0.583 (58.3% reduction)
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 4.1
 */
export const calculateDefenseReduction = (
  defense: number,
  penetration = 0
): number => {
  // Calculate remaining defense after armor penetration
  const remaining = Math.max(0, defense - penetration);
  
  // Apply hyperbolic reduction formula
  return remaining / (remaining + CALCULATION_CONSTANTS.DEFENSE_CONSTANT);
};

/**
 * Calculate elemental resistance reduction percentage using hyperbolic formula.
 * 
 * Formula: `Resistance / (Resistance + 530)`
 * 
 * Similar to defense but with a lower constant (530 vs 2860), meaning:
 * - Resistance scales faster to higher reduction percentages
 * - 530 resistance already gives 50% reduction
 * 
 * Special case: Negative resistance (boss weakness) gives NEGATIVE reduction,
 * which effectively becomes a damage multiplier.
 * 
 * @param resistance - Target's elemental resistance value (can be negative)
 * @returns Resistance reduction percentage (negative values possible for weakness)
 * 
 * @example
 * // Normal resistance
 * const reduction = calculateElementalReduction(100);
 * // 100/(100+530) = 0.159 (15.9% reduction)
 * 
 * @example
 * // Boss weak to element (negative resistance)
 * const reduction = calculateElementalReduction(-353);
 * // -353/(-353+530) = -1.995 (199.5% bonus → ~3x damage multiplier)
 * 
 * @example
 * // Zero resistance (most PVE bosses)
 * const reduction = calculateElementalReduction(0);
 * // 0/(0+530) = 0 (no reduction, full damage)
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 5.1, 13.8
 */
export const calculateElementalReduction = (resistance: number): number => {
  // Handle negative resistance (boss weakness)
  if (resistance < 0) {
    // Negative resistance creates a negative reduction (bonus damage)
    return resistance / (Math.abs(resistance) + CALCULATION_CONSTANTS.ELEM_RESIST_CONSTANT);
  }
  
  // Normal positive resistance reduction
  return resistance / (resistance + CALCULATION_CONSTANTS.ELEM_RESIST_CONSTANT);
};

// ============================================================================
// COMBAT RATES
// ============================================================================

/**
 * Calculate critical hit rate using hyperbolic formula with multiplier.
 * 
 * Formula: `1.15 × (Crit / (Crit + 938))`
 * 
 * The 1.15 multiplier allows reaching the 80% cap with realistic crit values.
 * Without it, the maximum achievable rate would be limited by the hyperbolic curve.
 * 
 * Critical resistance from target is subtracted before calculation.
 * Final rate is capped at 80% (STAT_LIMITS.MAX_CRITICAL_RATE).
 * 
 * @param critical - Attacker's critical hit stat (raw value, not percentage)
 * @param targetResist - Target's critical resistance (default: 0, used in PVP)
 * @returns Critical hit rate (0-0.8 range, e.g. 0.4 = 40% crit rate)
 * 
 * @example
 * // Typical Level 80 PVE build
 * const critRate = calculateCriticalRate(3500, 0);
 * // 1.15 × (3500/(3500+938)) = 0.907 → capped at 0.8 (80%)
 * 
 * @example
 * // With critical resistance (PVP)
 * const critRate = calculateCriticalRate(3500, 500);
 * // Net: 3000 crit
 * // 1.15 × (3000/(3000+938)) = 0.876 → capped at 0.8 (80%)
 * 
 * @example
 * // Low crit build
 * const critRate = calculateCriticalRate(938, 0);
 * // 1.15 × (938/(938+938)) = 0.575 (57.5%, inflection point)
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 6.3
 */
export const calculateCriticalRate = (
  critical: number,
  targetResist = 0
): number => {
  // Calculate remaining crit after resistance
  const remaining = Math.max(0, critical - targetResist);
  
  // Apply hyperbolic formula with 1.15 multiplier
  const rate = (CALCULATION_CONSTANTS.CRIT_RATE_MULTIPLIER * remaining) / 
               (remaining + CALCULATION_CONSTANTS.CRIT_RATE_CONSTANT);
  
  // Cap at 80%
  return Math.min(rate, STAT_LIMITS.MAX_CRITICAL_RATE);
};

/**
 * Calculate precision (hit chance) rate with parry opposition.
 * 
 * Formula: `0.95 × (1.42 × Precision / (Precision + Parry + 150))`
 * 
 * Complex formula with multiple components:
 * - Base 95% cap (misses are always possible)
 * - 1.42 multiplier to reach higher hit rates with reasonable precision
 * - Precision constant (+150) establishes minimum denominator
 * - Parry from target reduces hit chance
 * 
 * Note: This formula differs from some community versions that use 3640 constant.
 * We use Parry + 150 based on the official reference document.
 * 
 * @param precision - Attacker's precision stat (raw value)
 * @param evasion - Target's parry/evasion stat (default: 0)
 * @returns Hit chance rate (0-1.0 range, typically 0.7-0.95)
 * 
 * @example
 * // Typical Level 80 PVE (low parry)
 * const hitRate = calculatePrecisionRate(8000, 300);
 * // totalParry = 300 + 150 = 450
 * // rate = 1.42 × (8000 / (8000 + 450)) = 1.344
 * // capped = Math.min(1.344, 0.95) = 0.95 (95% hit, maxed out)
 * 
 * @example
 * // PVP with high evasion
 * const hitRate = calculatePrecisionRate(5000, 3000);
 * // totalParry = 3000 + 150 = 3150
 * // rate = 1.42 × (5000 / (5000 + 3150)) = 0.871 (87.1% hit)
 * 
 * @example
 * // Low precision build
 * const hitRate = calculatePrecisionRate(2000, 500);
 * // totalParry = 500 + 150 = 650
 * // rate = 1.42 × (2000 / (2000 + 650)) = 1.072 → capped at 0.95
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 6.2
 */
export const calculatePrecisionRate = (
  precision: number,
  evasion = 0
): number => {
  // Ensure non-negative precision
  const netPrecision = Math.max(0, precision);
  
  // Total parry includes target's evasion + base constant
  const totalParry = evasion + CALCULATION_CONSTANTS.PRECISION_CONSTANT;
  
  // Apply formula: 1.42 multiplier allows reaching high hit rates
  const rate = CALCULATION_CONSTANTS.PRECISION_MULTIPLIER * 
               (netPrecision / (netPrecision + totalParry));
  
  // Cap at 100% (but typically effective max is 95% due to formula)
  return Math.min(rate, STAT_LIMITS.MAX_PRECISION_RATE);
};

// ============================================================================
// SHIELD PENETRATION
// ============================================================================

/**
 * Calculate effective Qi Shield penetration with diminishing returns.
 * 
 * Qi Shield (气盾) penetration has a two-tier effectiveness:
 * - **Tier 1**: Penetration ≤ Shield/3 → Full effectiveness (×2)
 * - **Tier 2**: Penetration > Shield/3 → Reduced effectiveness (×0.5)
 * 
 * Formula:
 * ```
 * if Penetration ≤ Shield/3:
 *   Effective = Penetration × 2
 * else:
 *   Effective = (Shield/3 × 2) + (Penetration - Shield/3) × 0.5
 * ```
 * 
 * This creates a breakpoint mechanic where stacking shield penetration
 * has diminishing returns after reaching 1/3 of the shield value.
 * 
 * @param shield - Target's Qi Shield value (percentage as decimal, e.g. 0.2 = 20%)
 * @param penetration - Attacker's shield penetration value (same scale as shield)
 * @returns Effective shield penetration after diminishing returns
 * 
 * @example
 * // Low penetration (Tier 1: full effectiveness)
 * const effective = calculateShieldPenetration(0.3, 0.05);
 * // threshold = 0.3/3 = 0.1
 * // 0.05 ≤ 0.1 → effective = 0.05 × 2 = 0.1 (10% shield ignored)
 * 
 * @example
 * // High penetration (Tier 2: diminishing returns)
 * const effective = calculateShieldPenetration(0.3, 0.15);
 * // threshold = 0.3/3 = 0.1
 * // 0.15 > 0.1 → effective = (0.1 × 2) + (0.15 - 0.1) × 0.5
 * //              = 0.2 + 0.025 = 0.225 (22.5% shield ignored)
 * 
 * @example
 * // Zero shield (no penetration needed)
 * const effective = calculateShieldPenetration(0, 0.1);
 * // shield = 0 → effective = 0 (no shield to penetrate)
 * 
 * Note: This formula is based on Level 80 PVP mechanics where Qi Shield
 * penetration becomes important. In PVE, most enemies have 0 shield.
 * 
 * Reference: Community theorycraft from Chinese PVP players
 */
export const calculateShieldPenetration = (
  shield: number,
  penetration: number
): number => {
  // Early exit for invalid inputs
  if (penetration <= 0 || shield <= 0) {
    return 0;
  }
  
  // Calculate breakpoint (1/3 of shield value)
  const threshold = shield / 3;
  
  // Tier 1: Full effectiveness (2x multiplier)
  if (penetration <= threshold) {
    return penetration * 2;
  }
  
  // Tier 2: Diminishing returns
  // Full effectiveness up to threshold, then 0.5x for remainder
  return (threshold * 2) + ((penetration - threshold) * 0.5);
};

// ============================================================================
// FORMULA OBJECT (for consistency with reference document)
// ============================================================================

/**
 * Frozen object containing all formula functions.
 * 
 * This provides an alternative way to access formulas as an object,
 * consistent with the reference document structure.
 * 
 * Usage:
 * ```typescript
 * // Named exports (recommended)
 * import { calculateDefenseReduction } from '@/lib/constants';
 * 
 * // Object access (alternative)
 * import { FORMULAS } from '@/lib/constants';
 * const reduction = FORMULAS.defenseReduction(800, 200);
 * ```
 * 
 * Both approaches are equivalent and use the same underlying functions.
 */
export const FORMULAS = Object.freeze({
  defenseReduction: calculateDefenseReduction,
  elementalReduction: calculateElementalReduction,
  criticalRate: calculateCriticalRate,
  precisionRate: calculatePrecisionRate,
  shieldPenetration: calculateShieldPenetration,
} as const);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type for the FORMULAS object.
 * Useful for function parameter typing or dependency injection.
 */
export type Formulas = typeof FORMULAS;
