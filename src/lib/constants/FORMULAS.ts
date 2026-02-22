/**
 * Formules de calcul WWM — défense, résistance, pénétration, réduction.
 * Référence : WWM-Formules-Reference-v1.3.md
 */

import {
 CALCULATION_CONSTANTS,
 STAT_LIMITS,
} from './GAME_CONSTANTS';

// Réduction défense et résistance

/**
 * Calcule la réduction de défense via la formule hyperbolique.
 *
 * Formule : `Defense / (Defense + 2860)`
 *
 * La formule hyperbolique crée des rendements décroissants :
 * - 0 défense → 0% réduction
 * - 1430 défense → 33.3% réduction
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
 */
export const calculateDefenseReduction = (
 defense: number,
 penetration = 0
): number => {
 // Défense restante après pénétration
 const remaining = Math.max(0, defense - penetration);
 
 // Formule hyperbolique de réduction
 return remaining / (remaining + CALCULATION_CONSTANTS.DEFENSE_CONSTANT);
};

/**
 * Calculate elemental resistance reduction percentage using hyperbolic formula.
 *
 * Formula: `Resistance / (Resistance + 530)`
 *
 * - Resistance scales faster to higher reduction percentages
 * - 530 resistance already gives 50% reduction
 *
 * Special case: Negative resistance (boss weakness) gives NEGATIVE reduction,
 * ce qui agit comme un multiplicateur de dégâts.
 *
 * @param resistance - Target's elemental resistance value (can be negative)
 * @returns Resistance reduction percentage (negative values possible for weakness)
 *
 */
export const calculateElementalReduction = (resistance: number): number => {
 // Résistance négative (faiblesse boss)
 if (resistance < 0) {
 // Résistance négative → bonus de dégâts
 return resistance / (Math.abs(resistance) + CALCULATION_CONSTANTS.ELEM_RESIST_CONSTANT);
 }
 
 // Réduction de résistance positive standard
 return resistance / (resistance + CALCULATION_CONSTANTS.ELEM_RESIST_CONSTANT);
};

// Taux de combat

/**
 * Calcule le taux critique via la formule hyperbolique.
 *
 * Formula: `1.15 × (Crit / (Crit + 938))`
 *
 * The 1.15 multiplier allows reaching the 80% cap with realistic crit values.
 * Sans lui, le taux max serait limité par la courbe hyperbolique.
 *
 * Critical resistance from target is subtracted before calculation.
 * Final rate is capped at 80% (STAT_LIMITS.MAX_CRITICAL_RATE).
 *
 * @param critical - Attacker's critical hit stat (raw value, not percentage)
 * @param targetResist - Target's critical resistance (default: 0, used in PVP)
 * @returns Critical hit rate (0-0.8 range, e.g. 0.4 = 40% crit rate)
 *
 */
export const calculateCriticalRate = (
 critical: number,
 targetResist = 0
): number => {
 // Critique net après résistance
 const remaining = Math.max(0, critical - targetResist);
 
 // Formule hyperbolique (multiplicateur 1.15)
 const rate = (CALCULATION_CONSTANTS.CRIT_RATE_MULTIPLIER * remaining) / 
 (remaining + CALCULATION_CONSTANTS.CRIT_RATE_CONSTANT);
 
 // Cap à 80%
 return Math.min(rate, STAT_LIMITS.MAX_CRITICAL_RATE);
};

/**
 * Calcule le taux de précision (touche).
 *
 * Formula v1.3+: `0.95 × (1.43 × Precision / (Precision + Parry + 150))`
 *
 * HISTORICAL VERSIONS:
 * - v1.0 to v1.2: 1.42 multiplier
 * - v1.3+: 1.43 multiplier (current)
 *
 * Complex formula with multiple components:
 * - Cap de base 95% (les ratés sont toujours possibles)
 * - 1.43 multiplier to reach higher hit rates with reasonable precision (v1.3+)
 * - Precision constant (+150) establishes minimum denominator
 * - Parry from target reduces hit chance
 *
 * On utilise Parade + 150 selon le document de référence officiel.
 *
 * @verified Source: Bahamut forum guide v1.3.1, @逆水寒
 *
 * @param precision - Attacker's precision stat (raw value)
 * @param evasion - Target's parry/evasion stat (default: 0)
 * @returns Hit chance rate (0-1.0 range, typically 0.7-0.95)
 *
 */
export const calculatePrecisionRate = (
 precision: number,
 evasion = 0
): number => {
 // Précision non-négative
 const netPrecision = Math.max(0, precision);
 
 // Parade totale = esquive cible + constante de base
 const totalParry = evasion + CALCULATION_CONSTANTS.PRECISION_CONSTANT;
 
 // Formule : multiplicateur 1.43 (v1.3+)
 const rate = CALCULATION_CONSTANTS.PRECISION_MULTIPLIER * 
 (netPrecision / (netPrecision + totalParry));
 
 // Cap à 100%
 return Math.min(rate, STAT_LIMITS.MAX_PRECISION_RATE);
};

// Pénétration de bouclier

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
 * Effective = Penetration × 2
 * else:
 * Effective = (Shield/3 × 2) + (Penetration - Shield/3) × 0.5
 * ```
 *
 * a des rendements décroissants après 1/3 de la valeur du bouclier.
 *
 * @param shield - Target's Qi Shield value (percentage as decimal, e.g. 0.2 = 20%)
 * @param penetration - Attacker's shield penetration value (same scale as shield)
 * @returns Effective shield penetration after diminishing returns
 *
 */
export const calculateShieldPenetration = (
 shield: number,
 penetration: number
): number => {
 // Sortie anticipée si entrée invalide
 if (penetration <= 0 || shield <= 0) {
 return 0;
 }
 
 // Seuil = 1/3 de la valeur du bouclier
 const threshold = shield / 3;
 
 // Palier 1 : efficacité totale (×2)
 if (penetration <= threshold) {
 return penetration * 2;
 }
 
 // Palier 2 : rendements décroissants
 // Pleine efficacité jusqu'au seuil, puis ×0.5
 return (threshold * 2) + ((penetration - threshold) * 0.5);
};

// Objet FORMULAS (cohérence avec le document de référence)

/**
 * Frozen object containing all formula functions.
 *
 * cohérent avec la structure du document de référence.
 *
 * Les deux approches sont équivalentes et utilisent les mêmes fonctions.
 */
export const FORMULAS = Object.freeze({
 defenseReduction: calculateDefenseReduction,
 elementalReduction: calculateElementalReduction,
 criticalRate: calculateCriticalRate,
 precisionRate: calculatePrecisionRate,
 shieldPenetration: calculateShieldPenetration,
} as const);

// Exports de types

/**
 * Type de l'objet FORMULAS.
 * Useful for function parameter typing or dependency injection.
 */
export type Formulas = typeof FORMULAS;
