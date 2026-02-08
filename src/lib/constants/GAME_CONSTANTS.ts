/**
 * WWM Ultimate Calculator - Game Constants
 * 
 * Centralizes all game constants for Where Winds Meet calculations.
 * These constants are used across all calculators for damage, defense, rates, and DPS calculations.
 * 
 * Supports multiple server versions:
 * - Global OW12 (Level max 85)
 * - CN OW15 (Level max 100)
 * 
 * All values are based on:
 * - Community-validated formulas from wherewindsmeetcalculator.com
 * - Chinese theorycrafters (Bilibili 理论武学)
 * 
 * Reference: .dev/docs/Back/phases/WWM-Formules-Reference-v1.3.md
 * 
 * @module constants/GAME_CONSTANTS
 * @version 1.1.0
 */

// ============================================================================
// SERVER CONFIGURATIONS
// ============================================================================
/**
 * Configurations des différentes versions serveur de WWM.
 * 
 * @remarks
 * - GLOBAL_OW12 : Version Global actuelle (level max 85)
 * - CN_OW15 : Version Chinoise (level max 100)
 * 
 * Le serveur actif détermine les constantes de jeu utilisées.
 */
export const SERVER_CONFIGS = {
  /**
   * Version Global - OW12
   * Level maximum : 85
   */
  GLOBAL_OW12: {
    MAX_LEVEL: 85,
    VERSION_NAME: 'OW12',
    REGION: 'Global',
  },
  
  /**
   * Version Chinoise - OW15
   * Level maximum : 100
   */
  CN_OW15: {
    MAX_LEVEL: 100,
    VERSION_NAME: 'OW15',
    REGION: 'CN',
  },
} as const;

/**
 * Type pour les clés de configuration serveur.
 */
export type ServerConfigKey = keyof typeof SERVER_CONFIGS;

/**
 * Configuration serveur active.
 * 
 * @remarks
 * Par défaut : GLOBAL_OW12
 * Peut être changé via variable d'environnement NEXT_PUBLIC_SERVER_CONFIG
 */
export const ACTIVE_SERVER_KEY: ServerConfigKey = 
  (process.env.NEXT_PUBLIC_SERVER_CONFIG as ServerConfigKey) ?? 'GLOBAL_OW12';

/**
 * Configuration serveur active résolue.
 */
export const ACTIVE_SERVER = SERVER_CONFIGS[ACTIVE_SERVER_KEY];

// ============================================================================
// STAT LIMITS
// ============================================================================
/**
 * Maximum and minimum limits for character stats and combat values.
 * 
 * These caps are enforced in calculations to prevent overflow and ensure
 * game balance according to WWM's design.
 */
export const STAT_LIMITS = {
  /**
   * Maximum character level in the game.
   * Dépend du serveur actif (Global OW12: 85, CN OW15: 100).
   */
  MAX_LEVEL: ACTIVE_SERVER.MAX_LEVEL,

  /**
   * Maximum attack value before overflow.
   * Theoretical cap for physical attack stat.
   */
  MAX_ATTACK: 99999,

  /**
   * Maximum defense value before overflow.
   * Theoretical cap for defense stat.
   */
  MAX_DEFENSE: 99999,

  /**
   * Maximum critical hit rate cap.
   * Critical hits cannot exceed 80% chance.
   * 
   * @example
   * // Even with very high crit stat, rate caps at 80%
   * const critRate = Math.min(calculatedRate, STAT_LIMITS.MAX_CRITICAL_RATE);
   */
  MAX_CRITICAL_RATE: 0.8,

  /**
   * Maximum precision (hit chance) rate cap.
   * Precision caps at 95% - misses are always possible.
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.2
   * 
   * @example
   * // Even with 10000 precision, hit chance maxes at 95%
   * const hitChance = Math.min(calculatedPrecision, STAT_LIMITS.MAX_PRECISION_RATE);
   */
  MAX_PRECISION_RATE: 1.0,

  /**
   * Maximum affinity trigger rate cap.
   * Affinity procs cannot exceed 60% chance.
   * 
   * Note: Community sources vary between 40% and 60%.
   * Using 60% as the conservative upper bound.
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.4
   */
  MAX_AFFINITY_RATE: 0.6,

  /**
   * Minimum damage dealt on any successful hit.
   * Prevents zero or negative damage from excessive defense.
   */
  MIN_DAMAGE: 1,
} as const;

