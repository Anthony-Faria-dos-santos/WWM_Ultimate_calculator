/**
 * Barrel export des constantes.
 */

// Constantes de jeu
/**
 * Export all game constants including:
 * - SERVER_CONFIGS: Multi-server configurations (Global OW12, CN OW15)
 * - ACTIVE_SERVER_KEY: Current active server configuration key
 * - ACTIVE_SERVER: Current active server configuration
 * - STAT_LIMITS: Limites min/max des stats
 * - CALCULATION_CONSTANTS: Valeurs utilisées dans les formules
 * - DAMAGE_MULTIPLIERS: Multipliers for different combat outcomes
 * - DEFAULT_LEVEL_80_STATS: Stats de référence niveau 80
 * - DEFAULT_LEVEL_85_STATS: Stats de référence niveau 85 (Global OW12)
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

// Fonctions de formule
/**
 * Export all formula functions including:
 * - calculateDefenseReduction: Physical defense reduction (hyperbolic)
 * - calculateElementalReduction: Elemental resistance reduction (hyperbolic)
 * - calculateCriticalRate: Critical hit rate calculation
 * - calculatePrecisionRate: Precision/hit chance calculation
 * - calculateShieldPenetration: Pénétration de bouclier Qi avec rendements décroissants
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