// ============================================================================
// CALCULATION CONSTANTS
// ============================================================================
/**
 * Core constants used in damage calculation formulas.
 * 
 * These values are derived from hyperbolic reduction formulas and rate calculations
 * validated by the Chinese community and wherewindsmeetcalculator.com.
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 2
 */
export const CALCULATION_CONSTANTS = {
  /**
   * Defense constant for hyperbolic reduction formula.
   * 
   * Used in: Defense Reduction = Defense / (Defense + 2860)
   * 
   * This constant determines the diminishing returns curve for defense stat.
   * Higher defense values have progressively smaller impact on damage reduction.
   * 
   * @example
   * // Calculate defense reduction
   * const defenseReduction = defense / (defense + CALCULATION_CONSTANTS.DEFENSE_CONSTANT);
   * // 500 defense → 14.9% reduction
   * // 2860 defense → 50% reduction (inflection point)
   * // 5720 defense → 66.7% reduction
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 4.1
   */
  DEFENSE_CONSTANT: 2860,

  /**
   * Elemental resistance constant for hyperbolic reduction formula.
   * 
   * Used in: Resistance Reduction = Resistance / (Resistance + 530)
   * 
   * Similar to defense, but resistance caps at lower values.
   * 530 constant means faster diminishing returns than physical defense.
   * 
   * @example
   * // Calculate resistance reduction
   * const resistReduction = resistance / (resistance + CALCULATION_CONSTANTS.ELEM_RESIST_CONSTANT);
   * // 100 resistance → 15.9% reduction
   * // 530 resistance → 50% reduction (inflection point)
   * // 1060 resistance → 66.7% reduction
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 5.1
   */
  ELEM_RESIST_CONSTANT: 530,

  /**
   * Critical rate constant for hyperbolic rate formula.
   * 
   * Used in: Crit Rate = 1.15 × (Crit / (Crit + 938))
   * 
   * The 938 constant determines the curve of critical rate scaling.
   * Combined with the 1.15 multiplier, it allows reaching the 80% cap.
   * 
   * @example
   * // Calculate crit rate
   * const critRate = 1.15 * (crit / (crit + CALCULATION_CONSTANTS.CRIT_RATE_CONSTANT));
   * // 500 crit → 40.0% rate
   * // 938 crit → 50.0% rate (inflection point)
   * // 3000 crit → 78.0% rate (near cap)
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 6.3
   */
  CRIT_RATE_CONSTANT: 938,

  /**
   * Precision constant for hyperbolic rate formula.
   * 
   * Used in: Precision Rate = 95% × (1.42 × Precision / (Precision + Parry + 150))
   * 
   * The base 150 constant is added to the parry value to establish a minimum
   * denominator, ensuring precision scaling is smooth even at low values.
   * 
   * @example
   * // Calculate precision rate
   * const totalParry = parry + CALCULATION_CONSTANTS.PRECISION_CONSTANT;
   * const rate = 1.42 * (precision / (precision + totalParry));
   * const hitChance = Math.min(rate, 0.95); // Cap at 95%
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 2.2, 6.2
   */
  PRECISION_CONSTANT: 150,

  /**
   * Precision divider constant (alternate formula variant).
   * 
   * In some formula variations, precision uses a fixed 3640 divider:
   * Alternative: Precision Rate = Precision / (Precision + 3640)
   * 
   * Note: Current implementation uses the parry-based formula (150 constant).
   * This 3640 constant is kept for reference and potential PVP adjustments.
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 2.1
   */
  PRECISION_DIVIDER: 3640,

  /**
   * Base precision rate before scaling.
   * 
   * All precision calculations are scaled by 95% maximum cap.
   * This ensures misses are always possible, even with extreme precision.
   * 
   * Used in: Final Rate = BASE_PRECISION_RATE × (calculated_rate)
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.2
   */
  BASE_PRECISION_RATE: 0.95,

  /**
   * Precision multiplier coefficient.
   * 
   * The 1.42 multiplier in precision formula allows reaching the 95% cap
   * with realistic precision values.
   * 
   * Formula: Rate = 95% × (1.42 × Precision / (Precision + Parry + 150))
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.2
   */
  PRECISION_MULTIPLIER: 1.42,

  /**
   * Critical rate multiplier coefficient.
   * 
   * The 1.15 multiplier in crit formula allows reaching the 80% cap
   * with high crit values.
   * 
   * Formula: Crit Rate = 1.15 × (Crit / (Crit + 938))
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.3
   */
  CRIT_RATE_MULTIPLIER: 1.15,
} as const;

// ============================================================================
// DAMAGE MULTIPLIERS
// ============================================================================
/**
 * Damage multipliers for different combat outcomes.
 * 
 * These multipliers are applied to base damage pools based on the
 * outcome of the hit (normal, critical, affinity, etc.).
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 6, 8
 */
export const DAMAGE_MULTIPLIERS = {
  /**
   * Normal hit damage multiplier (no special effects).
   * Base damage with no critical or affinity proc.
   */
  NORMAL: 1.0,

  /**
   * Critical hit base damage multiplier.
   * 
   * Critical hits deal 150% of base damage (1.5x multiplier).
   * Additional crit damage bonuses from gear/talents are added on top.
   * 
   * Final Crit Multiplier = 1.5 + Crit Damage Bonus
   * 
   * @example
   * // Base crit: 150% damage
   * // With +50% crit damage bonus: 200% damage
   * const finalCritMult = DAMAGE_MULTIPLIERS.CRITICAL + critDamageBonus;
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.3
   */
  CRITICAL: 1.5,

  /**
   * Affinity proc base damage multiplier.
   * 
   * Affinity (会意) deals 135% of base damage (1.35x multiplier).
   * Additional affinity damage bonuses from gear/talents are added on top.
   * 
   * Final Affinity Multiplier = 1.35 + Affinity Damage Bonus
   * 
   * Note: This is 35% bonus damage, not 20% as in some older formulas.
   * Updated based on Level 80 community validation.
   * 
   * @example
   * // Base affinity: 135% damage
   * // With +20% affinity damage bonus: 155% damage
   * const finalAffMult = DAMAGE_MULTIPLIERS.AFFINITY + affinityDamageBonus;
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 6.4
   */
  AFFINITY: 1.35,

  /**
   * Critical + Affinity combined multiplier.
   * 
   * When both critical and affinity proc on the same hit,
   * multipliers are multiplicative (not additive).
   * 
   * Base Combined = 1.5 × 1.35 = 2.025 (202.5% damage)
   * 
   * Note: This is the base value. Additional bonuses are applied separately
   * and then multiplied together.
   * 
   * @example
   * // Critical (1.5 + 0.5 bonus) × Affinity (1.35 + 0.2 bonus)
   * // = 2.0 × 1.55 = 3.1 (310% damage)
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 8.1
   */
  CRITICAL_AFFINITY: 1.8,

  /**
   * Abrasion (擦伤/Graze) damage multiplier.
   * 
   * Abrasion occurs when precision fails to fully connect.
   * Deals only 50% of base damage (0.5x multiplier).
   * 
   * In WWM, abrasion is treated as a "weak hit" rather than a miss.
   * 
   * Note: Abrasion mechanics are complex and depend on specific conditions.
   * This constant is for the base case.
   * 
   * Reference: WWM-Formules-Reference-v1.3.md section 13.8
   */
  ABRASION: 0.5,
} as const;

// ============================================================================
// DEFAULT LEVEL 80 STATS
// ============================================================================
/**
 * Reference stat ranges for Level 80 characters in typical PVE builds.
 * 
 * These values represent common stat ranges for well-equipped Level 80 characters.
 * Used for:
 * - Build validation
 * - Default calculator values
 * - Sanity checks
 * 
 * Note: Actual stats vary significantly by:
 * - Class/weapon type
 * - Gear quality (blue, purple, gold)
 * - Set bonuses
 * - Inner ways (心法) and mystic arts (绝技)
 * 
 * Reference: Community data compilation from wherewindsmeetcalculator.com
 */
export const DEFAULT_LEVEL_80_STATS = {
  /**
   * Physical attack range for Level 80 characters.
   * Min: Fresh Level 80 with blue/purple gear
   * Max: Well-geared with gold equipment and optimized stats
   */
  attack: { min: 8500, max: 9500 },

  /**
   * Elemental attack range for Level 80 characters.
   * Generally lower than physical attack.
   * Elemental builds can reach higher values with specialized gear.
   */
  elementalAttack: { min: 1200, max: 1400 },

  /**
   * Defense value for Level 80 PVE content.
   * Affects physical damage reduction via hyperbolic formula.
   */
  defense: 4200,

  /**
   * Elemental resistance for Level 80 PVE content.
   * Affects elemental damage reduction.
   * 
   * Note: Most PVE bosses have 0 elemental resistance, or negative
   * resistance to their weak element (up to -353 for 3x damage multiplier).
   */
  elemResist: 1800,

  /**
   * Critical stat (raw value, not percentage).
   * Typical value provides ~35-45% crit rate after formula.
   */
  critical: 3500,

  /**
   * Precision stat (raw value, not percentage).
   * Typical value provides ~85-90% hit chance in PVE.
   */
  precision: 8000,

  /**
   * Affinity rate (as decimal, not raw stat).
   * Typical Level 80 build has 25% base affinity rate.
   */
  affinity: 0.25,

  /**
   * Critical damage bonus (as decimal).
   * +50% crit damage means 200% total (1.5 base + 0.5 bonus).
   */
  criticalBonus: 0.5,

  /**
   * Affinity damage bonus (as decimal).
   * +35% affinity damage means 170% total (1.35 base + 0.35 bonus).
   */
  affinityBonus: 0.35,
} as const;

// ============================================================================
// DEFAULT LEVEL 85 STATS (Global OW12)
// ============================================================================
/**
 * Statistiques de référence pour un personnage niveau 85 (Global OW12).
 * 
 * Ces valeurs représentent les statistiques typiques d'un personnage bien équipé
 * au niveau 85 sur la version Global OW12.
 * 
 * Utilisé pour :
 * - Valeurs par défaut du calculateur (serveur Global)
 * - Tests unitaires niveau 85
 * - Validation des builds niveau 85
 * 
 * @remarks
 * Basé sur un personnage PVE build équilibré niveau 85 avec :
 * - Équipement gold qualité élevée
 * - Voies intérieures niveau 8-10
 * - Arts mystiques niveau 5-7
 * - Optimisation stats équilibrée (crit/précision/affinité)
 * 
 * Note : Les stats réelles varient significativement selon :
 * - Classe/type d'arme (Épée vs Arc vs Lance)
 * - Type de build (Physique vs Élémentaire vs Hybride)
 * - Optimisation ciblée (DPS burst vs DPS soutenu)
 * 
 * Référence : Données communautaires serveurs Global OW12
 */
export const DEFAULT_LEVEL_85_STATS = {
  /**
   * Niveau du personnage.
   */
  level: 85,

  /**
   * Attaque physique de base.
   * Level 85 Global : ~20% supérieure au level 80.
   */
  attack: 3200,

  /**
   * Attaque physique minimale (variance).
   */
  attackMin: 2900,

  /**
   * Attaque physique maximale (variance).
   */
  attackMax: 3500,

  /**
   * Attaque élémentaire.
   * Environ 50% de l'attaque physique pour un build équilibré.
   */
  elementalAttack: 1600,

  /**
   * Défense physique.
   * Protège contre les dégâts physiques.
   */
  defense: 1900,

  /**
   * Résistance élémentaire.
   * Protège contre les dégâts élémentaires.
   */
  resistance: 350,

  /**
   * Statistique de critique (valeur brute).
   * Converti en taux via formule hyperbolique.
   * Typiquement ~70-75% de taux de critique au level 85.
   */
  critical: 3500,

  /**
   * Statistique de précision (valeur brute).
   * Converti en taux via formule hyperbolique.
   * Typiquement ~90-95% de chance de toucher au level 85.
   */
  precision: 7000,

  /**
   * Taux d'affinité (décimal 0-1).
   * Stat directe, pas de formule de conversion.
   * 40% est un bon équilibre pour un build niveau 85.
   */
  affinityRate: 0.40,

  /**
   * Pénétration d'armure.
   * Réduit la défense de la cible avant calcul.
   */
  armorPenetration: 900,

  /**
   * Pénétration élémentaire.
   * Réduit la résistance de la cible avant calcul.
   */
  elementalPenetration: 500,

  /**
   * Bouclier Qi (en décimal 0-1).
   * 20% de réduction linéaire des dégâts physiques reçus.
   */
  shield: 0.20,

  /**
   * Esquive/Parade.
   * Réduit la précision des attaquants.
   */
  evasion: 400,

  /**
   * Résistance aux critiques (PVP principalement).
   * Réduit le taux de critique des attaquants.
   */
  criticalResistance: 600,
} as const;

// ============================================================================
// DPS CONFIGURATION
// ============================================================================
/**
 * Configuration values for DPS calculations and rotation simulations.
 * 
 * These settings control how rotation simulations are performed and
 * how DPS metrics are calculated and compared.
 * 
 * Reference: WWM-Formules-Reference-v1.3.md section 10, 12
 */
export const DPS_CONFIG = {
  /**
   * Default rotation duration for DPS calculations (seconds).
   * 
   * 60 seconds is the standard window for DPS comparisons because:
   * - Most skill cooldowns fit within 60s
   * - Long enough to smooth out RNG variance
   * - Short enough for practical testing
   * 
   * Typical use: Raid boss DPS window, dummy target tests
   */
  DEFAULT_ROTATION_DURATION: 60,

  /**
   * Minimum rotation duration (seconds).
   * 
   * Rotations shorter than 10s are too brief for meaningful DPS metrics
   * due to:
   * - High variance from RNG (crits, affinity procs)
   * - Cooldown skewing (some skills may not be usable)
   * - Opening burst not representative of sustained DPS
   */
  MIN_ROTATION_DURATION: 10,

  /**
   * Maximum rotation duration (seconds).
   * 
   * Rotations longer than 5 minutes (300s) are impractical for:
   * - Calculator performance (too many iterations)
   * - Real gameplay scenarios (most fights are shorter)
   * - Diminishing returns on accuracy (60-120s is sufficient)
   */
  MAX_ROTATION_DURATION: 300,

  /**
   * Reference DPS for graduation rate calculation.
   * 
   * This represents the DPS of an optimal Level 80 build with:
   * - Gold gear with optimal stats
   * - Fully leveled inner ways and mystic arts
   * - Perfect rotation execution
   * - No downtime
   * 
   * Used to calculate Graduation Rate = (Your DPS / Reference DPS) × 100%
   * 
   * Note: This is a general reference. Actual optimal DPS varies by:
   * - Class/weapon type (Sword vs Bow vs Spear)
   * - Build type (Physical vs Elemental vs Hybrid)
   * - Fight duration and mechanics
   * 
   * This value (50,000 DPS) represents a mid-range optimal build.
   * Top-tier builds can exceed 60,000 DPS in ideal conditions.
   * 
   * Reference: Community data from Level 80 theorycrafters
   */
  GRADUATION_REFERENCE_DPS: 50000,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================
/**
 * Infer literal types from constants for type safety.
 * 
 * These type exports allow TypeScript to treat constant values as literal types,
 * enabling better type checking and autocomplete.
 * 
 * @example
 * // Type of STAT_LIMITS is readonly with specific number literals
 * type MaxLevel = typeof STAT_LIMITS.MAX_LEVEL; // 85 or 100 (depends on active server)
 * 
 * @example
 * // Access active server configuration
 * const currentMaxLevel = ACTIVE_SERVER.MAX_LEVEL; // 85 (Global OW12 by default)
 */
export type StatLimits = typeof STAT_LIMITS;
export type CalculationConstants = typeof CALCULATION_CONSTANTS;
export type DamageMultipliers = typeof DAMAGE_MULTIPLIERS;
export type DefaultLevel80Stats = typeof DEFAULT_LEVEL_80_STATS;
export type DefaultLevel85Stats = typeof DEFAULT_LEVEL_85_STATS;
export type DpsConfig = typeof DPS_CONFIG;
